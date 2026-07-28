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
  { start: 0, end: 1, speaker: 'A', subjectId: 'subject-1', confidence: .62 },
  { start: 2, end: 3, speaker: 'A', subjectId: 'subject-1', confidence: .68 },
  { start: 4, end: 5, speaker: 'B', subjectId: 'subject-2', confidence: .7 }
] });
const selected = track.speakerCues.slice(0, 2).map(engine.speakerCueKey);
track = engine.updateSpeakerCuesBulk(track, selected, { timeShift: .5, speaker: 'A2', subjectId: 'subject-3', locked: true, priority: 'primary', source: 'manual-override' });
const changed = track.speakerCues.filter(cue => cue.speaker === 'A2');
ok(changed.length === 2, 'bulk edit changes every selected cue');
ok(changed.every(cue => cue.subjectId === 'subject-3' && cue.locked && cue.priority === 'primary'), 'bulk edit applies face, lock, and role');
ok(changed[0].start === .5 && changed[1].start === 2.5, 'bulk edit shifts time while preserving duration');
ok(track.speakerCues.find(cue => cue.speaker === 'B').subjectId === 'subject-2', 'unselected cue is unchanged');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
['speakerCueSelectedCount','speakerCueSelectAllBtn','speakerCueSelectionClearBtn','speakerCueBulkShiftInput','speakerCueBulkLabelInput','speakerCueBulkApplyBtn','speakerCueUndoBtn','speakerCueRedoBtn'].forEach(id => ok(html.includes(`id="${id}"`), `${id} exists`));
const app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
ok(app.includes('applyBulkSpeakerCueEdit') && app.includes('updateSpeakerCuesBulk'), 'app wires selected-cue bulk edit');
ok(app.includes('recordSpeakerTimelineHistory') && app.includes('undoSpeakerTimelineEdit') && app.includes('redoSpeakerTimelineEdit'), 'app owns bounded speaker timeline undo and redo');
ok(app.includes('MAX_SPEAKER_TIMELINE_HISTORY = 30'), 'speaker timeline history is bounded');
console.log('PASS multi-cue selection, bulk face/role/time edits, and bounded undo-redo contract');
