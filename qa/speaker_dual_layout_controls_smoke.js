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
track = engine.updateSpeakerLayout(track, { split: .62, primaryPosition: 'bottom' });
const focus = engine.getFocusAt(track, 2);
ok(focus.source === 'speaker-dual-face', 'overlapping faces retain dual composition');
ok(focus.speakerLayout.split === .62 && focus.speakerLayout.primaryPosition === 'bottom', 'dual focus carries bounded pane layout');
track = engine.updateSpeakerLayout(track, { split: 2, primaryPosition: 'side' });
ok(track.speakerLayout.split === .65 && track.speakerLayout.primaryPosition === 'top', 'invalid pane layout is clamped and normalized');
const edits = engine.extractEdits(track);
ok(edits.speakerLayout.split === .65 && edits.speakerLayout.primaryPosition === 'top', 'pane layout persists in extracted edits');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
['speakerPaneSplitInput','speakerPaneSplitValue','speakerPanePositionSelect'].forEach(id => ok(html.includes(`id="${id}"`), `${id} exists`));
const renderer = fs.readFileSync(path.join(root, 'src/render/vertical-renderer.js'), 'utf8');
ok(renderer.includes('primarySplit') && renderer.includes('primaryOnBottom') && renderer.includes('secondaryHeight'), 'renderer applies adjustable split and pane position');
console.log('PASS adjustable dual-speaker pane ratio, position, persistence, and renderer contract');
