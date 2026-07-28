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
let track = engine._test.buildTrack([{ time: 0, x: .5, y: .46, confidence: .6, source: 'motion' }], 'hybrid', {}, {}, { subjects: [], activeSubjectId: 'auto', speakerCues: [
  { start: 0, end: 1, speaker: 'A', subjectId: 'subject-1', confidence: .62 },
  { start: 2, end: 3, speaker: 'A', subjectId: 'subject-1', confidence: .68 },
  { start: 3, end: 4, speaker: 'B', subjectId: 'subject-2', confidence: .7 }
] });
track = engine.updateSpeakerCuesBySpeaker(track, 'A', { subjectId: 'subject-3', locked: true, source: 'manual-override', priority: 'primary' });
const a = track.speakerCues.filter(cue => cue.speaker === 'A');
ok(a.length === 2 && a.every(cue => cue.subjectId === 'subject-3' && cue.locked && cue.priority === 'primary'), 'same-speaker bulk correction updates every matching cue');
ok(a.every(cue => cue.confidenceHistory.length >= 2), 'bulk correction appends bounded connection confidence history');
ok(track.speakerCues.find(cue => cue.speaker === 'B').subjectId === 'subject-2', 'bulk correction does not change other speakers');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
['speakerCuePrioritySelect','speakerFaceConfidenceHistory','speakerFaceApplySpeakerBtn'].forEach(id => ok(html.includes(`id="${id}"`), `${id} UI exists`));
ok(app.includes('applySpeakerTuneToMatchingSpeaker') && app.includes('updateSpeakerCuesBySpeaker'), 'app wires same-speaker correction');
console.log('PASS speaker-face confidence history, priority roles, and same-speaker bulk correction');
