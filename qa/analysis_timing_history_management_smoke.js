#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/app/analysis-controller.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/css/foundation-polish.css'), 'utf8');

function assert(condition, message) {
    if (!condition) throw new Error(message);
    console.log(`PASS ${message}`);
}

function node(tag) {
    return {
        tag,
        _textContent: '',
        get textContent() { return this._textContent; },
        set textContent(value) { this._textContent = String(value); if (value === '') this.children = []; },
        className: '', dataset: {}, hidden: true, disabled: true, children: [],
        append(...items) { this.children.push(...items); },
        appendChild(item) { this.children.push(item); return item; },
        setAttribute(name, value) { this[name] = String(value); }
    };
}

const legacy = {
    version: 1,
    history: [
        { status: 'completed', mediaKey: 'media-aabbccdd', media: { type: 'video/mp4', duration: 30 }, source: 'manual', completedAt: '2026-07-27T01:00:00.000Z', totalMs: 100, bottleneck: { key: 'engine', label: '모듈형 엔진 분석', durationMs: 70 }, stages: [{ key: 'engine', label: '모듈형 엔진 분석', durationMs: 70 }] },
        { status: 'failed', mediaKey: 'media-11223344', media: { type: 'audio/mp3', duration: 15 }, source: 'retry', completedAt: '2026-07-27T02:00:00.000Z', totalMs: 40, bottleneck: { key: 'audio', label: '오디오 특징 분석', durationMs: 30 }, stages: [{ key: 'audio', label: '오디오 특징 분석', durationMs: 30 }], error: 'failed safely' }
    ]
};
const values = new Map([['history-test', JSON.stringify(legacy)]]);
const storage = { getItem(key) { return values.get(key) || null; }, setItem(key, value) { values.set(key, String(value)); } };
const document = { createElement: node, dispatchEvent() {} };
const window = { document, localStorage: storage, Blob, performance: { now: () => 1 }, setTimeout, clearTimeout };
const context = vm.createContext({ window, document, Blob, AbortController, CustomEvent: function CustomEvent() {}, Object, Array, Map, Set, Math, Number, String, Date, Error, Promise, JSON, console });
vm.runInContext(source, context, { filename: 'analysis-controller.js' });
const elements = {
    analysisTimingPanel: node('div'),
    analysisTimingHistoryCount: node('span'),
    analysisTimingHistoryClearBtn: node('button'),
    analysisTimingHistoryEmpty: node('p'),
    analysisTimingHistoryList: node('ol')
};
const controller = window.AIShortsAnalysisController.createAnalysisController({
    state: { file: null, fileMeta: null },
    config: { APP_VERSION: 'v1.6.20', ANALYSIS_TIMING_HISTORY_KEY: 'history-test', ANALYSIS_TIMING_HISTORY_LIMIT: 12, ANALYSIS_TIMING_HISTORY_SCHEMA_VERSION: 2 },
    storage,
    elements,
    store: { addDiagnostic() {} },
    getActiveMediaElement() { return null; }, activateFlowTab() {}, updateButtons() {}, setProgress() {}, toast() {}, ensureMotionSmartReframe() {},
    getAutoCutOptions() { return {}; }, buildAutoCutTimeline() {}, createRecommendations() {}, createFallbackAudioAnalysis() { return {}; },
    beginOperation() { return null; }, assertOperation() {}, finishOperation() {}, isAbortError() { return false; }
});

const migrated = JSON.parse(values.get('history-test'));
assert(migrated.schema === 'ai-shorts-analysis-timing-history' && migrated.schemaVersion === 2, 'legacy timing history migrates to the versioned schema envelope');
assert(controller.getTimingHistory().length === 2 && controller.getTimingHistory().every(item => /^timing-[a-f0-9]{8}$/.test(item.id)), 'migrated history receives stable privacy-safe record ids');
assert(elements.analysisTimingPanel.hidden === false && elements.analysisTimingHistoryList.children.length === 2, 'stored timing history is rendered before a new analysis');
assert(controller.setTimingHistoryFilter('audio', 'all').length === 1, 'history search filters by stage and metadata without file names');
assert(controller.setTimingHistoryFilter('', 'failed').length === 1, 'history status filter isolates failed records');
const failedId = controller.getTimingHistory().find(item => item.status === 'failed').id;
assert(controller.deleteTimingHistoryEntry(failedId) && controller.getTimingHistory().length === 1, 'individual timing history deletion persists safely');
assert(controller.clearTimingHistory() === 1 && controller.getTimingHistory().length === 0, 'bulk timing history clearing removes the remaining bounded records');
assert(html.includes('id="analysisTimingHistorySearch"') && html.includes('data-history') === false && html.includes('id="analysisTimingHistoryList"'), 'analysis panel exposes searchable history controls without embedding private records');
assert(css.includes('.analysis-history-list') && css.includes('.analysis-history-delete'), 'analysis history list and delete action have visual ownership');
console.log('PASS v1.6.20 analysis timing history search, migration, and deletion contract');
