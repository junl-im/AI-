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
    let putCount = 0;
    let failAfter = Infinity;
    const cache = {
        async put(key, response) {
            putCount += 1;
            if (putCount > failAfter) throw new Error('simulated cache quota failure');
            stores.set(String(key), response && response.clone ? response.clone() : response);
        },
        async match(key) {
            const value = stores.get(String(key));
            return value && value.clone ? value.clone() : value || null;
        },
        async delete(key) { return stores.delete(String(key)); }
    };
    const document = {
        baseURI: 'https://example.test/app/',
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
        navigator: {},
        document,
        caches: { async open() { return cache; } },
        AIShortsRuntimeConfig: { VISION_MODEL_PACK_MAX_PACKS: 3 },
        WebAssembly,
        setTimeout,
        clearTimeout
    };
    const context = vm.createContext({ window, document, URL, TextEncoder, Uint8Array, ArrayBuffer, Date, JSON, Object, Array, Map, Set, Math, Number, String, RegExp, Error, Promise, Response, console, CustomEvent: function CustomEvent() {} });
    vm.runInContext(source, context, { filename: 'vision-model-pack-manager.js' });
    const api = window.AIShortsVisionModelPacks;

    function seedPack(id, label, installedAt) {
        const pathName = 'vision_bundle.mjs';
        const body = new TextEncoder().encode(`${id}:${label}`).buffer;
        const pack = {
            id,
            label,
            provider: 'mediapipe-tasks-vision',
            runtimeVersion: '0.10.test',
            installedAt,
            verifiedAt: installedAt,
            verification: 'verified',
            totalBytes: body.byteLength,
            files: [{ name: pathName, path: pathName, role: 'runtime', bytes: body.byteLength, sha256: 'a'.repeat(64), contentType: 'text/javascript' }],
            modelPath: 'models/face_detector.task',
            runtimePath: pathName
        };
        stores.set(api.assetUrl(id, pathName), new Response(body.slice(0)));
        return pack;
    }

    const active = seedPack('vision-1111111111111111', '활성 모델', '2026-07-03T00:00:00.000Z');
    const recent = seedPack('vision-2222222222222222', '최근 모델', '2026-07-02T00:00:00.000Z');
    const oldest = seedPack('vision-3333333333333333', '오래된 모델', '2026-07-01T00:00:00.000Z');
    values.set('ai-shorts-vision-model-packs-v1', JSON.stringify({ version: 1, packs: [active, recent, oldest] }));
    values.set('ai-shorts-vision-model-pack-active-v1', JSON.stringify({ packId: active.id, backend: 'cpu' }));
    const beforeKeys = Array.from(stores.keys()).sort();

    const required = api._test.REQUIRED_RUNTIME_FILES;
    const files = required.concat('face_detector.task').map(name => {
        const bytes = new TextEncoder().encode(`new-pack:${name}`);
        return {
            name,
            size: bytes.byteLength,
            async arrayBuffer() { return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength); }
        };
    });

    failAfter = 2;
    let failed = false;
    try {
        await api.installFromFiles(files);
    } catch (error) {
        failed = /기존 모델 팩은 유지/.test(error && error.message || '');
    }
    assert(failed, 'cache write failure is surfaced as a non-destructive install error');
    const afterStore = JSON.parse(values.get('ai-shorts-vision-model-packs-v1'));
    assert(afterStore.packs.length === 3 && afterStore.packs.some(pack => pack.id === oldest.id), 'failed installation preserves the existing pack inventory');
    assert(Array.from(stores.keys()).sort().join('|') === beforeKeys.join('|'), 'failed installation removes partially staged cache entries');
    assert(JSON.parse(values.get('ai-shorts-vision-model-pack-active-v1')).packId === active.id, 'failed installation preserves the active model selection');
    console.log('PASS v1.6.15 transactional vision model-pack installation guardrails');
})().catch(error => {
    console.error(error && error.stack || error);
    process.exit(1);
});
