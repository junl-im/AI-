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
        textContent: '',
        dataset: {},
        hidden: true,
        children: [],
        append(...items) { this.children.push(...items); },
        appendChild(item) { this.children.push(item); return item; }
    };
}

(async () => {
    let clock = 100;
    const document = { createElement: node, dispatchEvent() {} };
    const window = { document, performance: { now() { return clock; } }, setTimeout, clearTimeout };
    const context = vm.createContext({ window, document, CustomEvent: function CustomEvent(type, options) { this.type = type; this.detail = options && options.detail; }, Object, Array, Map, Set, Math, Number, String, Date, Error, Promise, console });
    vm.runInContext(source, context, { filename: 'analysis-controller.js' });
    const operations = {
        current: null,
        begin(channel) { const abortController = new AbortController(); this.current = { id: 'analysis-1', channel, signal: abortController.signal, abortController }; return this.current; },
        assertCurrent(token) { if (token !== this.current) { const error = new Error('stale'); error.name = 'AbortError'; throw error; } },
        isCurrent(token) { return token === this.current; },
        finish(token) { if (token === this.current) this.current = null; },
        cancel() { return false; },
        snapshot() { return { active: this.current ? [{ id: this.current.id, channel: this.current.channel }] : [] }; }
    };
    const timingPanel = node('div');
    const timingSummary = node('span');
    const timingDetail = node('small');
    const timingList = node('ol');
    const state = { file: { name: 'timed.mp4' }, fileKind: 'video', fileUrl: 'blob:timed', fileMeta: { duration: 30 }, recommendations: [], isAnalyzing: false };
    const diagnostics = [];
    const controller = window.AIShortsAnalysisController.createAnalysisController({
        state,
        config: { APP_VERSION: 'v1.6.20' },
        store: { addDiagnostic(item) { diagnostics.push(item); } },
        elements: { analysisTimingPanel: timingPanel, analysisTimingSummary: timingSummary, analysisTimingDetail: timingDetail, analysisTimingList: timingList },
        engineKernel: {
            createBudget() { clock += 4; return { tier: 'standard', longMedia: false, hardBlock: false, memoryRisk: 'low' }; },
            async analyzeMedia() { clock += 120; return { audioAnalysis: {}, motionAnalysis: {}, autoCuts: [], waveformBins: [], fileMeta: { duration: 30 }, engine: { version: '1.6.20', mode: 'modular', budget: { tier: 'standard' } } }; }
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

    assert(await controller.analyzeCurrentFile({ autoGenerate: true, source: 'timing-test' }) === true, 'timed analysis completes successfully');
    const report = controller.getTimingReport();
    assert(report && report.status === 'completed' && report.totalMs > 0, 'analysis controller exposes a completed timing report');
    assert(report.stages.some(stage => stage.key === 'metadata') && report.stages.some(stage => stage.key === 'engine') && report.stages.some(stage => stage.key === 'recommendations'), 'timing report covers metadata, engine, and recommendation stages');
    assert(report.bottleneck && report.bottleneck.key === 'engine', 'largest measured stage is identified as the bottleneck');
    assert(state.analysisTiming === report && diagnostics.some(item => item.type === 'analysis-timing'), 'timing report is retained in app state and diagnostics');
    assert(timingPanel.hidden === false && timingSummary.textContent.includes('병목') && timingList.children.length === report.stages.length, 'analysis timing UI renders summary and every measured stage');
    assert(html.includes('id="analysisTimingPanel"') && html.includes('id="analysisTimingList"'), 'analysis workflow exposes accessible timing diagnostics anchors');
    assert(css.includes('.analysis-timing-panel') && css.includes('[data-bottleneck="true"]'), 'analysis timing diagnostics have explicit visual ownership');
    console.log('PASS v1.6.20 analysis timing and bottleneck diagnostics contract');
})().catch(error => {
    console.error(error && error.stack || error);
    process.exit(1);
});
