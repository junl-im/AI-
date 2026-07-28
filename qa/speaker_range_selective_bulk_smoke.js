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
let track = engine._test.buildTrack([{ time: 0, x: .5, y: .46, confidence: .6, source: 'motion' }], 'hybrid', {}, {}, { speakerCues: [
  { start: 0, end: 1, speaker: 'A', subjectId: 'subject-1', confidence: .62, priority: 'auto' },
  { start: 2, end: 3, speaker: 'B', subjectId: 'subject-2', confidence: .68, priority: 'secondary' },
  { start: 4, end: 5, speaker: 'C', subjectId: 'subject-3', confidence: .7, priority: 'primary' }
] });
const keys = track.speakerCues.slice(0, 2).map(engine.speakerCueKey);
track = engine.updateSpeakerCuesBulk(track, keys, { speaker: '' });
ok(track.speakerCues.filter(cue => cue.speaker === '').length === 2, 'selected label field can intentionally clear labels');
ok(track.speakerCues[0].subjectId === 'subject-1' && track.speakerCues[1].priority === 'secondary', 'omitted face and role fields stay unchanged');
const shiftedKeys = track.speakerCues.slice(0, 2).map(engine.speakerCueKey);
track = engine.updateSpeakerCuesBulk(track, shiftedKeys, { timeShift: .25 });
ok(track.speakerCues[0].start === .25 && track.speakerCues[1].start === 2.25, 'time-only bulk patch moves only selected ranges');
ok(track.speakerCues[2].start === 4 && track.speakerCues[2].speaker === 'C', 'unselected cue remains unchanged');

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
['speakerCueBulkShiftToggle','speakerCueBulkLabelToggle','speakerCueBulkFaceToggle','speakerCueBulkPriorityToggle'].forEach(id => ok(html.includes(`id="${id}"`), `${id} exists`));
const app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
ok(app.includes('selectSpeakerCueRange') && app.includes('event.shiftKey'), 'Shift range selection is wired');
ok(app.includes('speakerSelectionDragActive') && app.includes("card.addEventListener('pointerenter'"), 'pointer-drag selection is wired and bounded to cards');
ok(app.includes('bulkSpeakerFieldSelected') && app.includes('선택 필드만 적용'), 'bulk edit requires explicit field selection');
ok(app.includes("Object.prototype.hasOwnProperty.call(input, 'speaker')") || fs.readFileSync(path.join(root, 'src/vision/smart-reframe-engine.js'), 'utf8').includes("Object.prototype.hasOwnProperty.call(input, 'speaker')"), 'engine distinguishes omitted label from explicit empty label');
console.log('PASS Shift/drag cue range selection and selective bulk field application');
