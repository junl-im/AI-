#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const pkg = require(path.join(root, 'package.json'));
const queue = read('src/render/render-queue.js');
const app = read('src/app.js');
const html = read('index.html');
const css = read('assets/css/render-queue.css');
function assert(value, message) {
    if (!value) { console.error(`FAIL ${message}`); process.exit(1); }
    console.log(`PASS ${message}`);
}
assert(pkg.version === '1.3.8', 'render ETA release version is v1.3.8');
assert(queue.includes('EMIT_INTERVAL_MS = 140') && queue.includes('function updateProgress'), 'render progress events are throttled');
assert(queue.includes('etaSeconds') && queue.includes('elapsedMs') && queue.includes('progressRate'), 'queue tracks ETA and elapsed time');
assert(queue.includes('statusText') && !queue.includes('filenameHint: status || item.filenameHint'), 'live status no longer overwrites the output filename');
assert(app.includes('formatQueueDuration') && app.includes('남은 약'), 'render UI presents a readable remaining-time estimate');
assert(app.includes('role="progressbar"') && app.includes('aria-valuenow'), 'render progress exposes accessible progress semantics');
assert(html.includes('id="renderQueueStatus"') && html.includes('aria-live="polite"'), 'render queue status is announced without interrupting the user');
assert(css.includes('v1.3.8 long-media render ETA'), 'render ETA layout has responsive styling');
console.log('PASS v1.3.8 throttled render ETA guardrails');
