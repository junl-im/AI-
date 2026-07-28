#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
function ok(value, message) { if (!value) throw new Error(message); }

const window = { window: null, AIShortsRuntimeConfig: {} }; window.window = window;
vm.runInContext(fs.readFileSync(path.join(root, 'src/vision/smart-reframe-engine.js'), 'utf8'), vm.createContext({ window, Object, Array, Map, Set, Math, Number, String, RegExp, Error, Promise, Date, console }));
const engine = window.AIShortsSmartReframe;
const point = (time, x) => ({ time, x, y: .42, confidence: .92, source: 'face', box: { x: x - .07, y: .25, width: .14, height: .22 } });
let track = engine._test.buildTrack([{ time: 0, x: .5, y: .46, confidence: .6, source: 'motion' }], 'hybrid', {}, {}, { subjects: [
  { id: 'subject-1', label: '인물 1', points: [point(0, .22), point(4, .24)] },
  { id: 'subject-2', label: '인물 2', points: [point(0, .78), point(4, .76)] }
], activeSubjectId: 'auto', speakerPriority: true, speakerCues: [
  { start: 0, end: 4, speaker: 'A', subjectId: 'subject-1', confidence: .9, priority: 'primary' },
  { start: 0, end: 4, speaker: 'B', subjectId: 'subject-2', confidence: .86, priority: 'secondary' }
] });
track = engine.updateSpeakerLayout(track, { orientation: 'horizontal', split: .61, primaryPosition: 'right' });
const focus = engine.getFocusAt(track, 2);
ok(focus.source === 'speaker-dual-face', 'overlapping speakers keep dual focus');
ok(focus.speakerLayout.orientation === 'horizontal' && focus.speakerLayout.split === .61 && focus.speakerLayout.primaryPosition === 'right', 'horizontal right-side layout reaches focus');
track = engine.updateSpeakerLayout(track, { orientation: 'horizontal', primaryPosition: 'bottom' });
ok(track.speakerLayout.orientation === 'horizontal' && track.speakerLayout.primaryPosition === 'left', 'invalid horizontal position falls back to left');
track = engine.updateSpeakerLayout(track, { orientation: 'diagonal', primaryPosition: 'right' });
ok(track.speakerLayout.orientation === 'vertical' && track.speakerLayout.primaryPosition === 'top', 'invalid orientation returns to vertical top');

const draws = [];
const context2d = {
  save() {}, restore() {}, beginPath() {}, rect() {}, clip() {}, fillRect() {},
  drawImage(...args) { draws.push(args); },
  createLinearGradient() { return { addColorStop() {} }; }, measureText() { return { width: 10 }; },
  set filter(value) { this._filter = value; }, get filter() { return this._filter || ''; },
  set fillStyle(value) { this._fill = value; }, get fillStyle() { return this._fill; }
};
const rendererWindow = {
  window: null, AIShortsRuntimeConfig: {}, AIShortsQualityEffects: { getCanvasFilter() { return ''; } },
  AIShortsSmartReframe: {
    getFocusAt() { return { source: 'speaker-dual-face', speakerLayout: { orientation: 'horizontal', split: .6, primaryPosition: 'right' }, dualSubjects: [
      { source: 'speaker-face', x: .22, y: .42, confidence: .9 }, { source: 'speaker-face', x: .78, y: .42, confidence: .88 }
    ] }; },
    resolveCropRect(_sw, _sh, _tw, _th, subject) { return { sx: subject.x < .5 ? 0 : 960, sy: 0, sw: 960, sh: 1080 }; }
  }
};
rendererWindow.window = rendererWindow;
vm.runInContext(fs.readFileSync(path.join(root, 'src/render/vertical-renderer.js'), 'utf8'), vm.createContext({ window: rendererWindow, Object, Array, Map, WeakMap, Math, Number, String, Error, Promise, console, setTimeout, clearTimeout, setInterval, clearInterval, requestAnimationFrame() {} }));
rendererWindow.AIShortsVerticalRenderer.drawCoverImage(context2d, { videoWidth: 1920, videoHeight: 1080 }, 1080, 1920, 'smart', null, { track: {}, time: 2, options: {} });
ok(draws.length === 3, 'horizontal dual speaker draws background and two panes');
ok(draws[1][5] === 0 && draws[2][5] > 400, 'horizontal panes occupy distinct left and right destinations');
ok(draws[1][8] === 1920 && draws[2][8] === 1920, 'both horizontal panes retain full output height');

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
['speakerPaneOrientationSelect','speakerPaneSplitInput','speakerPanePositionSelect'].forEach(id => ok(html.includes(`id="${id}"`), `${id} exists`));
const project = fs.readFileSync(path.join(root, 'src/project/project-service.js'), 'utf8');
ok(project.includes("orientation === 'horizontal'") && project.includes("primaryPosition === 'right'"), 'project sanitizer persists horizontal layout safely');
console.log('PASS horizontal dual-speaker layout, safe persistence, and renderer composition');
