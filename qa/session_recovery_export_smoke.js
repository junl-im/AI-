#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/ui/session-continuity.js'), 'utf8');

function ok(condition, message) {
    if (!condition) throw new Error(message);
    console.log(`PASS ${message}`);
}

function createHarness(raw, parseProjectText) {
    const downloads = [];
    const diagnostics = [];
    const toasts = [];
    const localStorage = {
        value: raw,
        getItem() { return this.value || ''; },
        setItem(key, value) { this.value = value; },
        removeItem() { this.value = ''; }
    };
    const document = {
        readyState: 'loading',
        hidden: false,
        body: { dataset: {} },
        addEventListener() {},
        getElementById() { return null; },
        querySelector() { return null; },
        createElement() { throw new Error('download service should own file saving'); },
        dispatchEvent() {}
    };
    const window = {
        window: null,
        document,
        localStorage,
        AIShortsRuntimeConfig: { APP_VERSION: 'v1.6.3', MAX_PROJECT_TEXT_CHARS: 2500000 },
        AIShortsAppState: { state: {}, addDiagnostic(event) { diagnostics.push(event); } },
        AIShortsProjectService: { parseProjectText },
        AIShortsDownloadService: { saveBlob(blob, filename) { downloads.push({ blob, filename }); } },
        AIShortsFeedbackUX: { toast(message, kind) { toasts.push({ message, kind }); return true; } },
        addEventListener() {},
        setTimeout,
        clearTimeout,
        setInterval,
        clearInterval
    };
    window.window = window;
    const context = vm.createContext({
        window, document, localStorage, Blob, CustomEvent: function CustomEvent() {},
        setTimeout, clearTimeout, setInterval, clearInterval, Date, JSON, Object, Array, Number, String, Boolean, Math
    });
    vm.runInContext(source, context);
    return { api: window.AIShortsSessionContinuity, downloads, diagnostics, toasts, localStorage };
}

(async () => {
    const damagedRaw = '{"broken":';
    const damaged = createHarness(damagedRaw, () => { throw new Error('invalid project JSON'); });
    const damagedResult = damaged.api.exportStoredSnapshot();
    ok(damagedResult && damagedResult.valid === false, 'damaged session export is marked invalid');
    ok(damaged.downloads.length === 1 && /damaged-session/.test(damaged.downloads[0].filename), 'damaged session creates one recovery download');
    const recovery = JSON.parse(await damaged.downloads[0].blob.text());
    ok(recovery.rawSnapshotText === damagedRaw, 'damaged recovery file preserves the exact stored text');
    ok(recovery.reason === 'invalid project JSON', 'damaged recovery file records the validation reason');
    ok(damaged.diagnostics.some(item => item.type === 'session-snapshot-export' && item.valid === false), 'damaged export is recorded in diagnostics');
    ok(damaged.toasts.some(item => /손상된 자동 저장 원문/.test(item.message)), 'damaged export gives visible user feedback');

    const validRaw = JSON.stringify({ app: 'AI Shorts Studio', schemaVersion: 3, recommendations: [{ id: 'a' }] });
    const valid = createHarness(validRaw, text => JSON.parse(text));
    const validResult = valid.api.exportStoredSnapshot();
    ok(validResult && validResult.valid === true, 'valid session export is marked valid');
    ok(/session-backup/.test(valid.downloads[0].filename), 'valid session uses a restorable backup filename');
    ok(await valid.downloads[0].blob.text() === validRaw, 'valid backup preserves directly importable session JSON');

    ok(source.includes('id="sessionExportBtn"') && source.includes("exportButton.textContent = invalidStoredRecord ? '손상 기록 저장' : '기록 백업'"), 'session panel exposes state-aware recovery export controls');
    console.log('PASS session recovery export guardrails');
})().catch(error => {
    console.error(error);
    process.exit(1);
});
