#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/storage/storage-manager.js'), 'utf8');
const values = new Map([
    ['ai-shorts-session-continuity-v112-backup-1', 'old-a'],
    ['ai-shorts-session-continuity-v112-backup-2', 'old-b'],
    ['ai-shorts-studio-v109-settings', '{}']
]);
let quotaThrown = false;
const localStorage = {
    get length() { return values.size; },
    key(index) { return [...values.keys()][index] || null; },
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    removeItem(key) { values.delete(key); },
    setItem(key, value) {
        if (key === 'ai-shorts-target' && !quotaThrown) {
            quotaThrown = true;
            const error = new Error('quota exceeded'); error.name = 'QuotaExceededError'; throw error;
        }
        values.set(key, String(value));
    }
};
const cacheNames = new Set(['ai-shorts-studio-shell-v1.5.21-old', 'ai-shorts-studio-shell-v1.6.3-stage-focus-progressive-disclosure', 'other-cache']);
const window = {
    window: null,
    localStorage,
    navigator: { storage: { async estimate() { return { usage: 80, quota: 100 }; } } },
    caches: { async keys() { return [...cacheNames]; }, async delete(name) { return cacheNames.delete(name); } },
    AIShortsRuntimeConfig: { BUILD_KEY: '1.6.3-stage-focus-progressive-disclosure', STORAGE_WARNING_RATIO: 0.8, STORAGE_CRITICAL_RATIO: 0.92 },
    document: { dispatchEvent() {} },
    CustomEvent: function CustomEvent() {}
};
window.window = window;
vm.runInContext(source, vm.createContext({ window, console, Object, String, Number, Math, Date, Set, Map, Promise }));
const manager = window.AIShortsStorageManager;
if (!manager) throw new Error('storage manager API missing');
const result = manager.safeSet('ai-shorts-target', 'saved', { maxCleanupRemovals: 2 });
if (!result.ok || !result.cleaned || !result.quota) throw new Error('quota write must clean stale backups and retry once');
if (localStorage.getItem('ai-shorts-target') !== 'saved') throw new Error('quota retry did not persist the target value');
(async () => {
    const estimate = await manager.estimate({ force: true });
    if (estimate.level !== 'warning' || estimate.ratio !== 0.8) throw new Error('storage pressure level was not calculated');
    const cleanup = await manager.cleanupCaches();
    if (cleanup.removedCount !== 1 || !cacheNames.has(manager.currentCacheName())) throw new Error('cache cleanup must remove only stale app caches');
    console.log('PASS quota-aware storage cleanup, retry, estimate, and cache retention');
})().catch(error => { console.error(error.stack || error); process.exit(1); });
