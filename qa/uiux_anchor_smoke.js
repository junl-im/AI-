#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const version = require('../package.json').version;
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const requiredIds = [
    'quickDurationChips', 'stepImport', 'stepAnalyze', 'stepEdit', 'stepExport',
    'dockPreviewBtn', 'dockExportBtn', 'dockTitle', 'dockMeta', 'heroWorkspaceStartBtn',
    'bottomFileBtn', 'fileDrop', 'fileInput'
];
const retiredIds = ['mobileActionBar', 'mobileAnalyzeBtn', 'mobilePreviewBtn', 'mobileExportBtn'];
const missing = requiredIds.filter(id => !html.includes(`id="${id}"`));
const lingering = retiredIds.filter(id => html.includes(`id="${id}"`));
if (missing.length || lingering.length) {
    console.error('FAIL UI/UX anchors: missing=' + missing.join(', ') + ' retired=' + lingering.join(', '));
    process.exit(1);
}
const uxCss = fs.readFileSync(path.join(root, 'assets/css/ux.css'), 'utf8');
const uxJs = fs.readFileSync(path.join(root, 'src/ui/ux-controls.js'), 'utf8');
if (!uxCss.includes('.workflow-rail') || uxCss.includes('.mobile-action-bar')) {
    console.error('FAIL ux.css workflow owner or retired mobile action bar state');
    process.exit(1);
}
if (!uxJs.includes('uxInstallQuickDurations') || !uxJs.includes('uxInstallMirrorButtons')) {
    console.error('FAIL ux-controls.js missing active convenience installers');
    process.exit(1);
}
console.log(`PASS v${version} UI/UX anchors and retired mobile action controls`);
