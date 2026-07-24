#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/engine/analysis-cache.js'), 'utf8');
function request(result) { const req = {}; setTimeout(() => { req.result = result; if (req.onsuccess) req.onsuccess(); }, 0); return req; }
function fakeIndexedDB() {
    const rows = new Map(); let created = false;
    const db = {
        objectStoreNames: { contains() { return created; } },
        createObjectStore() { created = true; return { createIndex() {} }; }, close() {},
        transaction() {
            const tx = { objectStore() { return { getAll() { return request([...rows.values()]); }, get(key) { return request(rows.get(key)); }, put(row) { rows.set(row.key, row); return request(row.key); }, delete(key) { rows.delete(key); return request(); } }; } };
            setTimeout(() => { if (tx.oncomplete) tx.oncomplete(); }, 5); return tx;
        }
    };
    return { rows, open() { const req = {}; setTimeout(() => { req.result = db; if (!created && req.onupgradeneeded) req.onupgradeneeded(); if (req.onsuccess) req.onsuccess(); }, 0); return req; } };
}
(async () => {
    const indexedDB = fakeIndexedDB();
    const window = { indexedDB, navigator: { storage: { async estimate() { return { usage: 100, quota: 1000 }; } } }, AIShortsRuntimeConfig: { APP_VERSION: 'v1.6.0' }, structuredClone: global.structuredClone };
    vm.runInContext(source, vm.createContext({ window, Date, Object, Array, Map, Set, WeakMap, Promise, JSON, Math, Number, String, Uint8Array, DataView, setTimeout, clearTimeout, console }), { filename: 'analysis-cache.js' });
    const cache = window.AIShortsAnalysisCache.createPersistentAnalysisCache({ namespace: 'analysis-contract-v2', contractVersion: '2', appVersion: '1.6.0', maxItems: 8, maxBytes: 8 * 1024 * 1024 });
    await cache.set('a::video/mp4::::100::1::10::fp-a::balanced::16000::40::analysis-contract-v2', { score: 1 }, { tier: 'balanced', contractVersion: '2', appVersion: '1.6.0' });
    await cache.set('b::video/mp4::::100::1::10::fp-b::quality::48000::80::analysis-contract-v2', { score: 2 }, { tier: 'quality', contractVersion: '2', appVersion: '1.6.0' });
    await cache.set('c::video/mp4::::100::1::10::fp-c::balanced::16000::40::analysis-contract-v2', { score: 3 }, { tier: 'balanced', contractVersion: '1', appVersion: '1.6.0' });
    let entries = await cache.list();
    if (entries.length !== 3 || entries.some(item => !item.token || !item.tier || !item.contractVersion || 'key' in item)) throw new Error('persistent cache list must expose profile metadata through privacy-safe tokens only');
    const selected = await cache.deleteByTokens(entries.filter(item => item.tier === 'quality').map(item => item.token));
    if (selected.removed !== 1 || selected.bytes <= 0) throw new Error('multi-token deletion must remove only selected persistent cache entries');
    const invalidated = await cache.invalidate({ contractVersion: '2', reason: 'legacy-contract' });
    if (invalidated.removed !== 1) throw new Error('contract invalidation must remove entries created by an older analysis contract');
    entries = await cache.list();
    if (entries.length !== 1 || entries[0].tier !== 'balanced' || entries[0].contractVersion !== '2') throw new Error('selective invalidation must preserve unrelated current-contract entries');
    const stats = cache.stats();
    if (stats.bulkDeletes !== 1 || stats.invalidations !== 1 || stats.selectiveDeletes !== 2) throw new Error('selective cache maintenance counters must remain observable');
    console.log('PASS contract-aware persistent analysis cache multi-delete and selective invalidation');
})().catch(error => { console.error(error.stack || error); process.exit(1); });
