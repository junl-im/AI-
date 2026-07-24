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
const workspaceCss = read('assets/css/workspace-layout-controls.css');
const headerCss = read('assets/css/header-meta-rail.css');
const heroCss = read('assets/css/hero-command-deck.css');
const sw = read('sw.js');
const gate = read('src/ui/flow-quality-gate.js');
const director = read('src/ui/flow-director-final.js');
const startPanel = (html.match(/<section class="start-command-panel[\s\S]*?<\/section>/) || [''])[0];
const buildKey = (read('src/config/app-runtime-config.js').match(/BUILD_KEY:\s*'([^']+)'/) || [])[1];

assert(pkg.version === '1.6.4', 'desktop prime release version is v1.6.4');
assert(html.includes(`assets/css/desktop-prime-layout.css?v=${buildKey}`), 'desktop prime stylesheet is linked last');
assert(sw.includes(`desktop-prime-layout.css?v=${buildKey}`), 'desktop prime stylesheet is cached');
assert(html.includes('data-desktop-layout="prime"'), 'prime desktop layout marker is present');
assert(workspaceCss.includes('"toolbar toolbar toolbar toolbar toolbar"') && workspaceCss.includes('"utility utility utility utility utility"'), 'desktop utility hub sits directly below the layout toolbar');
assert(workspaceCss.includes('grid-template-areas: "project copy"'), 'project and copy cards share one aligned utility row');
assert(workspaceCss.includes('"load divider-left preview divider-right candidates"') && workspaceCss.includes('"recommend divider-left preview divider-right waveform"'), 'desktop workspace keeps input, preview, candidates, and waveform lanes');
assert(css.includes('body[data-desktop-layout="prime"][data-ui="hyperflow-tabs"] [data-flow-panel]:not(.is-flow-active)') && css.includes('display: block !important'), 'desktop overrides legacy single-panel hiding rules');
assert(gate.includes('isDesktopPrime()') && gate.includes('panel.hidden = prime ? false : !isActive'), 'quality gate preserves all desktop prime panels');
assert(director.includes('isDesktopPrime()') && director.includes("const ariaHidden = prime || match ? 'false' : 'true'") && director.includes("panel.getAttribute('aria-hidden') !== ariaHidden"), 'flow director keeps prime panels accessible without repeated writes');
assert(workspaceCss.includes('minmax(260px, var(--workspace-left-track))') && workspaceCss.includes('minmax(350px, var(--workspace-center-track))') && workspaceCss.includes('minmax(300px, var(--workspace-right-track))'), 'workspace layout controller owns the three-lane split workspace');
assert(startPanel.includes('flow-overview-copy') && startPanel.includes('불러오기 메뉴에서 원본 하나를 선택'), 'mobile landing explains the single import flow');
assert(!startPanel.includes('for="fileInput"') && !startPanel.includes('projectFileInput'), 'mobile landing has no duplicated import buttons');
assert(!css.includes('body:not(.has-media)[data-active-flow-tab="file"] .studio-grid'), 'mobile empty state keeps the primary import card visible');
assert(/grid-template-columns:\s*minmax\(0, 1fr\) auto(?:\s*!important)?;/.test(headerCss), 'version and designer metadata use opposite header edges');
assert(heroCss.includes('.hero-launch-layout') && heroCss.includes('.hero-start-button'), 'hero owner includes the redesigned launch composition');
console.log('PASS v1.6.4 desktop utility hub, single import flow, and prime layout guardrails');
