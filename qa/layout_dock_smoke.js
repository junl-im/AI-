#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const requiredIds = [
    'bottomDock', 'bottomDockTitle', 'bottomDockMeta', 'bottomAnalyzeBtn', 'bottomRecommendBtn',
    'bottomEditBtn', 'bottomPreviewBtn', 'bottomThumbnailBtn', 'bottomExportBtn'
];
const missing = requiredIds.filter(id => !html.includes(`id="${id}"`));
if (missing.length) {
    console.error('FAIL missing bottom dock anchors: ' + missing.join(', '));
    process.exit(1);
}
if (!html.includes('assets/css/layout-dock.css') || !html.includes('src/ui/bottom-dock.js')) {
    console.error('FAIL layout dock assets are not linked from index.html');
    process.exit(1);
}
const css = fs.readFileSync(path.join(root, 'assets/css/layout-dock.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'src/ui/bottom-dock.js'), 'utf8');
if (!css.includes('.bottom-dock') || !css.includes('.source-media.is-visible') || !css.includes('body.has-media')) {
    console.error('FAIL layout-dock.css missing fixed dock/media stability rules');
    process.exit(1);
}
if (!js.includes('syncBottomDock') || !js.includes('document.body.classList.toggle') || !js.includes('bottomThumbnailBtn')) {
    console.error('FAIL bottom-dock.js missing sync/body-state/action logic');
    process.exit(1);
}
console.log('PASS layout stability and bottom dock anchors present');
