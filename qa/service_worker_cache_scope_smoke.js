#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');

function ok(condition, message) {
    if (!condition) throw new Error(message);
    console.log(`PASS ${message}`);
}

(async () => {
    const listeners = {};
    const deleted = [];
    let claimed = 0;
    const self = {
        location: { origin: 'https://example.test' },
        clients: { claim: async () => { claimed += 1; } },
        skipWaiting: async () => {},
        addEventListener(type, listener) { listeners[type] = listener; }
    };
    const caches = {
        keys: async () => [
            'ai-shorts-studio-shell-v1.3.6-media-engine',
            'ai-shorts-studio-shell-v1.6.2-layout-harmony-footer-health',
            'another-app-shell-v9',
            'shared-image-cache'
        ],
        delete: async key => { deleted.push(key); return true; },
        open: async () => ({ addAll: async () => {}, put: async () => {} }),
        match: async () => null
    };
    vm.runInContext(fs.readFileSync(path.join(root, 'sw.js'), 'utf8'), vm.createContext({
        self,
        caches,
        fetch: async () => ({ ok: true, clone() { return this; } }),
        URL,
        Response,
        Promise,
        console
    }));
    ok(typeof listeners.activate === 'function', 'service worker activate handler is registered');
    let pending = null;
    listeners.activate({ waitUntil(promise) { pending = promise; } });
    await pending;
    ok(deleted.includes('ai-shorts-studio-shell-v1.3.6-media-engine'), 'old AI Shorts shell cache is deleted');
    ok(!deleted.includes('ai-shorts-studio-shell-v1.6.2-layout-harmony-footer-health'), 'current AI Shorts shell cache is preserved');
    ok(!deleted.includes('another-app-shell-v9') && !deleted.includes('shared-image-cache'), 'unrelated origin caches are preserved');
    ok(claimed === 1, 'service worker still claims clients after scoped cleanup');
    console.log('PASS namespace-safe service worker cache activation guardrails');
})().catch(error => {
    console.error(error && error.stack || error);
    process.exit(1);
});
