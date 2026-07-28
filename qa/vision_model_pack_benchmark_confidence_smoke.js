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
    const document = { baseURI: 'https://example.test/', visibilityState: 'visible', hasFocus() { return true; }, dispatchEvent() {}, createElement() { return {}; } };
    const window = {
        crypto: webcrypto,
        localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
        location: { href: 'https://example.test/', origin: 'https://example.test' },
        navigator: { platform: 'ConfidenceOS', hardwareConcurrency: 8, deviceMemory: 16, connection: { saveData: false, effectiveType: '4g' } },
        document,
        caches: { async open() { return {}; } },
        AIShortsRuntimeConfig: {},
        WebAssembly,
        setTimeout,
        clearTimeout
    };
    const context = vm.createContext({ window, document, URL, TextEncoder, Uint8Array, ArrayBuffer, Date, JSON, Object, Array, Map, Set, Math, Number, String, RegExp, Error, Promise, Response, console, CustomEvent: function CustomEvent() {} });
    vm.runInContext(source, context, { filename: 'vision-model-pack-manager.js' });
    const test = window.AIShortsVisionModelPacks._test;
    const foreground = { visibility: 'visible', focused: true, batterySupported: true, batteryLevel: 0.8, charging: true, saveData: false };
    const stable = test.benchmarkConfidence([10, 10.2, 9.9, 10.1, 10, 10.2, 9.8, 10.1], foreground, 8);
    assert(stable.level === 'high' && stable.score >= 80, 'stable foreground benchmark receives high confidence');
    const unstable = test.benchmarkConfidence([8, 20, 7, 28, 9, 35, 8, 25], { visibility: 'hidden', focused: false, batterySupported: true, batteryLevel: 0.12, charging: false, saveData: true }, 8);
    assert(unstable.level === 'low' && unstable.reasons.includes('백그라운드 측정') && unstable.reasons.includes('낮은 배터리'), 'background and low-battery benchmark is downgraded with explicit reasons');
    assert(test.benchmarkReadiness({ visibility: 'hidden', focused: false }).ready === false, 'automatic refresh is deferred when the app is not foreground-ready');
    const recommendation = test.benchmarkRecommendation([
        { backend: 'cpu', status: 'passed', medianMs: 20, confidence: 'high', confidenceScore: 95 },
        { backend: 'gpu', status: 'passed', medianMs: 10, confidence: 'low', confidenceScore: 25 }
    ]);
    assert(recommendation.backend === 'cpu' && recommendation.excludedBackends.includes('gpu') && recommendation.policy === 'confidence-gated', 'low-confidence fast backend is excluded from automatic recommendation');
    assert(html.includes('id="visionPackConfidence"') && html.includes('id="visionPackConfidenceDetail"'), 'model panel exposes benchmark confidence status and detail');
    assert(panel.includes('function renderBenchmarkConfidence') && panel.includes('발열은 변동성으로 간접 추정'), 'model panel explains confidence signals without claiming unsupported thermal sensors');
    assert(css.includes('.vision-model-pack-confidence') && css.includes('[data-confidence="low"]'), 'benchmark confidence states have explicit visual ownership');
    console.log('PASS v1.6.20 benchmark context, confidence, and automatic exclusion contract');
})();
