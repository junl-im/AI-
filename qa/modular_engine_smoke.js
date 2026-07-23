#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function assertIncludes(file, token) {
    const text = read(file);
    if (!text.includes(token)) {
        console.error(`FAIL ${file} missing ${token}`);
        process.exit(1);
    }
}

[
    'src/engine/module-registry.js',
    'src/engine/module-contracts.js',
    'src/engine/analysis-cache.js',
    'src/engine/performance-budget.js',
    'src/engine/analysis-pipeline.js',
    'src/engine/scoring-pipeline.js',
    'src/engine/pro-engine-tuner.js',
    'src/engine/stability-auditor.js',
    'src/engine/engine-kernel.js',
    'assets/css/engine-panel.css'
].forEach(file => {
    if (!fs.existsSync(path.join(root, file))) {
        console.error(`FAIL missing modular engine file: ${file}`);
        process.exit(1);
    }
});

assertIncludes('index.html', 'src/engine/module-registry.js?v=1.5.27-selective-cache-integrity-retry-portable-backup');
assertIncludes('index.html', 'src/engine/engine-kernel.js?v=1.5.27-selective-cache-integrity-retry-portable-backup');
assertIncludes('index.html', 'engineStatusText');
assertIncludes('src/app.js', 'global.AIShortsEngineKernel');
assertIncludes('src/app.js', 'engineKernel.analyzeMedia');
assertIncludes('src/app.js', 'engineKernel.createRecommendations');
assertIncludes('src/state/app-state.js', 'engineMeta');
assertIncludes('src/state/app-state.js', 'engineOptions');
assertIncludes('src/ui/waveform-view.js', 'engineBadges');
assertIncludes('sw.js', 'src/engine/scoring-pipeline.js?v=1.5.27-selective-cache-integrity-retry-portable-backup');
assertIncludes('README.md', '모듈형 엔진');

const kernel = read('src/engine/engine-kernel.js');
const requiredModules = ['audio.feature.extractor', 'video.motion.sampler', 'auto.cut.detector', 'recommendation.scoring.pipeline', 'render.quality.effects', 'analysis.cache', 'stability.auditor', 'pro.engine.tuner'];
const missing = requiredModules.filter(token => !kernel.includes(token));
if (missing.length) {
    console.error('FAIL engine kernel module anchors missing: ' + missing.join(', '));
    process.exit(1);
}

console.log('PASS modular engine architecture guardrails present');
