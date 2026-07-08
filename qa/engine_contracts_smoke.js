#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const contracts = fs.readFileSync(path.join(root, 'src/engine/module-contracts.js'), 'utf8');
const cache = fs.readFileSync(path.join(root, 'src/engine/analysis-cache.js'), 'utf8');
const tuner = fs.readFileSync(path.join(root, 'src/engine/pro-engine-tuner.js'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

function fail(message) { console.error('FAIL ' + message); process.exit(1); }

['validateModule', 'normalizeAnalysisResult', 'validateAnalysisResult', 'validateRecommendation', 'createContractReport'].forEach(token => {
    if (!contracts.includes(token)) fail(`contracts missing ${token}`);
});
['makeFileKey', 'createAnalysisCache', 'hitRate', 'limit'].forEach(token => {
    if (!cache.includes(token)) fail(`analysis cache missing ${token}`);
});
['enhanceBudget', 'tuneRecommendations', 'proConfidence', 'proGrade', 'summarizeAnalysis'].forEach(token => {
    if (!tuner.includes(token)) fail(`pro tuner missing ${token}`);
});
['module-contracts.js?v=1.0.8-flow-audit', 'analysis-cache.js?v=1.0.8-flow-audit', 'pro-engine-tuner.js?v=1.0.8-flow-audit', 'stability-auditor.js?v=1.0.8-flow-audit'].forEach(token => {
    if (!sw.includes(token)) fail(`service worker missing ${token}`);
});

console.log('PASS engine contracts/cache/tuner guardrails present');
