#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const pkg = JSON.parse(read('package.json'));
const html = read('index.html');
const css = read('assets/css/ui-refinement.css');
const sw = read('sw.js');
function assert(condition, message) {
  if (!condition) { console.error(`FAIL ${message}`); process.exit(1); }
  console.log(`PASS ${message}`);
}
assert(pkg.version === '1.3.6', 'UI refinement release version is v1.3.6');
assert(html.includes('assets/css/ui-refinement.css?v=1.3.6-adaptive-mobile'), 'UI refinement stylesheet is loaded last');
assert(html.indexOf('ui-refinement.css') > html.indexOf('hero-command-deck.css'), 'UI refinement stylesheet wins the cascade');
assert(sw.includes('./assets/css/ui-refinement.css?v=1.3.6-adaptive-mobile'), 'service worker caches the UI refinement stylesheet');
assert(css.includes('grid-template-columns: repeat(8, minmax(0, 1fr))'), 'desktop menu bar uses one eight-item rail');
assert(css.includes('@media (max-width: 720px)') && css.includes('grid-template-columns: repeat(4, minmax(0, 1fr))'), 'mobile menu bar keeps a compact four-column layout');
assert(css.includes('--ui-line:') && css.includes('--ui-surface:'), 'shared surface and border tokens are defined');
assert(css.includes('.flow-overview-copy strong') && html.includes('순서대로 쇼츠를 완성하세요.'), 'mobile start guidance avoids awkward orphan wrapping');
assert(css.includes('prefers-reduced-motion') && css.includes('performance-lite'), 'motion and low-performance fallbacks remain present');
console.log('PASS v1.3.6 unified UI refinement guardrails present');
