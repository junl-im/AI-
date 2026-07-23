#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const pkg = require(path.join(root, 'package.json'));
const readJson = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
function ok(value, message) { if (!value) throw new Error(message); console.log(`PASS ${message}`); }
function metric(report, mode, parts) { let value=report[mode]; for (const part of parts) value=value[part]; return value; }

const reduction = readJson('qa/runtime-structure-priority-v1.5.25.json');
const probe = readJson('qa/runtime-structure-priority-probe-v1.5.25.json');
const cascade = readJson(`qa/runtime-css-ownership-v${pkg.version}.json`);
const current = readJson(`qa/runtime-browser-audit-v${pkg.version}.json`);
const baseline = readJson('qa/runtime-browser-audit-v1.5.19.json');

ok(pkg.version === '1.5.25', 'structure and responsive priority release version is v1.5.25');
ok(reduction.baselineVersion === '1.5.19' && reduction.targetVersion === '1.5.25', 'reduction is anchored to the v1.5.19 baseline');
ok(reduction.baselineImportant === 666 && reduction.removedCount === 73 && reduction.remainingImportant === 593, '73 verified priorities reduce the active total from 666 to 593');
ok(probe.safeCount >= 160 && probe.unsafeCount > 0 && probe.errors.length === 0, 'Chromium probe distinguishes safe and required structural priorities without runtime errors');
ok(cascade.importantCount === 593, 'active important count is fixed at 593');
ok(cascade.conflictingPropertyCount === 0 && cascade.sameValueDuplicateCount === 0 && cascade.shadowedDeclarationCount === 0, 'zero-conflict, zero-duplicate, zero-shadow cascade remains intact');

const dock = read('assets/css/pc-dock-reveal-hotfix.css');
const desktop = read('assets/css/desktop-prime-layout.css');
const workspace = read('assets/css/workspace-layout-controls.css');
ok(/bottom-dock-hyperflow\s*\{[\s\S]*?left:\s*0;[\s\S]*?right:\s*0;/.test(dock), 'desktop dock inset geometry now uses normal cascade priority');
ok(/bottom-dock-hyperflow\s*\{[\s\S]*?display:\s*block\s*!important/.test(dock), 'desktop dock display keeps the priority proven necessary');
ok(/\.app-shell\s*\{[\s\S]*?width:\s*min\(calc\(100% - 24px\), var\(--prime-workspace-max\)\);/.test(desktop), 'desktop shell width now uses normal cascade priority');
ok(/data-workspace-view="preview"[\s\S]*?grid-template-columns:[^;]+!important/.test(workspace), 'preview focus grid keeps the priority proven necessary');

const checks = [
  ['desktop',['dock','height']], ['smallLaptop',['dock','height']], ['tablet',['dock','height']], ['mobile',['dock','height']],
  ['desktop',['workspaceTests','preview','width']], ['desktop',['workspaceTests','waveform','width']],
  ['smallLaptop',['initialDensity','heroHeight']], ['tablet',['initialDensity','heroHeight']]
];
ok(Math.abs(current.desktop.uiStructure.utilityHub.project.top - current.desktop.uiStructure.utilityHub.copy.top) <= 1, 'desktop utility cards remain vertically aligned after the new storage health panel');
ok(current.desktop.uiStructure.importRect.top >= current.desktop.uiStructure.utilityHub.rect.bottom, 'desktop import workspace remains below the utility hub');
for (const [mode, parts] of checks) ok(metric(current, mode, parts) === metric(baseline, mode, parts), `${mode} ${parts.join('.')} matches v1.5.19`);
for (const mode of ['desktop','smallLaptop','tablet','mobile']) {
  ok(current[mode].audit.errors.length === 0 && current[mode].audit.consoleErrors.length === 0, `${mode} runtime remains error free`);
  ok(current[mode].bodyScrollWidth <= current[mode].viewport.width, `${mode} keeps horizontal overflow at zero`);
}
console.log('PASS v1.5.25 structural and responsive priority reduction with unchanged layout metrics');
