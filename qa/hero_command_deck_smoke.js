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
const sw = read('sw.js');

assert(pkg.version === '1.2.2', 'editorial masthead release version is v1.2.2');
assert(html.includes('assets/css/hero-command-deck.css?v=1.2.2-editorial-masthead'), 'editorial masthead stylesheet is linked');
assert(html.indexOf('hero-command-deck.css') > html.indexOf('desktop-prime-layout.css'), 'masthead stylesheet remains the final header override');
assert(sw.includes('./assets/css/hero-command-deck.css?v=1.2.2-editorial-masthead'), 'editorial masthead stylesheet is cached');
assert(html.includes('class="brand-release"') && html.includes('EDITORIAL STUDIO'), 'version metadata uses the editorial release rail');
assert(html.includes('class="signature-label">DESIGNED BY</span><strong>곰같은여우</strong>'), 'designer signature is typographic rather than a decorative badge');
assert(html.includes('LOCAL · PRIVATE · READY'), 'local private processing state is clear');
assert(html.includes('class="hero-command-deck"') && html.includes('WORKSPACE / 01'), 'borderless workspace start rail is present');
assert(html.includes('class="command-flow"'), 'start rail includes the four-step flow');
assert(html.includes('class="hero-start-button" for="fileInput"'), 'desktop start action still uses the existing file input');
assert(html.includes('이 브라우저 안에서만 처리됩니다.'), 'local-processing trust copy is visible');
assert(css.includes('border-left: 1px solid') && css.includes('background: transparent !important'), 'workspace rail avoids a nested card frame');
assert(css.includes('.cinematic-title::after') && css.includes('display: none !important'), 'old decorative title underline is removed');
assert(css.includes('@media (max-width: 860px)') && css.includes('.hero-command-deck'), 'compact screens remove the duplicated start rail');
assert(css.includes('@media (prefers-reduced-motion: reduce)') && css.includes('body.performance-lite'), 'motion and low-performance fallbacks are present');
assert(css.includes('.hero-start-button:focus-visible'), 'hero action keeps keyboard focus visibility');
console.log('PASS v1.2.2 editorial masthead guardrails present');
