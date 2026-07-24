#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
const reportPath = path.join(root, 'qa', `runtime-vision-model-pack-browser-v${version}.json`);

function assert(condition, message) {
    if (!condition) throw new Error(message);
    console.log(`PASS ${message}`);
}

assert(fs.existsSync(reportPath), 'vision model-pack browser audit report exists for the release version');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
assert(report.version === version, 'vision model-pack browser audit matches the release version');
assert(report.passed === true && Object.values(report.checks || {}).every(Boolean), 'vision model-pack install, activation, integrity failure, and removal lifecycle passes');
assert((report.externalRequests || []).length === 0, 'vision model-pack browser audit makes no external requests');
assert((report.pageErrors || []).length === 0 && (report.consoleErrors || []).length === 0, 'vision model-pack browser audit has no page or console errors');
console.log('PASS browser vision model-pack end-to-end audit contract');
