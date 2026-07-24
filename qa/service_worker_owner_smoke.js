#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');

function ok(condition, message) {
    if (!condition) {
        console.error(`FAIL ${message}`);
        process.exit(1);
    }
    console.log(`PASS ${message}`);
}

(async () => {
    let registerCalls = 0;
    let updateCalls = 0;
    const registration = {
        scope: 'https://example.test/',
        update: async () => { updateCalls += 1; await Promise.resolve(); }
    };
    const window = {
        window: null,
        location: { protocol: 'https:', hostname: 'example.test' },
        isSecureContext: true,
        navigator: { serviceWorker: { register: async () => { registerCalls += 1; return registration; } } },
        AIShortsRuntimeConfig: { APP_VERSION: 'v-test' },
        AIShortsAppState: { addDiagnostic() {} }
    };
    window.window = window;
    const context = vm.createContext({ window, console, Promise, Error });
    vm.runInContext(fs.readFileSync(path.join(root, 'src/boot/service-worker-registration.js'), 'utf8'), context);
    const owner = window.AIShortsServiceWorkerRegistration;
    await owner.register();
    ok(registerCalls === 1 && updateCalls === 1, 'initial registration and freshness check are owned by one module');
    await Promise.all([owner.checkForUpdate(), owner.checkForUpdate()]);
    ok(registerCalls === 1, 'manual update checks reuse the existing registration');
    ok(updateCalls === 2, 'simultaneous manual checks coalesce into one registration.update call');

    const sentinel = fs.readFileSync(path.join(root, 'src/boot/update-sentinel.js'), 'utf8');
    const versionSync = fs.readFileSync(path.join(root, 'src/boot/app-version-sync.js'), 'utf8');
    ok(sentinel.includes('owner.checkForUpdate()') && !sentinel.includes('registrationRef.update'), 'update sentinel delegates update checks to the owner');
    ok(versionSync.includes('owner.checkForUpdate()') && !versionSync.includes('owner.register()'), 'version sync delegates freshness checks to the owner API');
    const directUpdateFiles = [];
    for (const rel of ['src/boot/app-version-sync.js', 'src/boot/update-sentinel.js', 'src/app.js']) {
        if (/registration\.update\s*\(/.test(fs.readFileSync(path.join(root, rel), 'utf8'))) directUpdateFiles.push(rel);
    }
    ok(directUpdateFiles.length === 0, 'no secondary module calls registration.update directly');
    console.log('PASS v1.6.3 single-owner service worker update guardrails');
})().catch(error => {
    console.error(error && error.stack || error);
    process.exit(1);
});
