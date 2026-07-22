#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const version = require('../package.json').version;
const auditPath = path.join(root, 'qa', `runtime-browser-audit-v${version}.json`);

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL ${message}`);
    process.exit(1);
  }
  console.log(`PASS ${message}`);
}

assert(fs.existsSync(auditPath), `v${version} browser audit artifact exists`);
const report = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
assert(report.version === version, 'browser audit version matches release');

for (const mode of ['desktop', 'smallLaptop', 'tablet', 'mobile']) {
  const result = report[mode];
  assert(result && result.audit && result.auditAtFirstSample, `${mode} audit contains both sample windows`);
  assert(result.audit.errors.length === 0, `${mode} has no window errors`);
  assert(result.audit.rejections.length === 0, `${mode} has no unhandled promise rejections`);
  assert(result.audit.consoleErrors.length === 0, `${mode} has no console errors`);
  assert(result.runtimeHealth.runtimeErrors === 0, `${mode} runtime health reports zero errors`);
  assert(result.audit.raf === result.auditAtFirstSample.raf, `${mode} RAF counter stabilizes after initialization`);
  assert(result.audit.mutations - result.auditAtFirstSample.mutations <= 3, `${mode} mutation counter stays within the idle tolerance`);
  if (mode === 'mobile') {
    const visibleCompact = result.tabs.filter(tab => tab.visible);
    assert(result.tabs.length === 8 && visibleCompact.length === 4, 'mobile compact menu shows four priority items');
    assert(visibleCompact.some(tab => tab.tab === result.activeFlow), 'mobile compact menu always keeps the active stage visible');
    assert(result.expandedTabs.length === 8 && result.expandedTabs.every(tab => tab.visible), 'mobile full-menu toggle restores all eight items');
    assert(result.mobileMenu.controller === 'ready' && result.mobileMenu.mode === 'compact', 'mobile adaptive menu controller initializes in compact mode');
    assert(result.mobileMenu.guide.includes('현재') && result.mobileMenu.guide.includes('다음'), 'mobile menu guide announces current and next stages');
  } else {
    assert(result.tabs.length === 8 && result.tabs.every(tab => tab.visible), `${mode} keeps all eight menu items visible`);
  }
  assert(result.uiStructure && result.uiStructure.mediaInputCount === 1, `${mode} keeps one primary media input`);
  assert(result.uiStructure.primaryImportOwner === 'primary', `${mode} identifies the single import owner`);
  assert(result.uiStructure.heroEntry.tag === 'BUTTON' && result.uiStructure.heroEntry.controls === 'fileDrop' && !result.uiStructure.heroEntry.directFor, `${mode} hero entry navigates without opening a picker`);
  assert(result.uiStructure.dockEntry.tag === 'BUTTON' && result.uiStructure.dockEntry.controls === 'fileDrop' && !result.uiStructure.dockEntry.directFor, `${mode} dock entry navigates without opening a picker`);
  assert(result.uiStructure.retiredMobileAction === false, `${mode} has no retired duplicate mobile action bar`);
  assert(result.bodyScrollWidth <= result.viewport.width && result.htmlScrollWidth <= result.viewport.width, `${mode} has no horizontal page overflow`);
  assert(result.landing && result.landing.landing === true && result.landing.rail === true, `${mode} captures the stage landing sweep`);
  assert(result.stage && result.stage.current === true && result.stage.rail === true && result.stage.landing === false, `${mode} keeps a persistent stage rail after landing`);
}

const desktop = report.desktop;
assert(desktop.workspace && desktop.workspace.toolbarVisible === true, 'desktop workspace toolbar is visible');
assert(desktop.uiStructure.utilityHub.visible === true && desktop.uiStructure.utilityHub.projectVisible === true && desktop.uiStructure.utilityHub.copyVisible === true, 'desktop project and copy utility hub is visible');
assert(Math.abs(desktop.uiStructure.utilityHub.project.top - desktop.uiStructure.utilityHub.copy.top) <= 1 && Math.abs(desktop.uiStructure.utilityHub.project.bottom - desktop.uiStructure.utilityHub.copy.bottom) <= 1, 'desktop project and copy cards are vertically aligned');
assert(desktop.uiStructure.importRect.top >= desktop.uiStructure.utilityHub.rect.bottom, 'desktop primary import workspace follows the utility hub without overlap');
assert(Array.isArray(desktop.workspace.dividerVisible) && desktop.workspace.dividerVisible.every(Boolean), 'desktop shows both column resizers');
assert(desktop.workspaceTests && desktop.workspaceTests.keyboardResizeChanged === true, 'desktop keyboard resizing changes the saved column weights');
assert(desktop.workspaceTests.preview && desktop.workspaceTests.preview.mode === 'preview' && desktop.workspaceTests.preview.visible === true && desktop.workspaceTests.preview.width >= 700, 'preview focus mode expands the preview workspace');
assert(desktop.workspaceTests.waveform && desktop.workspaceTests.waveform.mode === 'waveform' && desktop.workspaceTests.waveform.visible === true && desktop.workspaceTests.waveform.width >= 1000, 'waveform focus mode expands the waveform workspace');

const smallLaptop = report.smallLaptop;
assert(smallLaptop.workspace.toolbarVisible === true && smallLaptop.workspace.dividerVisible.every(Boolean), 'small laptop keeps workspace controls usable');
assert(smallLaptop.initialDensity.heroHeight <= 330, 'small laptop redesigned hero stays within the compact density target');
assert(smallLaptop.dock.height <= 90, 'small laptop dock stays within the compact height target');

const tablet = report.tablet;
assert(tablet.workspaceTests && tablet.workspaceTests.mobileControlsHidden === true, 'tablet hides desktop-only workspace controls');
assert(tablet.workspace.toolbarVisible === false && tablet.workspace.dividerVisible.every(value => value === false), 'tablet removes toolbar and resizers from layout');
assert(tablet.initialDensity.heroHeight <= 320, 'tablet hero stays within the compact density target');
assert(tablet.dock.height <= 80 && tablet.dockScrollWidth <= tablet.dockClientWidth, 'tablet dock fits all eight stages in one compact row');

const mobile = report.mobile;
assert(mobile.workspaceTests && mobile.workspaceTests.mobileControlsHidden === true, 'mobile hides desktop-only workspace controls');
assert(mobile.initialUiStructure.primaryImportVisible === true, 'mobile initial file stage keeps the single primary import card visible');
assert(mobile.initialUiStructure.utilityHubVisible === false, 'mobile keeps the desktop project and copy utility hub out of the active flow');
assert(mobile.workspace && mobile.workspace.toolbarVisible === false && mobile.workspace.dividerVisible.every(value => value === false), 'mobile keeps toolbar and resizers out of layout');

console.log(`PASS v${version} four-viewport stability, responsive density, adaptive menu, and workspace control audit`);
