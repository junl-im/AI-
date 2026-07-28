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
let track = engine._test.buildTrack([{ time: 0, x: .5, y: .46, confidence: .6, source: 'motion' }, { time: 4, x: .5, y: .46, confidence: .6, source: 'motion' }], 'hybrid', {}, {}, { subjects: [
  { id: 'subject-1', label: '인물 1', points: [point(0, .22), point(4, .24)] },
  { id: 'subject-2', label: '인물 2', points: [point(0, .78), point(4, .76)] }
], activeSubjectId: 'auto', speakerPriority: true, speakerCues: [
  { start: 0, end: 4, speaker: 'A', subjectId: 'subject-1', confidence: .9, priority: 'primary' },
  { start: 1, end: 3, speaker: 'B', subjectId: 'subject-2', confidence: .86, priority: 'secondary' }
] });
const originalCount = track.speakerCues.length;
track = engine.duplicateSpeakerCue(track, engine.speakerCueKey(track.speakerCues[0]), { speaker: 'C', subjectId: 'auto', priority: 'secondary' });
ok(track.speakerCues.length === originalCount + 1, 'editor can add an overlapping secondary speaker cue');
track = engine.removeSpeakerCue(track, engine.speakerCueKey(track.speakerCues.find(cue => cue.speaker === 'C')));
const single = engine.getFocusAt(track, .5);
ok(single.source === 'speaker-face' && single.subjectId === 'subject-1', 'single active cue keeps normal speaker face crop');
const dual = engine.getFocusAt(track, 2);
ok(dual.source === 'speaker-dual-face', 'overlapping speakers request dual face composition');
ok(Array.isArray(dual.dualSubjects) && dual.dualSubjects.length === 2, 'dual composition preserves two distinct subject focuses');
ok(dual.dualSubjects[0].subjectId === 'subject-1' && dual.dualSubjects[1].subjectId === 'subject-2', 'primary and secondary roles order split panes');
const renderer = fs.readFileSync(path.join(root, 'src/render/vertical-renderer.js'), 'utf8');
ok(renderer.includes('drawDualSpeakerFaces') && renderer.includes("focus.source === 'speaker-dual-face'"), 'vertical renderer owns dual speaker split composition');
console.log('PASS overlapping speaker cues preserve two faces with primary-secondary split composition');
