#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/ai/local-ai-provider-registry.js'), 'utf8');

function assert(value, message) {
    if (!value) throw new Error(message);
    console.log(`PASS ${message}`);
}

function fakeStorage() {
    const values = new Map();
    return {
        getItem(key) { return values.has(key) ? values.get(key) : null; },
        setItem(key, value) { values.set(key, String(value)); }
    };
}

class FakeFormData {
    constructor() { this.values = []; }
    append(key, value, name) { this.values.push([key, value, name]); }
}

function makeResponse(status, data, contentType = 'application/json') {
    const text = typeof data === 'string' ? data : JSON.stringify(data);
    return {
        ok: status >= 200 && status < 300,
        status,
        headers: { get(name) { return String(name).toLowerCase() === 'content-length' ? String(Buffer.byteLength(text)) : contentType; } },
        body: null,
        async text() { return text; }
    };
}

(async () => {
    let digest = 'a'.repeat(64);
    const calls = [];
    const fetch = async (url, init) => {
        calls.push({ url: String(url), init });
        const parsed = new URL(url);
        if (parsed.pathname === '/api/tags') return makeResponse(200, { models: [{ name: 'qwen-local', model: 'qwen-local', size: 123456, digest: `sha256:${digest}`, details: { family: 'qwen', parameter_size: '7B', quantization_level: 'Q4_K_M' } }] });
        if (parsed.pathname === '/api/generate') return makeResponse(200, { response: JSON.stringify({ title: '강한 제목', hook: '첫 1초 후킹', description: '정확한 설명', hashtags: ['#쇼츠', '#로컬AI'], reason: '분석 정보 기반' }) });
        if (parsed.pathname === '/v1/models') return makeResponse(200, { data: [{ id: 'local-gguf', owned_by: 'local' }] });
        if (parsed.pathname === '/v1/chat/completions') return makeResponse(200, { choices: [{ message: { content: '{"title":"llama 제목","hook":"후킹","description":"설명","hashtags":["#태그"],"reason":"근거"}' } }] });
        if (parsed.pathname === '/') return makeResponse(200, '<html>whisper server</html>', 'text/html');
        if (parsed.pathname === '/inference') return makeResponse(200, { detected_language: 'ko', transcription: [{ timestamps: { from: '00:00:01.000', to: '00:00:03.250' }, text: '첫 문장' }, { offsets: { from: 3500, to: 5200 }, text: '둘째 문장' }] });
        return makeResponse(404, { error: 'not found' });
    };

    const localStorage = fakeStorage();
    const window = {
        fetch,
        localStorage,
        setTimeout,
        clearTimeout,
        AIShortsRuntimeConfig: {
            LOCAL_AI_ALLOW_REMOTE_ENDPOINTS: false,
            LOCAL_AI_MAX_RESPONSE_BYTES: 1024 * 1024,
            LOCAL_AI_MAX_PROMPT_CHARS: 24000,
            LOCAL_AI_MAX_SCHEMA_CHARS: 12000,
            LOCAL_AI_PROBE_TIMEOUT_MS: 5000,
            LOCAL_AI_REQUEST_TIMEOUT_MS: 30000,
            LOCAL_AI_MAX_TRANSCRIPTION_BYTES: 10 * 1024 * 1024,
            MAX_CAPTION_CUES: 5000,
            MAX_CAPTION_TEXT_CHARS: 1000000
        },
        AIShortsStorageManager: {
            safeGet(key, fallback) { return localStorage.getItem(key) || fallback; },
            safeSet(key, value) { localStorage.setItem(key, value); return { ok: true }; }
        }
    };
    const context = vm.createContext({ window, URL, Blob, TextDecoder, AbortController, DOMException, FormData: FakeFormData, setTimeout, clearTimeout, console, JSON, Object, Array, Map, Math, Number, String, Date, Error, Promise, RegExp, Buffer });
    vm.runInContext(source, context, { filename: 'local-ai-provider-registry.js' });
    const api = window.AIShortsLocalAIProviders;

    assert(api.listProviders('creative').length === 3 && api.listProviders('speech').length === 2, 'provider registry exposes bounded creative and speech adapters');
    assert(api.normalizeEndpoint('http://localhost:11434/') === 'http://localhost:11434', 'loopback endpoint is normalized without trailing slash');
    let remoteBlocked = false;
    try { api.normalizeEndpoint('https://example.com/api'); } catch (error) { remoteBlocked = /localhost/.test(error.message); }
    assert(remoteBlocked, 'non-loopback remote endpoints are rejected');
    let credentialBlocked = false;
    try { api.normalizeEndpoint('http://user:secret@127.0.0.1:11434'); } catch (error) { credentialBlocked = /계정/.test(error.message); }
    assert(credentialBlocked, 'endpoint credentials are rejected instead of persisted');

    const status = await api.probe('ollama');
    assert(status.state === 'ready' && status.models.length === 1 && status.models[0].digest === digest, 'Ollama model list and digest are normalized');
    api.pinModel('ollama', 'qwen-local', digest);
    assert(api.verifyModelPin('ollama', 'qwen-local').state === 'verified', 'selected model digest can be pinned and verified');

    const generated = await api.generateStructured('ollama', {
        model: 'qwen-local',
        system: 'system secret',
        prompt: 'prompt secret',
        schema: { type: 'object', properties: { title: { type: 'string' } } }
    });
    assert(generated.output.title === '강한 제목' && generated.pin.state === 'verified', 'Ollama structured JSON output is parsed under a verified model pin');
    const ollamaCall = calls.find(call => new URL(call.url).pathname === '/api/generate');
    assert(ollamaCall && ollamaCall.init.credentials === 'omit' && ollamaCall.init.referrerPolicy === 'no-referrer', 'local AI fetch omits credentials and referrer data');

    digest = 'b'.repeat(64);
    await api.probe('ollama');
    assert(api.verifyModelPin('ollama', 'qwen-local').state === 'mismatch', 'changed model digest is detected');
    let mismatchBlocked = false;
    try { await api.generateStructured('ollama', { model: 'qwen-local', prompt: 'x', system: 'y', schema: { type: 'object' } }); } catch (error) { mismatchBlocked = /digest/.test(error.message); }
    assert(mismatchBlocked, 'creative generation is blocked on model digest mismatch');

    const llamaStatus = await api.probe('llamacpp');
    const llama = await api.generateStructured('llamacpp', { model: llamaStatus.models[0].id, prompt: 'local', system: 'json', schema: { type: 'object' } });
    assert(llama.output.title === 'llama 제목', 'llama.cpp OpenAI-compatible structured output is supported');
    const llamaCall = calls.find(call => new URL(call.url).pathname === '/v1/chat/completions');
    const llamaBody = JSON.parse(llamaCall.init.body);
    assert(llamaBody.response_format.type === 'json_schema' && llamaBody.response_format.schema.type === 'object' && !llamaBody.response_format.json_schema, 'llama.cpp receives its native schema-constrained response format');

    await api.probe('whispercpp');
    const media = { size: 1024, name: 'voice.wav' };
    const transcript = await api.transcribe('whispercpp', media, { language: 'ko' });
    const inferenceCall = calls.find(call => new URL(call.url).pathname === '/inference');
    const inferenceFields = Object.fromEntries(inferenceCall.init.body.values.map(([key, value]) => [key, value]));
    assert(inferenceFields.response_format === 'json' && !Object.prototype.hasOwnProperty.call(inferenceFields, 'response-format'), 'whisper.cpp uses the documented response_format multipart field');
    assert(transcript.segments.length === 2 && transcript.srt.includes('00:00:01,000 --> 00:00:03,250'), 'whisper.cpp segments are normalized into SRT timestamps');
    assert(api.segmentsToSrt([{ start: 1.9996, end: 3.0004, text: '반올림' }]).includes('00:00:02,000 --> 00:00:03,000'), 'SRT millisecond rounding carries cleanly across second boundaries');
    assert(transcript.text.includes('첫 문장') && transcript.text.includes('둘째 문장'), 'transcription text is reconstructed from segment output');

    const snapshotText = JSON.stringify(api.snapshot());
    assert(!snapshotText.includes('prompt secret') && !snapshotText.includes('system secret') && !snapshotText.includes('http://127.0.0.1'), 'diagnostics redact prompts, system text, and raw endpoint addresses');
    assert(api.snapshot().policy.loopbackOnly === true, 'diagnostics expose loopback-only privacy policy');
    console.log('PASS localhost provider security, model integrity, structured generation, and transcription compatibility');
})().catch(error => {
    console.error(error.stack || error);
    process.exit(1);
});
