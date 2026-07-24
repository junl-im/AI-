// AI Shorts Studio v1.6.2 - quota-aware local and cache storage coordinator
'use strict';

(function exposeStorageManager(global) {
    if (global.AIShortsStorageManager) return;
    const config = global.AIShortsRuntimeConfig || {};
    const LOCAL_PREFIX = 'ai-shorts-';
    const CACHE_PREFIX = 'ai-shorts-studio-shell-';
    const WARNING_RATIO = Math.max(0.5, Math.min(0.95, Number(config.STORAGE_WARNING_RATIO) || 0.8));
    const CRITICAL_RATIO = Math.max(WARNING_RATIO, Math.min(0.99, Number(config.STORAGE_CRITICAL_RATIO) || 0.92));
    const ESTIMATE_REFRESH_MS = Math.max(5000, Number(config.STORAGE_ESTIMATE_REFRESH_MS) || 60000);
    const listeners = new Set();
    let lastEstimate = Object.freeze({ supported: false, usage: 0, quota: 0, ratio: 0, localStorageBytes: 0, cacheCount: 0, level: 'unknown', at: '' });
    let estimatePromise = null;
    let lastEstimateAt = 0;

    function addDiagnostic(event) {
        const store = global.AIShortsAppState;
        if (store && typeof store.addDiagnostic === 'function') store.addDiagnostic(event);
    }

    function isQuotaError(error) {
        if (!error) return false;
        const name = String(error.name || '');
        const code = Number(error.code || 0);
        const message = String(error.message || '');
        return name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED' || code === 22 || code === 1014 || /quota|storage.*full|exceeded/i.test(message);
    }

    function safeGet(key, fallback) {
        try {
            const value = global.localStorage && global.localStorage.getItem(String(key));
            return value == null ? (fallback == null ? null : fallback) : value;
        } catch (error) {
            addDiagnostic({ type: 'storage-read-error', key: String(key), message: error && error.message || String(error) });
            return fallback == null ? null : fallback;
        }
    }

    function safeRemove(key) {
        try {
            if (global.localStorage) global.localStorage.removeItem(String(key));
            return true;
        } catch (error) {
            addDiagnostic({ type: 'storage-remove-error', key: String(key), message: error && error.message || String(error) });
            return false;
        }
    }

    function listLocalKeys() {
        const storage = global.localStorage;
        if (!storage) return [];
        const keys = [];
        try {
            for (let index = 0; index < Number(storage.length || 0); index += 1) {
                const key = storage.key(index);
                if (key != null) keys.push(String(key));
            }
        } catch (_) { /* optional storage */ }
        return keys;
    }

    function localStorageBytes() {
        let bytes = 0;
        listLocalKeys().forEach(key => {
            const value = safeGet(key, '') || '';
            bytes += (key.length + value.length) * 2;
        });
        return bytes;
    }

    function cleanupLocal(options) {
        const opts = options || {};
        const preserve = new Set((opts.preserveKeys || []).map(String));
        const candidates = listLocalKeys().filter(key => key.startsWith(LOCAL_PREFIX) && !preserve.has(key));
        const backupKeys = candidates.filter(key => /session-continuity.*backup/i.test(key)).sort().reverse();
        const legacySessionKeys = candidates.filter(key => /session-continuity-v\d+/i.test(key) && !/backup/i.test(key) && key !== String(opts.currentSessionKey || ''));
        const removable = [...backupKeys, ...legacySessionKeys];
        const maxRemovals = Math.max(0, Number(opts.maxRemovals == null ? removable.length : opts.maxRemovals));
        const removed = [];
        removable.slice(0, maxRemovals).forEach(key => {
            if (safeRemove(key)) removed.push(key);
        });
        if (removed.length) addDiagnostic({ type: 'storage-local-cleanup', reason: opts.reason || 'manual', removed: removed.slice(0, 12), removedCount: removed.length });
        return Object.freeze({ removed, removedCount: removed.length });
    }

    function safeSet(key, value, options) {
        const opts = options || {};
        const storageKey = String(key);
        const text = String(value);
        try {
            if (!global.localStorage) throw new Error('localStorage unavailable');
            global.localStorage.setItem(storageKey, text);
            return Object.freeze({ ok: true, cleaned: false, quota: false, bytes: text.length * 2 });
        } catch (error) {
            const quota = isQuotaError(error);
            if (quota && opts.cleanup !== false) {
                cleanupLocal({
                    reason: 'quota-retry',
                    preserveKeys: [storageKey].concat(opts.preserveKeys || []),
                    currentSessionKey: opts.currentSessionKey,
                    maxRemovals: Number(opts.maxCleanupRemovals || 3)
                });
                try {
                    global.localStorage.setItem(storageKey, text);
                    addDiagnostic({ type: 'storage-write-recovered', key: storageKey, bytes: text.length * 2 });
                    return Object.freeze({ ok: true, cleaned: true, quota: true, bytes: text.length * 2 });
                } catch (retryError) {
                    error = retryError;
                }
            }
            addDiagnostic({ type: quota ? 'storage-quota-error' : 'storage-write-error', key: storageKey, bytes: text.length * 2, message: error && error.message || String(error) });
            return Object.freeze({ ok: false, cleaned: quota, quota, bytes: text.length * 2, error });
        }
    }

    function levelFor(ratio, quota) {
        if (!quota) return 'unknown';
        if (ratio >= CRITICAL_RATIO) return 'critical';
        if (ratio >= WARNING_RATIO) return 'warning';
        return 'ok';
    }

    function notify(snapshot) {
        listeners.forEach(listener => { try { listener(snapshot); } catch (_) { /* isolated */ } });
        if (global.document && typeof global.document.dispatchEvent === 'function' && typeof global.CustomEvent === 'function') {
            global.document.dispatchEvent(new global.CustomEvent('ai-shorts-storage-status', { detail: snapshot }));
        }
    }

    async function cacheNames() {
        try { return global.caches && typeof global.caches.keys === 'function' ? await global.caches.keys() : []; }
        catch (_) { return []; }
    }

    async function estimate(options) {
        const opts = options || {};
        const now = Date.now();
        if (!opts.force && estimatePromise) return estimatePromise;
        if (!opts.force && lastEstimateAt && now - lastEstimateAt < ESTIMATE_REFRESH_MS) return lastEstimate;
        estimatePromise = (async () => {
            let usage = 0;
            let quota = 0;
            let supported = false;
            try {
                const storage = global.navigator && global.navigator.storage;
                if (storage && typeof storage.estimate === 'function') {
                    const result = await storage.estimate();
                    usage = Math.max(0, Number(result && result.usage) || 0);
                    quota = Math.max(0, Number(result && result.quota) || 0);
                    supported = true;
                }
            } catch (error) {
                addDiagnostic({ type: 'storage-estimate-error', message: error && error.message || String(error) });
            }
            const localBytes = localStorageBytes();
            if (!usage) usage = localBytes;
            const names = await cacheNames();
            const ratio = quota > 0 ? Math.min(1, usage / quota) : 0;
            lastEstimate = Object.freeze({
                supported,
                usage,
                quota,
                ratio,
                localStorageBytes: localBytes,
                cacheCount: names.filter(name => String(name).startsWith(CACHE_PREFIX)).length,
                level: levelFor(ratio, quota),
                at: new Date().toISOString()
            });
            lastEstimateAt = Date.now();
            if (lastEstimate.level === 'warning' || lastEstimate.level === 'critical') {
                addDiagnostic({ type: 'storage-pressure', level: lastEstimate.level, usage, quota, ratio: Number(ratio.toFixed(4)) });
            }
            notify(lastEstimate);
            return lastEstimate;
        })().finally(() => { estimatePromise = null; });
        return estimatePromise;
    }

    function currentCacheName() {
        return `${CACHE_PREFIX}v${String(config.BUILD_KEY || '').replace(/^v/i, '')}`;
    }

    async function cleanupCaches(options) {
        const opts = options || {};
        const keep = new Set([String(opts.keepCacheName || currentCacheName())]);
        const names = await cacheNames();
        const stale = names.filter(name => String(name).startsWith(CACHE_PREFIX) && !keep.has(String(name)));
        const removed = [];
        for (const name of stale) {
            try {
                if (await global.caches.delete(name)) removed.push(name);
            } catch (_) { /* best effort */ }
        }
        if (removed.length) addDiagnostic({ type: 'storage-cache-cleanup', reason: opts.reason || 'manual', removedCount: removed.length, removed: removed.slice(0, 8) });
        return Object.freeze({ removed, removedCount: removed.length });
    }

    async function cleanup(options) {
        const opts = options || {};
        const local = cleanupLocal(opts);
        const cachesResult = await cleanupCaches(opts);
        const snapshot = await estimate({ force: true });
        return Object.freeze({ local, caches: cachesResult, snapshot });
    }

    function subscribe(listener) {
        if (typeof listener !== 'function') return () => {};
        listeners.add(listener);
        return () => listeners.delete(listener);
    }

    function status() { return lastEstimate; }

    global.AIShortsStorageManager = Object.freeze({
        safeGet,
        safeSet,
        safeRemove,
        isQuotaError,
        listLocalKeys,
        localStorageBytes,
        cleanupLocal,
        cleanupCaches,
        cleanup,
        estimate,
        status,
        subscribe,
        currentCacheName
    });
})(window);
