#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
const coordinator = read('src/engine/operation-coordinator.js');
const app = read('src/app.js');
const workflow = read('src/app/render-workflow-controller.js');
const mediaImport = read('src/app/media-import-controller.js');
const audio = read('src/analysis/audio-feature-extractor.js');
const motion = read('src/analysis/video-motion-analyzer.js');
const pipeline = read('src/engine/analysis-pipeline.js');
const renderer = read('src/render/vertical-renderer.js');
const queue = read('src/render/render-queue.js');
function assert(value, message) { if (!value) { console.error('FAIL:', message); process.exit(1); } }
assert(html.includes('src/engine/operation-coordinator.js?v=1.5.4-css-ownership'), 'operation coordinator is loaded');
assert(html.indexOf('operation-coordinator.js') < html.indexOf('src/app.js'), 'coordinator loads before main app');
for (const api of ['begin','cancel','finish','isCurrent','assertCurrent','startMediaSession','snapshot']) assert(coordinator.includes(api), `coordinator exports ${api}`);
assert(mediaImport.includes("startMediaSession({ fileName: file.name") && app.includes("beginOperation('analysis'") && app.includes("beginOperation('preview'") && workflow.includes("beginOperation('render'"), 'app and render controller coordinate media, analysis, preview and render generations');
assert(mediaImport.includes('renderQueue.cancel') && workflow.includes('assertOperation(token'), 'file replacement cancels render and stale results are rejected');
assert(audio.includes('signal') && audio.includes("error.name = 'AbortError'"), 'audio worker path supports cancellation');
assert(motion.includes('throwIfAborted(signal)') && motion.includes("waitForEvent(video, 'loadedmetadata', 5000, signal)"), 'video motion sampling supports cancellation');
assert(pipeline.includes('input && input.signal') && pipeline.includes('analyzeFileAudio(file, report, signal, {'), 'analysis pipeline propagates cancellation');
assert(renderer.includes('options && options.signal') && renderer.includes("signal.addEventListener('abort'"), 'renderer stops through AbortSignal');
assert(queue.includes('function cancel(reason)') && queue.includes("status: 'cancelled'"), 'render queue exposes cancellation and cancelled state');
console.log('PASS async operation ownership and cancellation contract');
