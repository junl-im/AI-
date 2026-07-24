'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
function ok(value, message) { if (!value) throw new Error(message); }
const window = { window: null, AIShortsRuntimeConfig: { SPEAKER_FACE_MAX_CUES: 2000 } };
window.window = window;
vm.runInContext(fs.readFileSync(path.join(root, 'src/vision/speaker-face-linker.js'), 'utf8'), vm.createContext({ window, Object, Array, Map, Set, Math, Number, String, RegExp, Error, console }));
const linker = window.AIShortsSpeakerFaceLinker;
const facePoint = (time, x, area, confidence = 0.92) => ({ time, x, y: 0.42, confidence, box: { x: x - 0.08, y: 0.25, width: Math.sqrt(area), height: Math.sqrt(area) } });
const track = {
  subjects: [
    { id: 'subject-1', coverage: 0.9, points: [facePoint(0, .25, .05), facePoint(.5, .28, .07), facePoint(1, .23, .05), facePoint(2, .24, .05), facePoint(3, .24, .05)] },
    { id: 'subject-2', coverage: 0.9, points: [facePoint(0, .74, .05), facePoint(1, .74, .05), facePoint(2, .72, .05), facePoint(2.5, .78, .08), facePoint(3, .71, .05)] }
  ]
};
const result = linker.linkSegmentsToFaces([
  { start: 0, end: 1.2, text: '첫 번째 발화', speaker: 'SPEAKER_00' },
  { start: 1.8, end: 3.1, text: '두 번째 발화', speaker: 'SPEAKER_01' }
], track);
ok(result.summary.segments === 2 && result.summary.subjects === 2, 'segment and subject counts are preserved');
ok(result.cues.length === 2, 'two separated speaker cues are emitted');
ok(result.cues.every(cue => cue.subjectId !== 'auto'), 'both diarized speakers map to faces');
ok(result.cues[0].subjectId !== result.cues[1].subjectId, 'different diarized speakers map one-to-one to different faces');
ok(result.summary.diarized === 2, 'diarization-backed cues are counted');
const fallback = linker.linkSegmentsToFaces([{ start: 0, end: 1.2, text: '무라벨 발화' }], track);
ok(fallback.cues[0].source === 'face-activity', 'unlabeled speech uses local face activity');
ok(linker.status(result).ready === true, 'linked result exposes ready status');
console.log('PASS speaker-face linker maps diarized and unlabeled speech to local face activity');
