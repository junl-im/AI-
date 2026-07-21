#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function pass(name) { console.log('PASS ' + name); }
function fail(name, detail) { console.error('FAIL ' + name + (detail ? ' - ' + detail : '')); process.exit(1); }
function assert(cond, name, detail) { cond ? pass(name) : fail(name, detail); }
const html = read('index.html');
const css = read('assets/css/glass-pro-ui.css');
const sw = read('sw.js');
assert(html.includes('assets/css/glass-pro-ui.css?v=1.5.4-css-ownership'), 'glass pro stylesheet is loaded after layout fixes');
assert(css.includes('--glass-surface') && css.includes('--glass-blur'), 'glass design tokens are defined');
assert(css.includes('backdrop-filter: blur(var(--glass-blur)) saturate(1.28)'), 'glass surfaces use backdrop blur');
assert(css.includes('.brand-panel.cinematic-brand-panel'), 'cinematic hero receives glass skin');
assert(css.includes('film-cyan') && css.includes('film-violet') && css.includes('film-amber'), 'shorts film color accents are present');
assert(css.includes('.bottom-dock-tab') && css.includes('min-height: 58px'), 'dock remains readable in glass skin');
assert(css.includes('@supports not ((backdrop-filter: blur(1px))'), 'non-backdrop-filter fallback is included');
assert(css.includes('@media (prefers-reduced-motion: reduce)'), 'reduced motion fallback is included');
assert(sw.includes('./assets/css/glass-pro-ui.css?v=1.5.4-css-ownership'), 'service worker caches glass stylesheet');
