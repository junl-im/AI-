#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const requiredIds = [
    'waveformDragShell', 'rangeDragOverlay', 'snapRangeBtn',
    'thumbnailTemplateSelect', 'batchLimitSelect', 'exportAllBtn'
];
const missing = requiredIds.filter(id => !html.includes(`id="${id}"`));
if (missing.length) {
    console.error('FAIL missing advanced editor anchors: ' + missing.join(', '));
    process.exit(1);
}
const css = fs.readFileSync(path.join(root, 'assets/css/advanced-editor.css'), 'utf8');
const drag = fs.readFileSync(path.join(root, 'src/ui/range-drag-controls.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
const renderer = fs.readFileSync(path.join(root, 'src/render/vertical-renderer.js'), 'utf8');
if (!css.includes('.drag-selection') || !css.includes('.batch-export-panel')) {
    console.error('FAIL advanced editor CSS missing drag/batch styles');
    process.exit(1);
}
if (!drag.includes('onPointerMove') || !drag.includes('snapToCurrentTime')) {
    console.error('FAIL range drag controls missing pointer/snap logic');
    process.exit(1);
}
if (!app.includes('exportAllCandidates') || !app.includes('thumbnailTemplateSelect')) {
    console.error('FAIL app missing batch export/template hooks');
    process.exit(1);
}
if (!renderer.includes('drawTemplateChrome') || !renderer.includes('thumbnailTemplate')) {
    console.error('FAIL renderer missing thumbnail template overlay support');
    process.exit(1);
}
console.log('PASS advanced editor anchors present');
