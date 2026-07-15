#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function ok(condition, message) {
    if (!condition) {
        console.error(`FAIL ${message}`);
        process.exit(1);
    }
    console.log(`PASS ${message}`);
}
const html = read('index.html');
const sw = read('sw.js');
const pkg = require('../package.json');
const css = read('assets/css/save-readiness.css');
const js = read('src/ui/save-readiness.js');
ok(pkg.version === '1.1.8', 'package version is v1.1.8');
ok(html.includes('assets/css/save-readiness.css?v=1.1.8-save-readiness'), 'save readiness stylesheet linked');
ok(html.includes('src/ui/save-readiness.js?v=1.1.8-save-readiness'), 'save readiness script linked');
ok(sw.includes('./assets/css/save-readiness.css?v=1.1.8-save-readiness'), 'service worker caches save readiness css');
ok(sw.includes('./src/ui/save-readiness.js?v=1.1.8-save-readiness'), 'service worker caches save readiness js');
ok(css.includes('.save-readiness-panel') && css.includes('.preview-ready-strip'), 'save readiness and preview strip styles exist');
ok(css.includes('@media (prefers-reduced-motion: reduce)'), 'reduced motion fallback exists');
ok(js.includes('AIShortsSaveReadiness'), 'global Save Readiness API exists');
ok(js.includes('saveReadinessPanel') && js.includes('previewReadyStrip'), 'runtime panels are created');
ok(js.includes('estimateSize') && js.includes('fmtSeconds'), 'export confidence helpers exist');
ok(js.includes('AIShortsMotionStability') || js.includes('AIShortsHyperFlowTabs'), 'tab bridge uses existing flow APIs');
