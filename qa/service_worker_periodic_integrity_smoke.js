#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
function keyOf(input) { return typeof input === 'string' ? input : input && input.url || String(input || ''); }
function diskResponse(input) {
    const clean = keyOf(input).replace(/^https:\/\/studio\.test\//, '').split('?')[0].replace(/^\.\//, '') || 'index.html';
    const file = path.join(root, clean);
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return new Response('missing', { status: 404 });
    return new Response(fs.readFileSync(file), { status: 200 });
}
function harness() {
    const handlers = {};
    const stores = new Map();
    function cache(name) {
        if (!stores.has(name)) stores.set(name, new Map());
        const store = stores.get(name);
        return { async put(item, response) { store.set(keyOf(item), response.clone ? response.clone() : response); }, async match(item) { const value = store.get(keyOf(item)) || null; return value && value.clone ? value.clone() : value; }, async delete(item) { return store.delete(keyOf(item)); }, async keys() { return [...store.keys()].map(url => ({ url })); } };
    }
    const caches = { async open(name) { return cache(name); }, async keys() { return [...stores.keys()]; }, async delete(name) { return stores.delete(name); } };
    const self = { crypto: crypto.webcrypto, location: { origin: 'https://studio.test' }, clients: { async claim() {}, async matchAll() { return []; } }, async skipWaiting() {}, addEventListener(type, handler) { handlers[type] = handler; } };
    async function fetchImpl(input) { return diskResponse(input); }
    vm.runInContext(source, vm.createContext({ self, caches, URL, Response, Uint8Array, console, fetch: fetchImpl, Set, Map, Array, Object, String, Number, Math, Date, Promise, JSON }), { filename: 'sw.js' });
    async function dispatch(type, payload) { const waits = []; const messages = []; const event = Object.assign({ waitUntil(value) { waits.push(Promise.resolve(value)); }, source: { postMessage(message) { messages.push(message); } } }, payload || {}); handlers[type](event); await Promise.all(waits); return messages; }
    return { stores, dispatch };
}
(async () => {
    const h = harness();
    await h.dispatch('install');
    const cacheName = [...h.stores.keys()].find(name => name.includes('v1.6.0'));
    const store = h.stores.get(cacheName);
    const target = [...store.keys()].find(key => key.includes('assets/css/theme.css'));
    if (!target) throw new Error('expected first rotating sample target is missing');
    store.set(target, new Response('tampered', { status: 200 }));
    const firstMessages = await h.dispatch('message', { data: { type: 'ai-shorts-service-worker-integrity-sample-request', requestId: 'audit-1', sampleSize: 12 } });
    const first = firstMessages.find(item => item.requestId === 'audit-1').report.periodicIntegrity;
    if (first.checked !== 12 || first.repaired !== 1 || first.failed !== 0) throw new Error('periodic integrity sample must detect, repair, and re-verify a corrupted sampled asset');
    const secondMessages = await h.dispatch('message', { data: { type: 'ai-shorts-service-worker-integrity-sample-request', requestId: 'audit-2', sampleSize: 12 } });
    const second = secondMessages.find(item => item.requestId === 'audit-2').report.periodicIntegrity;
    if (second.cursor !== first.nextCursor || second.nextCursor === second.cursor) throw new Error('periodic integrity audit must rotate its cursor across shell assets');
    if (second.checked !== 12 || second.failed !== 0) throw new Error('subsequent rotating sample must remain bounded and healthy');
    console.log('PASS rotating partial service worker integrity audit and targeted repair');
})().catch(error => { console.error(error.stack || error); process.exit(1); });
