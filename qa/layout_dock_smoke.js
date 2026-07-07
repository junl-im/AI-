#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const requiredIds = ['bottomDock', 'bottomDockTitle', 'bottomDockMeta', 'bottomFileBtn', 'bottomAnalyzeBtn'];
const missing = requiredIds.filter(id => !html.includes(`id="${id}"`));
if (missing.length) {
    console.error('FAIL missing lean bottom dock anchors: ' + missing.join(', '));
    process.exit(1);
}
['bottomRecommendBtn', 'bottomEditBtn', 'bottomPreviewBtn', 'bottomThumbnailBtn', 'bottomExportBtn'].forEach(id => {
    if (html.includes(`id="${id}"`)) {
        console.error('FAIL old multi-action dock button still present: ' + id);
        process.exit(1);
    }
});
if (!html.includes('📂') || !html.includes('⚡') || !html.includes('파일 열기') || !html.includes('분석하기')) {
    console.error('FAIL lean dock is missing emoji labels or clear action text');
    process.exit(1);
}
if (!html.includes('assets/css/layout-dock.css') || !html.includes('src/ui/bottom-dock.js')) {
    console.error('FAIL layout dock assets are not linked from index.html');
    process.exit(1);
}
const css = fs.readFileSync(path.join(root, 'assets/css/layout-dock.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'src/ui/bottom-dock.js'), 'utf8');
if (!css.includes('.bottom-dock-actions-lean') || !css.includes('grid-template-columns: 1fr 1fr') || !css.includes('.source-media.is-visible')) {
    console.error('FAIL layout-dock.css missing lean two-column dock or media stability rules');
    process.exit(1);
}
if (!js.includes('syncBottomDockNow') || !js.includes('requestAnimationFrame') || js.includes('bottomThumbnailBtn')) {
    console.error('FAIL bottom-dock.js should use lean RAF sync and no legacy multi-button mapping');
    process.exit(1);
}
console.log('PASS lean two-button bottom dock anchors present');
