#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { webcrypto } = require('crypto');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/vision/vision-model-pack-manager.js'), 'utf8');

function assert(condition, message) {
    if (!condition) throw new Error(message);
    console.log(`PASS ${message}`);
}

(async () => {
    const values = new Map();
    const stores = new Map();
    let quotaUsage = 9500;
    const quota = 10000;
    let putCount = 0;

    function responseBytes(response) {
        return Math.max(0, Number(response && response.headers && response.headers.get('Content-Length')) || 0);
    }

    const cache = {
        async put(key, response) {
            const url = String(key);
            const previous = stores.get(url);
            quotaUsage -= responseBytes(previous);
            const copy = response && response.clone ? response.clone() : response;
            stores.set(url, copy);
            quotaUsage += responseBytes(copy);
            putCount += 1;
        },
        async match(key) {
            const value = stores.get(String(key));
            return value && value.clone ? value.clone() : value || null;
        },
        async delete(key) {
            const url = String(key);
            const previous = stores.get(url);
            if (!previous) return false;
            stores.delete(url);
            quotaUsage = Math.max(0, quotaUsage - responseBytes(previous));
            return true;
        },
        async keys() { return Array.from(stores.keys()).map(url => ({ url })); }
    };

    const document = {
        baseURI: 'https://example.test/app/',
        visibilityState: 'visible',
        dispatchEvent() {},
        createElement() { return {}; }
    };
    const window = {
        crypto: webcrypto,
        localStorage: {
            getItem(key) { return values.has(key) ? values.get(key) : null; },
            setItem(key, value) { values.set(key, String(value)); },
            removeItem(key) { values.delete(key); }
        },
        location: { href: 'https://example.test/app/', origin: 'https://example.test' },
        navigator: { storage: { async estimate() { return { usage: quotaUsage, quota }; } } },
        document,
        caches: { async open() { return cache; } },
        AIShortsRuntimeConfig: {
            VISION_MODEL_PACK_MAX_PACKS: 3,
            VISION_MODEL_PACK_STORAGE_RESERVE_BYTES: 512,
            VISION_MODEL_PACK_STORAGE_WRITE_OVERHEAD_RATIO: 1
        },
        WebAssembly,
        setTimeout,
        clearTimeout
    };
    const context = vm.createContext({ window, document, URL, TextEncoder, Uint8Array, ArrayBuffer, Date, JSON, Object, Array, Map, Set, Math, Number, String, RegExp, Error, Promise, Response, console, CustomEvent: function CustomEvent() {} });
    vm.runInContext(source, context, { filename: 'vision-model-pack-manager.js' });
    const api = window.AIShortsVisionModelPacks;

    const retainedId = 'vision-1111111111111111';
    const retainedBody = new TextEncoder().encode('retained').buffer;
    const retainedPack = {
        id: retainedId,
        label: '기존 모델',
        provider: 'mediapipe-tasks-vision',
        runtimeVersion: '0.10.test',
        installedAt: '2026-07-27T00:00:00.000Z',
        verifiedAt: '2026-07-27T00:00:00.000Z',
        verification: 'verified',
        totalBytes: 100,
        files: [{ name: 'vision_bundle.mjs', path: 'vision_bundle.mjs', role: 'runtime', bytes: 100, sha256: 'a'.repeat(64), contentType: 'text/javascript' }],
        modelPath: 'models/face_detector.task',
        runtimePath: 'vision_bundle.mjs'
    };
    values.set('ai-shorts-vision-model-packs-v1', JSON.stringify({ version: 1, packs: [retainedPack] }));
    const retainedUrl = api.assetUrl(retainedId, 'vision_bundle.mjs');
    stores.set(retainedUrl, new Response(retainedBody.slice(0), { headers: { 'Content-Length': '100' } }));
    const orphanUrl = api.assetUrl('vision-deaddeaddeaddead', 'models/orphan.task');
    stores.set(orphanUrl, new Response(new Uint8Array(4000), { headers: { 'Content-Length': '4000' } }));

    const files = api._test.REQUIRED_RUNTIME_FILES.concat('face_detector.task').map(name => {
        const bytes = new TextEncoder().encode(`fresh:${name}`);
        return {
            name,
            size: bytes.byteLength,
            async arrayBuffer() { return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength); }
        };
    });

    const inspection = await api.inspectOrphanedCache();
    assert(inspection.orphanCount === 1 && inspection.orphanBytes === 4000, 'dry-run cache inspection reports orphan count and estimated bytes without deletion');
    assert(stores.has(orphanUrl), 'dry-run cache inspection does not delete orphaned assets');
    const diagnostics = await api.storageDiagnostics();
    assert(diagnostics.packCount === 1 && diagnostics.installedBytes === 100 && diagnostics.cache.orphanCount === 1, 'storage diagnostics combine origin estimate, installed packs, and orphan cache data');

    const before = await api.estimateInstallCapacity(files.reduce((sum, file) => sum + file.size, 0));
    assert(before.status === 'insufficient', 'storage preflight detects insufficient quota before model writes');
    const installed = await api.installFromFiles(files);
    assert(Boolean(installed && installed.id), 'installation retries after automatic orphan-cache reclamation');
    assert(!stores.has(orphanUrl), 'orphaned model cache entry is removed during quota recovery');
    assert(stores.has(retainedUrl), 'registered existing model cache entry is preserved during orphan cleanup');
    assert(api.listPacks().some(pack => pack.id === retainedId), 'registered existing model metadata remains intact');

    const cleanup = await api.cleanupOrphanedCache();
    assert(cleanup.removedCount === 0, 'manual orphan cleanup is idempotent after successful repair');

    quotaUsage = 9990;
    const putsBeforeFailure = putCount;
    const blockedFiles = api._test.REQUIRED_RUNTIME_FILES.concat('blaze_face.task').map(name => {
        const bytes = new TextEncoder().encode(`blocked-different-content:${name}`);
        return {
            name,
            size: bytes.byteLength,
            async arrayBuffer() { return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength); }
        };
    });
    let blocked = false;
    try {
        await api.installFromFiles(blockedFiles);
    } catch (error) {
        blocked = error && error.code === 'VISION_MODEL_PACK_QUOTA' && /저장 공간이 부족/.test(error.message);
    }
    assert(blocked, 'insufficient quota without reclaimable orphans blocks installation with a specific error');
    assert(putCount === putsBeforeFailure, 'quota rejection occurs before any new cache write');
    console.log('PASS v1.6.15 vision model-pack storage preflight and orphan reclamation guardrails');
})().catch(error => {
    console.error(error && error.stack || error);
    process.exit(1);
});
