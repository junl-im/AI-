#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function fail(message) { console.error(`FAIL ${message}`); process.exit(1); }
function assert(condition, message) { if (!condition) fail(message); }
function includes(file, token) { assert(read(file).includes(token), `${file} must include ${token}`); }

const pkg = JSON.parse(read('package.json'));
assert(pkg.version === '1.1.3', 'package version must be 1.1.3');
includes('index.html', 'assets/css/export-finish-center.css?v=1.1.3-export-finish');
includes('index.html', 'src/ui/export-finish-center.js?v=1.1.3-export-finish');
includes('sw.js', './assets/css/export-finish-center.css?v=1.1.3-export-finish');
includes('sw.js', './src/ui/export-finish-center.js?v=1.1.3-export-finish');
includes('src/ui/export-finish-center.js', 'AIShortsExportFinishCenter');
includes('src/ui/export-finish-center.js', 'ai-shorts-render-queue');
includes('src/ui/export-finish-center.js', 'data-export-finish-action="retry"');
includes('assets/css/export-finish-center.css', '.export-finish-center');
includes('assets/css/export-finish-center.css', 'data-state="failed"');
console.log('PASS export finish center smoke');
