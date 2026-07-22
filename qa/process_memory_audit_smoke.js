#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const version = require(path.join(root, 'package.json')).version;
const file = path.join(root, 'qa', `runtime-process-memory-v${version}.json`);
function ok(value, message) { if (!value) throw new Error(message); }
ok(fs.existsSync(file), 'process memory audit artifact exists');
const report = JSON.parse(fs.readFileSync(file, 'utf8'));
ok(report.version === version, 'process memory audit version matches release');
ok(report.cycles >= 4 && report.samples.length === report.cycles + 1, 'process memory audit includes baseline and repeated samples');
ok(report.summary.peakRssMiB > 0 && report.summary.finalRssMiB > 0, 'Chromium process RSS was measured');
ok(report.samples.every(sample => sample.jsHeapUsedMiB > 0), 'renderer JS heap was measured in every sample');
ok(report.samples.every(sample => sample.processMemory.totalProcessCount >= 2), 'Chromium process tree was captured');
ok(report.summary.processCategories.includes('browser') && report.summary.processCategories.includes('renderer'), 'browser and renderer memory categories are present');
ok(report.summary.runtimeErrorCount === 0 && report.errors.length === 0, 'memory audit has no page or console errors');
ok(report.samples.every(sample => !sample.operations || (Array.isArray(sample.operations.active) && sample.operations.active.length === 0)), 'memory audit leaves no active operation');
ok(report.samples.every(sample => sample.renderQueueSize === 0), 'memory audit leaves no queued render jobs');
ok(report.scope.limitations.some(item => item.includes('decoder')), 'native decoder attribution limitation is explicit');
console.log(`PASS v${version} Chromium RSS, GPU/media process category, and JS heap auxiliary memory audit`);
