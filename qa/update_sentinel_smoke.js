#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const pkg = require(path.join(root, 'package.json'));
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const config = fs.readFileSync(path.join(root, 'src/config/app-runtime-config.js'), 'utf8');
const sentinel = fs.readFileSync(path.join(root, 'src/boot/update-sentinel.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/css/update-sentinel.css'), 'utf8');
const handoff = fs.readFileSync(path.join(root, 'HANDOFF.md'), 'utf8');
function ok(condition, message) {
  if (!condition) {
    console.error('FAIL:', message);
    process.exit(1);
  }
}
const version = pkg.version;
const buildKey = (config.match(/BUILD_KEY:\s*'([^']+)'/) || [])[1] || '';
ok(html.includes(`assets/css/update-sentinel.css?v=${buildKey}`), 'update sentinel css linked');
ok(html.includes(`src/boot/update-sentinel.js?v=${buildKey}`), 'update sentinel script linked');
ok(sw.includes(`./assets/css/update-sentinel.css?v=${buildKey}`), 'update sentinel css cached');
ok(sw.includes(`./src/boot/update-sentinel.js?v=${buildKey}`), 'update sentinel script cached');
ok(sentinel.includes('AIShortsUpdateSentinel'), 'sentinel exports global API');
ok(sentinel.includes('clearOldShellCaches'), 'sentinel can clear previous shell caches');
ok(sentinel.includes('copyDiagnostics'), 'sentinel can copy update diagnostics');
ok(sentinel.includes('serviceWorker') && sentinel.includes('updatefound'), 'sentinel watches service worker updates');
ok(css.includes('.update-sentinel-panel'), 'sentinel panel styles exist');
ok(handoff.includes('Update Sentinel'), 'handoff documents update sentinel');
console.log('PASS update sentinel is wired and documented');
