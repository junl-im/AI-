#!/usr/bin/env node
'use strict';
const fs = require('fs');
const releaseVersion = require('../package.json').version;
const path = `qa/runtime-heap-stability-v${releaseVersion}.json`;
if (!/^1\.6\.\d+$/.test(releaseVersion)) throw new Error('heap stability contract must use the supported release line');
if (!fs.existsSync(path)) throw new Error('current-release real-media heap stability audit artifact is missing');
const report = JSON.parse(fs.readFileSync(path, 'utf8'));
if (report.version !== releaseVersion) throw new Error('heap stability audit artifact version mismatch');
if (!Number.isInteger(report.cycles) || report.cycles < 5 || !Array.isArray(report.samples) || report.samples.length !== report.cycles) {
    throw new Error('heap stability audit must contain at least 5 completed cycles');
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
if (!report.disposed || !report.disposed.urls || report.disposed.urls.active !== 0 || report.disposed.urls.exportActive !== 0) {
    throw new Error('Object URL remains active after disposal');
}
if (report.samples.some(sample => !sample.operations || sample.operations.active.length !== 0)) {
    throw new Error('an operation remains active after a repeat cycle');
}
if (report.samples.some(sample => !sample.urls || sample.urls.exportActive > 1)) {
    throw new Error('repeated exports retained more than one active download Object URL');
}
console.log(`PASS v${releaseVersion} current ${report.cycles}-cycle heap and Object URL stability audit`);
