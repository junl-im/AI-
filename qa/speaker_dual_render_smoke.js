#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
function ok(value, message) { if (!value) throw new Error(message); }
const draws = [];
const context2d = {
  save() {}, restore() {}, beginPath() {}, rect() {}, clip() {}, fillRect() {},
  drawImage(...args) { draws.push(args); },
  createLinearGradient() { return { addColorStop() {} }; },
  measureText() { return { width: 10 }; },
  set filter(value) { this._filter = value; }, get filter() { return this._filter || ''; },
  set fillStyle(value) { this._fill = value; }, get fillStyle() { return this._fill; }
};
const focus = {
  source: 'speaker-dual-face',
  dualSubjects: [
    { source: 'speaker-face', x: .22, y: .42, confidence: .9 },
    { source: 'speaker-face', x: .78, y: .42, confidence: .88 }
  ]
};
const window = {
  window: null,
  AIShortsRuntimeConfig: {},
  AIShortsQualityEffects: { getCanvasFilter() { return ''; } },
  AIShortsSmartReframe: {
    getFocusAt() { return focus; },
    resolveCropRect(_sw, _sh, _tw, _th, subject) {
      return { sx: subject.x < .5 ? 0 : 960, sy: 0, sw: 960, sh: 1080 };
    }
  }
};
window.window = window;
vm.runInContext(fs.readFileSync(path.join(root, 'src/render/vertical-renderer.js'), 'utf8'), vm.createContext({ window, Object, Array, Map, WeakMap, Math, Number, String, Error, Promise, console, setTimeout, clearTimeout, setInterval, clearInterval, requestAnimationFrame() {} }));
window.AIShortsVerticalRenderer.drawCoverImage(context2d, { videoWidth: 1920, videoHeight: 1080 }, 1080, 1920, 'smart', null, { track: {}, time: 2, options: {} });
ok(draws.length === 3, 'dual speaker composition draws one background and two face panes');
ok(draws[1][6] === 0 && draws[2][6] > 900, 'primary and secondary faces occupy separate top and bottom panes');
console.log('PASS vertical renderer composes overlapping speakers into two persistent face panes');
