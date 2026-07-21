#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const auditPath = path.join(root, 'qa', 'runtime-browser-audit-v1.4.1.json');

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL ${message}`);
    process.exit(1);
  }
  console.log(`PASS ${message}`);
}

assert(fs.existsSync(auditPath), 'v1.4.1 browser audit artifact exists');
const report = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
assert(report.version === '1.4.1', 'browser audit version matches release');

for (const mode of ['desktop', 'mobile']) {
  const result = report[mode];
  assert(result && result.audit && result.auditAtFirstSample, `${mode} audit contains both sample windows`);
  assert(result.audit.errors.length === 0, `${mode} has no window errors`);
  assert(result.audit.rejections.length === 0, `${mode} has no unhandled promise rejections`);
  assert(result.audit.consoleErrors.length === 0, `${mode} has no console errors`);
  assert(result.runtimeHealth.runtimeErrors === 0, `${mode} runtime health reports zero errors`);
  assert(result.audit.raf === result.auditAtFirstSample.raf, `${mode} RAF counter stabilizes after initialization`);
  assert(result.audit.mutations - result.auditAtFirstSample.mutations <= 3, `${mode} mutation counter stays within the idle tolerance`);
  if (mode === 'desktop') {
    assert(result.tabs.length === 8 && result.tabs.every(tab => tab.visible), 'desktop keeps all eight menu items visible');
  } else {
    const visibleCompact = result.tabs.filter(tab => tab.visible);
    assert(result.tabs.length === 8 && visibleCompact.length === 4, 'mobile compact menu shows four priority items');
    assert(visibleCompact.some(tab => tab.tab === result.activeFlow), 'mobile compact menu always keeps the active stage visible');
    assert(result.expandedTabs.length === 8 && result.expandedTabs.every(tab => tab.visible), 'mobile full-menu toggle restores all eight items');
    assert(result.mobileMenu.controller === 'ready' && result.mobileMenu.mode === 'compact', 'mobile adaptive menu controller initializes in compact mode');
    assert(result.mobileMenu.guide.includes('현재') && result.mobileMenu.guide.includes('다음'), 'mobile menu guide announces current and next stages');
  }
  assert(result.bodyScrollWidth <= result.viewport.width && result.htmlScrollWidth <= result.viewport.width, `${mode} has no horizontal page overflow`);

  assert(result.landing && result.landing.landing === true && result.landing.rail === true, `${mode} captures the stage landing sweep`);
  assert(result.stage && result.stage.current === true && result.stage.rail === true && result.stage.landing === false, `${mode} keeps a persistent stage rail after landing`);
}


const desktop = report.desktop;
assert(desktop.workspace && desktop.workspace.toolbarVisible === true, 'desktop workspace toolbar is visible');
assert(Array.isArray(desktop.workspace.dividerVisible) && desktop.workspace.dividerVisible.every(Boolean), 'desktop shows both column resizers');
assert(desktop.workspaceTests && desktop.workspaceTests.keyboardResizeChanged === true, 'desktop keyboard resizing changes the saved column weights');
assert(desktop.workspaceTests.preview && desktop.workspaceTests.preview.mode === 'preview' && desktop.workspaceTests.preview.visible === true && desktop.workspaceTests.preview.width >= 700, 'preview focus mode expands the preview workspace');
assert(desktop.workspaceTests.waveform && desktop.workspaceTests.waveform.mode === 'waveform' && desktop.workspaceTests.waveform.visible === true && desktop.workspaceTests.waveform.width >= 1000, 'waveform focus mode expands the waveform workspace');
const mobile = report.mobile;
assert(mobile.workspaceTests && mobile.workspaceTests.mobileControlsHidden === true, 'mobile hides desktop-only workspace controls');
assert(mobile.workspace && mobile.workspace.toolbarVisible === false && mobile.workspace.dividerVisible.every(value => value === false), 'mobile keeps toolbar and resizers out of layout');

console.log('PASS v1.4.1 real-browser stability, adaptive mobile menu, stage landing and workspace control audit');
