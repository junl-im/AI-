'use strict';

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/engine/analysis-pipeline.js'), 'utf8');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function run(parallelAnalysis, failMotion) {
    const warnings = [];
    const window = {
        AIShortsCoreUtils: { clamp: (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0)) },
        AIShortsAudioFeatureExtractor: {
            analyzeFileAudio: async (_file, progress) => {
                progress(18, 'decode');
                await wait(70);
                progress(76, 'audio complete');
                return {
                    decoded: null,
                    channelData: null,
                    waveformBins: [0.1, 0.2],
                    analysis: { duration: 20, frames: [], summary: {} },
                    preparation: { sourceDuration: 20, analyzedDuration: 20, sampleRate: 8000, sampleCount: 160000, approximateBytes: 640000, truncated: false }
                };
            }
        },
        AIShortsVideoMotionAnalyzer: {
            analyzeVideoMotion: async (_url, progress) => {
                progress(78, 'motion');
                await wait(70);
                if (failMotion) throw new Error('motion unavailable');
                progress(90, 'motion complete');
                return { duration: 20, frames: [], summary: { samples: 24 } };
            }
        },
        AIShortsAutoCutDetector: { createAutoCuts: () => ({ duration: 20, timeline: [] }) }
    };
    vm.runInNewContext(source, { window, Date, Math, Number, String, Object, Array, Promise, Error });
    const started = Date.now();
    const result = await window.AIShortsAnalysisPipeline.analyzeMedia({
        file: { name: 'clip.mp4' },
        fileKind: 'video',
        fileUrl: 'blob:clip',
        fileMeta: { duration: 20 },
        budget: { parallelAnalysis, audioMaxSeconds: 20, analysisSampleRate: 8000, motionSamples: 24 },
        onWarning: message => warnings.push(message),
        onProgress: () => {},
        getAutoCutOptions: () => ({})
    });
    return { elapsed: Date.now() - started, result, warnings };
}

(async () => {
    const parallel = await run(true, false);
    const sequential = await run(false, false);
    if (parallel.result.engine.analysisStrategy !== 'parallel') throw new Error('capable video analysis must use the parallel strategy');
    if (sequential.result.engine.analysisStrategy !== 'sequential-safe') throw new Error('safe budget must retain sequential analysis');
    if (!(parallel.elapsed + 35 < sequential.elapsed)) {
        throw new Error(`parallel analysis did not reduce wall time enough (${parallel.elapsed}ms vs ${sequential.elapsed}ms)`);
    }
    const degraded = await run(true, true);
    if (!degraded.result.audioAnalysis || degraded.result.motionAnalysis) throw new Error('motion failure must continue with audio analysis');
    if (!degraded.warnings.some(message => message.includes('오디오 중심'))) throw new Error('degraded parallel analysis must report a warning');
    console.log('PASS adaptive parallel video analysis and graceful motion fallback');
})().catch(error => {
    console.error(error.stack || error.message || error);
    process.exit(1);
});
