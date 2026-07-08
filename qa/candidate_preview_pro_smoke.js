#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
const css = read('assets/css/candidate-preview-pro.css');
const js = read('src/ui/candidate-preview-pro.js');
const pkg = JSON.parse(read('package.json'));

function assert(condition, message) {
    if (!condition) {
        console.error(`FAIL candidate_preview_pro_smoke: ${message}`);
        process.exit(1);
    }
}

assert(html.includes('assets/css/candidate-preview-pro.css'), 'candidate preview pro CSS must be linked in index.html');
assert(html.includes('src/ui/candidate-preview-pro.js'), 'candidate preview pro JS must be loaded in index.html');
assert(css.includes('.candidate-pro-board') && css.includes('.preview-pro-hud'), 'candidate and preview pro surfaces must be styled');
assert(js.includes('AIShortsCandidatePreviewPro'), 'candidate preview pro namespace must be exposed');
assert(js.includes('candidateProBoard') && js.includes('previewProHud'), 'candidate board and preview HUD must be created');
assert(js.includes('점수순') && js.includes('짧은 길이') && js.includes('빠른 시작'), 'candidate sort controls must exist');
assert(js.includes('clickCandidate') && js.includes('.recommendation-card'), 'comparison cards must connect to existing recommendation cards');
assert(pkg.qaChecks.includes('node --check src/ui/candidate-preview-pro.js'), 'package qaChecks must syntax-check candidate preview pro JS');
assert(pkg.qaChecks.includes('node qa/candidate_preview_pro_smoke.js'), 'package qaChecks must include this smoke test');
console.log('PASS candidate_preview_pro_smoke');
