#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

function createHarness() {
    const handlers = {};
    const stores = new Map();
    const transientFailures = new Map();
    function keyOf(input) { return typeof input === 'string' ? input : input && input.url || String(input || ''); }
    function cache(name) {
        if (!stores.has(name)) stores.set(name, new Map());
        const store = stores.get(name);
        return {
            async add(item) {
                const key = keyOf(item);
                const remaining = transientFailures.get(key) || 0;
                if (remaining > 0) {
                    transientFailures.set(key, remaining - 1);
                    throw new Error(`transient failure: ${key}`);
                }
                store.set(key, new Response(`cached:${key}`, { status: 200 }));
            },
            async put(item, response) { store.set(keyOf(item), response); },
            async match(item) { return store.get(keyOf(item)) || null; },
            async delete(item) { return store.delete(keyOf(item)); },
            async keys() { return [...store.keys()].map(url => ({ url })); }
        };
    }
    const caches = {
        async open(name) { return cache(name); },
        async keys() { return [...stores.keys()]; },
        async delete(name) { return stores.delete(name); },
        async match(item) { for (const store of stores.values()) if (store.has(keyOf(item))) return store.get(keyOf(item)); return null; }
    };
    const self = {
        location: { origin: 'https://studio.test' },
        clients: { async claim() {}, async matchAll() { return []; } },
        async skipWaiting() {},
        addEventListener(type, handler) { handlers[type] = handler; }
    };
    vm.runInContext(source, vm.createContext({ self, caches, URL, Response, console, fetch: async () => { throw new Error('offline'); } }), { filename: 'sw.js' });
    async function dispatch(type, payload) {
        const waits = [];
        const messages = [];
        const event = Object.assign({ waitUntil(value) { waits.push(Promise.resolve(value)); } }, payload || {});
        if (!event.source) event.source = { postMessage(message) { messages.push(message); } };
        handlers[type](event);
        await Promise.all(waits);
        return messages;
    }
    return { stores, transientFailures, dispatch };
}

(async () => {
    const harness = createHarness();
    await harness.dispatch('install');
    const [cacheName, store] = [...harness.stores.entries()].find(([name]) => name.includes('ai-shorts-studio-shell-v')) || [];
    if (!cacheName || !store) throw new Error('install must create the current shell cache');
    const missingFile = './assets/icons/studio/waveform.svg';
    store.delete(missingFile);
    harness.transientFailures.set(missingFile, 1);
    const messages = await harness.dispatch('message', { data: { type: 'ai-shorts-service-worker-repair-request', requestId: 'repair-test' } });
    const response = messages.find(message => message.requestId === 'repair-test');
    if (!response || !response.report) throw new Error('manual repair request must return a correlated report');
    if (!store.has(missingFile)) throw new Error('manual repair must restore a missing optional shell asset');
    if (!response.report.verified || response.report.repaired.indexOf(missingFile) < 0) throw new Error('repair report must expose restored asset and verified integrity');
    if (response.report.repairFailed.length || response.report.requiredMissing.length) throw new Error('transient repair failure must recover within retry budget');
    console.log('PASS service worker shell integrity inspection and manual repair retry');
})().catch(error => { console.error(error.stack || error); process.exit(1); });
