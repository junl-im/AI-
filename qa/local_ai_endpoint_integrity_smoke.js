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
    const calls = [];
    const digests = {
        'http://127.0.0.1:11434': 'a'.repeat(64),
        'http://127.0.0.1:11435': 'b'.repeat(64)
    };
    const fetch = async (url, init) => {
        const parsed = new URL(url);
        const origin = parsed.origin;
        calls.push({ url: String(url), init });
        if (parsed.pathname === '/api/tags') {
            return makeResponse(200, { models: [{ name: 'local-model', model: 'local-model', size: Infinity, digest: digests[origin] }] });
        }
        if (parsed.pathname === '/api/generate') return makeResponse(200, { response: '{"title":"ok"}' });
        return makeResponse(404, { error: 'not found' });
    };

    const values = new Map();
    const localStorage = {
        getItem(key) { return values.has(key) ? values.get(key) : null; },
        setItem(key, value) { values.set(key, String(value)); }
    };
    const window = {
        fetch,
        localStorage,
        setTimeout,
        clearTimeout,
        AIShortsRuntimeConfig: { LOCAL_AI_ALLOW_REMOTE_ENDPOINTS: false },
        AIShortsStorageManager: {
            safeGet(key, fallback) { return localStorage.getItem(key) || fallback; },
            safeSet(key, value) { localStorage.setItem(key, value); return { ok: true }; }
        }
    };
    const context = vm.createContext({ window, URL, Blob, TextDecoder, AbortController, DOMException, setTimeout, clearTimeout, console, JSON, Object, Array, Map, Math, Number, String, Date, Error, Promise, RegExp, Buffer });
    vm.runInContext(source, context, { filename: 'local-ai-provider-registry-endpoint-integrity.js' });
    const api = window.AIShortsLocalAIProviders;

    const first = await api.probe('ollama', { endpoint: 'http://127.0.0.1:11434' });
    api.configure({ endpoints: { ollama: 'http://127.0.0.1:11434' } });
    api.pinModel('ollama', 'local-model', digests['http://127.0.0.1:11434']);
    assert(api.verifyModelPin('ollama', 'local-model').state === 'verified', 'model pin is verified against the probed endpoint');
    assert(first.models[0].size === 0, 'non-finite model sizes are normalized before reaching diagnostics and UI');

    let immutable = false;
    try { first.models.push({ id: 'injected', digest: 'c'.repeat(64) }); }
    catch (_) { immutable = true; }
    assert(immutable && first.models.length === 1, 'provider status model lists are deeply immutable');

    api.configure({ endpoints: { ollama: 'http://127.0.0.1:11435' } });
    assert(api.verifyModelPin('ollama', 'local-model').state === 'stale', 'changing the endpoint invalidates the previous probe evidence');

    const beforeGenerate = calls.filter(call => new URL(call.url).pathname === '/api/generate').length;
    let staleBlocked = false;
    try { await api.generateStructured('ollama', { model: 'local-model', prompt: 'x', schema: { type: 'object' } }); }
    catch (error) { staleBlocked = error && error.code === 'LOCAL_AI_MODEL_RECHECK_REQUIRED'; }
    const afterGenerate = calls.filter(call => new URL(call.url).pathname === '/api/generate').length;
    assert(staleBlocked && beforeGenerate === afterGenerate, 'pinned generation is blocked before transport when endpoint evidence is stale');

    await api.probe('ollama', { endpoint: 'http://127.0.0.1:11435' });
    assert(api.verifyModelPin('ollama', 'local-model').state === 'unpinned', 'a fresh probe on the new endpoint exposes an independently unpinned model instead of reusing the old endpoint digest');

    console.log('PASS endpoint-bound model integrity and immutable provider diagnostics');
})().catch(error => {
    console.error(error.stack || error);
    process.exit(1);
});
