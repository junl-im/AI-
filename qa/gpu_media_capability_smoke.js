#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const version = require(path.join(root, 'package.json')).version;
const file = path.join(root, 'qa', `runtime-gpu-media-capability-v${version}.json`);
function ok(value, message) { if (!value) throw new Error(message); console.log(`PASS ${message}`); }
ok(fs.existsSync(file), 'GPU/media capability audit artifact exists');
const report = JSON.parse(fs.readFileSync(file, 'utf8'));
ok(report.version === version, 'GPU/media capability audit version matches release');
ok(Array.isArray(report.modes) && report.modes.length === 2, 'acceleration-requested and software-forced modes were compared');
ok(report.modes.every(mode => typeof mode.webgl.available === 'boolean'), 'WebGL capability result is recorded in both comparison modes');
ok(report.summary.bothMediaDecoded, 'H.264/AAC fixture decodes in both comparison modes');
ok(report.modes.every(mode => mode.media.totalFrames > 0), 'video playback advances decoded frames');
ok(report.modes.every(mode => mode.memory.baseline.totalRssMiB > 0 && mode.memory.duringMedia.totalRssMiB > 0), 'process-tree RSS is captured before and during media playback');
ok(report.summary.gpuProcessObservedInBothModes, 'GPU process category is observable in both comparison modes');
ok(report.summary.mediaUtilityObservedInBothModes, 'media utility process category appears during video decoding');
ok(report.summary.runtimeErrorCount === 0 && report.modes.every(mode => mode.errors.length === 0), 'GPU/media audit has no page or console errors');
ok(report.modes.every(mode => !mode.runtime.operations || mode.runtime.operations.active.length === 0), 'GPU/media audit leaves no active application operation');
ok(report.modes.every(mode => mode.runtime.queue === 0), 'GPU/media audit leaves no render queue jobs');
ok(report.limitations.some(item => item.includes('physical GPU')), 'physical GPU availability limitation is explicit');
console.log(`PASS v${version} GPU/WebGL and media decoder comparison guardrails`);
