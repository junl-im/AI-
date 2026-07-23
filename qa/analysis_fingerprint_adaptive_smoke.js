#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { webcrypto } = require('crypto');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/engine/analysis-cache.js'), 'utf8');
const window = {
    structuredClone: global.structuredClone,
    crypto: webcrypto,
    performance,
    AIShortsRuntimeConfig: {
        APP_VERSION: 'v-test',
        ANALYSIS_CACHE_FINGERPRINT_SAMPLE_BYTES: 4096,
        ANALYSIS_CACHE_MAX_SAMPLE_BYTES: 32768,
        ANALYSIS_CACHE_FULL_HASH_MAX_BYTES: 8192,
        ANALYSIS_CACHE_METADATA_HISTORY_LIMIT: 16
    }
};
vm.runInNewContext(source, { window, ArrayBuffer, Date, Object, Map, Math, Number, String, Uint8Array, DataView, WeakMap, Set });

function virtualFile(size, mutationIndex) {
    const bytes = new Uint8Array(size);
    if (Number.isFinite(mutationIndex) && mutationIndex >= 0 && mutationIndex < size) bytes[mutationIndex] = 255;
    const calls = [];
    return {
        name: 'same.mp4', type: 'video/mp4', size, lastModified: 1234, calls,
        slice(start, end) {
            calls.push([start, end]);
            const copy = bytes.slice(start, end);
            return { arrayBuffer: async () => copy.buffer };
        }
    };
}

(async () => {
    const api = window.AIShortsAnalysisCache;
    const small = virtualFile(4096);
    const smallFingerprint = await api.computeFileFingerprint(small);
    if (!smallFingerprint.includes('-full:')) throw new Error('small files must use a full-file fingerprint');
    if (small.calls.length !== 1 || small.calls[0][0] !== 0 || small.calls[0][1] !== small.size) throw new Error('small full hash must read the file exactly once');

    const largeSize = 20 * 1024 * 1024;
    const plan = api.fingerprintPlan(largeSize);
    if (plan.mode !== 'sampled' || plan.starts.length < 7) throw new Error('large files must expand to at least seven distributed samples');
    const mutationIndex = plan.starts[2] + 10;
    const largeA = virtualFile(largeSize);
    const largeB = virtualFile(largeSize, mutationIndex);
    const fingerprintA = await api.computeFileFingerprint(largeA);
    const fingerprintB = await api.computeFileFingerprint(largeB);
    if (!fingerprintA.includes('-sampled:') || fingerprintA === fingerprintB) throw new Error('distributed samples must distinguish content changes outside the old three sample points');
    if (largeA.calls.length !== plan.starts.length || largeA.calls.some(([start, end]) => start === 0 && end === largeSize)) throw new Error('large files must avoid a full-file read');

    await api.computeFileFingerprint(largeA);
    const stats = api.fingerprintStats();
    if (stats.fullFileHashes < 1 || stats.sampledHashes < 2) throw new Error('fingerprint diagnostics must count full and sampled hashes');
    if (stats.promiseHits < 1) throw new Error('same file object fingerprint promise must be reused');
    if (stats.collisionAvoidanceCount < 1) throw new Error('same metadata with different content must count as a collision avoided');
    if (!stats.lastMs && stats.lastMs !== 0 || stats.totalBytes <= 0) throw new Error('fingerprint timing and byte diagnostics must be available');
    console.log('PASS adaptive full/sample fingerprint plan and diagnostics');
})().catch(error => { console.error(error.stack || error); process.exit(1); });
