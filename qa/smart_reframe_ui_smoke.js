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

assert(pkg.version === '1.6.5', 'smart reframe release version is v1.6.5');
assert(html.includes('<option value="smart">스마트 피사체 추적</option>'), 'vertical-frame selector exposes smart subject tracking');
['smartReframePanel', 'smartReframeStatus', 'smartReframeDetail', 'smartReframeCaptionAvoidanceToggle', 'smartReframeAnalyzeBtn'].forEach(id => {
    assert(html.includes(`id="${id}"`), `${id} UI anchor exists`);
});
assert(html.includes('assets/css/smart-reframe.css?v=1.6.5-smart-reframe-caption-safe'), 'smart-reframe UI stylesheet is versioned');
assert(!html.includes('<script defer src="src/vision/smart-reframe-engine.js'), 'smart-reframe engine does not increase blocking startup scripts');
assert(loader.includes("versioned('src/vision/smart-reframe-engine.js', 'editing')"), 'smart-reframe engine hydrates with the editing phase');
assert(loader.includes("#cropModeSelect, #smartReframePanel"), 'smart-reframe intent prewarms its lazy engine');
assert((app.match(/smartReframe: state\.smartReframe/g) || []).length >= 3, 'still preview, playback, and thumbnail receive the tracking timeline');
assert(workflow.includes('smartReframe: state.smartReframe') && workflow.includes('smartReframeOptions: state.settings.smartReframeOptions'), 'final export receives smart-reframe state and options');
assert(state.includes("['center', 'top', 'bottom', 'blur-fit', 'smart']") && state.includes('smartReframeOptions'), 'persisted app settings accept smart crop and caption avoidance');
assert(project.includes("cropMode: ['center', 'top', 'bottom', 'blur-fit', 'smart']") && project.includes("['captionAvoidance', 'smoothing', 'zoom']"), 'project import/export preserves safe smart-reframe settings');
assert(css.includes('.smart-reframe-panel[hidden]') && css.includes('@media (max-width: 760px)'), 'smart-reframe controls have hidden and mobile layout contracts');
assert(!css.includes('!important'), 'smart-reframe stylesheet adds no cascade override debt');
const browserAuditPath = path.join(root, 'qa', `runtime-smart-reframe-browser-v${pkg.version}.json`);
assert(fs.existsSync(browserAuditPath), 'real-video smart-reframe browser audit exists');
const browserAudit = JSON.parse(fs.readFileSync(browserAuditPath, 'utf8'));
assert(browserAudit.version === pkg.version && browserAudit.passed === true, 'real-video smart-reframe browser audit matches the release and passed');
assert(browserAudit.checks.motionTrackAutoCreated && browserAudit.checks.panelVisibleForSmartVideo, 'browser flow creates and exposes the motion fallback track');
assert(browserAudit.checks.faceDetectorPromotesTrack && browserAudit.checks.operationReleased, 'browser flow promotes a local face detector track and releases operation ownership');
assert(browserAudit.checks.noPageErrors && browserAudit.checks.noConsoleErrors, 'smart-reframe browser flow has no runtime errors');
console.log('PASS v1.6.5 smart reframe UI contracts present');
