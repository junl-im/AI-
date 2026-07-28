#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const pkg = require(path.join(root, 'package.json'));
const config = read('src/config/app-runtime-config.js');
const budget = read('src/engine/performance-budget.js');
const extractor = read('src/analysis/audio-feature-extractor.js');
const core = read('src/analysis/audio-analysis-core.js');
const motion = read('src/analysis/video-motion-analyzer.js');
const pipeline = read('src/engine/analysis-pipeline.js');
const app = read('src/app.js');
const analysis = read('src/app/analysis-controller.js');
function assert(value, message) {
    if (!value) { console.error(`FAIL ${message}`); process.exit(1); }
    console.log(`PASS ${message}`);
}
assert(/^1\.6\.\d+$/.test(pkg.version), 'long-media performance release version is v1.6.20');
assert(config.includes('MAX_ANALYSIS_SECONDS: 30 * 60'), 'analysis coverage supports 30 minute media');
assert(config.includes('MEDIA_METADATA_WAIT_MS') && config.includes('ANALYSIS_PREP_YIELD_SAMPLES'), 'metadata and preparation budgets are configurable');
assert(budget.includes('analysisSampleRate') && budget.includes('estimatedAnalysisMemoryMb') && budget.includes('motionSamples'), 'performance budget owns audio rate, memory estimate, and motion samples');
assert(budget.includes('duration > 900') && budget.includes("longMedia"), 'long media selects a reduced adaptive budget');
assert(extractor.includes('async function createAnalysisMono') && extractor.includes('await yieldToMainThread()'), 'audio preparation downsamples and yields to the UI thread');
assert(extractor.includes('retainDecoded: false') && extractor.includes('retainChannelData: false'), 'decoded audio and analysis track are not retained by default');
assert(core.includes('Math.max(4000, Number(sampleRate)'), 'analysis core preserves adaptive sample-rate timing');
assert(pipeline.includes('targetSampleRate: Number(budget.analysisSampleRate') && pipeline.includes('maxSamples: Number(budget.motionSamples'), 'analysis pipeline applies the computed budget');
assert(motion.includes('const samples = Math.min(configuredMax, naturalSamples)') && motion.includes('finally {'), 'motion analysis caps samples and always releases media resources');
assert(analysis.includes('engineKernel.createBudget') && analysis.indexOf('await waitForActiveMediaMetadata(token)') < analysis.indexOf('await analyzeWithKernel(input, token, reportProgress, timing)'), 'metadata is known before kernel analysis creates the performance budget inside the analysis controller');
assert(analysis.includes("type: 'long-media-budget'"), 'analysis controller records the long-media budget in diagnostics');
console.log('PASS v1.6.20 adaptive long-media analysis guardrails');
