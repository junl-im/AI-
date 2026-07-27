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
    const cache = {
        async put(key, response) { stores.set(String(key), response); },
        async match(key) { const value = stores.get(String(key)); return value && value.clone ? value.clone() : value || null; },
        async delete(key) { return stores.delete(String(key)); }
    };
    const document = {
        baseURI: 'https://example.test/app/',
        createElement(name) {
            if (name !== 'canvas') return {};
            return { width: 0, height: 0, getContext() { return { fillStyle: '', fillRect() {} }; } };
        },
        dispatchEvent() {}
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
        AIShortsRuntimeConfig: { VISION_MODEL_PACK_BENCHMARK_ITERATIONS: 4 },
        AIShortsSmartReframe: { registerDetectorProvider() {} },
        WebAssembly,
        setTimeout,
        clearTimeout
    };
    const context = vm.createContext({ window, document, URL, TextEncoder, Uint8Array, ArrayBuffer, Date, JSON, Object, Array, Map, Set, Math, Number, String, RegExp, Error, Promise, Response, console, CustomEvent: function CustomEvent() {} });
    vm.runInContext(source, context, { filename: 'vision-model-pack-manager.js' });
    const api = window.AIShortsVisionModelPacks;
    const required = api._test.REQUIRED_RUNTIME_FILES;

    async function seedPack(id, label, modelName) {
        const files = [];
        const names = required.concat(modelName);
        for (const name of names) {
            const role = name === 'vision_bundle.mjs' ? 'runtime' : name.endsWith('.task') ? 'model' : 'wasm';
            const stored = api._test.storedPath(name, role);
            const buffer = new TextEncoder().encode(`${id}:${name}`).buffer;
            const hash = await api._test.sha256(buffer);
            files.push({ name, path: stored, role, bytes: buffer.byteLength, sha256: hash, contentType: 'application/octet-stream' });
            await cache.put(api.assetUrl(id, stored), new Response(buffer.slice(0)));
        }
        return { id, label, provider: 'mediapipe-tasks-vision', runtimeVersion: '0.10.test', installedAt: new Date().toISOString(), verifiedAt: new Date().toISOString(), verification: 'verified', totalBytes: files.reduce((sum, item) => sum + item.bytes, 0), files, modelPath: `models/${modelName}`, runtimePath: 'vision_bundle.mjs' };
    }

    const oldPack = await seedPack('vision-1111111111111111', '이전 모델', 'face_detector.task');
    const newPack = await seedPack('vision-2222222222222222', '새 모델', 'blaze_face.task');
    values.set('ai-shorts-vision-model-packs-v1', JSON.stringify({ version: 1, packs: [newPack, oldPack] }));

    let clock = 0;
    const runtimeModule = {
        FilesetResolver: { async forVisionTasks() { return {}; } },
        FaceDetector: {
            async createFromOptions(_, options) {
                const isNew = String(options.baseOptions.modelAssetPath).includes(newPack.id);
                const delegate = options.baseOptions.delegate;
                if (isNew && delegate === 'GPU' && runtimeModule.failNewGpu) throw new Error('GPU delegate failed');
                if (isNew && delegate === 'CPU' && runtimeModule.failNewCpu) throw new Error('CPU delegate failed');
                const step = delegate === 'GPU' ? 3 : 8;
                return {
                    detectForVideo() { clock += step; return { detections: [] }; },
                    close() {}
                };
            }
        }
    };

    const benchmark = await api.benchmarkPack(newPack.id, { runtimeModule, backends: ['gpu', 'cpu'], iterations: 4, warmup: 1, now: () => clock, frame: {} });
    assert(benchmark.results.length === 2 && benchmark.results.every(item => item.status === 'passed'), 'CPU and GPU model-pack benchmarks complete locally');
    assert(benchmark.recommendation.backend === 'gpu', 'faster GPU benchmark is recommended for this device');
    const summary = api.performanceSummary(newPack.id);
    assert(summary.latest.length === 2 && summary.recommendation.backend === 'gpu', 'benchmark history and recommendation persist in local storage');

    const oldRuntime = await api.activatePack(oldPack.id, { runtimeModule, backend: 'cpu', autoRollback: false });
    assert(oldRuntime.active && oldRuntime.packId === oldPack.id, 'previous verified model activates before a model switch');
    runtimeModule.failNewGpu = true;
    runtimeModule.failNewCpu = true;
    const recovered = await api.activatePack(newPack.id, { runtimeModule, backend: 'auto' });
    assert(recovered.recovered === true && recovered.packId === oldPack.id, 'failed replacement automatically rolls back to the previous verified model');
    assert(api.snapshot().runtime.active && api.snapshot().runtime.lastRecovery, 'rollback recovery is visible in the runtime snapshot');

    runtimeModule.failNewGpu = false;
    runtimeModule.failNewCpu = false;
    const switched = await api.activatePack(newPack.id, { runtimeModule, backend: 'gpu' });
    assert(switched.packId === newPack.id, 'replacement model activates after the runtime fault is cleared');
    const rolledBack = await api.rollbackToPrevious({ runtimeModule });
    assert(rolledBack.packId === oldPack.id && rolledBack.recovered === true, 'manual rollback restores the previous verified model');
    assert(api.snapshot().rollback.packId === newPack.id, 'manual rollback keeps the replaced model as a reversible undo target');

    const activeNewGpu = await api.activatePack(newPack.id, { runtimeModule, backend: 'gpu' });
    assert(activeNewGpu.packId === newPack.id && activeNewGpu.backend === 'gpu', 'replacement model can be reactivated on the GPU backend');
    runtimeModule.failNewCpu = true;
    const backendRecovered = await api.activatePack(newPack.id, { runtimeModule, backend: 'cpu' });
    assert(backendRecovered.recovered === true && backendRecovered.packId === newPack.id && backendRecovered.backend === 'gpu', 'failed backend switch restores the current model and last known-good backend');
    assert(api.snapshot().rollback.packId === oldPack.id, 'backend recovery preserves the previous-model rollback target');
    runtimeModule.failNewCpu = false;

    const recommendation = api._test.benchmarkRecommendation([
        { backend: 'gpu', status: 'failed', medianMs: 0 },
        { backend: 'cpu', status: 'passed', medianMs: 10 }
    ]);
    assert(recommendation.backend === 'cpu', 'failed GPU measurements safely recommend the CPU path');
    console.log('PASS v1.6.15 model-pack performance diagnostics, backend recovery, and safe rollback contract');
})().catch(error => {
    console.error(error && error.stack || error);
    process.exit(1);
});
