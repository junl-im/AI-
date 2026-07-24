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
        if (message.type !== 'ai-shorts-service-worker-repair-request') return;
        messageHandler({ data: {
            type: 'ai-shorts-service-worker-install-report',
            requestId: message.requestId,
            report: {
                cacheName: 'test-cache', attempted: 10, cached: 10, failed: 0, cacheEntries: 11,
                requiredMissing: [], failures: [], repaired: ['./assets/test.js'], repairFailed: [],
                repairAttempts: 1, repairReason: 'manual', lastRepairedAt: new Date().toISOString(),
                verified: true, integrity: { checked: 10, healthy: 10, missing: [], invalid: [] }
            }
        } });
    }
};
const registration = { scope: 'https://studio.test/', active: target, addEventListener() {}, async update() {} };
const serviceWorker = {
    controller: target,
    async register() { return registration; },
    addEventListener(type, handler) { if (type === 'message') messageHandler = handler; }
};
const window = {
    window: null,
    location: { protocol: 'https:', hostname: 'studio.test' },
    isSecureContext: true,
    navigator: { serviceWorker },
    AIShortsRuntimeConfig: { APP_VERSION: 'v1.6.2', SW_UPDATE_MAX_ATTEMPTS: 1 },
    AIShortsAppState: { addDiagnostic(item) { diagnostics.push(item); } },
    setTimeout() { return 9; },
    clearTimeout(id) { if (id === 9) timeoutCleared = true; }
};
window.window = window;
vm.runInContext(source, vm.createContext({ window, console, Promise, Error, Object, String, Number, Math, Date, Boolean, RegExp, Map }));

(async () => {
    const owner = window.AIShortsServiceWorkerRegistration;
    await owner.register();
    const result = await owner.repairCache({ timeoutMs: 5000 });
    if (!result || result.status !== 'ready' || !result.report.verified) throw new Error('repair request must resolve with the correlated verified report');
    const status = owner.getStatus();
    if (status.repair.state !== 'ready' || status.repair.repaired !== 1 || status.repair.failed !== 0) throw new Error('repair lifecycle must be observable through getStatus');
    if (!timeoutCleared) throw new Error('successful repair must clear its timeout');
    if (!diagnostics.some(item => item.type === 'service-worker-repair-complete')) throw new Error('repair completion must be recorded in diagnostics');
    console.log('PASS service worker repair request correlation and observable status');
})().catch(error => { console.error(error.stack || error); process.exit(1); });
