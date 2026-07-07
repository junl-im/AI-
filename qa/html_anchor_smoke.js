#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const requiredIds = [
    'fileInput', 'analyzeBtn', 'recommendationList', 'previewCanvas', 'sourceVideo', 'sourceAudio',
    'previewBtn', 'exportBtn', 'waveformCanvas', 'timelineView', 'titleInput', 'hashtagInput', 'diagnosticsBtn'
];
const missing = requiredIds.filter(id => !html.includes(`id="${id}"`));
if (missing.length) {
    console.error('FAIL missing DOM anchors: ' + missing.join(', '));
    process.exit(1);
}
console.log('PASS DOM anchors present');
