#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
function keyOf(input) { return typeof input === 'string' ? input : input && input.url || String(input || ''); }
function cleanPath(input) { return keyOf(input).replace(/^https:\/\/studio\.test\//, '').split('?')[0].replace(/^\.\//, '') || 'index.html'; }
function harness() {
    const handlers = {}; const stores = new Map(); const failedFetches = new Set();
    function cache(name) { if (!stores.has(name)) stores.set(name, new Map()); const store = stores.get(name); return { async put(item, response) { store.set(keyOf(item), response.clone()); }, async match(item) { const value = store.get(keyOf(item)) || null; return value && value.clone ? value.clone() : value; }, async delete(item) { return store.delete(keyOf(item)); }, async keys() { return [...store.keys()].map(url => ({ url })); } }; }
    const caches = { async open(name) { return cache(name); }, async keys() { return [...stores.keys()]; }, async delete(name) { return stores.delete(name); } };
    const self = { crypto: crypto.webcrypto, location: { origin: 'https://studio.test' }, clients: { async claim() {}, async matchAll() { return []; } }, async skipWaiting() {}, addEventListener(type, fn) { handlers[type] = fn; } };
    async function fetchImpl(input) { const clean = cleanPath(input); if (failedFetches.has(clean)) throw new Error(`forced failure: ${clean}`); const file = path.join(root, clean); if (!fs.existsSync(file)) return new Response('missing', { status: 404 }); return new Response(fs.readFileSync(file), { status: 200 }); }
    vm.runInContext(source, vm.createContext({ self, caches, URL, Response, Uint8Array, console, fetch: fetchImpl, Set, Map, Array, Object, String, Number, Math, Date, Promise, JSON }), { filename: 'sw.js' });
    async function dispatch(type, payload) { const waits = []; const messages = []; const event = Object.assign({ waitUntil(value) { waits.push(Promise.resolve(value)); }, source: { postMessage(message) { messages.push(message); } } }, payload || {}); handlers[type](event); await Promise.all(waits); return messages; }
    return { stores, failedFetches, dispatch };
}
(async () => {
    const h = harness(); await h.dispatch('install');
    const cacheName = [...h.stores.keys()].find(name => name.includes('v1.5.27'));
    const store = h.stores.get(cacheName);
    const target = [...store.keys()].find(key => key.includes('assets/css/theme.css'));
    const clean = cleanPath(target);
    store.set(target, new Response('tampered', { status: 200 })); h.failedFetches.add(clean);
    const auditMessages = await h.dispatch('message', { data: { type: 'ai-shorts-service-worker-integrity-sample-request', requestId: 'audit', sampleSize: 12 } });
    const failedReport = auditMessages.find(item => item.requestId === 'audit').report;
    if (!failedReport.periodicIntegrity.failed || !failedReport.integrityBackoff[target]) throw new Error('failed integrity repair must create audit history and per-asset backoff');
    h.failedFetches.delete(clean);
    const retryMessages = await h.dispatch('message', { data: { type: 'ai-shorts-service-worker-integrity-retry-request', requestId: 'retry', files: [target] } });
    const retry = retryMessages.find(item => item.requestId === 'retry');
    if (!retry.commandResult || retry.commandResult.repaired !== 1 || retry.commandResult.failed !== 0) throw new Error('manual failed-asset retry must bypass the scheduled backoff and repair the requested asset');
    if (retry.report.integrityBackoff[target]) throw new Error('successful manual retry must clear the asset backoff');
    const historyCount = retry.report.integrityHistory.length;
    const clearMessages = await h.dispatch('message', { data: { type: 'ai-shorts-service-worker-integrity-clear-request', requestId: 'clear', clearBackoff: false } });
    const cleared = clearMessages.find(item => item.requestId === 'clear');
    if (!cleared.commandResult || cleared.commandResult.clearedHistory !== historyCount || cleared.report.integrityHistory.length !== 0) throw new Error('audit history clear command must report and remove bounded history without deleting the cache');
    console.log('PASS service worker targeted failed-asset retry and audit history reset');
})().catch(error => { console.error(error.stack || error); process.exit(1); });
