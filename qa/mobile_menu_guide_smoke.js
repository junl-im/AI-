#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
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
assert(pkg.version === '1.5.20', 'adaptive mobile menu release version is v1.5.20');
['mobileDockGuide','mobileDockGuideText','mobileDockVisibleCount','mobileDockMenuToggle','bottomDockTabs'].forEach(id => assert(html.includes(`id="${id}"`), `${id} anchor exists`));
assert(html.includes('assets/css/mobile-menu-guide.css?v=1.5.20-structure-responsive-priority'), 'adaptive mobile menu stylesheet is linked');
assert(html.includes('src/ui/mobile-menu-guide.js?v=1.5.20-structure-responsive-priority'), 'adaptive mobile menu controller is linked');
assert(js.includes("const ORDER = ['file', 'recommend', 'candidates', 'preview', 'waveform', 'cut', 'edit', 'export']"), 'mobile controller owns the complete workflow order');
assert(js.includes('priorityTabs(current)') && js.includes("body.dataset.mobileMenuMode"), 'mobile controller computes current/next priorities and owns compact state');
assert(js.includes("setAttribute('aria-expanded'") && js.includes("setAttribute('aria-hidden'"), 'mobile menu expansion and hidden tabs expose accessible state');
assert(css.includes('data-mobile-menu-mode="compact"') && css.includes('data-mobile-priority="false"'), 'compact mode hides only non-priority tabs');
assert(css.includes('data-mobile-menu-mode="expanded"') && css.includes('repeat(4, minmax(0, 1fr))'), 'expanded mode restores all eight tabs in a four-column grid');
assert(sw.includes('./assets/css/mobile-menu-guide.css?v=1.5.20-structure-responsive-priority') && sw.includes('./src/ui/mobile-menu-guide.js?v=1.5.20-structure-responsive-priority'), 'service worker caches adaptive mobile menu assets');
console.log('PASS v1.5.20 adaptive mobile current/next menu guardrails');
