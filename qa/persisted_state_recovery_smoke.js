#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');

function ok(condition, message) {
    if (!condition) throw new Error(message);
    console.log(`PASS ${message}`);
}

const hostileSettings = JSON.stringify({
    duration: '999999999',
    style: 'unknown-style',
    cropMode: 'javascript:bad',
    renderPreset: 'ultra',
    captionOptions: { size: 999, maxLines: -2, color: 'red', highlightWords: 'x'.repeat(900) },
    qualityOptions: { brightness: 99, watermarkText: 'w'.repeat(900), watermarkPosition: 'center' },
    autoCutOptions: { silenceThreshold: -1, maxSnapDistance: 999 },
    __proto__: { polluted: true }
});
const storage = {
    value: hostileSettings,
    getItem() { return this.value; },
    setItem(key, value) { this.value = value; }
};
const stateWindow = {
    window: null,
    localStorage: storage,
    AIShortsRuntimeConfig: { LOCAL_STORAGE_KEY: 'settings-test' },
    AIShortsCoreUtils: { revokeObjectUrl() {} }
};
stateWindow.window = stateWindow;
vm.runInContext(fs.readFileSync(path.join(root, 'src/state/app-state.js'), 'utf8'), vm.createContext({ window: stateWindow, console, Date, JSON, Object }));
const appState = stateWindow.AIShortsAppState;
const settings = appState.state.settings;
ok(settings.duration === 'auto' && settings.style === 'balanced' && settings.cropMode === 'center', 'invalid persisted enum settings fall back safely');
ok(settings.captionOptions.size === 86 && settings.captionOptions.maxLines === 1, 'persisted caption numeric settings are bounded');
ok(settings.captionOptions.color === '#ffffff' && settings.captionOptions.highlightWords.length === 500, 'persisted caption text and colors are sanitized');
ok(settings.qualityOptions.brightness === 1.5 && settings.qualityOptions.watermarkText.length === 160, 'persisted quality settings are bounded');
ok(settings.renderPreset === 'balanced' && !settings.polluted, 'unknown render presets and prototype keys are rejected');
ok(appState.setSetting('__proto__', { polluted: true }) === false, 'unknown setting keys cannot mutate the state object');

const projectWindow = {
    window: null,
    AIShortsRuntimeConfig: { MAX_PROJECT_TEXT_CHARS: 4096, MAX_PROJECT_RECOMMENDATIONS: 4, MAX_PROJECT_CAPTIONS: 4, MAX_PROJECT_MEDIA_SECONDS: 3600 },
    AIShortsCaptionService: { serializeCaptions: () => '' }
};
projectWindow.window = projectWindow;
const projectContext = vm.createContext({ window: projectWindow, console, Date });
vm.runInContext(fs.readFileSync(path.join(root, 'src/project/project-service.js'), 'utf8'), projectContext);
const projectService = projectWindow.AIShortsProjectService;
const project = projectService.parseProjectText(JSON.stringify({
    app: 'AI Shorts Studio',
    schemaVersion: 3,
    settings: { duration: 'not-a-duration', captionOptions: { size: 60 } },
    recommendations: [{ id: 'a', start: 1, end: 8, title: 'A' }]
}));
ok(!Object.prototype.hasOwnProperty.call(project.settings, 'duration'), 'invalid imported duration setting is discarded');
projectWindow.projectForApply = project;
vm.runInContext(`window.targetStateForApply = {
    settings: { captionOptions: { color: '#00ffff', size: 48 }, qualityOptions: { watermarkText: '@keep' }, style: 'impact' },
    recommendations: [], captions: []
};`, projectContext);
vm.runInContext('window.AIShortsProjectService.applyProjectSnapshot(window.targetStateForApply, window.projectForApply)', projectContext);
const appliedSettings = JSON.parse(vm.runInContext('JSON.stringify(window.targetStateForApply.settings)', projectContext));
ok(appliedSettings.captionOptions.size === 60 && appliedSettings.captionOptions.color === '#00ffff', 'partial legacy caption settings merge without erasing current values');
ok(appliedSettings.qualityOptions.watermarkText === '@keep' && appliedSettings.style === 'impact', 'missing project setting groups preserve current preferences');

const sessionSource = fs.readFileSync(path.join(root, 'src/ui/session-continuity.js'), 'utf8');
const sessionCss = fs.readFileSync(path.join(root, 'assets/css/session-continuity.css'), 'utf8');
ok(sessionSource.includes('invalidStoredRecord') && sessionSource.includes("clear.disabled = !hasStoredRecord"), 'corrupt stored sessions keep the clear action available');
ok(sessionSource.includes("dataset.sessionContinuity = invalidStoredRecord ? 'invalid'"), 'corrupt sessions expose a distinct recoverable UI state');
ok(sessionCss.includes('data-session-continuity="invalid"'), 'corrupt session state has visible styling');
console.log('PASS persisted settings and corrupt session recovery guardrails');
