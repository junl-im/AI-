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
const startup = read('src/ui/startup-performance.js');
const ux = read('src/ui/ux-controls.js');
const range = read('src/ui/range-drag-controls.js');

assert(pkg.version === '1.1.8', 'runtime polish package version is v1.1.8');
assert(html.includes('assets/css/foundation-polish.css?v=1.1.8-foundation-polish'), 'foundation polish stylesheet is linked');
assert(html.includes('src/ui/startup-performance.js?v=1.1.8-foundation-polish'), 'startup performance module is linked');
assert(sw.includes('foundation-polish.css?v=1.1.8-foundation-polish'), 'foundation polish stylesheet is cached');
assert(sw.includes('startup-performance.js?v=1.1.8-foundation-polish'), 'startup performance module is cached');
assert(!ux.includes('setInterval(uxSyncAll, 700)'), '700ms UX polling loop is removed');
assert(ux.includes('MutationObserver(uxScheduleSync)') && ux.includes('requestAnimationFrame'), 'UX synchronization is event-driven and frame-batched');
assert(!range.includes('setInterval(render, 500)'), '500ms waveform DOM rebuild loop is removed');
assert(range.includes('lastSignature') && range.includes('replaceChildren'), 'waveform overlay skips unchanged DOM rebuilds');
assert(startup.includes('AIShortsStartupPerformance') && startup.includes("entryTypes: ['longtask']"), 'adaptive runtime performance guard is exposed');
assert(css.includes('.command-group-primary .command-buttons') && css.includes('display: grid !important'), 'startup file actions are visible');
assert(css.includes('.workflow-rail-separated') && css.includes('repeat(4, minmax(0, 1fr))'), 'four-step startup rail is visible on desktop');
assert(css.includes('body.has-media .start-command-panel'), 'startup guidance collapses after media is loaded');
console.log('PASS v1.1.8 runtime performance and startup hierarchy guardrails present');
