#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function assert(condition, message) {
    if (!condition) {
        console.error(`FAIL ${message}`);
        process.exit(1);
    }
    console.log(`PASS ${message}`);
}

const pkg = JSON.parse(read('package.json'));
const html = read('index.html');
const css = read('assets/css/desktop-prime-layout.css');
const sw = read('sw.js');
const gate = read('src/ui/flow-quality-gate.js');
const director = read('src/ui/flow-director-final.js');
const startPanel = (html.match(/<section class="start-command-panel[\s\S]*?<\/section>/) || [''])[0];

assert(pkg.version === '1.3.7', 'desktop prime release version is v1.3.7');
assert(html.includes('assets/css/desktop-prime-layout.css?v=1.3.7-adaptive-mobile'), 'desktop prime stylesheet is linked last');
assert(sw.includes('desktop-prime-layout.css?v=1.3.7-adaptive-mobile'), 'desktop prime stylesheet is cached');
assert(html.includes('data-desktop-layout="prime"'), 'prime desktop layout marker is present');
assert(css.includes('"load preview candidates"') && css.includes('"recommend preview waveform"'), 'desktop first viewport exposes input, preview, candidates, and waveform lanes');
assert(css.includes('body[data-desktop-layout="prime"][data-ui="hyperflow-tabs"] [data-flow-panel]:not(.is-flow-active)') && css.includes('display: block !important'), 'desktop overrides legacy single-panel hiding rules');
assert(gate.includes('isDesktopPrime()') && gate.includes('panel.hidden = prime ? false : !isActive'), 'quality gate preserves all desktop prime panels');
assert(director.includes('isDesktopPrime()') && director.includes("const ariaHidden = prime || match ? 'false' : 'true'") && director.includes("panel.getAttribute('aria-hidden') !== ariaHidden"), 'flow director keeps prime panels accessible without repeated writes');
assert(css.includes('grid-template-columns: minmax(260px, 0.76fr) minmax(350px, 1.05fr) minmax(300px, 0.88fr)'), 'desktop uses a three-lane split workspace');
assert(startPanel.includes('flow-overview-copy') && startPanel.includes('메뉴바에서 파일을 열고'), 'mobile landing is a flow overview');
assert(!startPanel.includes('for="fileInput"') && !startPanel.includes('projectFileInput'), 'mobile landing has no duplicated import buttons');
assert(css.includes('body:not(.has-media)[data-active-flow-tab="file"] .studio-grid'), 'mobile empty file tab hides the redundant import workspace');
assert(css.includes('grid-template-columns: auto minmax(0, 1fr) auto'), 'version and designer metadata use opposite header edges');
assert(css.includes('max-width: 720px !important'), 'hero description width is restrained');
console.log('PASS v1.3.7 desktop prime and mobile flow-only guardrails present');
