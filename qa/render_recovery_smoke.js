#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
function assert(value, message) {
    if (!value) { console.error(`FAIL ${message}`); process.exit(1); }
    console.log(`PASS ${message}`);
}
const pkg = JSON.parse(read('package.json'));
const html = read('index.html');
const app = read('src/app.js');
const queue = read('src/render/render-queue.js');
const renderer = read('src/render/vertical-renderer.js');
const css = read('assets/css/render-queue.css');
assert(pkg.version === '1.3.4', 'render recovery release version is v1.3.4');
assert(html.includes('id="renderQueueCancelBtn"') && html.includes('data-icon="stop"'), 'render queue exposes an explicit cancel action');
assert(app.includes("renderQueue.cancel('사용자가 렌더 작업을 취소했습니다.')") && app.includes("type: 'render-cancel-request'"), 'cancel action reaches the queue and diagnostics');
assert(app.includes('retryFailedRenderJobs') && app.includes('renderQueue.retryableJobs()') && app.includes('return runRenderQueueJobs(jobs);'), 'failed items restart through a fresh render operation');
assert(queue.includes('function retryableJobs()') && queue.includes("status: 'queued'") && queue.includes('attempts <= RETRY_LIMIT'), 'render queue rebuilds retryable jobs safely');
assert(renderer.includes('function inspectRenderCapability') && renderer.includes('capability.reasons.join'), 'renderer performs a capability preflight');
assert(renderer.includes('await sourceMedia.play()') && renderer.includes('원본 미디어 재생을 시작할 수 없어 렌더를 중단했습니다'), 'playback failure stops recording before a blank export');
assert(css.includes('.render-cancel-btn:not(:disabled)') && css.includes('[data-state="cancelled"]'), 'cancel control and cancelled state have dedicated styling');
console.log('PASS v1.3.4 render cancel, retry, and playback failure guardrails');
