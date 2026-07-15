#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/css/flow-quality-gate.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'src/ui/flow-quality-gate.js'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

function assert(condition, message) {
    if (!condition) {
        console.error(`FAIL ${message}`);
        process.exit(1);
    }
    console.log(`PASS ${message}`);
}

assert(html.includes('assets/css/flow-quality-gate.css?v=1.2.4-flow-audit'), 'flow quality gate stylesheet is linked');
assert(html.includes('src/ui/flow-quality-gate.js?v=1.2.4-flow-audit'), 'flow quality gate script is linked');
assert(sw.includes('./assets/css/flow-quality-gate.css?v=1.2.4-flow-audit'), 'flow quality gate stylesheet is cached');
assert(sw.includes('./src/ui/flow-quality-gate.js?v=1.2.4-flow-audit'), 'flow quality gate script is cached');
assert(js.includes("const ORDER = ['file', 'recommend', 'candidates', 'preview', 'waveform', 'cut', 'edit', 'export']"), 'canonical 8-step flow order is guarded');
assert(js.includes('bestTabForState'), 'state-aware fallback tab resolver exists');
assert(js.includes('setPanelVisibility'), 'single active panel visibility guard exists');
assert(js.includes('window-error') || js.includes('unhandledrejection'), 'runtime error guard exists');
assert(js.includes('flow-quality-hidden-legacy'), 'legacy duplicate UI is hidden by runtime guard');
assert(css.includes('[data-flow-panel][hidden]'), 'hidden panels are force-hidden');
assert(css.includes('.is-flow-active'), 'active panel class is styled');
assert(html.includes('data-build="1.2.4"'), 'build marker is v1.2.4');
