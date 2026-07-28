#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { webcrypto } = require('crypto');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/vision/vision-model-pack-manager.js'), 'utf8');
const panel = fs.readFileSync(path.join(root, 'src/ui/vision-model-pack-panel.js'), 'utf8');

function assert(condition, message) {
    if (!condition) throw new Error(message);
    console.log(`PASS ${message}`);
}

(() => {
    const values = new Map();
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
        navigator: { platform: 'TestOS', hardwareConcurrency: 8, deviceMemory: 16 },
        document,
        caches: { async open() { return {}; } },
        AIShortsRuntimeConfig: { VISION_MODEL_PACK_BENCHMARK_MAX_AGE_MS: 7 * 24 * 60 * 60 * 1000 },
        WebAssembly,
        setTimeout,
        clearTimeout
    };
    const context = vm.createContext({ window, document, URL, TextEncoder, Uint8Array, ArrayBuffer, Date, JSON, Object, Array, Map, Set, Math, Number, String, RegExp, Error, Promise, Response, console, CustomEvent: function CustomEvent() {} });
    vm.runInContext(source, context, { filename: 'vision-model-pack-manager.js' });
    const api = window.AIShortsVisionModelPacks;
    const packId = 'vision-1111111111111111';
    const env = api._test.benchmarkEnvironmentKey();
    const now = Date.parse('2026-07-27T00:00:00.000Z');
    const record = (overrides = {}) => Object.assign({
        id: 'bench-1111111111111111',
        packId,
        backend: 'cpu',
        createdAt: '2026-07-26T00:00:00.000Z',
        iterations: 8,
        medianMs: 10,
        p95Ms: 12,
        fps: 100,
        status: 'passed',
        error: '',
        environmentKey: env
    }, overrides);

    assert(api._test.benchmarkFreshness(packId, { history: [], capabilities: { gpuDelegate: false }, environmentKey: env, nowMs: now }).code === 'missing', 'missing benchmark history requires remeasurement');
    assert(api._test.benchmarkFreshness(packId, { history: [record({ environmentKey: '' })], capabilities: { gpuDelegate: false }, environmentKey: env, nowMs: now }).code === 'legacy-environment', 'legacy benchmark without environment identity requires refresh');
    assert(api._test.benchmarkFreshness(packId, { history: [record({ environmentKey: 'different-device' })], capabilities: { gpuDelegate: false }, environmentKey: env, nowMs: now }).code === 'environment-changed', 'device environment changes invalidate the prior recommendation');
    assert(api._test.benchmarkFreshness(packId, { history: [record({ createdAt: '2026-07-10T00:00:00.000Z' })], capabilities: { gpuDelegate: false }, environmentKey: env, nowMs: now }).code === 'stale', 'benchmark records expire after the configured age');
    assert(api._test.benchmarkFreshness(packId, { history: [record()], capabilities: { gpuDelegate: false }, environmentKey: env, nowMs: now }).due === false, 'recent benchmark from the same environment remains valid');

    const trend = api._test.benchmarkTrend([
        record({ id: 'bench-2222222222222222', medianMs: 12, createdAt: '2026-07-26T00:00:00.000Z' }),
        record({ id: 'bench-3333333333333333', medianMs: 10, createdAt: '2026-07-20T00:00:00.000Z' })
    ]);
    assert(trend.cpu.direction === 'regressed' && trend.cpu.deltaPercent === 20, 'benchmark trend reports material median-latency regression');
    assert(typeof api.scheduleBenchmarkRefresh === 'function', 'model manager exposes an automatic benchmark refresh scheduler');
    assert(panel.includes('manager.scheduleBenchmarkRefresh(runtime.packId)'), 'model activation schedules stale benchmark refresh from the UI owner');
    assert(panel.includes("'재측정 필요'"), 'model panel clearly labels expired or environment-mismatched measurements');
    console.log('PASS v1.6.20 model benchmark freshness, trend, and auto-refresh policy');
})();
