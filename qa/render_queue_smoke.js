#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function assert(condition, message) {
  if (!condition) { console.error('FAIL', message); process.exit(1); }
}
const html = read('index.html');
const app = read('src/app.js');
const queue = read('src/render/render-queue.js');
const css = read('assets/css/render-queue.css');
const pkg = JSON.parse(read('package.json'));
assert(html.includes('assets/css/render-queue.css'), 'render queue css is linked');
assert(html.includes('src/render/render-queue.js'), 'render queue script is loaded');
assert(html.includes('id="renderQueueStatus"'), 'render queue status exists');
assert(html.includes('id="renderQueueList"'), 'render queue list exists');
assert(html.includes('id="renderQueueRetryBtn"'), 'retry button exists');
assert(queue.includes('runJobs') && queue.includes('retryFailed') && queue.includes('subscribe'), 'queue public API exists');
assert(app.includes('runRenderQueueJobs'), 'app uses render queue jobs');
assert(app.includes('buildExportPayload'), 'app builds export payloads');
assert(app.includes('renderQueue.subscribe(renderRenderQueue)'), 'queue UI subscribes to updates');
assert(css.includes('.render-queue-card') && css.includes('body[data-render-queue="running"]'), 'queue css state styles exist');
assert(pkg.version === '1.3.7', 'package version is 1.2.9');
console.log('PASS render_queue_smoke');
