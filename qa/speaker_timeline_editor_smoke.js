#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
function ok(value, message) { if (!value) throw new Error(message); }
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/css/smart-reframe.css'), 'utf8');
['speakerCueTimeline','speakerCueStartInput','speakerCueEndInput','speakerCueLabelInput','speakerCuePrioritySelect','speakerFaceConfidenceHistory','speakerFaceApplySpeakerBtn','speakerCueSplitBtn','speakerCueOverlapBtn','speakerCueDeleteBtn'].forEach(id => ok(html.includes(`id="${id}"`), `${id} exists`));
ok(app.includes('splitSpeakerTuneCue') && app.includes('addOverlappingSpeakerTuneCue') && app.includes('deleteSpeakerTuneCue') && app.includes('speaker-cue-item'), 'app wires direct speaker cue editing');
ok(css.includes('.speaker-cue-timeline') && css.includes('.speaker-cue-edit-grid'), 'speaker timeline has responsive styles');
const window = { window: null, AIShortsRuntimeConfig: {}, console };
window.window = window;
const context = vm.createContext({ window, Object, Array, Map, Set, Math, Number, String, RegExp, Error, console });
vm.runInContext(fs.readFileSync(path.join(root, 'src/vision/smart-reframe-engine.js'), 'utf8'), context);
const engine = window.AIShortsSmartReframe;
let track = engine._test.buildTrack([
  { time: 0, x: .5, y: .46, confidence: .8, source: 'motion' },
  { time: 4, x: .5, y: .46, confidence: .8, source: 'motion' }
], 'face', {}, {}, { subjects: [], sceneCuts: [], activeSubjectId: 'auto', keyframes: [], speakerCues: [
  { start: 0, end: 4, speaker: 'A', subjectId: 'auto', confidence: .8, source: 'face-activity' }
], speakerPriority: true });
const original = track.speakerCues[0];
track = engine.splitSpeakerCue(track, engine.speakerCueKey(original), 2, { speaker: 'B' });
ok(track.speakerCues.length === 2, 'cue splits into two timeline segments');
ok(track.speakerCues[0].end === 2 && track.speakerCues[1].start === 2, 'split preserves exact boundary');
ok(track.speakerCues[1].speaker === 'B', 'split segment can carry a different simultaneous speaker label');
const second = track.speakerCues[1];
track = engine.updateSpeakerCue(track, engine.speakerCueKey(second), { start: 2.2, end: 3.8, speaker: 'B2', subjectId: 'subject-2', locked: true });
ok(track.speakerCues[1].start === 2.2 && track.speakerCues[1].end === 3.8 && track.speakerCues[1].speaker === 'B2', 'cue boundaries and label are directly editable');
ok(track.speakerCues[1].locked === true && track.speakerCues[1].subjectId === 'subject-2', 'manual face correction is preserved');
track = engine.removeSpeakerCue(track, engine.speakerCueKey(track.speakerCues[0]));
ok(track.speakerCues.length === 1 && track.speakerCues[0].speaker === 'B2', 'individual cue deletion works');
console.log('PASS direct speaker timeline editing, overlap splitting, deletion, and manual face correction');
