#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
function keyOf(input) { return typeof input === 'string' ? input : input && input.url || String(input || ''); }
let failingAsset = '';
function diskResponse(input) {
    const key = keyOf(input);
    if (failingAsset && key === failingAsset) return new Response('offline', { status: 503 });
    const clean = key.replace(/^https:\/\/studio\.test\//, '').split('?')[0].replace(/^\.\//, '') || 'index.html';
    const file = path.join(root, clean);
    return fs.existsSync(file) ? new Response(fs.readFileSync(file), { status: 200 }) : new Response('missing', { status: 404 });
}
function harness() {
    const handlers = {}; const stores = new Map();
    function cache(name) { if (!stores.has(name)) stores.set(name, new Map()); const store = stores.get(name); return { async put(item, response) { store.set(keyOf(item), response.clone()); }, async match(item) { const value = store.get(keyOf(item)); return value ? value.clone() : null; }, async delete(item) { return store.delete(keyOf(item)); }, async keys() { return [...store.keys()].map(url => ({ url })); } }; }
    const caches = { async open(name) { return cache(name); }, async keys() { return [...stores.keys()]; }, async delete(name) { return stores.delete(name); } };
    const self = { crypto: crypto.webcrypto, location: { origin: 'https://studio.test' }, clients: { async claim() {}, async matchAll() { return []; } }, async skipWaiting() {}, addEventListener(type, handler) { handlers[type] = handler; } };
    vm.runInContext(source, vm.createContext({ self, caches, URL, Response, Uint8Array, console, fetch: async input => diskResponse(input), Set, Map, Array, Object, String, Number, Math, Date, Promise, JSON }), { filename: 'sw.js' });
    async function dispatch(type, data) { const waits = []; const messages = []; const event = { data, source: { postMessage(message) { messages.push(message); } }, waitUntil(value) { waits.push(Promise.resolve(value)); } }; handlers[type](event); await Promise.all(waits); return messages; }
    return { stores, handlers, dispatch };
}
(async () => {
    const h = harness();
    const installWaits = []; h.handlers.install({ waitUntil(value) { installWaits.push(Promise.resolve(value)); } }); await Promise.all(installWaits);
    const store = h.stores.values().next().value;
    const target = [...store.keys()].find(key => key.includes('assets/css/theme.css'));
    store.set(target, new Response('tampered', { status: 200 })); failingAsset = target;
    const first = (await h.dispatch('message', { type: 'ai-shorts-service-worker-integrity-sample-request', requestId: 'one', sampleSize: 32, source: 'manual' }))[0].report;
    if (!first.periodicIntegrity.failed || !first.integrityBackoff[target] || first.integrityHistory.length !== 1) throw new Error('failed integrity repair must create per-asset exponential backoff and bounded audit history');
    for (let index = 0; index < 3; index += 1) await h.dispatch('message', { type: 'ai-shorts-service-worker-integrity-sample-request', requestId: `next-${index}`, sampleSize: 32, source: 'scheduled' });
    const latest = (await h.dispatch('message', { type: 'ai-shorts-service-worker-status-request', requestId: 'status' }))[0].report;
    if (latest.integrityHistory.length < 4 || !latest.integrityHistory.some(item => item.source === 'scheduled')) throw new Error('integrity audit history must preserve manual and scheduled run summaries');
    if (!latest.integrityHistory.some(item => item.skippedBackoff > 0)) throw new Error('rotating audit must skip assets whose retry backoff has not expired');
    console.log('PASS service worker integrity audit history and per-asset retry backoff');
})().catch(error => { console.error(error.stack || error); process.exit(1); });
