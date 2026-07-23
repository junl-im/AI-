#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

function ok(condition, message) {
    if (!condition) throw new Error(message);
    console.log(`PASS ${message}`);
}

(async () => {
    const listeners = {};
    const cacheWrites = [];
    const fetches = [];
    const cache = {
        addAll: async () => {},
        put: async (request) => { cacheWrites.push(request.url || String(request)); }
    };
    const self = {
        location: { origin: 'https://example.test' },
        clients: { claim: async () => {} },
        skipWaiting: async () => {},
        addEventListener(type, listener) { listeners[type] = listener; }
    };
    const caches = {
        keys: async () => [],
        delete: async () => true,
        open: async () => cache,
        match: async () => null
    };
    const fetch = async request => {
        fetches.push(request.url || String(request));
        return { ok: true, clone() { return this; } };
    };
    vm.runInContext(source, vm.createContext({ self, caches, fetch, URL, Response, Set, Promise, console }));
    ok(typeof listeners.fetch === 'function', 'service worker fetch handler is registered');

    async function dispatch(request) {
        let responsePromise = null;
        listeners.fetch({
            request,
            respondWith(value) { responsePromise = Promise.resolve(value); }
        });
        if (responsePromise) await responsePromise;
        return Boolean(responsePromise);
    }

    const navigated = await dispatch({ method: 'GET', url: 'https://example.test/', mode: 'navigate', destination: 'document' });
    ok(navigated, 'document navigation is owned by the network-first shell path');

    const scriptCached = await dispatch({ method: 'GET', url: 'https://example.test/src/app.js?v=test', mode: 'same-origin', destination: 'script' });
    ok(scriptCached, 'known same-origin script assets use runtime cache-first handling');
    ok(cacheWrites.some(url => url.includes('/src/app.js')), 'script response is admitted to the shell cache');

    const writesBeforeMedia = cacheWrites.length;
    const mediaOwned = await dispatch({ method: 'GET', url: 'https://example.test/uploads/large-video.mp4', mode: 'same-origin', destination: 'video' });
    ok(!mediaOwned && cacheWrites.length === writesBeforeMedia, 'same-origin video bypasses service worker cache ownership');

    const jsonOwned = await dispatch({ method: 'GET', url: 'https://example.test/project/session.json', mode: 'cors', destination: '' });
    ok(!jsonOwned, 'same-origin JSON and project data bypass runtime cache storage');

    const apiSlashOwned = await dispatch({ method: 'GET', url: 'https://example.test/api/', mode: 'cors', destination: '' });
    ok(!apiSlashOwned, 'non-navigation slash URLs are not misclassified as document navigation');

    ok(source.includes('RUNTIME_CACHE_DESTINATIONS') && source.includes("url.pathname.includes('/assets/')") && source.includes("url.pathname.includes('/src/')"), 'runtime caching is explicitly limited to application assets');
    console.log('PASS service worker runtime cache admission guardrails');
})().catch(error => {
    console.error(error && error.stack || error);
    process.exit(1);
});
