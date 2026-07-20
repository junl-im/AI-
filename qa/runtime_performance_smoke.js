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
const sw = read('sw.js');
const css = read('assets/css/foundation-polish.css');
const primeCss = read('assets/css/desktop-prime-layout.css');
const startup = read('src/ui/startup-performance.js');
const ux = read('src/ui/ux-controls.js');
const range = read('src/ui/range-drag-controls.js');

assert(pkg.version === '1.3.5', 'runtime polish package version is v1.3.5');
assert(html.includes('assets/css/foundation-polish.css?v=1.3.5-adaptive-mobile'), 'foundation polish stylesheet is linked');
assert(html.includes('src/ui/startup-performance.js?v=1.3.5-adaptive-mobile'), 'startup performance module is linked');
assert(sw.includes('foundation-polish.css?v=1.3.5-adaptive-mobile'), 'foundation polish stylesheet is cached');
assert(sw.includes('startup-performance.js?v=1.3.5-adaptive-mobile'), 'startup performance module is cached');
assert(!ux.includes('setInterval(uxSyncAll, 700)'), '700ms UX polling loop is removed');
assert(ux.includes('MutationObserver(uxScheduleSync)') && ux.includes('requestAnimationFrame'), 'UX synchronization is event-driven and frame-batched');
assert(!range.includes('setInterval(render, 500)'), '500ms waveform DOM rebuild loop is removed');
assert(range.includes('lastSignature') && range.includes('replaceChildren'), 'waveform overlay skips unchanged DOM rebuilds');
assert(startup.includes('AIShortsStartupPerformance') && startup.includes("entryTypes: ['longtask']"), 'adaptive runtime performance guard is exposed');
assert(primeCss.includes('.flow-overview-copy') && primeCss.includes('@media (max-width: 720px)'), 'mobile startup is a compact flow overview');
assert(primeCss.includes('repeat(2, minmax(0, 1fr))'), 'mobile four-step rail uses a readable two-by-two layout');
assert(primeCss.includes('body.has-media .start-command-panel'), 'mobile startup guidance collapses after media is loaded');
console.log('PASS v1.3.5 runtime performance and startup hierarchy guardrails present');
