#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');

function ok(condition, message) {
    if (!condition) {
        console.error(`FAIL ${message}`);
        process.exit(1);
    }
    console.log(`PASS ${message}`);
}

function track(name) {
    return {
        name,
        stops: 0,
        stop() { this.stops += 1; }
    };
}

(async () => {
    let sourceCaptureCalls = 0;
    const canvasVideo = track('canvas-video');
    const sourceAudio = track('source-audio');
    const sourceVideo = track('source-video');
    const canvasTracks = [canvasVideo];
    const canvasStream = {
        addTrack(item) { canvasTracks.push(item); },
        getTracks() { return canvasTracks.slice(); }
    };
    const sourceStream = {
        getAudioTracks() { return [sourceAudio]; },
        getTracks() { return [sourceAudio, sourceVideo]; }
    };
    const canvas = {
        width: 1080,
        height: 1920,
        captureStream() { return canvasStream; },
        getContext() { return {}; }
    };
    const sourceMedia = {
        duration: 10,
        volume: 0.45,
        muted: true,
        captureStream() { sourceCaptureCalls += 1; return sourceStream; },
        pause() {},
        play() { return Promise.resolve(); }
    };
    class ThrowingMediaRecorder {
        static isTypeSupported() { return true; }
        constructor() { throw new Error('constructor blocked'); }
    }
    const window = {
        window: null,
        AIShortsRuntimeConfig: { EXPORT_MIME_CANDIDATES: ['video/webm'], PREVIEW_FPS: 30 },
        AIShortsCoreUtils: { getMediaRecorderMime: () => 'video/webm' },
        AIShortsQualityEffects: {},
        MediaRecorder: ThrowingMediaRecorder,
        requestAnimationFrame: callback => setTimeout(callback, 0),
        cancelAnimationFrame: clearTimeout,
        setTimeout,
        clearTimeout,
        setInterval,
        clearInterval
    };
    window.window = window;
    const context = vm.createContext({
        window,
        MediaRecorder: ThrowingMediaRecorder,
        requestAnimationFrame: window.requestAnimationFrame,
        cancelAnimationFrame: window.cancelAnimationFrame,
        setTimeout,
        clearTimeout,
        setInterval,
        clearInterval,
        Blob,
        console
    });
    vm.runInContext(fs.readFileSync(path.join(root, 'src/render/vertical-renderer.js'), 'utf8'), context);
    const renderer = window.AIShortsVerticalRenderer;

    const first = renderer.inspectRenderCapability(canvas, sourceMedia);
    const second = renderer.inspectRenderCapability(canvas, sourceMedia);
    ok(first.ok && second.hasMediaCapture, 'render capability detects capture support without allocating a stream');
    ok(sourceCaptureCalls === 0, 'capability preflight never calls media captureStream');

    let failed = false;
    try {
        await renderer.recordVerticalSegment(canvas, sourceMedia, { start: 0, end: 2 });
    } catch (error) {
        failed = /constructor blocked/.test(error.message);
    }
    ok(failed, 'renderer surfaces setup failure');
    ok(sourceCaptureCalls === 1, 'render execution allocates the source capture stream exactly once');
    ok(canvasVideo.stops === 1 && sourceAudio.stops === 1 && sourceVideo.stops === 1, 'setup failure releases canvas, audio, and unused source video tracks');

    const rendererSource = fs.readFileSync(path.join(root, 'src/render/vertical-renderer.js'), 'utf8');
    ok(rendererSource.includes('sourceMedia.muted = originalMuted'), 'renderer restores the original media muted state during cleanup');
    ok(rendererSource.includes('const originalCurrentTime') && rendererSource.includes('sourceMedia.currentTime = restoredTime'), 'renderer restores the original media position after export');
    ok(rendererSource.includes('const originalPlaybackRate') && rendererSource.includes('sourceMedia.playbackRate = originalPlaybackRate'), 'renderer restores the original playback rate after export');
    ok(rendererSource.includes('normalizeMediaRange') && rendererSource.includes('렌더 구간이 올바르지 않습니다'), 'renderer independently validates export range boundaries');
    console.log('PASS v1.6.3 render capture preflight, range validation, and media-state cleanup guardrails');
})().catch(error => {
    console.error(error && error.stack || error);
    process.exit(1);
});
