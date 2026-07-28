#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { webcrypto } = require('crypto');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/vision/vision-model-pack-manager.js'), 'utf8');
const panel = fs.readFileSync(path.join(root, 'src/ui/vision-model-pack-panel.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/css/smart-reframe.css'), 'utf8');

function assert(condition, message) {
    if (!condition) throw new Error(message);
    console.log(`PASS ${message}`);
}

(() => {
    const values = new Map();
    const document = { baseURI: 'https://example.test/app/', dispatchEvent() {}, createElement() { return {}; } };
    const window = {
        crypto: webcrypto,
        localStorage: {
            getItem(key) { return values.has(key) ? values.get(key) : null; },
            setItem(key, value) { values.set(key, String(value)); },
            removeItem(key) { values.delete(key); }
        },
        location: { href: 'https://example.test/app/', origin: 'https://example.test' },
        navigator: { platform: 'HistoryOS', hardwareConcurrency: 8, deviceMemory: 16 },
        document,
        caches: { async open() { return {}; } },
        AIShortsRuntimeConfig: {},
        WebAssembly,
        setTimeout,
        clearTimeout
    };
    const context = vm.createContext({ window, document, URL, TextEncoder, Uint8Array, ArrayBuffer, Date, JSON, Object, Array, Map, Set, Math, Number, String, RegExp, Error, Promise, Response, console, CustomEvent: function CustomEvent() {} });
    vm.runInContext(source, context, { filename: 'vision-model-pack-manager.js' });
    const api = window.AIShortsVisionModelPacks;
    const env = api._test.benchmarkEnvironmentKey();
    const record = (id, backend, createdAt, medianMs, environmentKey = env, status = 'passed') => ({
        id,
        packId: 'vision-1111111111111111',
        backend,
        createdAt,
        iterations: 8,
        medianMs,
        p95Ms: medianMs + 2,
        fps: 1000 / medianMs,
        status,
        error: '',
        environmentKey
    });
    const history = [
        record('bench-1111111111111111', 'cpu', '2026-07-27T03:00:00.000Z', 11),
        record('bench-2222222222222222', 'gpu', '2026-07-27T03:00:00.000Z', 7),
        record('bench-3333333333333333', 'cpu', '2026-07-20T03:00:00.000Z', 12),
        record('bench-4444444444444444', 'gpu', '2026-07-20T03:00:00.000Z', 8),
        record('bench-5555555555555555', 'cpu', '2026-07-10T03:00:00.000Z', 20, 'other-device'),
        record('bench-6666666666666666', 'gpu', '2026-07-10T03:00:00.000Z', 25, env, 'failed')
    ];
    const series = api._test.benchmarkSeries(history, { environmentKey: env, limit: 10 });
    assert(series.count === 4 && series.cpu.length === 2 && series.gpu.length === 2, 'benchmark history includes only passed samples from the current device environment');
    assert(series.cpu[0].medianMs === 12 && series.cpu[1].medianMs === 11, 'CPU history is ordered oldest to newest for chart rendering');
    assert(series.gpu[0].medianMs === 8 && series.gpu[1].medianMs === 7, 'GPU history is ordered oldest to newest for chart rendering');
    assert(series.minMedianMs === 7 && series.maxMedianMs === 12, 'benchmark history exposes a stable chart value range');
    assert(series.firstAt === '2026-07-20T03:00:00.000Z' && series.lastAt === '2026-07-27T03:00:00.000Z', 'benchmark history exposes the visible date range');

    assert(html.includes('id="visionPackHistoryChart"') && html.includes('id="visionPackHistoryDetail"'), 'model panel exposes an accessible benchmark history chart and summary');
    assert(panel.includes('function renderBenchmarkHistory') && panel.includes("createElementNS('http://www.w3.org/2000/svg'"), 'model panel renders benchmark history without external chart dependencies');
    assert(panel.includes('vision-benchmark-line-cpu') && panel.includes('vision-benchmark-line-gpu') && panel.includes('same device environment') === false, 'benchmark history uses explicit backend-specific SVG series while Korean UI copy remains local');
    assert(css.includes('.vision-model-pack-history-chart') && css.includes('.vision-benchmark-line-cpu') && css.includes('.vision-benchmark-line-gpu'), 'benchmark history chart has CPU and GPU visual ownership');
    console.log('PASS v1.6.20 device benchmark history series and UI contract');
})();
