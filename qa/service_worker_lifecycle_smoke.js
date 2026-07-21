#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
function ok(value, message) { if (!value) { console.error(`FAIL ${message}`); process.exit(1); } console.log(`PASS ${message}`); }
const source = fs.readFileSync(path.join(root, 'src/boot/service-worker-registration.js'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
ok(pkg.version === '1.5.2', 'service worker lifecycle release version is v1.5.2');
ok(source.includes('function getStatus()') && source.includes('function waitUntilControlled(options)'), 'registration owner exposes observable lifecycle APIs');
ok(source.includes("serviceWorker.addEventListener('controllerchange'") && source.includes("registration.addEventListener('updatefound'"), 'controller and update transitions are recorded');
ok(source.includes("type: 'service-worker-state-change'") && source.includes("type: 'service-worker-controller-change'"), 'lifecycle transitions are written to diagnostics');
ok(sw.includes("self.addEventListener('install'") && sw.includes('self.skipWaiting()'), 'service worker installs and requests immediate activation');
ok(sw.includes("self.addEventListener('activate'") && sw.includes('self.clients.claim()'), 'service worker activates and claims open clients');
const reportPath = path.join(root, 'qa', 'runtime-service-worker-lifecycle-v1.5.2.json');
ok(fs.existsSync(reportPath), 'isolated lifecycle audit artifact exists');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
ok(report.version === '1.5.2' && report.install.shellCached && report.install.skipWaitingCalls === 1, 'audit confirms shell installation and skipWaiting');
ok(report.activate.claimCalls === 1 && report.activate.deletedCaches.length > 0, 'audit confirms client claim and old cache cleanup');
ok(report.offlineNavigation.ok && report.offlineNavigation.status === 200, 'audit confirms cached offline navigation fallback');
console.log('PASS v1.5.2 observable service worker lifecycle guardrails');
