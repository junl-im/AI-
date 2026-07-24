'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
function ok(value, message) { if (!value) throw new Error(message); }
const window = { window: null, AIShortsRuntimeConfig: {} };
window.window = window;
vm.runInContext(fs.readFileSync(path.join(root, 'src/vision/smart-reframe-engine.js'), 'utf8'), vm.createContext({ window, Object, Array, Map, Set, Math, Number, String, RegExp, Error, Promise, Date, console, setTimeout, clearTimeout }));
const engine = window.AIShortsSmartReframe;
const points = [{ time: 0, x: .5, y: .46, confidence: .5, source: 'motion' }, { time: 3, x: .5, y: .46, confidence: .5, source: 'motion' }];
const track = engine._test.buildTrack(points, 'hybrid', {}, {}, { subjects: [
  { id: 'subject-1', label: '인물 1', points: [{ time: 0, x: .2, y: .4, confidence: .9, source: 'face' }, { time: 3, x: .2, y: .4, confidence: .9, source: 'face' }] },
  { id: 'subject-2', label: '인물 2', points: [{ time: 0, x: .8, y: .4, confidence: .9, source: 'face' }, { time: 3, x: .8, y: .4, confidence: .9, source: 'face' }] }
], activeSubjectId: 'auto' });
const directed = engine.applySpeakerCues(track, [
  { start: 0, end: 1.4, subjectId: 'subject-1', speaker: 'A', confidence: .9 },
  { start: 1.5, end: 3, subjectId: 'subject-2', speaker: 'B', confidence: .88 }
], true);
const left = engine.getFocusAt(directed, .7);
const right = engine.getFocusAt(directed, 2.2);
ok(left.source === 'speaker-face' && left.subjectId === 'subject-1' && left.x < .35, 'first speech cue directs crop to first face');
ok(right.source === 'speaker-face' && right.subjectId === 'subject-2' && right.x > .65, 'second speech cue directs crop to second face');
const disabled = engine.setSpeakerPriority(directed, false);
ok(engine.getFocusAt(disabled, 2.2).source !== 'speaker-face', 'speaker priority can be disabled without deleting cues');
const manualSubject = engine.selectSubject(directed, 'subject-1');
ok(engine.getFocusAt(manualSubject, 2.2).subjectId === 'subject-1', 'manual subject pin overrides speaker switching');
const manualKeyframe = engine.upsertKeyframe(directed, { time: 2.2, x: .45, y: .3, zoom: 1.2 });
ok(engine.getFocusAt(manualKeyframe, 2.2).source === 'manual', 'manual crop keyframe overrides speaker direction');
const edits = engine.extractEdits(directed);
ok(edits.speakerPriority && edits.speakerCues.length === 2, 'speaker cues persist through smart-reframe edits');
console.log('PASS smart reframe speaker priority, manual override, and persisted cue guardrails');
