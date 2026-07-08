#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
const hyper = fs.readFileSync(path.join(root, 'src/ui/hyperflow-tabs.js'), 'utf8');

if (!html.includes('파일을 열면 자동 분석') || !html.includes('✨ 추천 생성')) {
    console.error('FAIL UI copy should explain auto analysis and recommendation generation');
    process.exit(1);
}
if (!app.includes("analyzeCurrentFile({ autoGenerate: false, source: 'file-open' })")) {
    console.error('FAIL file open should trigger automatic analysis');
    process.exit(1);
}
if (!app.includes('generateRecommendationsFromAnalysis') || !app.includes("activateFlowTab('candidates'") || !app.includes("activateFlowTab('preview', { reveal: true })")) {
    console.error('FAIL app should separate auto analysis, candidate selection, and preview auto-transition');
    process.exit(1);
}
if (!app.includes('hasAnalysisReady') || !app.includes("els.analyzeBtn.textContent = state.isAnalyzing ? '⚙️ 자동 분석 중' : '✨ 추천 생성'")) {
    console.error('FAIL recommendation button state should be analysis-aware');
    process.exit(1);
}
if (!hyper.includes("const ORDER = ['file', 'recommend', 'candidates', 'preview', 'waveform', 'cut', 'edit', 'export']")) {
    console.error('FAIL HyperFlow tab order should be fixed at 8 workflow tabs');
    process.exit(1);
}
console.log('PASS HyperFlow auto-analysis workflow guardrails present');
