#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const requiredIds = [
    'heroAnalyzeBtn', 'quickDurationChips', 'stepImport', 'stepAnalyze', 'stepEdit', 'stepExport',
    'dockPreviewBtn', 'dockExportBtn', 'dockTitle', 'dockMeta', 'mobileActionBar',
    'mobileAnalyzeBtn', 'mobilePreviewBtn', 'mobileExportBtn'
];
const missing = requiredIds.filter(id => !html.includes(`id="${id}"`));
if (missing.length) {
    console.error('FAIL missing UI/UX anchors: ' + missing.join(', '));
    process.exit(1);
}
const uxCss = fs.readFileSync(path.join(root, 'assets/css/ux.css'), 'utf8');
const uxJs = fs.readFileSync(path.join(root, 'src/ui/ux-controls.js'), 'utf8');
if (!uxCss.includes('.workflow-rail') || !uxCss.includes('.mobile-action-bar')) {
    console.error('FAIL ux.css missing workflow/mobile styles');
    process.exit(1);
}
if (!uxJs.includes('uxInstallQuickDurations') || !uxJs.includes('uxInstallMirrorButtons')) {
    console.error('FAIL ux-controls.js missing quick action installers');
    process.exit(1);
}
console.log('PASS UI/UX anchors present');
