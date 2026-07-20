#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');

function ok(condition, message) {
    if (!condition) throw new Error(message);
    console.log(`PASS ${message}`);
}

(async () => {
    const timers = new Map();
    let timerId = 0;
    let lastWorker = null;
    const diagnostics = [];
    class SilentWorker {
        constructor() { this.terminated = false; lastWorker = this; }
        postMessage() {}
        terminate() { this.terminated = true; }
    }
    const window = {
        window: null,
        Worker: SilentWorker,
        AIShortsRuntimeConfig: { ANALYSIS_WORKER_URL: 'worker.js', ANALYSIS_WORKER_STALL_MS: 5000 },
        AIShortsAudioAnalysisCore: {
            analyzeAudioAsync: async () => ({ duration: 1, frames: [], summary: { fallback: true } })
        },
        AIShortsAppState: { addDiagnostic(event) { diagnostics.push(event); } },
        setTimeout(callback) { const id = ++timerId; timers.set(id, callback); return id; },
        clearTimeout(id) { timers.delete(id); }
    };
    window.window = window;
    vm.runInContext(fs.readFileSync(path.join(root, 'src/analysis/audio-feature-extractor.js'), 'utf8'), vm.createContext({
        window,
        console,
        Promise,
        Error,
        Float32Array
    }));
    const promise = window.AIShortsAudioFeatureExtractor.analyzeChannelData(new Float32Array([0, 0.1]), 8000, 1, null, null);
    ok(timers.size === 1, 'worker analysis arms a no-progress watchdog');
    const callback = Array.from(timers.values())[0];
    callback();
    const result = await promise;
    ok(result && result.summary && result.summary.fallback, 'silent worker falls back to the compatibility analyzer');
    ok(lastWorker && lastWorker.terminated, 'stalled worker is terminated before fallback');
    ok(diagnostics.some(item => item.type === 'analysis-worker-fallback' && /응답하지/.test(item.message)), 'worker stall fallback is recorded in diagnostics');

    const source = fs.readFileSync(path.join(root, 'src/analysis/audio-feature-extractor.js'), 'utf8');
    ok(source.includes('worker.onmessageerror'), 'malformed worker messages also trigger fallback');
    ok(source.includes('ANALYSIS_WORKER_STALL_MS'), 'worker stall budget is configurable');
    console.log('PASS analysis worker stall and malformed-message recovery guardrails');
})().catch(error => {
    console.error(error && error.stack || error);
    process.exit(1);
});
