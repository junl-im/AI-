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
    let fetchCount = 0;
    const fetch = async () => {
        fetchCount += 1;
        if (fetchCount === 1) {
            await new Promise(resolve => setTimeout(resolve, 260));
            return makeResponse(400, { error: { message: 'json_schema unsupported' } });
        }
        return makeResponse(200, { choices: [{ message: { content: '{"title":"late"}' } }] });
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
        AIShortsRuntimeConfig: {
            LOCAL_AI_ALLOW_REMOTE_ENDPOINTS: false,
            LOCAL_AI_REQUEST_TIMEOUT_MS: 2000
        },
        AIShortsStorageManager: {
            safeGet(key, fallback) { return localStorage.getItem(key) || fallback; },
            safeSet(key, value) { localStorage.setItem(key, value); return { ok: true }; }
        }
    };
    const context = vm.createContext({ window, URL, Blob, TextDecoder, AbortController, DOMException, setTimeout, clearTimeout, console, JSON, Object, Array, Map, Math, Number, String, Date, Error, Promise, RegExp, Buffer });
    vm.runInContext(source, context, { filename: 'local-ai-provider-registry-operation-deadline.js' });
    const api = window.AIShortsLocalAIProviders;

    const started = Date.now();
    let timedOut = false;
    try {
        await api.generateStructured('openailocal', {
            endpoint: 'http://127.0.0.1:8080',
            model: 'deadline-model',
            prompt: 'deadline test',
            system: 'return json',
            schema: { type: 'object', properties: { title: { type: 'string' } } },
            timeoutMs: 700
        });
    } catch (error) {
        timedOut = error.name === 'TimeoutError' && error.code === 'LOCAL_AI_TIMEOUT';
    }
    const elapsed = Date.now() - started;
    assert(timedOut, 'structured generation enforces one timeout budget across strict-schema and fallback attempts');
    assert(fetchCount === 1, 'fallback transport is not started when the shared deadline has less than one safe request window remaining');
    assert(elapsed < 700, 'shared deadline failure returns before a second full timeout window can begin');
    console.log('PASS local AI multi-request operations use a shared deadline');
})().catch(error => {
    console.error(error.stack || error);
    process.exit(1);
});
