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
function createHarness() {
    const handlers = {};
    const stores = new Map();
    const failures = new Set();
    function cache(name) {
        if (!stores.has(name)) stores.set(name, new Map());
        const store = stores.get(name);
        return { async add(item) { const response = await fetchImpl(item); if (!response.ok) throw new Error('fetch failed'); store.set(keyOf(item), response); }, async put(item, response) { store.set(keyOf(item), response && response.clone ? response.clone() : response); }, async match(item) { const value = store.get(keyOf(item)) || null; return value && value.clone ? value.clone() : value; }, async delete(item) { return store.delete(keyOf(item)); }, async keys() { return [...store.keys()].map(url => ({ url })); } };
    }
    const caches = { async open(name) { return cache(name); }, async keys() { return [...stores.keys()]; }, async delete(name) { return stores.delete(name); }, async match(item) { for (const store of stores.values()) if (store.has(keyOf(item))) return store.get(keyOf(item)); return null; } };
    async function fetchImpl(input) { if (failures.has(keyOf(input))) throw new Error(`offline ${keyOf(input)}`); return diskResponse(input); }
    const self = { crypto: crypto.webcrypto, location: { origin: 'https://studio.test' }, clients: { async claim() {}, async matchAll() { return []; } }, async skipWaiting() {}, addEventListener(type, handler) { handlers[type] = handler; } };
    vm.runInContext(source, vm.createContext({ self, caches, URL, Response, Uint8Array, console, fetch: fetchImpl, Set, Map, Array, Object, String, Number, Math, Date, Promise, JSON }), { filename: 'sw.js' });
    async function dispatch(type, payload) { const waits = []; const messages = []; const event = Object.assign({ waitUntil(value) { waits.push(Promise.resolve(value)); } }, payload || {}); if (!event.source) event.source = { postMessage(message) { messages.push(message); } }; handlers[type](event); await Promise.all(waits); return messages; }
    return { stores, failures, dispatch };
}
(async () => {
    const h = createHarness();
    h.stores.set('ai-shorts-studio-shell-v1.5.23-old-known-good', new Map([['./index.html', new Response('old')]]));
    await h.dispatch('install');
    const currentName = [...h.stores.keys()].find(name => name.includes('v1.6.4'));
    const store = h.stores.get(currentName);
    if (!store) throw new Error('current integrity cache missing');
    const target = './assets/css/theme.css?v=1.6.4-recovery-loop-impact-preview';
    store.set(target, new Response('tampered-content', { status: 200 }));
    const statusMessages = await h.dispatch('message', { data: { type: 'ai-shorts-service-worker-status-request', requestId: 'status' } });
    const status = statusMessages.find(item => item.requestId === 'status').report;
    if (!status.integrity.corrupted.includes(target)) throw new Error('content hash inspection must detect a tampered cached asset');
    const repairMessages = await h.dispatch('message', { data: { type: 'ai-shorts-service-worker-repair-request', requestId: 'repair' } });
    const repaired = repairMessages.find(item => item.requestId === 'repair').report;
    if (!repaired.contentVerified || repaired.integrity.corrupted.length || !repaired.repaired.includes(target)) throw new Error('manual repair must replace and re-verify corrupted content');
    const required = './index.html';
    store.set(required, new Response('tampered-index', { status: 200 }));
    h.failures.add(required);
    let activationFailed = false;
    try { await h.dispatch('activate'); } catch (_) { activationFailed = true; }
    if (!activationFailed) throw new Error('activation must fail when a required corrupted asset cannot be repaired');
    if (!h.stores.has('ai-shorts-studio-shell-v1.5.23-old-known-good')) throw new Error('failed activation must preserve the previous known-good cache');
    console.log('PASS SHA-256 shell integrity repair and rollback-safe activation');
})().catch(error => { console.error(error.stack || error); process.exit(1); });
