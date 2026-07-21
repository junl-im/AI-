// AI Shorts Studio v1.5.4 - clone-safe bounded in-session analysis cache
'use strict';

(function exposeAnalysisCache(global) {
    function makeFileKey(file, fileMeta, budget) {
        const meta = fileMeta || {};
        const parts = [
            file && file.name || meta.name || 'unknown',
            file && file.size || meta.size || 0,
            file && file.lastModified || meta.lastModified || 0,
            meta.duration ? Math.round(Number(meta.duration) * 10) / 10 : 0,
            budget && budget.tier || 'balanced',
            budget && budget.analysisSampleRate || 0,
            budget && budget.motionSamples || 0,
            budget && budget.cacheNamespace || 'engine-v1.5.4'
        ];
        return parts.map(item => String(item).replace(/\s+/g, '_')).join('::');
    }

    function cloneValue(value) {
        if (value == null) return value;
        if (typeof global.structuredClone === 'function') {
            try { return global.structuredClone(value); } catch (_) { /* fallback below */ }
        }
        if (ArrayBuffer.isView(value)) return new value.constructor(value);
        if (value instanceof ArrayBuffer) return value.slice(0);
        if (Array.isArray(value)) return value.map(cloneValue);
        if (typeof value === 'object') {
            const output = {};
            Object.keys(value).forEach(key => { output[key] = cloneValue(value[key]); });
            return output;
        }
        return value;
    }

    function createAnalysisCache(limit, options) {
        const maxItems = Math.max(1, Number(limit) || 4);
        const opts = options || {};
        const maxAgeMs = Math.max(30_000, Number(opts.maxAgeMs) || 30 * 60 * 1000);
        const store = new Map();
        let hits = 0;
        let misses = 0;
        let evictions = 0;
        let expired = 0;
        let lastHitAgeMs = 0;

        function removeExpired(now) {
            for (const [key, entry] of store.entries()) {
                if (now - entry.createdAt <= maxAgeMs) continue;
                store.delete(key);
                expired += 1;
            }
        }

        function get(key) {
            const now = Date.now();
            removeExpired(now);
            if (!key || !store.has(key)) {
                misses += 1;
                return null;
            }
            const entry = store.get(key);
            store.delete(key);
            store.set(key, entry);
            hits += 1;
            lastHitAgeMs = Math.max(0, now - entry.createdAt);
            return cloneValue(entry.value);
        }

        function set(key, value) {
            if (!key || !value) return;
            const now = Date.now();
            removeExpired(now);
            if (store.has(key)) store.delete(key);
            store.set(key, { createdAt: now, value: cloneValue(value) });
            while (store.size > maxItems) {
                const oldest = store.keys().next().value;
                store.delete(oldest);
                evictions += 1;
            }
        }

        function clear() {
            store.clear();
            hits = 0;
            misses = 0;
            evictions = 0;
            expired = 0;
            lastHitAgeMs = 0;
        }

        function stats() {
            removeExpired(Date.now());
            const total = hits + misses;
            return Object.freeze({
                size: store.size,
                limit: maxItems,
                maxAgeMs,
                hits,
                misses,
                evictions,
                expired,
                lastHitAgeMs,
                cloneSafe: true,
                hitRate: total ? Math.round((hits / total) * 100) : 0
            });
        }

        return Object.freeze({ get, set, clear, stats, makeFileKey });
    }

    global.AIShortsAnalysisCache = Object.freeze({ createAnalysisCache, makeFileKey, cloneValue });
})(window);
