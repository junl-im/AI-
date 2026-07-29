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

class FakeFormData {
    constructor() { this.values = []; }
    append(key, value, name) { this.values.push([key, value, name]); }
}

function makeResponse(status, data, declaredBytes) {
    const text = typeof data === 'string' ? data : JSON.stringify(data);
    return {
        ok: status >= 200 && status < 300,
        status,
        headers: {
            get(name) {
                if (String(name).toLowerCase() !== 'content-length') return 'application/json';
                return String(declaredBytes == null ? Buffer.byteLength(text) : declaredBytes);
            }
        },
        body: null,
        async text() { return text; }
    };
}

(async () => {
    const calls = [];
    let oversized = false;
    const fetch = async (url, init) => {
        calls.push({ url: String(url), init });
        if (init.signal && init.signal.aborted) {
            const error = new Error('aborted before fetch');
            error.name = 'AbortError';
            throw error;
        }
        const pathname = new URL(url).pathname;
        if (pathname === '/api/tags') {
            return makeResponse(200, { models: [{ name: 'safe-local', model: 'safe-local', digest: 'a'.repeat(64) }] }, oversized ? 3 * 1024 * 1024 : undefined);
        }
        if (pathname === '/api/generate') {
            return makeResponse(200, { response: '{"title":"bounded"}' });
        }
        if (pathname === '/inference') {
            return makeResponse(200, {
                detected_language: 'ko',
                transcription: [
                    { start: 0, end: 1, offsets: { from: 500, to: 1000 }, text: 'zero-start' },
                    { timestamps: { from: 'invalid', to: 'invalid' }, offsets: { from: 1500, to: 2500 }, text: 'offset-fallback' }
                ]
            });
        }
        return makeResponse(404, { error: 'not found' });
    };

    const storage = new Map();
    const localStorage = {
        getItem(key) { return storage.has(key) ? storage.get(key) : null; },
        setItem(key, value) { storage.set(key, String(value)); }
    };
    const window = {
        fetch,
        localStorage,
        setTimeout,
        clearTimeout,
        AIShortsRuntimeConfig: {
            LOCAL_AI_ALLOW_REMOTE_ENDPOINTS: false,
            LOCAL_AI_HISTORY_LIMIT: 'broken',
            LOCAL_AI_REQUEST_TIMEOUT_MS: 'broken',
            LOCAL_AI_MAX_RESPONSE_BYTES: Infinity,
            LOCAL_AI_MAX_PROMPT_CHARS: 'broken',
            LOCAL_AI_MAX_SCHEMA_CHARS: NaN,
            LOCAL_AI_MAX_TRANSCRIPTION_BYTES: 'broken',
            MAX_CAPTION_CUES: Infinity,
            MAX_CAPTION_TEXT_CHARS: 'broken'
        },
        AIShortsStorageManager: {
            safeGet(key, fallback) { return localStorage.getItem(key) || fallback; },
            safeSet(key, value) { localStorage.setItem(key, value); return { ok: true }; }
        }
    };
    const context = vm.createContext({
        window,
        URL,
        Blob,
        TextDecoder,
        AbortController,
        DOMException,
        FormData: FakeFormData,
        setTimeout,
        clearTimeout,
        console,
        JSON,
        Object,
        Array,
        Map,
        Math,
        Number,
        String,
        Date,
        Error,
        Promise,
        RegExp,
        Buffer
    });
    vm.runInContext(source, context, { filename: 'local-ai-provider-registry-resilience.js' });
    const api = window.AIShortsLocalAIProviders;

    const policy = api.snapshot().policy;
    assert(policy.requestTimeoutMs === 120000 && policy.maxResponseBytes === 2 * 1024 * 1024, 'invalid request timeout and response limits recover to finite defaults');
    assert(policy.maxPromptChars === 24000 && policy.maxSchemaChars === 12000, 'invalid prompt and schema limits recover to finite defaults');
    assert(policy.maxTranscriptionBytes === 512 * 1024 * 1024 && policy.maxCaptionCues === 5000 && policy.maxCaptionTextChars === 1000000, 'invalid transcription and caption limits recover to finite defaults');
    assert(policy.redirects === 'blocked' && policy.credentials === 'omit' && policy.referrerPolicy === 'no-referrer', 'diagnostics expose the enforced no-redirect privacy policy');

    await api.probe('ollama');
    const probeCall = calls.find(call => new URL(call.url).pathname === '/api/tags');
    assert(probeCall.init.redirect === 'error' && probeCall.init.credentials === 'omit' && probeCall.init.referrerPolicy === 'no-referrer', 'local AI requests block redirects and enforce credential and referrer isolation');

    const longPrompt = 'x'.repeat(25000);
    const generated = await api.generateStructured('ollama', { model: 'safe-local', prompt: longPrompt, system: 'local', schema: { type: 'object' } });
    const generateCall = calls.find(call => new URL(call.url).pathname === '/api/generate');
    const generateBody = JSON.parse(generateCall.init.body);
    assert(generated.output.title === 'bounded' && generateBody.prompt.length === 24000, 'invalid prompt limit still applies the bounded default before transport');

    const cyclic = { type: 'object' };
    cyclic.self = cyclic;
    let cyclicRejected = false;
    try { await api.generateStructured('ollama', { model: 'safe-local', prompt: 'x', schema: cyclic }); }
    catch (error) { cyclicRejected = /순환 참조/.test(error.message); }
    assert(cyclicRejected, 'cyclic JSON schemas fail with a controlled validation error');

    let largeFileRejected = false;
    try { await api.transcribe('whispercpp', { size: 513 * 1024 * 1024, name: 'large.wav' }, {}); }
    catch (error) { largeFileRejected = /512MB 이하/.test(error.message); }
    assert(largeFileRejected, 'invalid transcription limit cannot disable the default file-size guard');

    const transcript = await api.transcribe('whispercpp', { size: 1024, name: 'small.wav' }, {});
    assert(transcript.segments[0].start === 0, 'an explicit zero-second transcript start is preserved instead of being replaced by offsets');
    assert(transcript.segments[1].start === 1.5 && transcript.segments[1].end === 2.5, 'missing or invalid timestamps still fall back to millisecond offsets');

    oversized = true;
    let oversizedRejected = false;
    try { await api.probe('ollama'); }
    catch (error) { oversizedRejected = error.code === 'LOCAL_AI_RESPONSE_TOO_LARGE'; }
    assert(oversizedRejected, 'invalid response configuration cannot disable declared response-size rejection');
    oversized = false;

    for (let index = 0; index < 24; index += 1) await api.probe('ollama');
    assert(api.snapshot().history.length === 20, 'invalid history retention recovers to the bounded 20-entry default');

    console.log('PASS redirect-safe transport, bounded invalid-config recovery, and zero-timestamp transcript normalization');
})().catch(error => {
    console.error(error.stack || error);
    process.exit(1);
});
