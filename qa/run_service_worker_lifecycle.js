#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'qa', 'runtime-service-worker-lifecycle-v1.5.4.json');

const handlers = {};
const cacheStores = new Map();
let skipWaitingCalls = 0;
let claimCalls = 0;
const deleted = [];

function keyOf(input) {
    if (typeof input === 'string') return input;
    return input && input.url || String(input || '');
}
function makeCache(name) {
    if (!cacheStores.has(name)) cacheStores.set(name, new Map());
    const store = cacheStores.get(name);
    return {
        async addAll(items) { for (const item of items) store.set(keyOf(item), new Response(`cached:${item}`, { status: 200 })); },
        async put(request, response) { store.set(keyOf(request), response); },
        async match(request) { return store.get(keyOf(request)) || null; }
    };
}
const caches = {
    async open(name) { return makeCache(name); },
    async keys() { return [...cacheStores.keys()]; },
    async delete(name) { deleted.push(name); return cacheStores.delete(name); },
    async match(request) {
        const key = keyOf(request);
        for (const store of cacheStores.values()) if (store.has(key)) return store.get(key);
        return null;
    }
};
const self = {
    location: { origin: 'https://studio.test' },
    clients: { async claim() { claimCalls += 1; } },
    async skipWaiting() { skipWaitingCalls += 1; },
    addEventListener(type, handler) { handlers[type] = handler; }
};
const context = vm.createContext({ self, caches, URL, Response, Request, console, fetch: async () => { throw new Error('offline'); } });
vm.runInContext(fs.readFileSync(path.join(root, 'sw.js'), 'utf8'), context, { filename: 'sw.js' });

async function dispatchWaitable(type, detail) {
    const waits = [];
    const event = Object.assign({ waitUntil(promise) { waits.push(Promise.resolve(promise)); } }, detail || {});
    handlers[type](event);
    await Promise.all(waits);
    return event;
}

(async () => {
    await makeCache('ai-shorts-studio-shell-v1.3.9-old').put('./old.js', new Response('old'));
    await dispatchWaitable('install');
    const currentName = [...cacheStores.keys()].find(name => name.includes('v1.5.4-css-ownership'));
    const currentCache = currentName && cacheStores.get(currentName);
    const shellCached = Boolean(currentCache && currentCache.has('./index.html'));
    await dispatchWaitable('activate');

    let fetchResponse = null;
    const request = { method: 'GET', mode: 'navigate', url: 'https://studio.test/index.html' };
    handlers.fetch({ request, respondWith(promise) { fetchResponse = Promise.resolve(promise); } });
    const response = await fetchResponse;
    const offlineBody = await response.text();

    const report = {
        version: '1.5.4',
        auditMode: 'isolated-service-worker-runtime',
        handlers: Object.keys(handlers).sort(),
        install: { skipWaitingCalls, shellCached, currentCache: currentName || '' },
        activate: { claimCalls, deletedCaches: deleted },
        offlineNavigation: { status: response.status, ok: response.ok, bodyPrefix: offlineBody.slice(0, 32) }
    };
    fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
    const ok = handlers.install && handlers.activate && handlers.fetch && skipWaitingCalls === 1 && shellCached && claimCalls === 1 && deleted.includes('ai-shorts-studio-shell-v1.3.9-old') && response.ok;
    if (!ok) throw new Error('service worker lifecycle audit failed');
    console.log(`PASS isolated service worker lifecycle audit -> ${path.basename(output)}`);
})().catch(error => { console.error(error.stack || error); process.exit(1); });
