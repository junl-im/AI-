#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const dockJs = fs.readFileSync(path.join(root, 'src/ui/bottom-dock.js'), 'utf8');
const appJs = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/css/layout-dock.css'), 'utf8');

if (/setInterval\s*\(/.test(dockJs)) {
    console.error('FAIL bottom dock should not use polling setInterval');
    process.exit(1);
}
if (!dockJs.includes('scheduleSync') || !dockJs.includes('MutationObserver')) {
    console.error('FAIL bottom dock should use scheduled event/observer sync');
    process.exit(1);
}
if (!appJs.includes('previewStillRaf') || !appJs.includes('renderPreviewStillNow')) {
    console.error('FAIL app preview still rendering is not RAF-batched');
    process.exit(1);
}
if (!css.includes('content-visibility: auto') || !css.includes('contain: layout paint') || !css.includes('contain: content')) {
    console.error('FAIL performance CSS containment rules are missing');
    process.exit(1);
}
console.log('PASS lean dock performance guardrails present');
