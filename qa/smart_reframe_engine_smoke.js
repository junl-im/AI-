#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');

function assert(condition, message) {
    if (!condition) { console.error(`FAIL ${message}`); process.exit(1); }
    console.log(`PASS ${message}`);
}

const window = { AIShortsRuntimeConfig: {}, AIShortsCoreUtils: {} };
window.window = window;
const context = vm.createContext({ window, console, setTimeout, clearTimeout, Uint8ClampedArray, Math, Number, Object, Array, Promise, Error });
vm.runInContext(fs.readFileSync(path.join(root, 'src/vision/smart-reframe-engine.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'src/analysis/video-motion-analyzer.js'), 'utf8'), context);

const engine = window.AIShortsSmartReframe;
const motion = window.AIShortsVideoMotionAnalyzer;
assert(engine && typeof engine.createTrackFromMotion === 'function', 'smart reframe engine exposes motion-track creation');
assert(typeof engine.getFocusAt === 'function' && typeof engine.resolveCropRect === 'function', 'smart reframe engine exposes interpolation and crop resolution');

const track = engine.createTrackFromMotion({ frames: [
    { time: 0, motionX: 0.18, motionY: 0.44, spatialConfidence: 0.72 },
    { time: 1, motionX: 0.34, motionY: 0.43, spatialConfidence: 0.76 },
    { time: 2, motionX: 0.78, motionY: 0.42, spatialConfidence: 0.88 }
] }, { smoothing: 0.3 });
assert(track.points.length === 3 && track.source === 'motion', 'motion analysis becomes a bounded smart-reframe track');
assert(track.points.every(point => point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1), 'all subject coordinates stay normalized');
assert(Math.abs(track.points[2].x - track.points[1].x) <= 0.12, 'tracking applies a maximum movement step to prevent crop jumps');

const focus = engine.getFocusAt(track, 1.5);
assert(focus.x > track.points[1].x && focus.x < track.points[2].x, 'subject focus interpolates between sampled timestamps');

const lowerCaption = engine.resolveCropRect(1920, 1080, 1080, 1920, { x: 0.74, y: 0.48, confidence: 0.9, source: 'face' }, {
    zoom: 1.08,
    captionAvoidance: true,
    captionOptions: { position: 'lower' }
});
const noAvoidance = engine.resolveCropRect(1920, 1080, 1080, 1920, { x: 0.74, y: 0.48, confidence: 0.9, source: 'face' }, {
    zoom: 1.08,
    captionAvoidance: false,
    captionOptions: { position: 'lower' }
});
assert(lowerCaption.sx >= 0 && lowerCaption.sy >= 0 && lowerCaption.sx + lowerCaption.sw <= 1920.001 && lowerCaption.sy + lowerCaption.sh <= 1080.001, 'resolved smart crop never leaves source bounds');
assert(lowerCaption.sy >= noAvoidance.sy, 'lower captions shift the subject upward inside the output frame');

const score = engine.scoreRange(track, 0, 2);
assert(score.samples === 3 && score.confidence > 0 && score.edgeRisk >= 0 && score.edgeRisk <= 1, 'range score reports confidence and subject edge risk');

let invalidProviderRejected = false;
try { engine.registerDetectorProvider({}); } catch (_) { invalidProviderRejected = true; }
assert(invalidProviderRejected, 'invalid face-detector providers are rejected');
assert(engine.registerDetectorProvider({ name: 'test-provider', detect: async () => [] }) === true, 'detector provider hook accepts a local detector contract');
let mediaPipeTimestamp = -1;
assert(engine.registerMediaPipeFaceDetector({ detectForVideo(frame, timestamp) { mediaPipeTimestamp = timestamp; return { detections: [] }; } }) === true, 'MediaPipe Face Detector adapter accepts detectForVideo');
engine.registerDetectorProvider(null);
assert(typeof engine.registerMediaPipeFaceDetector === 'function' && mediaPipeTimestamp === -1, 'MediaPipe adapter registers without running hidden analysis');

const width = 8;
const height = 4;
const previous = new Uint8ClampedArray(width * height * 4);
const current = new Uint8ClampedArray(previous);
for (let y = 0; y < height; y += 1) {
    for (let x = 5; x < width; x += 1) {
        const index = (y * width + x) * 4;
        current[index] = 255;
        current[index + 1] = 255;
        current[index + 2] = 255;
        current[index + 3] = 255;
    }
}
const metrics = motion._test.frameDiffMetrics(current, previous, width, height);
assert(metrics.motionX > 0.65 && metrics.motionX <= 1, 'spatial motion centroid follows activity on the right side');
assert(metrics.motionBox && metrics.motionBox.x >= 0.6, 'spatial motion analyzer records a normalized active box');

console.log('PASS smart reframe engine smoke complete');
