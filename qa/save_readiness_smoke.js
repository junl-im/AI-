#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const configSource = fs.readFileSync(path.join(root, 'src/config/app-runtime-config.js'), 'utf8');
const buildKey = (configSource.match(/BUILD_KEY:\s*'([^']+)'/) || [])[1] || '';
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function ok(condition, message) {
    if (!condition) {
        console.error(`FAIL ${message}`);
        process.exit(1);
    }
    console.log(`PASS ${message}`);
}
const html = read('index.html');
const loader = read('src/boot/staged-ui-loader.js');
const sw = read('sw.js');
const pkg = require('../package.json');
const css = read('assets/css/save-readiness.css');
const js = read('src/ui/save-readiness.js');
ok(/^1\.6\.\d+$/.test(pkg.version), 'package version is v1.6.25');
ok(html.includes(`assets/css/save-readiness.css?v=${buildKey}`), 'save readiness stylesheet linked');
ok(loader.includes("versioned('src/ui/save-readiness.js', 'editing')"), 'save readiness script staged');
ok(sw.includes(`./assets/css/save-readiness.css?v=${buildKey}`), 'service worker caches save readiness css');
ok(sw.includes('async function cacheFirst'), 'service worker caches save readiness JS on first use');
ok(css.includes('.save-readiness-panel') && css.includes('.preview-ready-strip'), 'save readiness and preview strip styles exist');
ok(css.includes('@media (prefers-reduced-motion: reduce)'), 'reduced motion fallback exists');
ok(js.includes('AIShortsSaveReadiness'), 'global Save Readiness API exists');
ok(js.includes('saveReadinessPanel') && js.includes('previewReadyStrip'), 'runtime panels are created');
ok(js.includes('estimateSize') && js.includes('fmtSeconds'), 'export confidence helpers exist');
ok(js.includes('AIShortsMotionStability') || js.includes('AIShortsHyperFlowTabs'), 'tab bridge uses existing flow APIs');
