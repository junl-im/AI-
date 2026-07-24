#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/boot/service-worker-registration.js'), 'utf8');
let updateCalls = 0;
const waits = [];
const diagnostics = [];
const registration = {
    scope: 'https://studio.test/', active: { postMessage() {} },
    addEventListener() {},
    async update() { updateCalls += 1; if (updateCalls < 3) throw new Error(`offline-${updateCalls}`); }
};
const serviceWorker = { register: async () => registration, addEventListener() {}, controller: null };
const window = {
    window: null, location: { protocol: 'https:', hostname: 'studio.test' }, isSecureContext: true,
    navigator: { serviceWorker },
    AIShortsRuntimeConfig: { APP_VERSION: 'v1.6.1', SW_UPDATE_MAX_ATTEMPTS: 3, SW_UPDATE_BACKOFF_BASE_MS: 250 },
    AIShortsAppState: { addDiagnostic(item) { diagnostics.push(item); } },
    setTimeout(callback, ms) { waits.push(ms); callback(); return 1; }
};
window.window = window;
vm.runInContext(source, vm.createContext({ window, console, Promise, Error, Object, String, Number, Math, Date, Boolean, RegExp }));
(async () => {
    const owner = window.AIShortsServiceWorkerRegistration;
    const result = await owner.register();
    if (result.status !== 'ready' || updateCalls !== 3) throw new Error('update owner must retry transient failures up to success');
    if (waits.join(',') !== '250,500') throw new Error(`unexpected exponential backoff schedule: ${waits.join(',')}`);
    const status = owner.getStatus();
    if (status.update.state !== 'ready' || status.update.attempts !== 3 || status.update.lastError) throw new Error('successful retry state must be observable');
    if (diagnostics.filter(item => item.type === 'service-worker-update-retry').length !== 2) throw new Error('each backoff retry must be recorded');
    console.log('PASS service worker update retry backoff and observable status');
})().catch(error => { console.error(error.stack || error); process.exit(1); });
