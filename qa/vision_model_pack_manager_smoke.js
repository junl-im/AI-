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

const values = new Map();
const window = {
    crypto: webcrypto,
    localStorage: {
        getItem(key) { return values.has(key) ? values.get(key) : null; },
        setItem(key, value) { values.set(key, String(value)); }
    },
    location: { href: 'https://example.test/app/', origin: 'https://example.test' },
    navigator: {},
    AIShortsRuntimeConfig: {},
    WebAssembly,
    setTimeout,
    clearTimeout
};
vm.runInContext(source, vm.createContext({ window, URL, TextEncoder, Uint8Array, ArrayBuffer, Date, JSON, Object, Array, Map, Set, Math, Number, String, RegExp, Error, Promise, console }), { filename: 'vision-model-pack-manager.js' });
const api = window.AIShortsVisionModelPacks;
const required = api._test.REQUIRED_RUNTIME_FILES.map(name => ({ name, size: 1024 }));
const model = { name: 'blaze_face_short_range.tflite', size: 2048 };
const selected = api._test.selectInputFiles(required.concat(model));

assert(selected.files.length === 8 && selected.modelName === model.name, 'official MediaPipe runtime set and face model are accepted');
assert(selected.files.some(item => item.role === 'runtime') && selected.files.filter(item => item.role === 'wasm').length === 6, 'runtime and WASM roles are bounded by an allowlist');
assert(api._test.storedPath('vision_wasm_internal.wasm', 'wasm') === 'wasm/vision_wasm_internal.wasm', 'WASM files use an isolated synthetic path');
assert(api._test.storedPath(model.name, 'model') === `models/${model.name}`, 'face model uses an isolated synthetic model path');
let missingBlocked = false;
try { api._test.selectInputFiles(required); } catch (error) { missingBlocked = /얼굴 감지 모델/.test(error.message); }
assert(missingBlocked, 'pack installation is rejected when the face model is missing');
let oversizeBlocked = false;
try { api._test.selectInputFiles(required.concat({ name: model.name, size: 80 * 1024 * 1024 })); } catch (error) { oversizeBlocked = /단일 파일|전체 크기/.test(error.message); }
assert(oversizeBlocked, 'oversized model files are rejected before storage');
const snapshot = api.snapshot();
assert(snapshot.policy.localFilesOnly === true && snapshot.policy.remoteDownload === false && snapshot.policy.integrity === 'sha256', 'model-pack policy is local-file-only with SHA-256 verification');
assert(snapshot.packs.length === 0 && snapshot.runtime.active === false, 'manager performs no install or activation at startup');
assert(api.assetUrl('vision-0123456789abcdef', 'wasm/test.wasm').includes('/__ai_shorts_vision_pack__/vision-0123456789abcdef/wasm/test.wasm'), 'synthetic same-origin asset URLs are scoped to the vision-pack namespace');
console.log('PASS browser vision model-pack security and validation contract');
