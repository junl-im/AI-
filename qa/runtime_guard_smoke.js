#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
function read(rel) { return fs.readFileSync(path.join(root, rel), 'utf8'); }
function ok(condition, message) {
    if (!condition) {
        console.error(`FAIL ${message}`);
        process.exit(1);
    }
    console.log(`PASS ${message}`);
}

function loadBrowserModule(rel, windowOverrides) {
    const window = Object.assign({
        navigator: {},
        location: { protocol: 'https:' },
        URL,
        setTimeout,
        clearTimeout,
        console
    }, windowOverrides || {});
    window.window = window;
    const context = vm.createContext({ window, URL, console, setTimeout, clearTimeout });
    vm.runInContext(read(rel), context, { filename: rel });
    return window;
}

(async () => {
    const utilsWindow = loadBrowserModule('src/utils/core-utils.js');
    const utils = utilsWindow.AIShortsCoreUtils;
    ok(utils.detectMediaKind({ name: 'clip.MP4', type: '' }) === 'video', 'extension-only video files are accepted');
    ok(utils.detectMediaKind({ name: 'track', type: 'audio/mpeg' }) === 'audio', 'MIME-only audio files are accepted');
    ok(utils.detectMediaKind({ name: 'notes.pdf', type: 'application/pdf' }) === '', 'unsupported dragged files are rejected');
    ok(utils.escapeHtml('<img src=x onerror=1>') === '&lt;img src=x onerror=1&gt;', 'HTML-sensitive user text is escaped');

    const diagnostics = [];
    let registerCalls = 0;
    let updateCalls = 0;
    const registration = { scope: 'https://example.test/', update: () => { updateCalls += 1; return Promise.resolve(); } };
    const swWindow = loadBrowserModule('src/boot/service-worker-registration.js', {
        AIShortsRuntimeConfig: { APP_VERSION: 'v-test' },
        AIShortsAppState: { addDiagnostic: event => diagnostics.push(event) },
        navigator: { serviceWorker: { register: async url => { registerCalls += 1; ok(url === 'sw.js', 'service worker uses the shell entry'); return registration; } } }
    });
    const first = await swWindow.AIShortsServiceWorkerRegistration.register();
    const second = await swWindow.AIShortsServiceWorkerRegistration.register();
    ok(first.status === 'ready' && first.version === 'v-test', 'service worker success path resolves with runtime config version');
    ok(second.status === 'ready' && registerCalls === 1, 'service worker registration is single-owned and idempotent');
    await Promise.resolve();
    ok(updateCalls === 1, 'registered service worker requests one update check');
    ok(diagnostics.some(item => item.type === 'service-worker-ready' && item.version === 'v-test'), 'service worker success diagnostic is recorded');

    const failures = [];
    let attempts = 0;
    const failWindow = loadBrowserModule('src/boot/service-worker-registration.js', {
        AIShortsRuntimeConfig: { APP_VERSION: 'v-test' },
        AIShortsAppState: { addDiagnostic: event => failures.push(event) },
        navigator: { serviceWorker: { register: async () => { attempts += 1; throw new Error('blocked'); } } }
    });
    const failedOnce = await failWindow.AIShortsServiceWorkerRegistration.register();
    const failedTwice = await failWindow.AIShortsServiceWorkerRegistration.register();
    ok(failedOnce.status === 'error' && failedTwice.status === 'error' && attempts === 2, 'failed service worker registration can be retried');
    ok(failures.filter(item => item.type === 'service-worker-error').length === 2, 'service worker failures stay diagnostic instead of unhandled');

    let insecureCalls = 0;
    const insecureWindow = loadBrowserModule('src/boot/service-worker-registration.js', {
        location: { protocol: 'http:', hostname: 'example.test' },
        navigator: { serviceWorker: { register: async () => { insecureCalls += 1; } } }
    });
    const insecureResult = await insecureWindow.AIShortsServiceWorkerRegistration.register();
    ok(insecureResult.status === 'unsupported' && insecureCalls === 0, 'insecure non-local origins skip service worker registration');

    const versionSync = read('src/boot/app-version-sync.js');
    ok(!versionSync.includes('navigator.serviceWorker.ready') && !versionSync.includes('registration.update'), 'service worker update checks have a single owner');
    const app = read('src/app.js');
    const session = read('src/ui/session-continuity.js');
    const preview = read('src/ui/candidate-preview-pro.js');
    const finish = read('src/ui/export-finish-center.js');
    const pinBoard = read('src/ui/candidate-pin-board.js');
    ok(!app.includes('runtimeConfig.APP_VERSION'), 'undefined runtimeConfig service worker reference is removed');
    ok(app.includes("type: 'unsupported-media'"), 'unsupported media rejection is wired into import flow');
    ok(!session.includes('meta.innerHTML = `${stored.fileName'), 'session file names are not injected through innerHTML');
    ok(preview.includes('heading.textContent = title') && !preview.includes('<b>${title}</b>'), 'imported candidate titles render as text');
    ok(preview.includes("card.dataset.id === targetId") && !preview.includes('querySelector(`.recommendation-card[data-id='), 'candidate preview does not interpolate imported IDs into CSS selectors');
    ok(pinBoard.includes("card.dataset.id === targetId") && !pinBoard.includes('querySelector(`.recommendation-card[data-id='), 'candidate pin board does not interpolate imported IDs into CSS selectors');
    ok(finish.includes('document.createTextNode(clampText(item.label') && !finish.includes('${clampText(item.label'), 'render job labels render as text');

    console.log('PASS v1.5.2 runtime registration, media intake, and user-text safety guardrails');
})().catch(error => {
    console.error(error && error.stack || error);
    process.exit(1);
});
