#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/boot/service-worker-registration.js'), 'utf8');
let messageHandler = null;
let timeoutCleared = false;
const diagnostics = [];
const target = {
    postMessage(message) {
        if (message.type !== 'ai-shorts-service-worker-integrity-sample-request') return;
        messageHandler({ data: { type: 'ai-shorts-service-worker-install-report', requestId: message.requestId, report: {
            cacheName: 'test-cache', attempted: 20, cached: 20, failed: 0, cacheEntries: 21,
            requiredMissing: [], failures: [], repaired: [], repairFailed: [], verified: true, contentVerified: true,
            integrity: { checked: 20, healthy: 20, hashVerified: 20, hashUnsupported: 0, manifestVerified: true, missing: [], invalid: [], corrupted: [] },
            periodicIntegrity: { checkedAt: new Date().toISOString(), checked: message.sampleSize, healthy: message.sampleSize, repaired: 0, failed: 0, cursor: 12, nextCursor: 24, sampleSize: message.sampleSize, missing: [], invalid: [], corrupted: [], repairFailed: [] }
        } } });
    }
};
const registration = { scope: 'https://studio.test/', active: target, addEventListener() {}, async update() {} };
const serviceWorker = { controller: target, async register() { return registration; }, addEventListener(type, handler) { if (type === 'message') messageHandler = handler; } };
const window = {
    window: null, location: { protocol: 'https:', hostname: 'studio.test' }, isSecureContext: true,
    navigator: { serviceWorker },
    AIShortsRuntimeConfig: { APP_VERSION: 'v1.5.28', SW_UPDATE_MAX_ATTEMPTS: 1, SW_INTEGRITY_AUDIT_SAMPLE_SIZE: 12 },
    AIShortsAppState: { addDiagnostic(item) { diagnostics.push(item); } },
    setTimeout() { return 7; }, clearTimeout(id) { if (id === 7) timeoutCleared = true; }
};
window.window = window;
vm.runInContext(source, vm.createContext({ window, console, Promise, Error, Object, String, Number, Math, Date, Boolean, RegExp, Map, Set }));
(async () => {
    const owner = window.AIShortsServiceWorkerRegistration;
    await owner.register();
    const result = await owner.requestIntegrityAudit({ sampleSize: 12, timeoutMs: 5000 });
    if (!result || result.status !== 'ready' || result.report.periodicIntegrity.checked !== 12) throw new Error('integrity audit request must resolve with its correlated sample report');
    const status = owner.getStatus().integrityAudit;
    if (status.state !== 'ready' || status.checked !== 12 || status.nextCursor !== 24) throw new Error('integrity audit lifecycle and rotation cursor must be observable');
    if (!timeoutCleared) throw new Error('successful integrity audit must clear its response timeout');
    if (!diagnostics.some(item => item.type === 'service-worker-integrity-audit-complete')) throw new Error('integrity audit completion must be recorded');
    console.log('PASS service worker integrity audit request correlation and status');
})().catch(error => { console.error(error.stack || error); process.exit(1); });
