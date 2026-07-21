#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function ok(condition, message) {
    if (!condition) {
        console.error('FAIL ' + message);
        process.exit(1);
    }
    console.log('PASS ' + message);
}
const html = read('index.html');
const loader = read('src/boot/staged-ui-loader.js');
const sw = read('sw.js');
const css = read('assets/css/handoff-coach.css');
const js = read('src/ui/handoff-coach.js');
const pkg = JSON.parse(read('package.json'));

ok(pkg.version === '1.5.4', 'package version is v1.5.4');
ok(html.includes('assets/css/handoff-coach.css?v=1.5.4-css-ownership'), 'handoff coach stylesheet is linked');
ok(loader.includes("versioned('src/ui/handoff-coach.js', 'editing')"), 'handoff coach script is staged');
ok(sw.includes('./assets/css/handoff-coach.css?v=1.5.4-css-ownership'), 'handoff coach stylesheet is cached');
ok(sw.includes('async function cacheFirst'), 'handoff coach script is cached on first use');
ok(css.includes('.candidate-handoff-card'), 'candidate handoff card styles exist');
ok(css.includes('.preview-handoff-ribbon'), 'preview handoff ribbon styles exist');
ok(css.includes('@media (max-width: 720px)'), 'mobile handoff layout exists');
ok(js.includes('candidateHandoffCard'), 'candidate handoff card is created by runtime');
ok(js.includes('previewHandoffRibbon'), 'preview handoff ribbon is created by runtime');
ok(js.includes('AIShortsHandoffCoach'), 'handoff coach runtime API is exposed');
ok(js.includes('setActiveFlowTab(tab, { reveal: true, force: true })'), 'handoff buttons use stable tab reveal');
