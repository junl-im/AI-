#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

function assert(condition, message) {
    if (!condition) throw new Error(message);
    console.log(`PASS ${message}`);
}

(async () => {
    const listeners = {};
    const opened = [];
    let networkCalls = 0;
    const cachedResponse = new Response('export const ready = true;', { headers: { 'Content-Type': 'text/javascript' } });
    const caches = {
        keys: async () => [],
        delete: async () => true,
        match: async () => null,
        open: async name => {
            opened.push(name);
            return {
                addAll: async () => {},
                put: async () => {},
                match: async key => String(key).includes('/__ai_shorts_vision_pack__/') ? cachedResponse.clone() : null
            };
        }
    };
    const self = {
        location: { origin: 'https://example.test' },
        clients: { claim: async () => {} },
        skipWaiting: async () => {},
        addEventListener(type, listener) { listeners[type] = listener; }
    };
    const fetch = async () => { networkCalls += 1; return new Response('network'); };
    vm.runInContext(source, vm.createContext({ self, caches, fetch, URL, Response, Set, Promise, console }));
    let responsePromise = null;
    listeners.fetch({
        request: { method: 'GET', url: 'https://example.test/__ai_shorts_vision_pack__/vision-0123456789abcdef/vision_bundle.mjs?sha=test', mode: 'same-origin', destination: 'script' },
        respondWith(value) { responsePromise = Promise.resolve(value); }
    });
    const response = await responsePromise;
    assert(response && response.status === 200 && (await response.text()).includes('ready'), 'service worker serves installed vision runtime from its dedicated cache');
    assert(opened.includes('ai-shorts-vision-model-packs-v1'), 'vision assets are isolated from the application shell cache');
    assert(networkCalls === 0, 'synthetic vision-pack requests never fall through to the network');
    assert(source.lastIndexOf('if (isVisionModelAsset(url))') < source.lastIndexOf('if (isNavigationRequest(request))'), 'vision-pack route is resolved before navigation and runtime cache paths');
    console.log('PASS offline service-worker bridge for verified browser vision assets');
})().catch(error => {
    console.error(error && error.stack || error);
    process.exit(1);
});
