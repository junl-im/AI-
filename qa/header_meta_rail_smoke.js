#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
function assert(condition, message) {
  if (!condition) { console.error('FAIL', message); process.exit(1); }
  console.log('PASS', message);
}
const pkg = JSON.parse(read('package.json'));
const html = read('index.html');
const css = read('assets/css/header-meta-rail.css');
const bridge = read('src/ui/flow-command-bridge.js');
const sw = read('sw.js');
assert(pkg.version === '1.2.9', 'header metadata release version is v1.2.9');
assert(!html.includes('LOCAL · PRIVATE · 9:16') && !html.includes('brand-compat-pill'), 'center metadata slogan and markup are absent');
assert(html.includes('>v1.2.9</button>') && html.includes('모바일 · PC 호환'), 'build version and compatibility share the left rail');
assert(html.includes('class="signature-label">DESIGNED BY</span><strong>곰같은여우</strong>'), 'designer credit remains on the right rail');
assert(css.includes('grid-template-columns: minmax(0, 1fr) auto'), 'header uses a two-column metadata rail');
assert(css.includes('@media (max-width: 720px)') && css.includes('.badge-version::before') && css.includes('display: block !important'), 'mobile explicitly preserves BUILD');
assert(css.includes('.brand-signature-pill .signature-label') && css.includes('display: inline !important'), 'mobile explicitly preserves DESIGNED BY');
assert(!bridge.includes('LOCAL · PRIVATE · 9:16') && !bridge.includes('brand-compat-pill'), 'runtime bridge does not recreate removed metadata');
assert(html.includes('header-meta-rail.css?v=1.2.9-stability-audit') && sw.includes('header-meta-rail.css?v=1.2.9-stability-audit'), 'metadata rail stylesheet is loaded and cached');
console.log('PASS v1.2.9 header metadata rail guardrails present');
