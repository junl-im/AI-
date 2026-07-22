#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
function assert(value, message) {
    if (!value) { console.error(`FAIL ${message}`); process.exit(1); }
    console.log(`PASS ${message}`);
}
const pkg = JSON.parse(read('package.json'));
const html = read('index.html');
const sw = read('sw.js');
const core = read('src/analysis/audio-analysis-core.js');
const extractor = read('src/analysis/audio-feature-extractor.js');
const worker = read('src/workers/highlight-analysis.worker.js');
assert(pkg.version === '1.5.17', 'audio fallback release version is v1.5.17');
assert(html.includes('audio-analysis-core.js?v=1.5.17-important-cascade-reduction') && html.indexOf('audio-analysis-core.js') < html.indexOf('audio-feature-extractor.js'), 'shared audio core loads before the extractor');
assert(sw.includes('audio-analysis-core.js?v=1.5.17-important-cascade-reduction'), 'service worker caches the shared audio core');
assert(core.includes('function analyzeAudioAsync') && core.includes('await new Promise(resolve => global.setTimeout(resolve, 0))'), 'main-thread fallback yields between analysis batches');
assert(core.includes('throwIfAborted(signal)'), 'shared audio core honors cancellation');
assert(extractor.includes("type: 'analysis-worker-fallback'") && extractor.includes('core.analyzeAudioAsync'), 'worker failures switch to the compatibility analyzer with diagnostics');
assert(worker.includes("importScripts('../analysis/audio-analysis-core.js')") && worker.includes('core.analyzeAudio'), 'worker and fallback use one shared scoring implementation');
console.log('PASS v1.5.17 shared audio analyzer and worker fallback guardrails');
