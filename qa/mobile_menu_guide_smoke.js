#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const configSource = fs.readFileSync(path.join(root, 'src/config/app-runtime-config.js'), 'utf8');
const buildKey = (configSource.match(/BUILD_KEY:\s*'([^']+)'/) || [])[1] || '';
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const pkg = require(path.join(root, 'package.json'));
const html = read('index.html');
const js = read('src/ui/mobile-menu-guide.js');
const css = read('assets/css/mobile-menu-guide.css');
const sw = read('sw.js');
function assert(value, message) {
  if (!value) { console.error(`FAIL ${message}`); process.exit(1); }
  console.log(`PASS ${message}`);
}
assert(/^1\.6\.\d+$/.test(pkg.version), 'adaptive mobile menu release version is v1.6.25');
['mobileDockGuide','mobileDockGuideText','mobileDockVisibleCount','mobileDockMenuToggle','bottomDockTabs'].forEach(id => assert(html.includes(`id="${id}"`), `${id} anchor exists`));
assert(html.includes(`assets/css/mobile-menu-guide.css?v=${buildKey}`), 'adaptive mobile menu stylesheet is linked');
assert(html.includes(`<script defer src="src/ui/mobile-menu-guide.js?v=${buildKey}"></script>`), 'adaptive mobile menu controller loads with the initial shell so compact mobile geometry is ready before first paint');
assert(js.includes("const ORDER = ['file', 'recommend', 'candidates', 'preview', 'waveform', 'cut', 'edit', 'export']"), 'mobile controller owns the complete workflow order');
assert(js.includes('priorityTabs(current)') && js.includes("body.dataset.mobileMenuMode"), 'mobile controller computes current/next priorities and owns compact state');
assert(js.includes("setAttribute('aria-expanded'") && js.includes("setAttribute('aria-hidden'"), 'mobile menu expansion and hidden tabs expose accessible state');
assert(css.includes('data-mobile-menu-mode="compact"') && css.includes('data-mobile-priority="false"'), 'compact mode hides only non-priority tabs');
assert(css.includes('data-mobile-menu-mode="expanded"') && css.includes('repeat(4, minmax(0, 1fr))'), 'expanded mode restores all eight tabs in a four-column grid');
assert(sw.includes(`./assets/css/mobile-menu-guide.css?v=${buildKey}`) && sw.includes(`./src/ui/mobile-menu-guide.js?v=${buildKey}`), 'service worker caches adaptive mobile menu assets');
console.log('PASS v1.6.25 adaptive mobile current/next menu guardrails');
