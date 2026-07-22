#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/css/shutter-glass-flow.css'), 'utf8');
const metaCss = fs.readFileSync(path.join(root, 'assets/css/header-meta-rail.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'src/ui/flow-command-bridge.js'), 'utf8');
const finalJs = fs.readFileSync(path.join(root, 'src/ui/flow-director-final.js'), 'utf8');
function assert(condition, message) {
  if (!condition) {
    console.error('FAIL:', message);
    process.exit(1);
  }
}
assert(!html.includes('brand-compat-pill') && !html.includes('LOCAL · PRIVATE · 9:16'), 'topline omits the redundant center readiness slogan');
assert(html.includes('src/ui/flow-command-bridge.js'), 'command bridge is loaded');
assert(metaCss.includes('.brand-compat-pill') && metaCss.includes('display: none !important'), 'removed status remains defensively hidden');
assert(css.includes('data-flow-command-bridge="ready"'), 'command bridge motion guard styles exist');
assert(js.includes('stopImmediatePropagation'), 'tab click propagation is stopped before legacy handlers');
assert(js.includes('AIShortsFlowCommandBridge'), 'command bridge exports API');
assert(!js.includes('brand-compat-pill') && !js.includes('LOCAL · PRIVATE · 9:16'), 'command bridge cannot restore removed status markup');
assert(js.includes('AIShortsHyperFlowTabs') && js.includes('AIShortsMotionStability'), 'legacy navigation APIs are bridged');
assert(finalJs.includes("document.body.dataset.build = '1.5.14'"), 'final director build is v1.5.14');
console.log('PASS no_shake_command_bridge_smoke');

