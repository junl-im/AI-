#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const storageSource = fs.readFileSync(path.join(root, 'src/storage/storage-manager.js'), 'utf8');
const sessionSource = fs.readFileSync(path.join(root, 'src/ui/session-continuity.js'), 'utf8');
const values = new Map();
const primary = 'ai-shorts-session-continuity-v112';
values.set(primary, JSON.stringify({ app: 'AI Shorts Studio', schemaVersion: 3, savedAt: '2026-01-01T00:00:00.000Z', recommendations: [{ id: 'old', start: 0, end: 10, duration: 10 }], selectedRecommendationId: 'old', captions: [], settings: {}, copy: {} }));
const localStorage = {
    get length() { return values.size; },
    key(index) { return [...values.keys()][index] || null; },
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
};
const state = { fileMeta: { name: 'clip.mp4', size: 10, duration: 10 }, recommendations: [{ id: 'new', start: 1, end: 9, duration: 8 }], selectedRecommendationId: 'new', selectedRange: { start: 1, end: 9 }, captions: [], settings: {} };
const document = { readyState: 'loading', hidden: false, body: { dataset: {} }, getElementById() { return null; }, querySelector() { return null; }, addEventListener() {}, dispatchEvent() {} };
const projectService = {
    CURRENT_SCHEMA_VERSION: 4,
    parseProjectText(text) { const parsed = JSON.parse(text); if (parsed.app !== 'AI Shorts Studio') throw new Error('bad app'); parsed.schemaVersion = 4; parsed.recommendations = parsed.recommendations || []; parsed.captions = parsed.captions || []; return parsed; },
    createProjectSnapshot(current) { return { app: 'AI Shorts Studio', schemaVersion: 4, fileMeta: current.fileMeta, fileName: current.fileMeta.name, recommendations: current.recommendations, selectedRecommendationId: current.selectedRecommendationId, selectedRange: current.selectedRange, captions: [], settings: {}, copy: {} }; }
};
const diagnostics = [];
const window = {
    window: null, document, localStorage, navigator: {}, caches: { async keys() { return []; } }, CustomEvent: function CustomEvent() {},
    AIShortsRuntimeConfig: { APP_VERSION: 'v1.5.26', BUILD_KEY: '1.5.26-adaptive-cache-audit-protected-recovery', SESSION_SCHEMA_VERSION: 4, SESSION_BACKUP_COUNT: 2, SESSION_BACKUP_MAX_CHARS: 750000 },
    AIShortsProjectService: projectService,
    AIShortsAppState: { state, addDiagnostic(item) { diagnostics.push(item); }, saveSettings() {} },
    setTimeout, clearTimeout, setInterval() { return 1; }, clearInterval() {}, addEventListener() {}
};
window.window = window;
const context = vm.createContext({ window, document, localStorage, navigator: window.navigator, caches: window.caches, CustomEvent: window.CustomEvent, console, Object, String, Number, Math, Date, Set, Map, Promise, JSON, Blob, setTimeout, clearTimeout });
vm.runInContext(storageSource, context, { filename: 'storage-manager.js' });
vm.runInContext(sessionSource, context, { filename: 'session-continuity.js' });
const api = window.AIShortsSessionContinuity;
const migrated = api.loadSnapshot();
if (!migrated || migrated.schemaVersion !== 4 || migrated.session.sourceSchemaVersion !== 3) throw new Error('v3 session must migrate to schema v4');
if (JSON.parse(values.get(primary)).schemaVersion !== 4) throw new Error('migrated session must repair the primary record');
if (!api.saveSnapshotNow('test')) throw new Error('new schema session save failed');
const backupKey = api.BACKUP_KEYS[0];
if (!values.has(backupKey)) throw new Error('previous valid session must rotate into backup slot 1');
values.set(primary, '{broken');
const recovered = api.loadSnapshot();
if (!recovered || recovered.app !== 'AI Shorts Studio') throw new Error('damaged primary must recover from a valid rotating backup');
if (!diagnostics.some(item => item.type === 'session-schema-migrated') || !diagnostics.some(item => item.type === 'session-backup-recovered')) throw new Error('migration and backup recovery diagnostics are required');
console.log('PASS session schema v4 migration, rotating backup, and damaged-primary recovery');
