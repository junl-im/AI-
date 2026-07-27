#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/app/preview-controller.js'), 'utf8');

function assert(condition, message) {
    if (!condition) throw new Error(message);
    console.log(`PASS ${message}`);
}

(async () => {
    let nextRaf = 1;
    const rafCallbacks = new Map();
    const cancelledRafs = [];
    const clearedIntervals = [];
    const diagnostics = [];
    const renders = [];
    const operationEvents = [];
    let intervalId = 100;
    const window = {
        requestAnimationFrame(callback) { const id = nextRaf++; rafCallbacks.set(id, callback); return id; },
        cancelAnimationFrame(id) { cancelledRafs.push(id); rafCallbacks.delete(id); },
        setInterval() { intervalId += 1; return intervalId; },
        clearInterval(id) { clearedIntervals.push(id); },
        setTimeout,
        clearTimeout
    };
    const context = vm.createContext({ window, Object, Boolean, Number, String, Math, Error, Promise, console });
    vm.runInContext(source, context, { filename: 'preview-controller.js' });
    const factory = window.AIShortsPreviewController;
    assert(factory && typeof factory.createPreviewController === 'function', 'preview controller factory is exposed');

    const state = {
        fileKind: 'video',
        isPreviewing: false,
        settings: { cropMode: 'smart', captionStyle: 'creator', thumbnailTemplate: 'neon' },
        smartReframe: null,
        waveformBins: []
    };
    const media = {
        currentTime: 0,
        videoWidth: 1920,
        ended: false,
        muted: true,
        volume: 1,
        pause() {},
        async play() { return true; }
    };
    const elements = {
        previewCanvas: {},
        sourceVideo: media,
        previewStatus: { textContent: '' },
        titleInput: { value: '테스트' }
    };
    const selected = { id: 'candidate-1', start: 2, end: 8, duration: 6, rangeText: '00:02 - 00:08' };
    let currentToken = null;
    const controller = factory.createPreviewController({
        state,
        elements,
        renderer: { renderStill(canvas, source, options) { renders.push({ canvas, source, options }); } },
        qualityEffects: { calculateFadeVolume() { return 0.8; } },
        operationCoordinator: {
            isCurrent(token) { return token === currentToken; },
            cancel(channel, reason) { operationEvents.push({ type: 'cancel', channel, reason }); currentToken = null; }
        },
        store: { addDiagnostic(item) { diagnostics.push(item); } },
        getSelectedRecommendation() { return selected; },
        getActiveMediaElement() { return media; },
        getSmartReframeOptions() { return {}; },
        getCaptionOptions() { return {}; },
        getQualityOptions() { return { safeGuide: true }; },
        getActiveCaptionText() { return ''; },
        activateFlowTab() {},
        updateButtons() {},
        toast() {},
        beginOperation(channel, meta) { currentToken = { channel, meta }; operationEvents.push({ type: 'begin', channel }); return currentToken; },
        assertOperation(token) { if (token !== currentToken) throw new Error('stale operation'); },
        finishOperation(token, result) { operationEvents.push({ type: 'finish', result }); if (token === currentToken) currentToken = null; },
        isAbortError(error) { return Boolean(error && error.name === 'AbortError'); }
    });

    assert(controller.renderStill() === true && controller.renderStill() === false, 'preview still rendering batches duplicate RAF requests');
    const stillId = controller.snapshot().stillRafActive;
    assert(stillId === true && rafCallbacks.size === 1, 'preview still RAF is owned by the controller');
    const first = Array.from(rafCallbacks.entries())[0];
    rafCallbacks.delete(first[0]);
    first[1]();
    assert(renders.length === 1 && controller.snapshot().stillRafActive === false, 'preview still RAF clears after rendering');

    const played = await controller.playSelectedRange();
    assert(played === true && state.isPreviewing === true, 'selected range playback starts through the controller');
    assert(controller.snapshot().playbackRafActive && controller.snapshot().playbackTimerActive, 'playback owns both RAF and completion timer');
    controller.stop({ result: 'manual-stop' });
    assert(state.isPreviewing === false && !controller.snapshot().playbackRafActive && !controller.snapshot().playbackTimerActive, 'stop clears playback RAF and timer');
    assert(clearedIntervals.length === 1 && operationEvents.some(item => item.type === 'finish'), 'stop finalizes the preview operation');

    media.play = async () => { throw new Error('autoplay blocked'); };
    const rejected = await controller.playSelectedRange();
    assert(rejected === false && state.isPreviewing === false, 'playback rejection returns to a stopped state');
    assert(diagnostics.some(item => item.type === 'preview-playback-error'), 'playback rejection records a diagnostic');
    assert(!controller.snapshot().playbackRafActive && !controller.snapshot().playbackTimerActive, 'playback rejection leaves no RAF or interval work');

    controller.dispose();
    assert(controller.snapshot().disposed === true && !controller.snapshot().stillRafActive, 'dispose clears pending still rendering and marks controller closed');
    assert(cancelledRafs.length >= 1, 'controller cancellation reaches the RAF owner');
    console.log('PASS v1.6.15 isolated preview lifecycle and teardown contract');
})().catch(error => {
    console.error(error && error.stack || error);
    process.exit(1);
});
