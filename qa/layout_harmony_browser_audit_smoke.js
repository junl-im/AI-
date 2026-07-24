#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const version = require('../package.json').version;
const file = path.join(root, 'qa', `runtime-layout-harmony-browser-v${version}.json`);
function assert(condition, message) {
  if (!condition) { console.error(`FAIL ${message}`); process.exit(1); }
  console.log(`PASS ${message}`);
}
assert(fs.existsSync(file), `v${version} layout harmony browser audit exists`);
const report = JSON.parse(fs.readFileSync(file, 'utf8'));
assert(report.version === version, 'layout harmony audit version matches release');
for (const mode of ['desktop', 'mobile']) {
  const result = report[mode];
  assert(result.errors.length === 0, `${mode} layout audit has no page errors`);
  assert(result.collapsed.open === false && result.aiClosed.visible === true, `${mode} Local AI starts as a visible compact disclosure`);
  assert(result.collapsed.summaryText.includes('로컬 AI 카피') && result.collapsed.summaryText.includes('음성 전사'), `${mode} Local AI summary explains its two user-facing jobs`);
  assert(result.aiClosed.height <= (mode === 'mobile' ? 130 : 90), `${mode} collapsed Local AI stays within the compact height budget`);
  assert(result.opened.open === true && result.workbench.visible === true && result.aiOpen.height > result.aiClosed.height, `${mode} explicit expansion reveals the complete Local AI workbench`);
  assert(result.collapsed.overflow <= 0 && result.opened.overflow <= 0, `${mode} collapsed and expanded Local AI have no horizontal overflow`);
  assert(result.footerRelation.afterMain === true && result.footerRelation.parentClass.includes('app-shell'), `${mode} storage health is semantically after the workspace inside the app shell`);
  assert(result.storage.top >= result.grid.bottom, `${mode} storage health is visually below the complete workspace`);
}
const d = report.desktop;
assert(d.utility.visible === true && d.aiClosed.top >= d.utility.bottom - 1 && d.aiClosed.bottom <= d.importPanel.top + 1, 'desktop Local AI occupies the aligned row between utility cards and the primary workflow');
assert(Math.abs(d.aiClosed.left - d.grid.left) <= 2 && Math.abs(d.aiClosed.right - d.grid.right) <= 2, 'desktop Local AI spans the same workspace width as the grid');
assert(d.focusVisibility.preview === false && d.focusVisibility.waveform === false, 'desktop focus modes hide the optional Local AI workbench');
assert(report.mobile.utility.visible === false, 'mobile keeps the desktop-only project/copy utility row out of the active flow');
console.log(`PASS v${version} Local AI alignment, compact disclosure, focus-mode containment, and footer health placement`);
