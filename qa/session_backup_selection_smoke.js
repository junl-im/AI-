#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const sessionSource = fs.readFileSync(path.join(root, 'src/ui/session-continuity.js'), 'utf8');
const values = new Map();
const primaryKey = 'ai-shorts-session-continuity-v112';
const backupKey = `${primaryKey}-backup-1`;
values.set(primaryKey, JSON.stringify({ app: 'AI Shorts Studio', schemaVersion: 4, savedAt: '2026-07-23T01:00:00.000Z', fileName: 'latest.mp4', recommendations: [{ id: 'latest', start: 0, end: 15 }], selectedRecommendationId: 'latest', captions: [], settings: {}, copy: {} }));
values.set(backupKey, JSON.stringify({ app: 'AI Shorts Studio', schemaVersion: 4, savedAt: '2026-07-22T01:00:00.000Z', fileName: 'backup.mp4', recommendations: [{ id: 'backup', start: 10, end: 25 }], selectedRecommendationId: 'backup', captions: [], settings: {}, copy: {} }));
const localStorage = { get length() { return values.size; }, key(i) { return [...values.keys()][i] || null; }, getItem(key) { return values.has(key) ? values.get(key) : null; }, setItem(key, value) { values.set(key, String(value)); }, removeItem(key) { values.delete(key); } };
const state = { recommendations: [], selectedRecommendationId: '', settings: {}, captions: [] };
const document = { readyState: 'loading', hidden: false, body: { dataset: {} }, getElementById() { return null; }, querySelector() { return null; }, addEventListener() {}, dispatchEvent() {} };
const history = [];
const window = {
    window: null, document, localStorage, navigator: {}, CustomEvent: function CustomEvent() {},
    AIShortsRuntimeConfig: { APP_VERSION: 'v1.6.1', SESSION_SCHEMA_VERSION: 4, SESSION_BACKUP_MIN_COUNT: 1, SESSION_BACKUP_COUNT: 2, SESSION_BACKUP_MAX_COUNT: 3 },
    AIShortsProjectService: {
        CURRENT_SCHEMA_VERSION: 4,
        parseProjectText(text) { return JSON.parse(text); },
        applyProjectSnapshot(current, snapshot) { current.recommendations = snapshot.recommendations; current.selectedRecommendationId = snapshot.selectedRecommendationId; current.settings = snapshot.settings || {}; current.captions = snapshot.captions || []; }
    },
    AIShortsAppState: { state, addDiagnostic(item) { history.push(item); }, saveSettings() {} },
    setTimeout, clearTimeout, setInterval() { return 1; }, clearInterval() {}, addEventListener() {}
};
window.window = window;
const context = vm.createContext({ window, document, localStorage, navigator: window.navigator, CustomEvent: window.CustomEvent, console, Object, String, Number, Math, Date, Set, Map, Promise, JSON, Blob, setTimeout, clearTimeout });
vm.runInContext(sessionSource, context, { filename: 'session-continuity.js' });
const api = window.AIShortsSessionContinuity;
const available = api.listAvailableSnapshots();
if (available.length !== 2 || !available.some(item => item.kind === 'backup' && item.key === backupKey && item.valid)) throw new Error('primary and backup restore points must be listed with validation metadata');
if (!api.restoreSnapshot(backupKey)) throw new Error('a specifically selected backup must restore successfully');
if (state.selectedRecommendationId !== 'backup' || state.recommendations[0].id !== 'backup') throw new Error('selected backup contents must be applied instead of the latest primary snapshot');
const status = api.getStatus();
if (status.selectedRestoreSource !== backupKey || status.selectableSnapshotCount !== 2) throw new Error('session status must expose the selected restore source and available restore count');
if (!api.readRecoveryHistory().some(item => item.type === 'session-restored' && item.source === backupKey && item.selectedBackup)) throw new Error('selected backup restoration must be recorded in recovery history');
console.log('PASS selectable validated session backup restoration');
