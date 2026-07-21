#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
function assert(condition, message) {
    if (!condition) { console.error(`FAIL ${message}`); process.exit(1); }
    console.log(`PASS ${message}`);
}

const pkg = JSON.parse(read('package.json'));
const html = read('index.html');
const loader = read('src/boot/staged-ui-loader.js');
const sw = read('sw.js');
const directScripts = (html.match(/<script\s+defer\s+src=/g) || []).length;
const stagedOnly = [
    'src/ui/ux-controls.js',
    'src/ui/range-drag-controls.js',
    'src/ui/flow-doctor.js',
    'src/ui/handoff-coach.js',
    'src/ui/save-readiness.js',
    'src/ui/render-quality-planner.js',
    'src/ui/candidate-preview-pro.js',
    'src/ui/candidate-pin-board.js',
    'src/ui/session-continuity.js',
    'src/ui/export-finish-center.js',
    'src/ui/studio-experience-controller.js'
];

assert(pkg.version === '1.5.4', 'staged hydration release version is v1.5.4');
assert(html.includes('src/boot/staged-ui-loader.js?v=1.5.4-css-ownership'), 'staged UI loader is on the critical path');
assert(directScripts <= 48, `direct startup scripts are reduced to ${directScripts}`);
stagedOnly.forEach(file => assert(!html.includes(`<script defer src="${file}`), `${file} is removed from blocking startup execution`));
assert(loader.includes('shell: [') && loader.includes('editing: [') && loader.includes('export: ['), 'loader separates shell, editing and export phases');
assert(loader.includes("dependencies = Object.freeze({ editing: ['shell'], export: ['shell', 'editing'] })"), 'phase dependency order is explicit');
assert(loader.includes("requestIdleCallback") && loader.includes("pointerover") && loader.includes("ai-shorts-navigation-request"), 'idle warmup and intent-based preloading are installed');
assert(loader.includes("data") || loader.includes('dataset.hydrationMode'), 'hydration state is exposed to runtime diagnostics');
assert(sw.includes('staged-ui-loader.js?v=1.5.4-css-ownership'), 'service worker caches the staged loader');
assert(!sw.includes('./src/ui/candidate-preview-pro.js') && !sw.includes('./src/ui/export-finish-center.js'), 'staged feature scripts are not fetched during service-worker install');
assert(sw.includes('async function cacheFirst'), 'staged feature scripts are cached when first requested');
assert(html.indexOf('startup-performance.js') < html.indexOf('src/app.js'), 'adaptive performance profile starts before the main app');
console.log('PASS v1.5.4 staged UI hydration guardrails present');
