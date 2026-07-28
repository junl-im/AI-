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
      subjectId: 'auto', keyframes: [], speakerPriority: true, speakerLayout: { split: .61, primaryPosition: 'bottom', gridPrimarySize: .6, gridPrimaryPosition: 'right', gridPaging: 'manual', gridPageSeconds: 2.5, gridTransition: 'slide', gridTransitionMs: 480, gridManualPages: [['subject-2','subject-1','subject-3']] },
      speakerCues: [{ start: 1, end: 3, speaker: 'SPEAKER_00', subjectId: 'subject-2', confidence: .87, source: 'manual-override', segmentCount: 1, locked: true, mode: 'manual', energy: .83, gridCrop: { x: .12, y: -.08, zoom: 1.18 } }]
    },
    recommendations: [], captions: [], selectedRecommendationId: '', selectedRange: null, fileMeta: null, fileKind: 'video'
  };
  const snapshot = service.createProjectSnapshot(state, '', '');
  ok(snapshot.schemaVersion === 5, 'project schema is upgraded to v5');
  ok(snapshot.smartReframeEdits.speakerCues.length === 1, 'speaker cue is serialized');
  ok(snapshot.smartReframeEdits.speakerLayout.split === .61 && snapshot.smartReframeEdits.speakerLayout.primaryPosition === 'bottom' && snapshot.smartReframeEdits.speakerLayout.gridPrimarySize === .6 && snapshot.smartReframeEdits.speakerLayout.gridPrimaryPosition === 'right' && snapshot.smartReframeEdits.speakerLayout.gridPageSeconds === 2.5 && snapshot.smartReframeEdits.speakerLayout.gridPaging === 'manual' && snapshot.smartReframeEdits.speakerLayout.gridTransition === 'slide' && snapshot.smartReframeEdits.speakerLayout.gridTransitionMs === 480 && snapshot.smartReframeEdits.speakerLayout.gridManualPages[0][0] === 'subject-2', 'speaker pane and grid layout are serialized');
  ok(snapshot.smartReframeEdits.speakerCues[0].gridCrop.x === .12 && snapshot.smartReframeEdits.speakerCues[0].gridCrop.zoom === 1.18 && snapshot.smartReframeEdits.speakerCues[0].energy === .83, 'per-cue grid crop is serialized');
  ok(snapshot.smartReframeEdits.speakerCues[0].speaker === 'SPEAKER_00', 'speaker token is preserved');
  ok(snapshot.smartReframeEdits.speakerCues[0].locked === true && snapshot.smartReframeEdits.speakerCues[0].mode === 'manual', 'manual speaker lock metadata is preserved');
  const target = { settings: {}, recommendations: [], captions: [], smartReframeEdits: null };
  service.applyProjectSnapshot(target, snapshot);
  ok(target.smartReframeEdits.speakerPriority === true && target.smartReframeEdits.speakerLayout.split === .61 && target.smartReframeEdits.speakerLayout.primaryPosition === 'bottom' && target.smartReframeEdits.speakerLayout.gridPrimaryPosition === 'right' && target.smartReframeEdits.speakerLayout.gridPaging === 'manual' && target.smartReframeEdits.speakerLayout.gridManualPages[0][1] === 'subject-1' && target.smartReframeEdits.speakerCues[0].gridCrop.y === -.08 && target.smartReframeEdits.speakerCues[0].subjectId === 'subject-2' && target.smartReframeEdits.speakerCues[0].locked === true, 'speaker direction and pane layout restore on project import');
  const oldProject = service.parseProjectText(JSON.stringify({ app: 'AI Shorts Studio', schemaVersion: 4, settings: {}, recommendations: [], captions: [], copy: {} }));
  ok(oldProject.schemaVersion === 5 && oldProject.smartReframeEdits.speakerCues.length === 0, 'schema v4 projects migrate safely to v5');
})();
`, context);
console.log('PASS schema-v5 speaker direction project persistence and v4 migration');
