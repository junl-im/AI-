#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/engine/analysis-cache.js'), 'utf8');
const kernelSource = fs.readFileSync(path.join(root, 'src/engine/engine-kernel.js'), 'utf8');

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
        createObjectStore() { created = true; return { createIndex() {} }; },
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
        setItem(key, value) { values.set(key, String(value)); }
    };
}

function assert(value, message) {
    if (!value) throw new Error(message);
    console.log(`PASS ${message}`);
}

(async () => {
    const indexedDB = fakeIndexedDB();
    const window = {
        indexedDB,
        localStorage: fakeLocalStorage(),
        navigator: { storage: { async estimate() { return { usage: 100, quota: 1000 }; } } },
        AIShortsRuntimeConfig: { APP_VERSION: 'v1.5.29', ANALYSIS_CACHE_STORAGE_TREND_LIMIT: 12 },
        structuredClone: global.structuredClone
    };
    vm.runInContext(source, vm.createContext({ window, Date, Object, Array, Map, Set, WeakMap, Promise, JSON, Math, Number, String, Uint8Array, DataView, setTimeout, clearTimeout, console }), { filename: 'analysis-cache.js' });
    const api = window.AIShortsAnalysisCache;

    const optionsA = { silenceThreshold: 0.09, beatSensitivity: 0.58, motionSensitivity: 0.6, handlePadding: 0.25 };
    const optionsAReordered = { handlePadding: 0.25, motionSensitivity: 0.6, beatSensitivity: 0.58, silenceThreshold: 0.09 };
    const optionsB = { silenceThreshold: 0.12, beatSensitivity: 0.58, motionSensitivity: 0.6, handlePadding: 0.25 };
    const signatureA = api.makeOptionSignature(optionsA);
    const signatureA2 = api.makeOptionSignature(optionsAReordered);
    const signatureB = api.makeOptionSignature(optionsB);
    assert(signatureA.length === 16 && signatureA === signatureA2, 'analysis option signature is stable across object key order');
    assert(signatureA !== signatureB, 'analysis option signature changes when an analysis-affecting option changes');

    const keyA = api.makeFileKey(null, { name: 'sample.mp4', size: 100, lastModified: 1, fingerprint: 'fp' }, { tier: 'balanced', analysisSampleRate: 16000, motionSamples: 40, optionSignature: signatureA, cacheNamespace: 'analysis-contract-v3' });
    const keyB = api.makeFileKey(null, { name: 'sample.mp4', size: 100, lastModified: 1, fingerprint: 'fp' }, { tier: 'balanced', analysisSampleRate: 16000, motionSamples: 40, optionSignature: signatureB, cacheNamespace: 'analysis-contract-v3' });
    assert(keyA !== keyB, 'persistent and memory cache keys isolate different analysis option signatures');
    assert(kernelSource.includes('getAutoCutOptions()') && kernelSource.includes('optionSignature })') && kernelSource.includes('getAutoCutOptions: () => autoCutOptions'), 'engine snapshots auto-cut options once and reuses the same signature for cache lookup and analysis');

    const cache = api.createPersistentAnalysisCache({ databaseName: 'signature-trend-test', namespace: 'analysis-contract-v3', contractVersion: '3', appVersion: '1.5.29', maxItems: 8, maxBytes: 8 * 1024 * 1024, storageTrendLimit: 12 });
    await cache.set(keyA, { score: 1 }, { tier: 'balanced', contractVersion: '3', optionSignature: signatureA });
    await cache.set(keyB, { score: 2 }, { tier: 'balanced', contractVersion: '3', optionSignature: signatureB });

    const snapshot = await cache.maintenanceSnapshot({ refresh: false, trendLimit: 12 });
    assert(snapshot.entries.length === 2 && snapshot.optionSignatures.groups.length === 2, 'single maintenance snapshot exposes entries and grouped option signatures');
    assert(snapshot.storageTrend.length >= 1 && snapshot.storageTrend[0].totalItems === 2, 'namespace storage cost trend records item and byte growth');
    const scansBefore = cache.stats().readAllScans;
    await cache.maintenanceSnapshot({ refresh: false });
    assert(cache.stats().readAllScans === scansBefore, 'cached maintenance snapshot avoids an additional IndexedDB full scan');
    const scansBeforePolicyRefresh = cache.stats().readAllScans;
    await cache.prune({ forceQuota: true });
    assert(cache.stats().readAllScans - scansBeforePolicyRefresh === 1, 'cache policy refresh updates snapshots with exactly one IndexedDB full scan');

    const removed = await cache.invalidate({ optionSignatureToken: signatureA, reason: 'option-signature' });
    assert(removed.removed === 1, 'option signature token invalidation removes only the selected cache group');
    const after = await cache.maintenanceSnapshot({ refresh: false, trendLimit: 12 });
    assert(after.entries.length === 1 && after.entries[0].optionSignatureToken === signatureB, 'unrelated option signature cache remains available');
    assert(after.storageTrend.length >= 2 && after.storageTrend[0].totalItems === 1, 'storage trend records cleanup cost reduction');
    assert(!JSON.stringify(after).includes('sample.mp4'), 'maintenance snapshot does not expose file names or raw cache keys');
    console.log('PASS option-aware cache correctness, grouped cleanup, storage trend, and cached snapshot performance');
})().catch(error => {
    console.error(error.stack || error);
    process.exit(1);
});
