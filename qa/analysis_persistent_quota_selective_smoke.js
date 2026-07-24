#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/engine/analysis-cache.js'), 'utf8');

function request(result) {
    const value = {};
    setTimeout(() => { value.result = result; if (value.onsuccess) value.onsuccess(); }, 0);
    return value;
}
function fakeIndexedDB() {
    const rows = new Map();
    let created = false;
    const database = {
        objectStoreNames: { contains() { return created; } },
        createObjectStore() { created = true; return { createIndex() {} }; },
        close() {},
        transaction() {
            const tx = {
                objectStore() {
                    return {
                        getAll() { return request([...rows.values()]); },
                        get(key) { return request(rows.get(key)); },
                        put(row) { rows.set(row.key, row); return request(row.key); },
                        delete(key) { rows.delete(key); return request(undefined); },
                        clear() { rows.clear(); return request(undefined); }
                    };
                }
            };
            setTimeout(() => { if (tx.oncomplete) tx.oncomplete(); }, 5);
            return tx;
        }
    };
    return {
        rows,
        open() {
            const req = {};
            setTimeout(() => {
                req.result = database;
                if (!created && req.onupgradeneeded) req.onupgradeneeded();
                if (req.onsuccess) req.onsuccess();
            }, 0);
            return req;
        }
    };
}

(async () => {
    const idb = fakeIndexedDB();
    const window = {
        indexedDB: idb,
        navigator: { storage: { async estimate() { return { usage: 950, quota: 1000 }; } } },
        AIShortsRuntimeConfig: { APP_VERSION: 'v1.6.3' },
        structuredClone: global.structuredClone
    };
    vm.runInContext(source, vm.createContext({ window, Date, Object, Array, Map, Set, WeakMap, Promise, JSON, Math, Number, String, Uint8Array, DataView, setTimeout, clearTimeout, console }), { filename: 'analysis-cache.js' });
    const cache = window.AIShortsAnalysisCache.createPersistentAnalysisCache({ maxItems: 8, minItems: 2, maxBytes: 8 * 1024 * 1024, minBytes: 1024 * 1024, warningRatio: 0.8, criticalRatio: 0.92, namespace: 'test-v1' });
    await cache.refreshQuotaPolicy(true);
    const pressure = cache.stats();
    if (pressure.quotaLevel !== 'critical' || pressure.effectiveMaxItems !== 2 || pressure.effectiveMaxBytes !== 1024 * 1024) throw new Error('critical storage pressure must reduce persistent cache limits to the configured floor');
    await cache.set('private-file-a::secret', { score: 1, payload: 'a'.repeat(1000) });
    await cache.set('private-file-b::secret', { score: 2, payload: 'b'.repeat(1000) });
    const entries = await cache.list();
    if (entries.length !== 2 || entries.some(item => !item.token || 'key' in item)) throw new Error('persistent cache listing must expose privacy-safe tokens and bounded metadata only');
    const removed = await cache.deleteByToken(entries[0].token);
    if (!removed.removed || (await cache.list()).length !== 1 || cache.stats().selectiveDeletes !== 1) throw new Error('a single persistent cache entry must be removable by privacy-safe token');
    console.log('PASS quota-aware persistent analysis cache limits and selective deletion');
})().catch(error => { console.error(error.stack || error); process.exit(1); });
