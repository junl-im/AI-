#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const auditPath = path.join(root, 'qa', 'runtime-browser-audit-v1.3.0.json');

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL ${message}`);
    process.exit(1);
  }
  console.log(`PASS ${message}`);
}

assert(fs.existsSync(auditPath), 'v1.3.0 browser audit artifact exists');
const report = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
assert(report.version === '1.3.0', 'browser audit version matches release');

for (const mode of ['desktop', 'mobile']) {
  const result = report[mode];
  assert(result && result.audit && result.auditAtFirstSample, `${mode} audit contains both sample windows`);
  assert(result.audit.errors.length === 0, `${mode} has no window errors`);
  assert(result.audit.rejections.length === 0, `${mode} has no unhandled promise rejections`);
  assert(result.audit.consoleErrors.length === 0, `${mode} has no console errors`);
  assert(result.runtimeHealth.runtimeErrors === 0, `${mode} runtime health reports zero errors`);
  assert(result.audit.raf === result.auditAtFirstSample.raf, `${mode} RAF counter stabilizes after initialization`);
  assert(result.audit.mutations === result.auditAtFirstSample.mutations, `${mode} mutation counter stabilizes after initialization`);
  assert(result.tabs.length === 8 && result.tabs.every(tab => tab.visible), `${mode} keeps all eight menu items visible`);
  assert(result.bodyScrollWidth <= result.viewport.width && result.htmlScrollWidth <= result.viewport.width, `${mode} has no horizontal page overflow`);

  assert(result.landing && result.landing.landing === true && result.landing.rail === true, `${mode} captures the stage landing sweep`);
  assert(result.stage && result.stage.current === true && result.stage.rail === true && result.stage.landing === false, `${mode} keeps a persistent stage rail after landing`);
}

console.log('PASS v1.3.0 real-browser stability and stage landing audit');
