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
const point = (time, x, y=.42) => ({ time, x, y, confidence: .92, source: 'face', box: { x: x - .06, y: y - .1, width: .12, height: .2 } });
const subjects = [
  { id: 'subject-1', points: [point(0,.18),point(4,.2)] },
  { id: 'subject-2', points: [point(0,.5),point(4,.52)] },
  { id: 'subject-3', points: [point(0,.82),point(4,.8)] },
  { id: 'subject-4', points: [point(0,.66,.68),point(4,.65,.68)] }
];
const cues = subjects.map((subject, index) => ({ start: 0, end: 4, speaker: `S${index+1}`, subjectId: subject.id, confidence: .9-index*.03, priority: index === 0 ? 'primary' : index === 3 ? 'secondary' : 'auto' }));
const track = engine._test.buildTrack([point(0,.5),point(4,.5)], 'hybrid', {}, {}, { subjects, activeSubjectId: 'auto', speakerPriority: true, speakerCues: cues });
const focus = engine.getFocusAt(track, 2);
ok(focus.source === 'speaker-grid-face', 'three or more distinct active speakers request grid composition');
ok(Array.isArray(focus.gridSubjects) && focus.gridSubjects.length === 4, 'grid preserves up to four distinct speakers');
ok(focus.gridSubjects[0].subjectId === 'subject-1', 'primary speaker remains first grid cell');
ok(focus.gridSubjects[3].subjectId === 'subject-4', 'secondary speaker remains after automatic speakers');
console.log('PASS dynamic grid preserves three to four simultaneous speaker faces');
