#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/ui/session-continuity.js'), 'utf8');
function ok(condition, message) { if (!condition) throw new Error(message); console.log(`PASS ${message}`); }
const values = new Map([['ai-shorts-session-continuity-v112', '{broken']]);
const downloads = [];
const localStorage = { get length() { return values.size; }, key(i) { return [...values.keys()][i] || null; }, getItem(k) { return values.get(k) || null; }, setItem(k, v) { values.set(k, String(v)); }, removeItem(k) { values.delete(k); } };
const document = { readyState: 'loading', hidden: false, body: { dataset: {} }, addEventListener() {}, getElementById() { return null; }, querySelector() { return null; }, dispatchEvent() {} };
const window = { window: null, document, localStorage, AIShortsRuntimeConfig: { APP_VERSION: 'v1.6.4', SESSION_SCHEMA_VERSION: 4, SESSION_BACKUP_COUNT: 2, SESSION_BACKUP_MAX_COUNT: 3, SESSION_RECOVERY_HISTORY_LIMIT: 20 }, AIShortsAppState: { state: {}, addDiagnostic() {} }, AIShortsProjectService: { parseProjectText() { throw new Error('damaged primary'); } }, AIShortsDownloadService: { saveBlob(blob, filename) { downloads.push({ blob, filename }); } }, AIShortsFeedbackUX: { toast() { return true; } }, addEventListener() {}, setTimeout, clearTimeout, setInterval() { return 1; }, clearInterval() {} };
window.window = window;
const context = vm.createContext({ window, document, localStorage, Blob, CustomEvent: function CustomEvent() {}, setTimeout, clearTimeout, Date, JSON, Object, Array, Number, String, Boolean, Math, console });
vm.runInContext(source, context, { filename: 'session-continuity.js' });
window.AIShortsSessionContinuity.loadSnapshot();
const result = window.AIShortsSessionContinuity.exportRecoveryDiagnostics();
ok(result && /recovery-diagnostics/.test(result.filename), 'recovery diagnostics export creates a dedicated JSON download');
(async () => {
    const payload = JSON.parse(await downloads[0].blob.text());
    ok(payload.exportType === 'session-recovery-diagnostics', 'diagnostics file declares its export contract');
    ok(payload.status.invalid && payload.recoveryHistory.some(item => item.type === 'backup-recovery-failed'), 'diagnostics include invalid status and failed recovery history');
    ok(Array.isArray(payload.backups) && !Object.prototype.hasOwnProperty.call(payload, 'rawSnapshotText'), 'diagnostics expose backup metadata without leaking raw project content');
    ok(source.includes('id="sessionDiagnosticsBtn"'), 'session panel exposes recovery diagnostics export');
    console.log('PASS bounded session recovery history and privacy-safe diagnostics export');
})().catch(error => { console.error(error); process.exit(1); });
