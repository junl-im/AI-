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

function response(data) {
    const text = JSON.stringify(data);
    return {
        ok: true,
        status: 200,
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
    const values = new Map([['ai-shorts-local-ai-v1', JSON.stringify({
        creativeProviderId: 'ollama',
        endpoints: { ollama: endpointA },
        creativeModel: 'model-a'
    })]]);
    const localStorage = {
        getItem(key) { return values.has(key) ? values.get(key) : null; },
        setItem(key, value) { values.set(key, String(value)); }
    };
    const fetch = async url => {
        const parsed = new URL(url);
        if (parsed.pathname !== '/api/tags') return response({});
        const isB = parsed.port === '11435';
        return response({ models: [{ name: isB ? 'model-b' : 'model-a', model: isB ? 'model-b' : 'model-a', digest: isB ? digestB : digestA }] });
    };
    const window = {
        fetch,
        localStorage,
        setTimeout,
        clearTimeout,
        AIShortsRuntimeConfig: { LOCAL_AI_ALLOW_REMOTE_ENDPOINTS: false, LOCAL_AI_ENDPOINT_PROFILE_LIMIT: 3 },
        AIShortsStorageManager: {
            safeGet(key, fallback) { return localStorage.getItem(key) || fallback; },
            safeSet(key, value) { localStorage.setItem(key, value); return { ok: true }; }
        }
    };
    const context = vm.createContext({ window, URL, Blob, TextDecoder, AbortController, DOMException, FormData: class { append() {} }, setTimeout, clearTimeout, console, JSON, Object, Array, Map, Set, Math, Number, String, Date, Error, Promise, RegExp, Buffer });
    vm.runInContext(source, context, { filename: 'local-ai-provider-registry-endpoint-profiles.js' });
    const api = window.AIShortsLocalAIProviders;

    let profiles = api.listEndpointProfiles('ollama');
    assert(profiles.length === 1 && profiles[0].active && profiles[0].endpoint === endpointA, 'legacy endpoint settings migrate into one active named profile');

    await api.probe('ollama', { endpoint: endpointA });
    profiles = api.listEndpointProfiles('ollama');
    assert(profiles[0].lastProbe.state === 'ready' && profiles[0].models[0].id === 'model-a', 'successful probe evidence and model list are persisted inside the matching endpoint profile');

    api.pinModel('ollama', 'model-a', digestA, endpointA);
    assert(api.listEndpointProfiles('ollama')[0].pinCount === 1, 'profile summaries expose endpoint-scoped pin counts');

    const profileB = api.saveEndpointProfile('ollama', { name: '보조 Ollama', endpoint: endpointB, creativeModel: 'model-b' });
    assert(profileB.active && api.getSettings().endpoints.ollama === endpointB && api.getSettings().creativeModel === 'model-b', 'saving a profile activates its endpoint and preferred creative model');
    assert(api.getProviderStatus('ollama', endpointB).state === 'idle', 'switching profiles requires a fresh runtime probe instead of reusing prior trust');

    await api.probe('ollama', { endpoint: endpointB });
    api.pinModel('ollama', 'model-b', digestB, endpointB);
    profiles = api.listEndpointProfiles('ollama');
    const storedB = profiles.find(profile => profile.id === profileB.id);
    assert(storedB.lastProbe.state === 'ready' && storedB.models[0].id === 'model-b' && storedB.pinCount === 1, 'each endpoint profile retains its own model cache, probe summary, and pin count');

    const profileA = profiles.find(profile => profile.endpoint === endpointA);
    const activatedA = api.activateEndpointProfile('ollama', profileA.id);
    assert(activatedA.profile.active && activatedA.settings.endpoints.ollama === endpointA, 'activating a saved profile restores its endpoint');
    assert(api.getProviderStatus('ollama', endpointA).state === 'idle' && api.verifyModelPin('ollama', 'model-a', endpointA).state === 'stale', 'profile activation preserves the reconnect-before-generation integrity gate');

    let duplicateBlocked = false;
    try { api.saveEndpointProfile('ollama', { name: '중복', endpoint: endpointA }); }
    catch (error) { duplicateBlocked = /동일한 localhost 주소/.test(error.message); }
    assert(duplicateBlocked, 'duplicate endpoint profiles are rejected per provider');

    api.activateEndpointProfile('ollama', profileB.id);
    assert(api.removeEndpointProfile('ollama', profileB.id) === true, 'a non-final endpoint profile can be removed');
    assert(api.getModelPin('ollama', 'model-b', endpointB) === '', 'removing a profile clears orphaned pins for that endpoint');
    assert(api.getSettings().endpoints.ollama === endpointA && api.listEndpointProfiles('ollama').length === 1, 'removing the active profile falls back to the remaining profile');

    let finalBlocked = false;
    try { api.removeEndpointProfile('ollama', profileA.id); }
    catch (error) { finalBlocked = /최소 1개/.test(error.message); }
    assert(finalBlocked, 'the final provider profile cannot be removed');

    const diagnostics = JSON.stringify(api.snapshot());
    assert(!diagnostics.includes(endpointA) && !diagnostics.includes(endpointB), 'diagnostics keep raw endpoint addresses out of exported snapshots');
    assert(api.snapshot().settings.endpointProfileCount >= 4, 'diagnostics report bounded profile counts without exposing profile contents');

    console.log('PASS named endpoint profile migration, isolation, activation, removal, and privacy contracts');
})().catch(error => {
    console.error(error.stack || error);
    process.exit(1);
});
