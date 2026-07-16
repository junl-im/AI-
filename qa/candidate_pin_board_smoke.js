#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function ok(value, message) { if (!value) { console.error(`FAIL ${message}`); process.exit(1); } }
const html = read('index.html');
const loader = read('src/boot/staged-ui-loader.js');
const sw = read('sw.js');
const pkg = JSON.parse(read('package.json'));
const css = read('assets/css/candidate-pin-board.css');
const js = read('src/ui/candidate-pin-board.js');
ok(pkg.version === '1.3.0', 'package version is 1.2.9');
ok(html.includes('assets/css/candidate-pin-board.css?v=1.3.0-stage-beacon'), 'candidate pin stylesheet linked');
ok(loader.includes("versioned('src/ui/candidate-pin-board.js', 'editing')"), 'candidate pin script staged');
ok(sw.includes('./assets/css/candidate-pin-board.css?v=1.3.0-stage-beacon'), 'candidate pin css cached');
ok(sw.includes('async function cacheFirst'), 'candidate pin script is cached on first use');
ok(css.includes('.candidate-pin-board') && css.includes('.candidate-save-compare'), 'pin board and save compare styles exist');
ok(js.includes('AIShortsCandidatePinBoard'), 'pin board API exported');
ok(js.includes('STORAGE_KEY') && js.includes('ai-shorts-pinned-candidates-v1'), 'pinned candidates persist locally');
ok(js.includes('estimateSize') && js.includes('estimateTime'), 'save estimate comparison connected');
ok(pkg.qaChecks.includes('node qa/candidate_pin_board_smoke.js'), 'candidate pin QA registered');
console.log('PASS candidate pin board smoke');
