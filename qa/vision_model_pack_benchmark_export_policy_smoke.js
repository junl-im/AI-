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

(async () => {
    const values = new Map();
    const downloads = [];
    const document = { baseURI: 'https://example.test/', visibilityState: 'visible', hasFocus() { return true; }, dispatchEvent() {}, createElement() { return { getContext() { return {}; } }; } };
    const window = {
        crypto: webcrypto,
        Blob,
        AIShortsDownloadService: { saveBlob(blob, filename) { downloads.push({ blob, filename }); return true; } },
        localStorage: {
            getItem(key) { return values.has(key) ? values.get(key) : null; },
            setItem(key, value) { values.set(key, String(value)); },
            removeItem(key) { values.delete(key); }
        },
        location: { href: 'https://example.test/', origin: 'https://example.test' },
        navigator: { platform: 'PolicyOS', hardwareConcurrency: 8, deviceMemory: 16 },
        document,
        caches: { async open() { return {}; } },
        AIShortsRuntimeConfig: { APP_VERSION: 'v1.6.20', VISION_MODEL_PACK_AUTO_RECOMMENDATION_MIN_CONFIDENCE_SCORE: 55 },
        WebAssembly,
        setTimeout,
        clearTimeout
    };
    const context = vm.createContext({ window, document, Blob, URL, TextEncoder, Uint8Array, ArrayBuffer, Date, JSON, Object, Array, Map, Set, Math, Number, String, RegExp, Error, Promise, Response, console, CustomEvent: function CustomEvent() {} });
    vm.runInContext(source, context, { filename: 'vision-model-pack-manager.js' });
    const api = window.AIShortsVisionModelPacks;
    const test = api._test;
    const highCpuLowGpu = test.benchmarkRecommendation([
        { backend: 'cpu', status: 'passed', medianMs: 20, confidence: 'high', confidenceScore: 95 },
        { backend: 'gpu', status: 'passed', medianMs: 9, confidence: 'low', confidenceScore: 20 }
    ]);
    assert(highCpuLowGpu.backend === 'cpu' && highCpuLowGpu.excludedBackends.includes('gpu'), 'automatic recommendation excludes a faster low-confidence GPU result');
    const allLow = test.benchmarkRecommendation([
        { backend: 'cpu', status: 'passed', medianMs: 20, confidence: 'low', confidenceScore: 20 },
        { backend: 'gpu', status: 'passed', medianMs: 9, confidence: 'low', confidenceScore: 25 }
    ]);
    assert(allLow.backend === 'auto' && allLow.eligibleBackends.length === 0 && allLow.reason.includes('자동 추천에서 제외'), 'automatic recommendation is withheld when every measurement is low confidence');
    const reliable = test.benchmarkRecommendation([
        { backend: 'cpu', status: 'passed', medianMs: 20, confidence: 'medium', confidenceScore: 65 },
        { backend: 'gpu', status: 'passed', medianMs: 9, confidence: 'high', confidenceScore: 92 }
    ]);
    assert(reliable.backend === 'gpu' && reliable.excludedBackends.length === 0, 'reliable CPU and GPU measurements still select the faster backend');

    const packId = 'vision-1111111111111111';
    const environmentKey = test.benchmarkEnvironmentKey();
    values.set(test.BENCHMARK_KEY, JSON.stringify({ version: 1, history: [
        { id: 'bench-1111111111111111', packId, backend: 'cpu', createdAt: '2026-07-27T04:00:00.000Z', iterations: 8, medianMs: 20, p95Ms: 22, fps: 50, status: 'passed', environmentKey, confidence: 'high', confidenceScore: 92, confidenceReasons: ['안정'], context: { visibility: 'visible', focused: true } },
        { id: 'bench-2222222222222222', packId, backend: 'gpu', createdAt: '2026-07-27T04:00:00.000Z', iterations: 8, medianMs: 9, p95Ms: 18, fps: 111, status: 'passed', environmentKey, confidence: 'low', confidenceScore: 30, confidenceReasons: ['측정 변동이 큼'], context: { visibility: 'visible', focused: true } }
    ] }));
    const summary = api.performanceSummary(packId);
    assert(summary.recommendation.backend === 'cpu' && summary.recommendation.excludedBackends.includes('gpu'), 'persisted benchmark summary applies the confidence gate');
    const exported = api.exportBenchmarkDiagnostics(packId);
    assert(exported.saved && downloads.length === 1 && /vision-benchmark-diagnostics/.test(downloads[0].filename), 'benchmark diagnostics export through the shared download owner');
    const payload = JSON.parse(await downloads[0].blob.text());
    assert(payload.exportType === 'vision-model-benchmark-diagnostics' && payload.policy.lowConfidenceExcluded === true && payload.performance.historyCount === 2, 'benchmark diagnostics declare confidence policy and bounded history');
    assert(html.includes('id="visionPackBenchmarkExportBtn"') && panel.includes('function exportBenchmarkDiagnostics'), 'model panel exposes benchmark diagnostics export');
    assert(panel.includes('자동 추천 보류') && panel.includes('자동 제외'), 'model panel clearly explains withheld automatic recommendations');
    assert(css.includes('#visionPackBenchmarkExportBtn') && css.includes('[data-backend="auto"]'), 'benchmark export and withheld recommendation have visual ownership');
    console.log('PASS v1.6.20 confidence-gated benchmark recommendation and diagnostics export contract');
})().catch(error => {
    console.error(error && error.stack || error);
    process.exit(1);
});
