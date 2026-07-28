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
const point = (time, x, y=.42) => ({ time, x, y, confidence: .94, source: 'face', zoom: 1, box: { x: x-.05, y: y-.08, width: .1, height: .16 } });
const subjects = [.2,.5,.8].map((x,index)=>({ id:`subject-${index+1}`, points:[point(0,x),point(4,x)] }));
const cues = subjects.map((subject,index)=>({ start:0,end:4,speaker:`S${index+1}`,subjectId:subject.id,confidence:.9,priority:index===0?'primary':'auto',gridCrop:index===0?{x:.1,y:-.12,zoom:1.2}:{} }));
const track = engine._test.buildTrack([point(0,.5),point(4,.5)], 'hybrid', {}, {}, { subjects, activeSubjectId:'auto', speakerPriority:true, speakerCues:cues });
const focus = engine.getFocusAt(track, 2);
ok(focus.source === 'speaker-grid-face', 'three speakers request a grid');
ok(Math.abs(focus.gridSubjects[0].x - .3) < .001, 'per-cue horizontal crop offset reaches the grid subject');
ok(Math.abs(focus.gridSubjects[0].y - .3) < .001, 'per-cue vertical crop offset reaches the grid subject');
ok(Math.abs(focus.gridSubjects[0].zoom - 1.2) < .001, 'per-cue zoom reaches the grid subject');
const bounded = engine._test.safeGridCrop({x:9,y:-9,zoom:9});
ok(bounded.x === .25 && bounded.y === -.25 && bounded.zoom === 1.35, 'grid crop values are clamped');
const edits = engine.extractEdits(track);
ok(edits.speakerCues[0].gridCrop.x === .1 && edits.speakerCues[0].gridCrop.zoom === 1.2, 'grid crop persists in extracted edits');
console.log('PASS per-speaker grid cell crop offsets are bounded and persisted');
