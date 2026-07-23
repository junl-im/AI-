#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { webcrypto } = require('crypto');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/engine/analysis-cache.js'), 'utf8');
const window = { structuredClone: global.structuredClone, crypto: webcrypto, AIShortsRuntimeConfig: { APP_VERSION: 'v-test', ANALYSIS_CACHE_FINGERPRINT_SAMPLE_BYTES: 4096 } };
vm.runInNewContext(source, { window, ArrayBuffer, Date, Object, Map, Math, Number, String, Uint8Array, DataView, WeakMap, Set });

function namedBlob(text) {
    const blob = new Blob([text.repeat(5000)], { type: 'video/mp4' });
    Object.defineProperty(blob, 'name', { value: 'same.mp4' });
    Object.defineProperty(blob, 'lastModified', { value: 123456 });
    return blob;
}

(async () => {
    const a = namedBlob('A');
    const b = namedBlob('B');
    const aCopy = namedBlob('A');
    const meta = { name: 'same.mp4', size: a.size, type: 'video/mp4', lastModified: 123456, duration: 20 };
    const budget = { tier: 'balanced', analysisSampleRate: 12000, motionSamples: 80 };
    const keyA = await window.AIShortsAnalysisCache.makeFileKeyAsync(a, meta, budget);
    const keyB = await window.AIShortsAnalysisCache.makeFileKeyAsync(b, meta, budget);
    const keyACopy = await window.AIShortsAnalysisCache.makeFileKeyAsync(aCopy, meta, budget);
    if (keyA === keyB) throw new Error('same metadata with different file bytes must not collide');
    if (keyA !== keyACopy) throw new Error('same sampled content and metadata should reuse the cache key');
    const cache = window.AIShortsAnalysisCache.createAnalysisCache(2);
    cache.set(keyA, { value: 'A' });
    if (cache.get(keyB)) throw new Error('content-distinct key must not hit another file analysis');
    if (!cache.stats().fingerprintedKeys) throw new Error('cache diagnostics must report fingerprinted key policy');
    console.log('PASS sampled file fingerprint prevents analysis cache collisions');
})().catch(error => { console.error(error.stack || error); process.exit(1); });
