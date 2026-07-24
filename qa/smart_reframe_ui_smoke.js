#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function assert(condition, message) {
    if (!condition) { console.error(`FAIL ${message}`); process.exit(1); }
    console.log(`PASS ${message}`);
}

const pkg = JSON.parse(read('package.json'));
const html = read('index.html');
const app = read('src/app.js');
const state = read('src/state/app-state.js');
const project = read('src/project/project-service.js');
const workflow = read('src/app/render-workflow-controller.js');
const loader = read('src/boot/staged-ui-loader.js');
const css = read('assets/css/smart-reframe.css');

assert(pkg.version === '1.6.9', 'smart reframe director release version is v1.6.9');
assert(html.includes('<option value="smart">스마트 피사체 추적</option>'), 'vertical-frame selector exposes smart subject tracking');
[
    'smartReframePanel', 'smartReframeStatus', 'smartReframeDetail', 'smartReframeCaptionAvoidanceToggle', 'smartReframeAnalyzeBtn',
    'smartReframeEditor', 'smartReframeSubjectSelect', 'smartReframeXInput', 'smartReframeYInput', 'smartReframeZoomInput',
    'smartReframeKeyframeSetBtn', 'smartReframeKeyframeDeleteBtn', 'smartReframeKeyframeResetBtn'
].forEach(id => assert(html.includes(`id="${id}"`), `${id} UI anchor exists`));
assert(html.includes('assets/css/smart-reframe.css?v=1.6.9-direct-crop-editor'), 'smart-reframe director stylesheet is versioned');
assert(!html.includes('<script defer src="src/vision/smart-reframe-engine.js'), 'smart-reframe engine does not increase blocking startup scripts');
assert(loader.includes("versioned('src/vision/smart-reframe-engine.js', 'editing')"), 'smart-reframe engine hydrates with the editing phase');
assert(loader.includes('#cropModeSelect, #smartReframePanel'), 'smart-reframe intent prewarms its lazy engine');
assert((app.match(/smartReframe: state\.smartReframe/g) || []).length >= 3, 'still preview, playback, and thumbnail receive the tracking timeline');
assert(app.includes('applySmartReframeSubjectSelection') && app.includes('setSmartReframeKeyframe') && app.includes('resetSmartReframeKeyframes'), 'app owns subject selection and crop-keyframe actions');
assert(workflow.includes('smartReframe: state.smartReframe') && workflow.includes('smartReframeOptions: state.settings.smartReframeOptions'), 'final export receives smart-reframe state and options');
assert(state.includes("['center', 'top', 'bottom', 'blur-fit', 'smart']") && state.includes('smartReframeEdits') && state.includes('sceneCutProtection'), 'persisted app state accepts smart crop, scene protection, and session edits');
assert(project.includes("cropMode: ['center', 'top', 'bottom', 'blur-fit', 'smart']") && project.includes('sanitizeSmartReframeEdits') && project.includes('smartReframeEdits'), 'project import/export preserves subject pin and crop keyframes');
assert(css.includes('.smart-reframe-editor-grid') && css.includes('.smart-reframe-panel[data-manual="true"]') && css.includes('@media (max-width: 760px)'), 'smart-reframe editor has manual-state and responsive layout contracts');
assert(!css.includes('!important'), 'smart-reframe stylesheet adds no cascade override debt');
const browserAuditPath = path.join(root, 'qa', `runtime-smart-reframe-browser-v${pkg.version}.json`);
assert(fs.existsSync(browserAuditPath), 'real-video smart-reframe director browser audit exists');
const browserAudit = JSON.parse(fs.readFileSync(browserAuditPath, 'utf8'));
assert(browserAudit.version === pkg.version && browserAudit.passed === true, 'real-video smart-reframe browser audit matches the release and passed');
assert(browserAudit.checks.motionTrackAutoCreated && browserAudit.checks.panelVisibleForSmartVideo, 'browser flow creates and exposes the motion fallback track');
assert(browserAudit.checks.multipleSubjectsDetected && browserAudit.checks.manualSubjectPinWorks, 'browser flow detects and pins one of multiple subjects');
assert(browserAudit.checks.keyframeCreateDeleteWorks && browserAudit.checks.operationReleased, 'browser flow edits crop keyframes and releases operation ownership');
assert(browserAudit.checks.speakerFacesLinked && browserAudit.checks.speakerDirectionChangesCrop, 'browser flow links two local transcript speakers to distinct tracked faces');
assert(browserAudit.checks.speakerDirectionPersists && browserAudit.checks.speakerStatusVisible, 'speaker-directed crop state persists and is visible in the editor');
assert(browserAudit.checks.noPageErrors && browserAudit.checks.noConsoleErrors, 'smart-reframe director flow has no runtime errors');
console.log('PASS v1.6.9 smart reframe director UI contracts present');
