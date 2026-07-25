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
['speakerFaceTuningPanel','speakerFaceSubjectSelect','speakerFaceConfidenceMeter','speakerFaceLockToggle','speakerFaceApplyBtn','speakerFaceAutoBtn'].forEach(id => ok(html.includes(`id="${id}"`), `${id} is present`));
ok(app.includes('applySpeakerTuneCue') && app.includes('resetSpeakerTuneCue') && app.includes('existingCues: state.smartReframe.speakerCues'), 'app wires manual cue editing and locked-cue relinking');
ok(css.includes('.speaker-face-tuning-panel') && css.includes('.speaker-face-confidence'), 'responsive speaker tuning styles are present');
const window = { window: null, AIShortsRuntimeConfig: {}, console };
window.window = window;
const context = vm.createContext({ window, Object, Array, Map, Set, Math, Number, String, RegExp, Error, console });
vm.runInContext(fs.readFileSync(path.join(root, 'src/vision/smart-reframe-engine.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'src/vision/speaker-face-linker.js'), 'utf8'), context);
const engine = window.AIShortsSmartReframe;
const linker = window.AIShortsSpeakerFaceLinker;
const track = engine._test.buildTrack([
  { time: 0, x: .5, y: .46, confidence: .4, source: 'motion' },
  { time: 3, x: .5, y: .46, confidence: .4, source: 'motion' }
], 'face', {}, {}, {
  subjects: [
    { id: 'subject-1', label: '인물 1', coverage: .9, points: [{ time: 0, x: .2, y: .4, confidence: .95 }, { time: 1, x: .23, y: .4, confidence: .95 }, { time: 2, x: .22, y: .4, confidence: .95 }] },
    { id: 'subject-2', label: '인물 2', coverage: .9, points: [{ time: 0, x: .8, y: .4, confidence: .93 }, { time: 1, x: .74, y: .4, confidence: .93 }, { time: 2, x: .78, y: .4, confidence: .93 }] }
  ],
  sceneCuts: [], activeSubjectId: 'auto', keyframes: [], speakerCues: [], speakerPriority: true
});
const linked = linker.linkSegmentsToFaces([{ start: 0, end: 1.2, speaker: 'A', text: 'one' }, { start: 1.3, end: 2.5, speaker: 'B', text: 'two' }], track, {});
let directed = engine.applySpeakerCues(track, linked.cues, true);
const first = directed.speakerCues[0];
directed = engine.updateSpeakerCue(directed, engine.speakerCueKey(first), { subjectId: 'subject-2', locked: true, source: 'manual-override' });
ok(directed.speakerCues[0].locked === true && directed.speakerCues[0].mode === 'manual' && directed.speakerCues[0].subjectId === 'subject-2', 'manual cue assignment is normalized and locked');
const relinked = linker.linkSegmentsToFaces([{ start: 0, end: 1.2, speaker: 'A', text: 'one' }, { start: 1.3, end: 2.5, speaker: 'B', text: 'two' }], directed, { existingCues: directed.speakerCues });
ok(relinked.cues[0].locked === true && relinked.cues[0].subjectId === 'subject-2' && relinked.cues[0].source === 'manual-override', 'locked assignment survives automatic relinking');
const focused = engine.getFocusAt(engine.applySpeakerCues(directed, relinked.cues, true), .6);
ok(focused.subjectId === 'subject-2' && focused.source === 'speaker-face', 'manual speaker cue directs crop without becoming a crop keyframe');
const unlocked = engine.updateSpeakerCue(directed, engine.speakerCueKey(directed.speakerCues[0]), { locked: false });
ok(unlocked.speakerCues[0].locked === false && unlocked.speakerCues[0].mode === 'auto', 'manual cue can return to automatic mode');
console.log('PASS per-segment speaker-face tuning, confidence UI, locked relinking, and mixed auto/manual tracking');
