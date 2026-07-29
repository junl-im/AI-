#!/usr/bin/env node
'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/ai/local-ai-provider-registry.js'), 'utf8');

function assert(value, message) {
    if (!value) throw new Error(message);
    console.log(`PASS ${message}`);
}

function json(response, status, value, headers = {}) {
    const body = JSON.stringify(value);
    response.writeHead(status, Object.assign({ 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }, headers));
    response.end(body);
}

(async () => {
    const hits = { ready: 0, redirect: 0, redirectedTarget: 0, slow: 0, error: 0, supersedeA: 0, supersedeB: 0, supersedeClosed: 0 };
    const server = http.createServer((request, response) => {
        if (request.url === '/ready/api/tags') {
            hits.ready += 1;
            return json(response, 200, { models: [{ name: 'integration-model', model: 'integration-model', digest: 'a'.repeat(64) }] });
        }
        if (request.url === '/redirect/api/tags') {
            hits.redirect += 1;
            response.writeHead(302, { Location: '/redirect-target/api/tags' });
            return response.end();
        }
        if (request.url === '/redirect-target/api/tags') {
            hits.redirectedTarget += 1;
            return json(response, 200, { models: [] });
        }
        if (request.url === '/slow/api/tags') {
            hits.slow += 1;
            return setTimeout(() => {
                if (!response.writableEnded) json(response, 200, { models: [] });
            }, 900);
        }
        if (request.url === '/supersede-a/api/tags') {
            hits.supersedeA += 1;
            response.once('close', () => { if (!response.writableEnded) hits.supersedeClosed += 1; });
            return setTimeout(() => {
                if (!response.writableEnded) json(response, 200, { models: [{ name: 'old-network-model', digest: 'c'.repeat(64) }] });
            }, 900);
        }
        if (request.url === '/supersede-b/api/tags') {
            hits.supersedeB += 1;
            return json(response, 200, { models: [{ name: 'new-network-model', digest: 'd'.repeat(64) }] });
        }
        if (request.url === '/error/api/tags') {
            hits.error += 1;
            return json(response, 503, { error: { message: 'model warming up' } });
        }
        return json(response, 404, { error: 'not found' });
    });

    await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', resolve);
    });
    const address = server.address();
    const base = `http://127.0.0.1:${address.port}`;

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
            LOCAL_AI_PROBE_TIMEOUT_MS: 500,
            LOCAL_AI_REQUEST_TIMEOUT_MS: 2000
        },
        AIShortsStorageManager: {
            safeGet(key, fallback) { return localStorage.getItem(key) || fallback; },
            safeSet(key, value) { localStorage.setItem(key, value); return { ok: true }; }
        }
    };
    const context = vm.createContext({ window, URL, Blob, TextDecoder, AbortController, DOMException, setTimeout, clearTimeout, console, JSON, Object, Array, Map, Math, Number, String, Date, Error, Promise, RegExp, Buffer });
    vm.runInContext(source, context, { filename: 'local-ai-provider-registry-transport-integration.js' });
    const api = window.AIShortsLocalAIProviders;

    try {
        const ready = await api.probe('ollama', { endpoint: `${base}/ready` });
        assert(ready.state === 'ready' && ready.models[0].id === 'integration-model' && hits.ready === 1, 'real loopback HTTP probe reads the expected model list');

        let redirectBlocked = false;
        try { await api.probe('ollama', { endpoint: `${base}/redirect` }); }
        catch (error) { redirectBlocked = error.code === 'LOCAL_AI_REDIRECT_BLOCKED' && /최종 localhost API 주소/.test(error.recovery || ''); }
        assert(redirectBlocked && hits.redirect === 1 && hits.redirectedTarget === 0, 'real HTTP redirects are blocked before the redirected destination is contacted');

        const timeoutStarted = Date.now();
        let timedOut = false;
        try { await api.probe('ollama', { endpoint: `${base}/slow`, timeoutMs: 500 }); }
        catch (error) { timedOut = error.name === 'TimeoutError' && error.code === 'LOCAL_AI_TIMEOUT'; }
        assert(timedOut && Date.now() - timeoutStarted < 850, 'real slow loopback requests are aborted by the bounded provider timeout');

        const controller = new AbortController();
        const pending = api.probe('ollama', { endpoint: `${base}/slow`, signal: controller.signal, timeoutMs: 2000 });
        setTimeout(() => controller.abort(new DOMException('integration cancel', 'AbortError')), 30);
        let aborted = false;
        try { await pending; }
        catch (error) { aborted = error.name === 'AbortError' && /integration cancel/.test(error.message); }
        assert(aborted, 'external cancellation aborts a real in-flight loopback request');


        const oldProbe = api.probe('ollama', { endpoint: `${base}/supersede-a`, timeoutMs: 2000 });
        const observedOldProbe = oldProbe.then(value => ({ value }), error => ({ error }));
        await new Promise(resolve => setTimeout(resolve, 40));
        const newProbe = api.probe('ollama', { endpoint: `${base}/supersede-b`, timeoutMs: 2000 });
        const newest = await newProbe;
        const oldResult = await observedOldProbe;
        const oldSuperseded = Boolean(oldResult.error && oldResult.error.name === 'AbortError' && oldResult.error.code === 'LOCAL_AI_PROBE_SUPERSEDED');
        await new Promise(resolve => setTimeout(resolve, 40));
        assert(oldSuperseded && newest.models[0].id === 'new-network-model', 'a newer real HTTP probe rejects the older caller instead of returning stale model data');
        assert(hits.supersedeA === 1 && hits.supersedeB === 1 && hits.supersedeClosed >= 1, 'superseding a probe closes the older loopback HTTP transport instead of leaving it running');

        let httpMetadata = false;
        try { await api.probe('ollama', { endpoint: `${base}/error` }); }
        catch (error) { httpMetadata = error.code === 'LOCAL_AI_HTTP_503' && error.status === 503 && /서버 로그/.test(error.recovery || ''); }
        const failedStatus = api.snapshot().providers.ollama;
        assert(httpMetadata && failedStatus.errorCode === 'LOCAL_AI_HTTP_503' && /서버 로그/.test(failedStatus.recovery), 'HTTP failures retain bounded status codes and actionable recovery guidance');

        console.log('PASS real loopback transport redirect, timeout, abort, and recovery metadata integration');
    } finally {
        await new Promise(resolve => server.close(resolve));
    }
})().catch(error => {
    console.error(error.stack || error);
    process.exit(1);
});
