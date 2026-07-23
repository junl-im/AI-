#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const pkg = require(path.join(root, 'package.json'));
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const report = JSON.parse(read(`qa/runtime-css-ownership-v${pkg.version}.json`));
const current = JSON.parse(read(`qa/runtime-browser-audit-v${pkg.version}.json`));
const prior = JSON.parse(read('qa/runtime-browser-audit-v1.5.17.json'));
function ok(value, message) { if (!value) throw new Error(message); console.log(`PASS ${message}`); }
function metric(report, mode, pathParts) { let value=report[mode]; for (const key of pathParts) value=value[key]; return value; }
ok(pkg.version === '1.5.26', 'important cascade reduction release version is v1.5.26');
ok(report.importantCount <= 593, 'important declaration ceiling remains at or below 593');
ok(report.conflictingPropertyCount === 0 && report.sameValueDuplicateCount === 0 && report.shadowedDeclarationCount === 0, 'cascade remains conflict, duplicate, and shadow free');
const stage = read('assets/css/studio-experience.css');
const mobile = read('assets/css/mobile-menu-guide.css');
const header = read('assets/css/header-meta-rail.css');
const icons = read('assets/css/icon-system.css');
ok(/\.hyperflow-stage\s*\{[\s\S]*?display:\s*flex;/.test(stage), 'stage display no longer requires important priority');
ok(stage.includes('min-height: 52px !important') && stage.includes('display: none !important'), 'workspace hero collapse keeps the priorities proven necessary');
ok(mobile.includes('gap: 6px;') && mobile.includes('.toast { bottom: 144px; }'), 'mobile dock gap and default toast offset use normal cascade priority');
ok(mobile.includes('padding-bottom: calc(var(--mobile-dock-compact-height) + 22px) !important'), 'mobile shell clearance retains its required priority');
ok(header.includes('grid-template-columns: minmax(0, 1fr) auto;') && header.includes('justify-self: end;'), 'header metadata geometry uses normal cascade priority');
ok(icons.includes('width: 42px;') && icons.includes('background-color: currentColor;'), 'upload and dock icon base sizing uses normal cascade priority');
const checks = [
  ['desktop',['dock','height']], ['smallLaptop',['dock','height']], ['tablet',['dock','height']], ['mobile',['dock','height']],
  ['desktop',['workspaceTests','preview','width']], ['desktop',['workspaceTests','waveform','width']],
];
ok(Math.abs(current.desktop.uiStructure.utilityHub.project.top - current.desktop.uiStructure.utilityHub.copy.top) <= 1, 'desktop utility cards remain vertically aligned after the new storage health panel');
ok(current.desktop.uiStructure.importRect.top >= current.desktop.uiStructure.utilityHub.rect.bottom, 'desktop import workspace remains below the utility hub');
for (const [mode, parts] of checks) ok(metric(current,mode,parts) === metric(prior,mode,parts), `${mode} ${parts.join('.')} matches v1.5.17`);
for (const mode of ['desktop','smallLaptop','tablet','mobile']) {
  ok(current[mode].audit.errors.length === 0 && current[mode].audit.consoleErrors.length === 0, `${mode} runtime remains error free`);
  ok(current[mode].bodyScrollWidth <= current[mode].viewport.width, `${mode} keeps horizontal overflow at zero`);
}
console.log('PASS v1.5.26 safe important reduction with unchanged responsive layout metrics');
