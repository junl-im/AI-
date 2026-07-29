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
    append() {}
}

function makeResponse(status, data) {
    const text = JSON.stringify(data);
    return {
        ok: status >= 200 && status < 300,
        status,
        headers: { get(name) { return String(name).toLowerCase() === 'content-length' ? String(Buffer.byteLength(text)) : 'application/json'; } },
        body: null,
        async text() { return text; }
    };
}

(async () => {
    const endpointA = 'http://127.0.0.1:11434';
    const endpointB = 'http://127.0.0.1:11435';
    const digestA = 'a'.repeat(64);
    const digestB = 'b'.repeat(64);
    const storage = new Map();
    storage.set('ai-shorts-local-ai-v1', JSON.stringify({
        creativeProviderId: 'ollama',
        endpoints: { ollama: endpointA },
        modelPins: { 'ollama:shared-model': digestA }
    }));
    const localStorage = {
        getItem(key) { return storage.has(key) ? storage.get(key) : null; },
        setItem(key, value) { storage.set(key, String(value)); }
    };
    const fetch = async (url) => {
        const parsed = new URL(url);
        if (parsed.pathname === '/api/tags') {
            const digest = parsed.port === '11435' ? digestB : digestA;
            return makeResponse(200, { models: [{ name: 'shared-model', model: 'shared-model', digest }] });
        }
        if (parsed.pathname === '/api/generate') return makeResponse(503, { error: 'model unavailable' });
        if (parsed.pathname === '/inference') return makeResponse(500, { error: 'speech unavailable' });
        return makeResponse(404, { error: 'not found' });
    };
    const window = {
        fetch,
        localStorage,
        setTimeout,
        clearTimeout,
        AIShortsRuntimeConfig: { LOCAL_AI_ALLOW_REMOTE_ENDPOINTS: false, LOCAL_AI_HISTORY_LIMIT: 20 },
        AIShortsStorageManager: {
            safeGet(key, fallback) { return localStorage.getItem(key) || fallback; },
            safeSet(key, value) { localStorage.setItem(key, value); return { ok: true }; }
        }
    };
    const context = vm.createContext({ window, URL, Blob, TextDecoder, AbortController, DOMException, FormData: FakeFormData, setTimeout, clearTimeout, console, JSON, Object, Array, Map, Math, Number, String, Date, Error, Promise, RegExp, Buffer });
    vm.runInContext(source, context, { filename: 'local-ai-provider-registry-endpoint-pins.js' });
    const api = window.AIShortsLocalAIProviders;

    assert(api.getModelPin('ollama', 'shared-model', endpointA) === digestA, 'legacy provider-model pins migrate to the configured endpoint scope');
    assert(api.getModelPin('ollama', 'shared-model', endpointB) === '', 'a migrated pin does not leak into another localhost endpoint');

    await api.probe('ollama', { endpoint: endpointA });
    assert(api.verifyModelPin('ollama', 'shared-model', endpointA).state === 'verified', 'the migrated endpoint A pin verifies against endpoint A');

    api.pinModel('ollama', 'shared-model', digestB, endpointB);
    assert(api.getModelPin('ollama', 'shared-model', endpointA) === digestA, 'pinning endpoint B preserves endpoint A trust state');
    assert(api.getModelPin('ollama', 'shared-model', endpointB) === digestB, 'the same model name can keep an independent endpoint B digest');
    assert(api.snapshot().settings.pinnedModelCount === 2, 'diagnostics count independent endpoint-scoped pins');
    assert(api.unpinModel('ollama', 'shared-model', endpointB) === true && api.getModelPin('ollama', 'shared-model', endpointA) === digestA, 'unpinning endpoint B leaves endpoint A pinned');

    let generationFailed = false;
    try { await api.generateStructured('ollama', { endpoint: endpointA, model: 'untracked-model', prompt: 'x' }); }
    catch (error) { generationFailed = error.code === 'LOCAL_AI_HTTP_503'; }
    assert(generationFailed, 'generation transport failures retain the HTTP error code');

    let transcriptionFailed = false;
    try { await api.transcribe('whispercpp', { size: 8, name: 'tiny.wav' }, { endpoint: 'http://127.0.0.1:8081' }); }
    catch (error) { transcriptionFailed = error.code === 'LOCAL_AI_HTTP_500'; }
    assert(transcriptionFailed, 'transcription transport failures retain the HTTP error code');

    const failures = api.snapshot().history.filter(item => !item.ok);
    assert(failures.some(item => item.type === 'generate' && item.errorCode === 'LOCAL_AI_HTTP_503'), 'failed generation is retained in privacy-safe provider diagnostics');
    assert(failures.some(item => item.type === 'transcribe' && item.errorCode === 'LOCAL_AI_HTTP_500'), 'failed transcription is retained in privacy-safe provider diagnostics');
    assert(failures.every(item => !Object.prototype.hasOwnProperty.call(item, 'prompt') && !Object.prototype.hasOwnProperty.call(item, 'endpoint')), 'failure diagnostics do not retain prompts or endpoint addresses');

    console.log('PASS endpoint-scoped model pins and failure-aware local AI diagnostics');
})().catch(error => {
    console.error(error.stack || error);
    process.exit(1);
});
