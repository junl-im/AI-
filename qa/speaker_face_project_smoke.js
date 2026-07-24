'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const context = vm.createContext({ console });
context.window = {
  window: null,
  AIShortsRuntimeConfig: { SESSION_SCHEMA_VERSION: 5, MAX_PROJECT_MEDIA_SECONDS: 86400, MAX_PROJECT_CAPTIONS: 5000, MAX_PROJECT_RECOMMENDATIONS: 24 },
  AIShortsCaptionService: { serializeCaptions() { return ''; } },
  AIShortsCoreUtils: {}
};
context.window.window = context.window;
vm.runInContext(fs.readFileSync(path.join(root, 'src/project/project-service.js'), 'utf8'), context);
vm.runInContext(`
(function () {
  function ok(value, message) { if (!value) throw new Error(message); }
  const service = window.AIShortsProjectService;
  const state = {
    settings: { cropMode: 'smart', smartReframeOptions: { speakerPriority: true } },
    smartReframeEdits: {
      subjectId: 'auto', keyframes: [], speakerPriority: true,
      speakerCues: [{ start: 1, end: 3, speaker: 'SPEAKER_00', subjectId: 'subject-2', confidence: .87, source: 'diarization-face', segmentCount: 1 }]
    },
    recommendations: [], captions: [], selectedRecommendationId: '', selectedRange: null, fileMeta: null, fileKind: 'video'
  };
  const snapshot = service.createProjectSnapshot(state, '', '');
  ok(snapshot.schemaVersion === 5, 'project schema is upgraded to v5');
  ok(snapshot.smartReframeEdits.speakerCues.length === 1, 'speaker cue is serialized');
  ok(snapshot.smartReframeEdits.speakerCues[0].speaker === 'SPEAKER_00', 'speaker token is preserved');
  const target = { settings: {}, recommendations: [], captions: [], smartReframeEdits: null };
  service.applyProjectSnapshot(target, snapshot);
  ok(target.smartReframeEdits.speakerPriority === true && target.smartReframeEdits.speakerCues[0].subjectId === 'subject-2', 'speaker direction restores on project import');
  const oldProject = service.parseProjectText(JSON.stringify({ app: 'AI Shorts Studio', schemaVersion: 4, settings: {}, recommendations: [], captions: [], copy: {} }));
  ok(oldProject.schemaVersion === 5 && oldProject.smartReframeEdits.speakerCues.length === 0, 'schema v4 projects migrate safely to v5');
})();
`, context);
console.log('PASS schema-v5 speaker direction project persistence and v4 migration');
