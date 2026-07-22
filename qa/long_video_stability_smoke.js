#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const version = require(path.join(root, 'package.json')).version;
const reportPath = path.join(root, 'qa', `runtime-long-video-stability-v${version}.json`);

function ok(value, message) {
    if (!value) throw new Error(message);
}

ok(fs.existsSync(reportPath), 'long video stability audit artifact exists');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
ok(report.version === version && report.passed === true, 'long video audit matches the release and passed');
ok(report.inheritedFrom === '1.5.9' && /CSS ownership/.test(report.inheritanceReason), 'CSS-only release explicitly inherits the v1.5.9 long-video run');
ok(JSON.stringify(report.sequenceMinutes) === JSON.stringify([15, 30, 15]), 'audit repeats 15m to 30m to 15m replacement in one page');
ok(report.cycles.length === 3, 'all long-video cycles completed');
ok(report.cycles.every(cycle => {
    const video = cycle.source.streams.find(stream => stream.codec_type === 'video') || {};
    return video.width === 1920 && video.height === 1080;
}), 'all sources are real 1920x1080 MP4 files');
ok(report.cycles.every(cycle => cycle.analysis.engineMeta.analysisStrategy === 'sequential-safe'), 'long media uses the safe sequential analysis strategy');
ok(report.cycles.find(cycle => cycle.minutes === 30).analysis.engineMeta.budget.analysisSampleRate <= 6000, '30 minute source uses the reduced analysis sample rate');
ok(report.cycles.find(cycle => cycle.minutes === 30).analysis.motionSummary.samples <= 64, '30 minute source uses bounded motion samples');
ok(report.cycles.every(cycle => !cycle.analysis.retainedAudioBuffer && !cycle.analysis.retainedChannelData), 'decoded buffers are released after each analysis');
ok(report.cycles.every(cycle => Number(cycle.outputProbe.duration) > 1 && Number(cycle.outputProbe.size) > 0), 'every cycle creates a playable short export');
ok(report.cycles.every(cycle => cycle.after.operations.active.length === 0 && cycle.after.queue.total === 0), 'operations and render queue are empty after every cycle');
ok(report.cycles.every(cycle => cycle.after.urls.sourceActive === 1 && cycle.after.urls.exportActive === 0), 'file replacement keeps only one source Object URL');
ok(report.disposed.urls.active === 0, 'all Object URLs are released on dispose');
ok(report.pageErrors.length === 0 && report.consoleErrors.length === 0, 'long video audit has no page or console errors');
console.log(`PASS v${version} 15m/30m 1080p replacement, analysis, render, and cleanup audit`);
