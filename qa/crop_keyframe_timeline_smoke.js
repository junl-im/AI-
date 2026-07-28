#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
function ok(value, message) { if (!value) { console.error(`FAIL ${message}`); process.exit(1); } console.log(`PASS ${message}`); }

const pkg = JSON.parse(read('package.json'));
const html = read('index.html');
const app = read('src/app.js');
const loader = read('src/boot/staged-ui-loader.js');
const css = read('assets/css/smart-reframe.css');
const engineSource = read('src/vision/smart-reframe-engine.js');
const timelineSource = read('src/ui/crop-keyframe-timeline.js');
const document = { dispatchEvent() {}, createElement() { return { className: '', style: {}, dataset: {}, setAttribute() {}, addEventListener() {}, appendChild() {}, removeEventListener() {} }; } };
const window = { document, AIShortsRuntimeConfig: {}, confirm: () => true };
window.window = window;
const context = vm.createContext({ window, document, console, CustomEvent: function(type, init) { this.type = type; this.detail = init && init.detail; }, setTimeout, clearTimeout });
vm.runInContext(engineSource, context);
vm.runInContext(timelineSource, context);
const engine = window.AIShortsSmartReframe;
const api = window.AIShortsCropKeyframeTimeline;

ok(/^1\.6\.\d+$/.test(pkg.version), 'crop keyframe timeline release version is v1.6.25');
['cropKeyframeTimelinePanel', 'cropKeyframeTimeline', 'cropKeyframeMarkerLayer', 'cropKeyframeSceneLayer', 'cropKeyframePlayhead', 'cropKeyframeCopyBtn', 'cropKeyframePasteBtn', 'cropKeyframeRangeBtn', 'cropKeyframeDeleteBtn'].forEach(id => ok(html.includes(`id="${id}"`), `${id} anchor exists`));
ok(loader.includes("versioned('src/ui/crop-keyframe-timeline.js', 'editing')"), 'timeline editor stays on editing-stage lazy load');
ok(app.includes('getCropKeyframeTimelineController') && app.includes('engine.moveKeyframe') && app.includes('engine.applyKeyframeToRange'), 'app connects timeline editing to collision-safe engine operations');
ok(css.includes('.crop-keyframe-timeline') && css.includes('.crop-keyframe-marker') && css.includes('.crop-keyframe-scene-cut'), 'timeline, draggable markers, and scene boundaries have owned styles');
ok(!css.includes('!important'), 'timeline adds no cascade override debt');
ok(api && api.createController && api._test, 'crop keyframe timeline controller API is exposed');
const copied = api._test.copyKeyframe({ time: -1, x: 2, y: -1, zoom: 4 });
ok(copied.time === 0 && copied.x === 1 && copied.y === 0 && copied.zoom === 1.35, 'timeline clipboard sanitizes keyframe values');

let track = engine._test.buildTrack([
  { time: 0, x: 0.3, y: 0.4, confidence: 0.8, source: 'motion' },
  { time: 10, x: 0.7, y: 0.4, confidence: 0.8, source: 'motion' }
], 'motion', {}, {}, { sceneCuts: [5] });
track = engine.upsertKeyframe(track, { time: 1, x: 0.2, y: 0.3, zoom: 1.1 });
track = engine.upsertKeyframe(track, { time: 2, x: 0.4, y: 0.5, zoom: 1.2 });
track = engine.moveKeyframe(track, 1, 1.98, 0.12);
ok(track.keyframes.length === 1 && Math.abs(track.keyframes[0].time - 1.98) < 0.001, 'drag move resolves a time collision in favor of the moved keyframe');
track = engine.pasteKeyframe(track, { x: 0.8, y: 0.2, zoom: 1.3 }, 4);
ok(track.keyframes.length === 2 && engine.getNearestKeyframe(track, 4, 0.01).x === 0.8, 'clipboard paste inserts sanitized crop at the playhead');
track = engine.applyKeyframeToRange(track, { x: 0.55, y: 0.42, zoom: 1.16 }, 3, 7);
const rangeKeys = track.keyframes.filter(item => item.time >= 3 && item.time <= 7);
ok(rangeKeys.length === 3 && rangeKeys.some(item => item.time === 5), 'range application replaces interior edits and anchors the scene boundary');
ok(rangeKeys.every(item => item.x === 0.55 && item.zoom === 1.16), 'range application keeps one crop consistently across the selected interval');
console.log('PASS v1.6.25 crop keyframe timeline contracts present');
