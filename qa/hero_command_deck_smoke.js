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

assert(pkg.version === '1.2.1', 'hero command deck release version is v1.2.1');
assert(html.includes('assets/css/hero-command-deck.css?v=1.2.1-hero-command-deck'), 'command deck stylesheet is linked');
assert(html.indexOf('hero-command-deck.css') > html.indexOf('desktop-prime-layout.css'), 'command deck stylesheet is the final hero override');
assert(sw.includes('./assets/css/hero-command-deck.css?v=1.2.1-hero-command-deck'), 'command deck stylesheet is cached');
assert(html.includes('class="hero-eyebrow"') && html.includes('LOCAL AI CREATIVE SUITE'), 'premium product eyebrow is present');
assert(html.includes('class="hero-command-deck"') && html.includes('STUDIO STATUS'), 'studio status deck is present');
assert(html.includes('class="hero-start-button" for="fileInput"'), 'desktop hero start action uses the existing file input');
assert(html.includes('파일은 업로드되지 않고 이 브라우저에서 처리됩니다.'), 'local-processing trust copy is visible');
assert(html.includes('class="hero-capability-row"'), 'hero capability summary is present');
assert(css.includes('grid-template-columns: minmax(0, 1.5fr) minmax(310px, 0.62fr)'), 'desktop hero uses a two-column command layout');
assert(css.includes('@media (max-width: 860px)') && css.includes('.hero-command-deck') && css.includes('display: none'), 'compact screens remove the duplicated start deck');
assert(css.includes('@media (prefers-reduced-motion: reduce)') && css.includes('body.performance-lite'), 'motion and low-performance fallbacks are present');
assert(css.includes('.hero-start-button:focus-visible'), 'hero action keeps keyboard focus visibility');
console.log('PASS v1.2.1 cinematic hero command deck guardrails present');
