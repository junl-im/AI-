'use strict';

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/engine/analysis-cache.js'), 'utf8');
const window = { structuredClone: global.structuredClone };
vm.runInNewContext(source, { window, ArrayBuffer, Date, Object, Map, Math, Number, String });

const cache = window.AIShortsAnalysisCache.createAnalysisCache(2, { maxAgeMs: 60000 });
const original = {
    audioAnalysis: { frames: [{ time: 1, score: 0.8 }] },
    waveformBins: new Float32Array([0.1, 0.2, 0.3]),
    engine: { mode: 'parallel' }
};
cache.set('a', original);
original.audioAnalysis.frames[0].score = 0;
original.waveformBins[0] = 9;

const first = cache.get('a');
if (!first || first.audioAnalysis.frames[0].score !== 0.8) throw new Error('cache must snapshot values on set');
if (Math.abs(first.waveformBins[0] - 0.1) > 0.0001) throw new Error('cache must clone typed arrays on set');
first.audioAnalysis.frames[0].score = 0.1;
first.waveformBins[1] = 8;

const second = cache.get('a');
if (second.audioAnalysis.frames[0].score !== 0.8) throw new Error('cache hit must return an isolated clone');
if (Math.abs(second.waveformBins[1] - 0.2) > 0.0001) throw new Error('typed array cache hits must be isolated');

cache.set('b', { value: 2 });
cache.set('c', { value: 3 });
const stats = cache.stats();
if (stats.size !== 2 || stats.evictions !== 1) throw new Error('cache must enforce its LRU item limit');
if (!stats.cloneSafe) throw new Error('cache diagnostics must expose clone-safe behavior');
if (!window.AIShortsAnalysisCache.makeFileKey({ name: 'clip.mp4', size: 10, lastModified: 2 }, { duration: 20 }, { tier: 'max', analysisSampleRate: 12000, motionSamples: 160 }).includes('12000')) {
    throw new Error('cache key must include analysis quality settings');
}

console.log('PASS clone-safe bounded analysis cache guardrails');
