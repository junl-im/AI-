#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function ok(value, message) { if (!value) throw new Error(message); console.log(`PASS ${message}`); }
const html = read('index.html');
const sw = read('sw.js');
const loader = read('src/boot/staged-ui-loader.js');
const panel = read('src/ui/storage-health-panel.js');
const runtime = read('src/boot/runtime-health.js');
const diagnostics = read('src/download/download-service.js');
ok(html.includes('assets/css/storage-health-panel.css?v=1.6.5-smart-reframe-caption-safe'), 'storage health stylesheet is linked');
ok(html.includes('src/storage/storage-manager.js?v=1.6.5-smart-reframe-caption-safe'), 'quota-aware storage manager is on the core path');
ok(loader.includes("versioned('src/ui/storage-health-panel.js', 'shell')"), 'storage health UI is loaded with the shell phase');
ok(sw.includes('storage-health-panel.css?v=1.6.5-smart-reframe-caption-safe') && sw.includes('storage-manager.js?v=1.6.5-smart-reframe-caption-safe'), 'storage diagnostics assets are available offline');
ok(panel.includes('storageHealthCleanupBtn') && panel.includes('serviceWorker.getStatus') && panel.includes('AIShortsSessionContinuity'), 'panel exposes cleanup, service worker, and session recovery status');
ok(panel.includes('mountAtPageEnd') && panel.includes('navigateToHealthPanel') && panel.includes('returnToWorkspaceTop'), 'storage status is footer-mounted with closed-loop issue and recovery navigation');
ok(panel.includes('analysisCacheNamespaceSelect') && panel.includes('analysisCacheMaintenanceHistory') && panel.includes('deletePersistentAnalysisCacheNamespaces'), 'panel exposes legacy namespace selection and bounded cleanup history');
ok(panel.includes('analysisCacheSignatureSelect') && panel.includes('invalidateSelectedAnalysisCacheSignature') && panel.includes('analysisCacheStorageTrend'), 'panel exposes option signature cleanup and namespace storage cost trend');
ok(panel.includes('getPersistentAnalysisCacheMaintenanceSnapshot') && panel.includes('refresh: false'), 'panel reuses the cached maintenance snapshot instead of repeating IndexedDB full scans');
ok(panel.includes('storageConfirmImpact') && panel.includes('previewCleanup'), 'storage cleanup shows an impact preview before destructive confirmation');
ok(runtime.includes('serviceWorkerLifecycle') && runtime.includes('sessionContinuity') && diagnostics.includes('sessionContinuity'), 'copied diagnostics include storage, service worker, and session state');
console.log('PASS storage, cleanup impact preview, cache signature, trend, and offline diagnostics panel guardrails');
