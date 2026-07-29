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

function deferred() {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
    return { promise, resolve, reject };
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
    const pending = [];
    const fetch = (url) => {
        const task = deferred();
        pending.push({ url: String(url), task });
        return task.promise;
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
        AIShortsRuntimeConfig: { LOCAL_AI_ALLOW_REMOTE_ENDPOINTS: false, LOCAL_AI_PROBE_TIMEOUT_MS: 2000 },
        AIShortsStorageManager: {
            safeGet(key, fallback) { return localStorage.getItem(key) || fallback; },
            safeSet(key, value) { localStorage.setItem(key, value); return { ok: true }; }
        }
    };
    const context = vm.createContext({ window, URL, Blob, TextDecoder, AbortController, DOMException, setTimeout, clearTimeout, console, JSON, Object, Array, Map, Math, Number, String, Date, Error, Promise, RegExp, Buffer });
    vm.runInContext(source, context, { filename: 'local-ai-provider-registry-state-race.js' });
    const api = window.AIShortsLocalAIProviders;

    const firstProbe = api.probe('ollama', { endpoint: endpointA });
    const secondProbe = api.probe('ollama', { endpoint: endpointB });
    assert(pending.length === 2, 'overlapping provider probes are both issued for race validation');

    pending[1].task.resolve(makeResponse(200, { models: [{ name: 'new-model', model: 'new-model', digest: 'b'.repeat(64) }] }));
    await secondProbe;
    pending[0].task.resolve(makeResponse(200, { models: [{ name: 'old-model', model: 'old-model', digest: 'a'.repeat(64) }] }));
    let superseded = false;
    try { await firstProbe; }
    catch (error) { superseded = error.name === 'AbortError' && error.code === 'LOCAL_AI_PROBE_SUPERSEDED'; }
    assert(superseded, 'the older overlapping probe rejects with an explicit superseded code instead of returning stale data');

    const latest = api.snapshot().providers.ollama;
    assert(latest.endpointToken === api.hashToken(endpointB) && latest.models[0].id === 'new-model', 'a late older probe cannot overwrite the newest endpoint status');

    api.configure({ endpoints: { ollama: endpointB } });
    api.pinModel('ollama', 'new-model', 'b'.repeat(64));
    assert(api.getModelPin('ollama', 'new-model') === 'b'.repeat(64), 'model pin is persisted before removal');
    assert(api.unpinModel('ollama', 'new-model') === true, 'model pin removal reports an existing entry');
    assert(api.getModelPin('ollama', 'new-model') === '' && api.snapshot().settings.pinnedModelCount === 0, 'model pin removal replaces persisted pin state instead of re-merging deleted entries');

    api.configure({ endpoints: { ollama: endpointA } });
    const thirdProbe = api.probe('ollama', { endpoint: endpointA });
    assert(pending.length === 3, 'an in-flight probe exists before endpoint configuration changes');
    api.configure({ endpoints: { ollama: endpointB } });
    pending[2].task.resolve(makeResponse(200, { models: [{ name: 'late-config-model', model: 'late-config-model', digest: 'c'.repeat(64) }] }));
    let endpointSuperseded = false;
    try { await thirdProbe; }
    catch (error) { endpointSuperseded = error.name === 'AbortError' && error.code === 'LOCAL_AI_PROBE_SUPERSEDED'; }
    assert(endpointSuperseded, 'changing the configured endpoint aborts the previous probe with its cancellation code preserved');
    const afterEndpointChange = api.snapshot().providers.ollama;
    assert(afterEndpointChange.endpointToken === api.hashToken(endpointB) && afterEndpointChange.state === 'idle', 'changing the configured endpoint invalidates in-flight probe commits and old ready state');

    console.log('PASS removable model pins and race-safe provider status ownership');
})().catch(error => {
    console.error(error.stack || error);
    process.exit(1);
});
