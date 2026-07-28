#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const version = require('../package.json').version;
const file = path.join(root, 'qa', `runtime-support-diagnostics-import-v${version}.json`);
function ok(value, message) { if (!value) throw new Error(message); console.log(`PASS ${message}`); }
ok(fs.existsSync(file), 'support diagnostics import browser audit artifact exists');
const report = JSON.parse(fs.readFileSync(file, 'utf8'));
ok(report.version === version && report.passed === true, 'support diagnostics import browser audit matches the release and passed');
for (const [name, value] of Object.entries(report.checks || {})) ok(value === true, `support diagnostics browser check passed: ${name}`);
ok(report.pageErrors.length === 0 && report.consoleErrors.length === 0, 'support diagnostics preview has no page or console errors');
console.log(`PASS v${version} diagnostics import preview, normalized download, future-schema, and corrupted-JSON browser audit`);
