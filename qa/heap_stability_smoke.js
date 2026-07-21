#!/usr/bin/env node
'use strict';
const fs = require('fs');
const version = require('../package.json').version;
const path = `qa/runtime-heap-stability-v${version}.json`;
if (!fs.existsSync(path)) throw new Error('real-media heap stability audit artifact is missing');
const report = JSON.parse(fs.readFileSync(path, 'utf8'));
if (report.version !== version) throw new Error('heap stability audit release version mismatch');
if (report.cycles !== 20 || !Array.isArray(report.samples) || report.samples.length !== 20) {
    throw new Error('heap stability audit must contain 20 completed cycles');
}
const requiredChecks = [
    'completedCycles',
    'noPageErrors',
    'noRuntimeErrors',
    'operationsReleasedEveryCycle',
    'renderQueueReleasedEveryCycle',
    'boundedObjectUrlsDuringCycles',
    'objectUrlsReleasedOnDispose',
    'boundedHeapWindowGrowth',
    'boundedHeapSlope'
];
for (const name of requiredChecks) {
    if (!report.checks || report.checks[name] !== true) throw new Error(`heap stability check failed: ${name}`);
}
if (!report.passed) throw new Error('heap stability audit is not marked passed');
if (!report.trend || !Number.isFinite(report.trend.growthBytes) || !Number.isFinite(report.trend.slopeBytesPerCycle)) {
    throw new Error('heap stability trend metrics are missing');
}
if (!report.disposed || !report.disposed.urls || report.disposed.urls.active !== 0) {
    throw new Error('source Object URL remains active after disposal');
}
if (report.samples.some(sample => !sample.operations || sample.operations.active.length !== 0)) {
    throw new Error('an operation remains active after a repeat cycle');
}
console.log('PASS v1.5.3 20-cycle real-media Chromium heap and Object URL stability audit');
