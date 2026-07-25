#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const file = path.join(root, 'qa', `runtime-crop-keyframe-timeline-v${pkg.version}.json`);
function ok(value, message) { if (!value) { console.error(`FAIL ${message}`); process.exit(1); } console.log(`PASS ${message}`); }
ok(fs.existsSync(file), 'crop keyframe timeline browser audit exists for the release');
const report = JSON.parse(fs.readFileSync(file, 'utf8'));
ok(report.version === pkg.version && report.passed === true, 'crop keyframe timeline browser audit matches the release and passed');
ok(report.checks.timelineVisible && report.checks.copyPasteWorks, 'timeline markers and clipboard paste work in Chromium');
ok(report.checks.dragMoveCollisionCleanup && report.checks.rangeApplicationWorks, 'marker drag collision cleanup and selected-range application work');
ok(report.checks.noHorizontalOverflow && report.checks.noRuntimeErrors, 'timeline has no overflow or runtime errors');
console.log('PASS crop keyframe timeline browser audit contract present');
