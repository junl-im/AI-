#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const version = require('../package.json').version;
const file = path.join(root, 'qa', `runtime-storage-health-browser-v${version}.json`);
function assert(condition, message) {
  if (!condition) { console.error(`FAIL ${message}`); process.exit(1); }
  console.log(`PASS ${message}`);
}
assert(fs.existsSync(file), `v${version} dedicated storage diagnostics browser audit exists`);
const report = JSON.parse(fs.readFileSync(file, 'utf8'));
assert(report.version === version, 'storage diagnostics audit version matches the release');
for (const mode of ['desktop', 'mobile']) {
  const result = report[mode];
  assert(result.errors.length === 0, `${mode} storage diagnostics has no page errors`);
  assert(result.initial.advancedHidden === true, `${mode} advanced diagnostics are hidden on first paint`);
  assert(!/namespace|signature|셸 표본|분석 캐시 전체/.test(result.initial.text), `${mode} normal summary contains no technical maintenance terms`);
  assert(result.initial.autoRepairHidden === true, `${mode} healthy state hides automatic repair`);
  assert(result.initial.overflow <= 0 && result.advanced.overflow <= 0, `${mode} summary and advanced diagnostics have no horizontal overflow`);
  assert(result.initial.height <= (mode === 'mobile' ? 145 : 90), `${mode} normal storage summary remains compact`);
  assert(result.advanced.policyRefreshCalls === 1, `${mode} rapid advanced opening upgrades the in-flight summary refresh without duplicate cache scans`);
  assert(result.advanced.hidden === false && result.advanced.technical === true && result.advanced.bodyLocked === true, `${mode} explicit advanced entry reveals technical controls and locks background scroll`);
  assert(result.advanced.width <= result.viewport.width && result.advanced.height <= result.viewport.height, `${mode} advanced diagnostics fit inside the viewport`);
  assert(result.confirmationBeforeCancel.visible === true && result.confirmationBeforeCancel.clearCalls === 0, `${mode} first destructive click opens confirmation without deleting data`);
  assert(result.confirmationBeforeCancel.safety.includes('현재 프로젝트') && result.confirmationBeforeCancel.safety.includes('삭제되지 않습니다'), `${mode} confirmation explains project-data safety`);
  assert(result.confirmationAfterCancel.hidden === true && result.confirmationAfterCancel.clearCalls === 0, `${mode} cancellation leaves the analysis cache untouched`);
  assert(result.confirmationAfterAccept.hidden === true && result.confirmationAfterAccept.clearCalls === 1, `${mode} confirmed cleanup executes exactly once`);
  assert(result.warning.hidden === false && result.warning.label.includes('저장 공간 정리') && result.warning.title.includes('정리가 필요'), `${mode} automatic repair appears only for an actionable storage problem`);
  assert(result.closed.advancedHidden === true && result.closed.bodyLocked === false, `${mode} Escape closes advanced diagnostics and restores page scrolling`);
}
assert(report.mobile.advanced.width === report.mobile.viewport.width && report.mobile.advanced.height === report.mobile.viewport.height, 'mobile advanced diagnostics use the full viewport instead of expanding the normal page');
console.log(`PASS v${version} storage summary visibility, advanced modal, mobile containment, and destructive-action confirmation browser audit`);
