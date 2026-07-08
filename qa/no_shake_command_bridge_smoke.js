#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/css/shutter-glass-flow.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'src/ui/flow-command-bridge.js'), 'utf8');
const finalJs = fs.readFileSync(path.join(root, 'src/ui/flow-director-final.js'), 'utf8');
function assert(condition, message) {
  if (!condition) {
    console.error('FAIL:', message);
    process.exit(1);
  }
}
assert(html.includes('brand-compat-pill') && html.includes('PC · 모바일 호환'), 'topline includes PC/mobile compatibility');
assert(html.includes('src/ui/flow-command-bridge.js'), 'command bridge is loaded');
assert(css.includes('brand-compat-pill'), 'compatibility pill styles exist');
assert(css.includes('data-flow-command-bridge="ready"'), 'command bridge motion guard styles exist');
assert(js.includes('stopImmediatePropagation'), 'tab click propagation is stopped before legacy handlers');
assert(js.includes('AIShortsFlowCommandBridge'), 'command bridge exports API');
assert(js.includes('AIShortsHyperFlowTabs') && js.includes('AIShortsMotionStability'), 'legacy navigation APIs are bridged');
assert(finalJs.includes("document.body.dataset.build = '1.1.7'"), 'final director build is v1.1.7');
console.log('PASS no_shake_command_bridge_smoke');
