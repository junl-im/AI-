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
        className: '',
        dataset: {},
        hidden: true,
        disabled: true,
        children: [],
        append(...items) { this.children.push(...items); },
        appendChild(item) { this.children.push(item); return item; }
    };
}

(async () => {
    let clock = 100;
    let engineCost = 120;
    let operationId = 0;
    const values = new Map();
    const downloads = [];
    const storage = {
        getItem(key) { return values.has(key) ? values.get(key) : null; },
        setItem(key, value) { values.set(key, String(value)); },
        removeItem(key) { values.delete(key); }
    };
    const document = { createElement: node, dispatchEvent() {} };
    const window = { document, localStorage: storage, Blob, performance: { now() { return clock; } }, setTimeout, clearTimeout };
    const context = vm.createContext({ window, document, Blob, AbortController, CustomEvent: function CustomEvent(type, options) { this.type = type; this.detail = options && options.detail; }, Object, Array, Map, Set, Math, Number, String, Date, Error, Promise, JSON, console });
    vm.runInContext(source, context, { filename: 'analysis-controller.js' });
    const operations = {
        current: null,
        begin(channel) { const abortController = new AbortController(); this.current = { id: `analysis-${++operationId}`, channel, signal: abortController.signal, abortController }; return this.current; },
        assertCurrent(token) { if (token !== this.current) { const error = new Error('stale'); error.name = 'AbortError'; throw error; } },
        isCurrent(token) { return token === this.current; },
        finish(token) { if (token === this.current) this.current = null; },
        cancel() { return false; },
        snapshot() { return { active: this.current ? [{ id: this.current.id, channel: this.current.channel }] : [] }; }
    };
    const timingPanel = node('div');
    const timingSummary = node('span');
    const timingDetail = node('small');
    const timingComparison = node('small');
    const timingExport = node('button');
    const timingList = node('ol');
    const state = {
        file: { name: 'private-session-name.mp4', size: 424242, type: 'video/mp4', lastModified: 12345 },
        fileKind: 'video', fileUrl: 'blob:timed', fileMeta: { duration: 30 }, recommendations: [], isAnalyzing: false
    };
    const diagnostics = [];
    const controller = window.AIShortsAnalysisController.createAnalysisController({
        state,
        config: { APP_VERSION: 'v1.6.20', ANALYSIS_TIMING_HISTORY_KEY: 'timing-test', ANALYSIS_TIMING_HISTORY_LIMIT: 4 },
        storage,
        downloadService: { saveBlob(blob, filename) { downloads.push({ blob, filename }); return true; } },
        store: { addDiagnostic(item) { diagnostics.push(item); } },
        elements: { analysisTimingPanel: timingPanel, analysisTimingSummary: timingSummary, analysisTimingDetail: timingDetail, analysisTimingComparison: timingComparison, analysisTimingExportBtn: timingExport, analysisTimingList: timingList },
        engineKernel: {
            createBudget() { clock += 4; return { tier: 'standard', longMedia: false, hardBlock: false, memoryRisk: 'low' }; },
            async analyzeMedia() { clock += engineCost; return { audioAnalysis: {}, motionAnalysis: {}, autoCuts: [], waveformBins: [], fileMeta: { duration: 30 }, engine: { version: '1.6.20', mode: 'modular', budget: { tier: 'standard' } } }; }
        },
        operationCoordinator: operations,
        getActiveMediaElement() { return { duration: 30 }; },
        activateFlowTab() { clock += 1; },
        updateButtons() { clock += 1; },
        setProgress() { clock += 1; },
        toast() {},
        ensureMotionSmartReframe() {},
        getAutoCutOptions() { return {}; },
        buildAutoCutTimeline() {},
        createRecommendations() { clock += 18; state.recommendations = [{ id: 'candidate' }]; },
        createFallbackAudioAnalysis() { return {}; },
        beginOperation(channel, meta) { return operations.begin(channel, meta); },
        assertOperation(token) { return operations.assertCurrent(token); },
        finishOperation(token) { return operations.finish(token); },
        isAbortError(error) { return Boolean(error && error.name === 'AbortError'); }
    });

    assert(await controller.analyzeCurrentFile({ autoGenerate: true, source: 'history-test' }) === true, 'first timed analysis completes');
    assert(controller.getTimingReport().comparison === null, 'first timed analysis has no false comparison');
    engineCost = 55;
    assert(await controller.analyzeCurrentFile({ autoGenerate: true, source: 'history-test' }) === true, 'second timed analysis completes');
    const report = controller.getTimingReport();
    assert(report.comparison && report.comparison.basis === 'same-media' && report.comparison.direction === 'improved', 'same-media timing history reports an improvement');
    assert(report.comparison.stages.some(stage => stage.key === 'engine' && stage.direction === 'improved'), 'stage comparison identifies the improved engine stage');
    assert(timingComparison.textContent.includes('동일 원본') && timingComparison.dataset.direction === 'improved', 'timing UI explains the previous-analysis comparison');
    assert(timingList.children.length === report.stages.length && timingExport.disabled === false, 'timing comparison preserves stage rows and enables diagnostics export');
    const history = controller.getTimingHistory();
    assert(history.length === 2 && history.every(item => item.mediaKey && !Object.prototype.hasOwnProperty.call(item, 'fileName')), 'bounded local history uses non-reversible media identity without file names');
    assert(!String(values.get('timing-test')).includes('private-session-name.mp4'), 'persisted timing history excludes the raw file name');
    const exported = controller.exportTimingDiagnostics();
    assert(exported.saved && downloads.length === 1 && /analysis-timing-diagnostics/.test(downloads[0].filename), 'analysis timing diagnostics export through the shared download owner');
    const payload = JSON.parse(await downloads[0].blob.text());
    assert(payload.exportType === 'analysis-timing-diagnostics' && payload.history.length === 2 && payload.privacy.historyIncludesFileNames === false, 'analysis timing export declares its privacy and bounded history contract');
    assert(diagnostics.some(item => item.type === 'analysis-timing-export'), 'analysis timing export is recorded in diagnostics');
    assert(html.includes('id="analysisTimingComparison"') && html.includes('id="analysisTimingExportBtn"'), 'analysis panel exposes comparison and JSON export controls');
    assert(css.includes('.analysis-timing-comparison') && css.includes('.analysis-timing-export'), 'analysis timing comparison and export have explicit visual ownership');

    const blockedDiagnostics = [];
    const blockedWindow = { document, Blob, performance: { now() { return clock; } }, setTimeout, clearTimeout };
    Object.defineProperty(blockedWindow, 'localStorage', { get() { throw new Error('storage access denied'); } });
    const blockedContext = vm.createContext({ window: blockedWindow, document, Blob, AbortController, CustomEvent: function CustomEvent(type, options) { this.type = type; this.detail = options && options.detail; }, Object, Array, Map, Set, Math, Number, String, Date, Error, Promise, JSON, console });
    vm.runInContext(source, blockedContext, { filename: 'analysis-controller-blocked-storage.js' });
    const blockedController = blockedWindow.AIShortsAnalysisController.createAnalysisController({
        state: { file: null, fileMeta: null },
        config: {},
        store: { addDiagnostic(item) { blockedDiagnostics.push(item); } },
        elements: {},
        getActiveMediaElement() { return null; },
        activateFlowTab() {}, updateButtons() {}, setProgress() {}, toast() {}, ensureMotionSmartReframe() {},
        getAutoCutOptions() { return {}; }, buildAutoCutTimeline() {}, createRecommendations() {}, createFallbackAudioAnalysis() { return {}; },
        beginOperation() { return null; }, assertOperation() {}, finishOperation() {}, isAbortError() { return false; }
    });
    assert(Boolean(blockedController) && blockedDiagnostics.some(item => item.type === 'analysis-timing-storage-unavailable'), 'analysis controller survives denied localStorage access and records a diagnostic');
    console.log('PASS v1.6.20 analysis timing history, comparison, privacy-safe export, and blocked-storage fallback contract');
})().catch(error => {
    console.error(error && error.stack || error);
    process.exit(1);
});
