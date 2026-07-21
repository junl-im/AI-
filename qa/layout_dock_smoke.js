#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const requiredIds = ['bottomDock', 'bottomDockTitle', 'bottomDockMeta', 'bottomFileBtn', 'analyzeBtn'];
const missing = requiredIds.filter(id => !html.includes(`id="${id}"`));
if (missing.length) {
    console.error('FAIL missing HyperFlow dock anchors: ' + missing.join(', '));
    process.exit(1);
}
const requiredTabs = ['file', 'recommend', 'candidates', 'preview', 'waveform', 'cut', 'edit', 'export'];
const missingTabs = requiredTabs.filter(tab => !html.includes(`data-flow-tab="${tab}"`));
if (missingTabs.length) {
    console.error('FAIL missing HyperFlow dock tabs: ' + missingTabs.join(', '));
    process.exit(1);
}
if (html.includes('bottomAnalyzeBtn') || html.includes('분석하기</span></button>')) {
    console.error('FAIL legacy analysis dock button should be removed');
    process.exit(1);
}
['upload','spark','candidates','preview','waveform','cut','edit','export'].forEach(icon => {
    if (!html.includes(`data-icon="${icon}"`)) {
        console.error('FAIL HyperFlow dock missing vector icon: ' + icon);
        process.exit(1);
    }
});
if (/[＋✦◆▶∿✂◫↓]/.test((html.match(/<nav[^>]*class="bottom-dock-tabs"[^>]*>[\s\S]*?<\/nav>/) || [''])[0])) {
    console.error('FAIL legacy glyph remains in menu bar');
    process.exit(1);
}
if (!html.includes('assets/css/hyperflow-tabs.css') || !html.includes('src/ui/hyperflow-tabs.js')) {
    console.error('FAIL HyperFlow assets are not linked from index.html');
    process.exit(1);
}
const css = fs.readFileSync(path.join(root, 'assets/css/hyperflow-tabs.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'src/ui/hyperflow-tabs.js'), 'utf8');
if (!css.includes('.bottom-dock-tabs') || !css.includes('grid-template-columns: repeat(4') || !css.includes('[data-flow-panel]')) {
    console.error('FAIL HyperFlow CSS missing two-row dock or panel visibility rules');
    process.exit(1);
}
if (!js.includes('setActiveFlowTab') || !js.includes('AIShortsHyperFlowTabs')) {
    console.error('FAIL HyperFlow JS missing tab controller');
    process.exit(1);
}
if (html.includes('id="flowRecommendBtn"') || js.includes('flowRecommendBtn')) {
    console.error('FAIL top duplicate recommend button bridge should not exist');
    process.exit(1);
}
console.log('PASS HyperConnect 8-tab bottom dock anchors present with updated v1.4.0 vector icons');
