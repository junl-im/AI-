#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const render = fs.readFileSync(path.join(root, 'src/render/vertical-renderer.js'), 'utf8');
const required = ['recordVerticalSegment', 'drawAudioVisual', 'drawCoverImage', 'captureStream', 'MediaRecorder'];
const missing = required.filter(token => !render.includes(token));
if (missing.length) {
    console.error('FAIL renderer missing tokens: ' + missing.join(', '));
    process.exit(1);
}
console.log('PASS render capability smoke');
