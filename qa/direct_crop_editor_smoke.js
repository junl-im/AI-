#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
function ok(value, message) { if (!value) { console.error(`FAIL ${message}`); process.exit(1); } console.log(`PASS ${message}`); }

const pkg = JSON.parse(read('package.json'));
const html = read('index.html');
const app = read('src/app.js');
const loader = read('src/boot/staged-ui-loader.js');
const css = read('assets/css/smart-reframe.css');
const source = read('src/ui/direct-crop-editor.js');
const context = {
    window: {},
    CustomEvent: function CustomEvent(type, init) { this.type = type; this.detail = init && init.detail; },
    console,
    setTimeout,
    clearTimeout
};
context.window.document = { dispatchEvent() {}, createElementNS() { return { setAttribute() {}, dataset: {} }; } };
context.document = context.window.document;
vm.createContext(context);
vm.runInContext(source, context);
const api = context.window.AIShortsDirectCropEditor;

ok(pkg.version === '1.6.9', 'direct crop release version is v1.6.9');
['directCropPanel', 'directCropOverlay', 'directCropPathOverlay', 'directCropToggleBtn', 'directCropSaveBtn', 'directCropUndoBtn'].forEach(id => ok(html.includes(`id="${id}"`), `${id} anchor exists`));
ok(html.includes('tabindex="0" aria-label="세로 쇼츠 미리보기 캔버스"'), 'preview canvas is keyboard focusable');
ok(loader.includes("versioned('src/ui/direct-crop-editor.js', 'editing')"), 'direct crop editor stays on editing-stage lazy load');
ok(app.includes('applySmartReframeEditorDraft') && app.includes('getDirectCropController') && app.includes("commit: (source, quiet) => setSmartReframeKeyframe"), 'app connects gesture drafts to persisted crop keyframes');
ok(css.includes('.direct-crop-overlay') && css.includes('.direct-crop-path-overlay') && css.includes('.direct-crop-panel'), 'direct crop surface, path map, and control panel have owned styles');
ok(!css.includes('!important'), 'smart-reframe stylesheet adds no cascade override debt');
ok(api && api.createController && api._test, 'direct crop controller API is exposed');
const copied = api._test.copyDraft({ time: -2, x: 2, y: -1, zoom: 2 }, { time: 5, x: 0.5, y: 0.46, zoom: 1.08 });
ok(copied.time === 0 && copied.x === 1 && copied.y === 0 && copied.zoom === 1.35, 'gesture draft clamps time, position, and zoom bounds');
ok(Math.abs(api._test.distance({ x: 0, y: 0 }, { x: 3, y: 4 }) - 5) < 0.001, 'pinch distance helper is deterministic');
const audit = path.join(root, 'qa', `runtime-direct-crop-browser-v${pkg.version}.json`);
ok(fs.existsSync(audit), 'direct crop browser audit exists for the release');
const report = JSON.parse(fs.readFileSync(audit, 'utf8'));
ok(report.version === pkg.version && report.passed === true, 'direct crop browser audit matches the release and passed');
ok(report.checks.dragCreatesKeyframe && report.checks.wheelUpdatesZoom && report.checks.keyboardNudgeWorks, 'drag, wheel, and keyboard editing paths passed');
ok(report.checks.pathVisible && report.checks.undoWorks && report.checks.noRuntimeErrors, 'path visualization, undo, and runtime safety passed');
console.log('PASS v1.6.9 direct preview crop editor contracts present');
