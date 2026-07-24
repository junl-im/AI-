#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/engine/analysis-cache.js'), 'utf8');

function request(result) {
    const req = {};
    setTimeout(() => {
        req.result = result;
        if (req.onsuccess) req.onsuccess();
    }, 0);
    return req;
}

function fakeIndexedDB() {
    const rows = new Map();
    let created = false;
    const db = {
        objectStoreNames: { contains() { return created; } },
        createObjectStore() {
            created = true;
            return { createIndex() {} };
        },
        close() {},
        transaction() {
            const tx = {
                objectStore() {
                    return {
                        getAll() { return request([...rows.values()]); },
                        get(key) { return request(rows.get(key)); },
                        put(row) { rows.set(row.key, row); return request(row.key); },
                        delete(key) { rows.delete(key); return request(); }
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
                req.result = db;
                if (!created && req.onupgradeneeded) req.onupgradeneeded();
                if (req.onsuccess) req.onsuccess();
            }, 0);
            return req;
        }
    };
}

function fakeLocalStorage() {
    const values = new Map();
    return {
        getItem(key) { return values.has(key) ? values.get(key) : null; },
        setItem(key, value) { values.set(key, String(value)); },
        removeItem(key) { values.delete(key); }
    };
}

function assert(value, message) {
    if (!value) throw new Error(message);
    console.log(`PASS ${message}`);
}

(async () => {
    const indexedDB = fakeIndexedDB();
    const localStorage = fakeLocalStorage();
    const window = {
        indexedDB,
        localStorage,
        navigator: { storage: { async estimate() { return { usage: 100, quota: 1000 }; } } },
        AIShortsRuntimeConfig: { APP_VERSION: 'v1.6.1', ANALYSIS_CACHE_MAINTENANCE_HISTORY_LIMIT: 20 },
        structuredClone: global.structuredClone
    };
    const context = vm.createContext({ window, Date, Object, Array, Map, Set, WeakMap, Promise, JSON, Math, Number, String, Uint8Array, DataView, setTimeout, clearTimeout, console });
    vm.runInContext(source, context, { filename: 'analysis-cache.js' });

    const legacy = window.AIShortsAnalysisCache.createPersistentAnalysisCache({
        databaseName: 'namespace-history-test',
        namespace: 'analysis-contract-v1',
        contractVersion: '1',
        appVersion: '1.6.1',
        maxItems: 8,
        maxBytes: 8 * 1024 * 1024
    });
    await legacy.set('legacy-private-name.mp4::video/mp4::::100::1::10::legacy-fingerprint::balanced::16000::40::analysis-contract-v1', { score: 1 }, { tier: 'balanced', contractVersion: '1', appVersion: '1.6.1' });

    const current = window.AIShortsAnalysisCache.createPersistentAnalysisCache({
        databaseName: 'namespace-history-test',
        namespace: 'analysis-contract-v2',
        contractVersion: '2',
        appVersion: '1.6.1',
        maxItems: 8,
        maxBytes: 8 * 1024 * 1024
    });
    await current.set('current-private-name.mp4::video/mp4::::100::1::10::current-fingerprint::quality::48000::80::analysis-contract-v2', { score: 2 }, { tier: 'quality', contractVersion: '2', appVersion: '1.6.1' });

    const before = await current.getNamespaceStatus();
    assert(before.current && before.current.count === 1, 'current analysis namespace remains visible');
    assert(before.legacyNamespaceCount === 1 && before.legacyItems === 1, 'legacy analysis namespace is preserved for explicit review');
    assert(before.legacy[0].token && before.legacy[0].namespace === '', 'legacy namespace is exposed through a privacy-safe token only');
    assert(before.legacy[0].contractVersions.includes('1'), 'legacy namespace summary includes contract metadata');

    const removed = await current.deleteNamespaces([before.legacy[0].token]);
    assert(removed.removedNamespaces === 1 && removed.removed === 1 && removed.bytes > 0, 'selected legacy namespace cleanup removes only matching rows');

    const after = await current.getNamespaceStatus();
    assert(after.current.count === 1 && after.legacyNamespaceCount === 0, 'selected cleanup preserves the current namespace');

    const history = current.maintenanceHistory();
    assert(history.length === 1 && history[0].operation === 'namespace-delete', 'namespace cleanup is recorded in bounded maintenance history');
    assert(history[0].namespaceTokens.length === 1 && history[0].removed === 1, 'maintenance history records tokenized scope and removed count');
    const serialized = JSON.stringify(history);
    assert(!serialized.includes('legacy-private-name.mp4') && !serialized.includes('analysis-contract-v1'), 'maintenance history does not expose file names or raw legacy namespace values');

    const reloaded = window.AIShortsAnalysisCache.createPersistentAnalysisCache({
        databaseName: 'namespace-history-test',
        namespace: 'analysis-contract-v2',
        contractVersion: '2',
        appVersion: '1.6.1',
        maxItems: 8,
        maxBytes: 8 * 1024 * 1024
    });
    assert(reloaded.maintenanceHistory().length === 1, 'maintenance history survives cache facade recreation');
    console.log('PASS privacy-safe namespace status, selected cleanup, and persistent maintenance history');
})().catch(error => {
    console.error(error.stack || error);
    process.exit(1);
});
