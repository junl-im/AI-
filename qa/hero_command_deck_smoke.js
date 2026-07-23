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
const css = read('assets/css/hero-command-deck.css');
const metaCss = read('assets/css/header-meta-rail.css');
const sw = read('sw.js');

assert(pkg.version === '1.5.27', 'shorts pulse hero release version is v1.5.27');
assert(html.includes('assets/css/hero-command-deck.css?v=1.5.27-selective-cache-integrity-retry-portable-backup'), 'shorts pulse hero stylesheet is linked');
assert(html.indexOf('hero-command-deck.css') > html.indexOf('desktop-prime-layout.css'), 'hero stylesheet remains the final header override');
assert(sw.includes('./assets/css/hero-command-deck.css?v=1.5.27-selective-cache-integrity-retry-portable-backup'), 'shorts pulse hero stylesheet is cached');
assert(html.includes('class="brand-release"') && html.includes('SHORTS-FIRST STUDIO'), 'version metadata uses the shorts-first release rail');
assert(html.includes('class="signature-label">DESIGNED BY</span><strong>곰같은여우</strong>'), 'designer signature stays typographic and aligned');
assert(!html.includes('LOCAL · PRIVATE · 9:16') && !html.includes('brand-compat-pill'), 'redundant center readiness slogan is removed');
assert(html.includes('release-device-compat') && html.includes('모바일 · PC 호환'), 'mobile and PC compatibility is displayed next to the version');
assert(html.includes('assets/css/header-meta-rail.css?v=1.5.27-selective-cache-integrity-retry-portable-backup') && sw.includes('./assets/css/header-meta-rail.css?v=1.5.27-selective-cache-integrity-retry-portable-backup'), 'two-sided metadata rail override is linked and cached');
assert(metaCss.includes('grid-template-columns: minmax(0, 1fr) auto') && metaCss.includes('.signature-label') && metaCss.includes('display: inline !important'), 'mobile keeps BUILD and DESIGNED BY visible');
assert(html.includes('class="shorts-timeline"') && html.includes('00:00') && html.includes('00:15'), 'hero includes a concise short-form cut timeline');
assert(html.includes('class="shorts-frame-stack"') && html.includes('class="shorts-frame-main"'), '9:16 cut frame composition is present');
assert(html.includes('HOOK') && html.includes('BEAT') && html.includes('CAPTION'), 'short-form editing cues are visible');
assert(html.includes('id="heroWorkspaceStartBtn"') && html.includes('aria-controls="fileDrop"') && !html.includes('class="hero-start-button" for="fileInput"'), 'desktop start action navigates to the single import card');
assert(html.includes('브라우저 안에서만 분석됩니다.') || html.includes('브라우저 안에서 빠르게 이어집니다.'), 'local-processing trust copy is visible');
assert(css.includes('aspect-ratio: 9 / 16') && css.includes('.shorts-frame-main'), 'visual identity is based on the vertical shorts ratio');
assert(css.includes('.cinematic-title::after') && css.includes('display: none !important'), 'old decorative title underline stays removed');
assert(css.includes('@media (max-width: 920px)') && css.includes('.hero-command-deck'), 'compact screens remove the duplicated desktop action visual');
assert(css.includes('@media (prefers-reduced-motion: reduce)') && css.includes('body.performance-lite'), 'motion and low-performance fallbacks are present');
assert(css.includes('.hero-start-button:focus-visible'), 'hero action keeps keyboard focus visibility');
console.log('PASS v1.5.27 shorts pulse hero guardrails present');
