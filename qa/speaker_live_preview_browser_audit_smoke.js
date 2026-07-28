#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const version = require(path.join(root, 'package.json')).version;
const file = path.join(root, 'qa', `runtime-speaker-live-preview-v${version}.json`);
if (!fs.existsSync(file)) throw new Error(`missing ${path.basename(file)}`);
const report = JSON.parse(fs.readFileSync(file, 'utf8'));
if (!report.passed) throw new Error('speaker live preview browser audit failed');
const failed = Object.entries(report.checks || {}).filter(([, value]) => !value).map(([key]) => key);
if (failed.length) throw new Error(`failed checks: ${failed.join(', ')}`);
console.log('PASS live preview divider, crop guides, and multi-speaker grid browser audit');
