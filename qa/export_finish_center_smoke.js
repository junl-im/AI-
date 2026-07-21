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
const loader = read('src/boot/staged-ui-loader.js');
assert(pkg.version === '1.5.5', 'package version must be 1.2.9');
includes('index.html', 'assets/css/export-finish-center.css?v=1.5.5-mobile-control-ownership');
assert(loader.includes("versioned('src/ui/export-finish-center.js', 'export')"), 'export finish center script must be staged');
includes('sw.js', './assets/css/export-finish-center.css?v=1.5.5-mobile-control-ownership');
assert(read('sw.js').includes('async function cacheFirst'), 'export finish center uses runtime cache-first loading');
includes('src/ui/export-finish-center.js', 'AIShortsExportFinishCenter');
includes('src/ui/export-finish-center.js', 'ai-shorts-render-queue');
includes('src/ui/export-finish-center.js', 'data-export-finish-action="retry"');
includes('assets/css/export-finish-center.css', '.export-finish-center');
includes('assets/css/export-finish-center.css', 'data-state="failed"');
console.log('PASS export finish center smoke');
