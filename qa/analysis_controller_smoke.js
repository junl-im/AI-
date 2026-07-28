#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/app/analysis-controller.js'), 'utf8');

function assert(condition, message) {
    if (!condition) throw new Error(message);
    console.log(`PASS ${message}`);
}

function createMedia(duration = 30) {
    const listeners = new Map();
    return {
        duration,
        addEventListener(type, handler) { listeners.set(type, handler); },
        removeEventListener(type, handler) { if (listeners.get(type) === handler) listeners.delete(type); },
        listenerCount() { return listeners.size; }
    };
}

function installFactory() {
    const document = { dispatchEvent() {} };
    const window = { document, setTimeout, clearTimeout };
    const context = vm.createContext({ window, document, CustomEvent: function CustomEvent(type, options) { this.type = type; this.detail = options && options.detail; }, Object, Array, Map, Set, Math, Number, String, Date, Error, Promise, console });
    vm.runInContext(source, context, { filename: 'analysis-controller.js' });
    return window.AIShortsAnalysisController;
}

function createOperationCoordinator() {
    let current = null;
    return {
        begin(channel, meta) {
            const abortController = new AbortController();
            current = { id: `${channel}-1`, channel, meta, signal: abortController.signal, abortController };
            return current;
        },
        assertCurrent(token) {
            if (token !== current || token.signal.aborted) {
                const error = new Error('stale analysis');
                error.name = 'AbortError';
                throw error;
            }
        },
        isCurrent(token) { return token === current && !token.signal.aborted; },
        finish(token) { if (token === current) current = null; return true; },
        cancel(channel, reason) {
            if (!current || current.channel !== channel) return false;
            current.abortController.abort(reason);
            return true;
        },
        snapshot() { return { active: current ? [{ id: current.id, channel: current.channel }] : [] }; }
    };
}

function baseDependencies(overrides = {}) {
    const media = createMedia(42);
    const state = {
        file: { name: 'sample.mp4' },
        fileKind: 'video',
        fileUrl: 'blob:sample',
        fileMeta: { name: 'sample.mp4', duration: 42, size: 1024 },
        recommendations: [{ id: 'old' }],
        selectedRecommendationId: 'old',
        isAnalyzing: false
    };
    const operations = createOperationCoordinator();
    const progress = [];
    const diagnostics = [];
    const toasts = [];
    let recommendationCalls = 0;
    let buttonUpdates = 0;
    const deps = {
        state,
        config: { APP_VERSION: '1.6.20', MAX_ANALYSIS_SECONDS: 1800 },
        store: { addDiagnostic(item) { diagnostics.push(item); } },
        elements: { importStatus: { textContent: 'sample.mp4' }, analysisCancelBtn: { disabled: false, textContent: '분석 취소', dataset: {} } },
        audioExtractor: {},
        motionAnalyzer: {},
        engineKernel: {
            createBudget() { return { tier: 'standard', longMedia: false, hardBlock: false, memoryRisk: 'low' }; },
            async analyzeMedia() {
                return {
                    audioBuffer: null,
                    channelData: null,
                    audioAnalysis: { duration: 42, frames: [] },
                    motionAnalysis: { duration: 42, samples: [] },
                    autoCuts: [{ time: 4 }],
                    waveformBins: [0.1, 0.2],
                    fileMeta: { duration: 42 },
                    engine: { version: '1.6.20', mode: 'modular', budget: { tier: 'standard' } }
                };
            },
            auditRuntime() { return { healthy: true }; }
        },
        operationCoordinator: operations,
        getActiveMediaElement() { return media; },
        activateFlowTab() {},
        updateButtons() { buttonUpdates += 1; },
        setProgress(value, text) { progress.push({ value, text }); },
        toast(message, kind) { toasts.push({ message, kind }); },
        ensureMotionSmartReframe() {},
        getAutoCutOptions() { return {}; },
        buildAutoCutTimeline() {},
        createRecommendations() { recommendationCalls += 1; state.recommendations = [{ id: 'new' }]; },
        createFallbackAudioAnalysis(duration) { return { duration, frames: [] }; },
        beginOperation(channel, meta) { return operations.begin(channel, meta); },
        assertOperation(token, reason) { return operations.assertCurrent(token, reason); },
        finishOperation(token, result) { return operations.finish(token, result); },
        isAbortError(error) { return Boolean(error && error.name === 'AbortError'); }
    };
    Object.assign(deps, overrides);
    return { deps, state, media, progress, diagnostics, toasts, getRecommendationCalls: () => recommendationCalls, getButtonUpdates: () => buttonUpdates };
}

(async () => {
    const factory = installFactory();
    const success = baseDependencies();
    const controller = factory.createAnalysisController(success.deps);
    const first = controller.analyzeCurrentFile({ autoGenerate: true, source: 'test' });
    const duplicate = controller.analyzeCurrentFile({ autoGenerate: false, source: 'duplicate' });
    assert(first === duplicate, 'analysis controller coalesces duplicate analysis requests');
    assert(await first === true, 'analysis controller completes the modular engine path');
    assert(success.state.isAnalyzing === false && success.state.engineMeta.version === '1.6.20', 'analysis completion commits engine state and clears busy ownership');
    assert(success.getRecommendationCalls() === 1 && success.state.recommendations[0].id === 'new', 'auto-generate remains inside the analysis completion boundary');
    assert(success.progress.some(item => item.value === 100 && item.text === '추천 완료'), 'analysis controller owns final progress state');
    assert(success.diagnostics.some(item => item.type === 'engine-analysis'), 'analysis controller records engine diagnostics');
    assert(controller.snapshot().active === false && controller.snapshot().operationActive === false, 'completed analysis leaves no active operation ownership');

    const cancelCase = baseDependencies();
    cancelCase.deps.engineKernel.analyzeMedia = ({ signal }) => new Promise((resolve, reject) => {
        signal.addEventListener('abort', () => {
            const error = new Error('cancelled');
            error.name = 'AbortError';
            reject(error);
        }, { once: true });
    });
    const cancelling = factory.createAnalysisController(cancelCase.deps);
    const pending = cancelling.analyzeCurrentFile({ source: 'cancel-test' });
    await Promise.resolve();
    assert(cancelling.cancel('user cancel') === true, 'analysis controller owns operation cancellation');
    assert(cancelCase.deps.elements.analysisCancelBtn.disabled === true && cancelCase.deps.elements.analysisCancelBtn.textContent === '중단 중', 'cancel request updates the analysis control state');
    assert(await pending === false && cancelCase.state.isAnalyzing === false, 'aborted analysis resolves safely and clears busy state');
    assert(cancelCase.diagnostics.some(item => item.type === 'analysis-cancel-request') && cancelCase.diagnostics.some(item => item.type === 'analysis-cancelled'), 'cancel request and completion diagnostics are both retained');

    const fallback = baseDependencies({ engineKernel: {} });
    fallback.deps.audioExtractor = {
        async analyzeFileAudio() { throw new Error('video audio unsupported'); }
    };
    fallback.deps.motionAnalyzer = {
        async analyzeVideoMotion() { return { duration: 42, samples: [{ time: 0 }] }; }
    };
    const fallbackController = factory.createAnalysisController(fallback.deps);
    assert(await fallbackController.analyzeCurrentFile({ source: 'fallback-test' }) === true, 'video motion fallback completes when audio decode is unavailable');
    assert(fallback.state.audioAnalysis.duration === 42 && fallback.state.motionAnalysis.samples.length === 1, 'fallback path commits synthetic audio and motion analysis');
    assert(fallback.diagnostics.some(item => item.type === 'audio-decode-fallback'), 'fallback path records the audio decode limitation');

    assert(controller.dispose() === true && controller.snapshot().disposed === true, 'analysis controller exposes deterministic disposal');
    assert(await controller.analyzeCurrentFile() === false, 'disposed analysis controller rejects new work');
    console.log('PASS v1.6.20 isolated analysis orchestration and cancellation contract');
})().catch(error => {
    console.error(error && error.stack || error);
    process.exit(1);
});
