// AI Shorts Studio v0.9.5 - lightweight in-session analysis cache
'use strict';

(function exposeAnalysisCache(global) {
    function makeFileKey(file, fileMeta, budget) {
        const meta = fileMeta || {};
        const parts = [
            file && file.name || meta.name || 'unknown',
            file && file.size || meta.size || 0,
            file && file.lastModified || meta.lastModified || 0,
            meta.duration ? Math.round(Number(meta.duration) * 10) / 10 : 0,
            budget && budget.tier || 'balanced'
        ];
        return parts.map(item => String(item).replace(/\s+/g, '_')).join('::');
    }

    function createAnalysisCache(limit) {
        const maxItems = Math.max(1, Number(limit) || 4);
        const store = new Map();
        let hits = 0;
        let misses = 0;

        function get(key) {
            if (!key || !store.has(key)) {
                misses += 1;
                return null;
            }
            const value = store.get(key);
            store.delete(key);
            store.set(key, value);
            hits += 1;
            return value;
        }

        function set(key, value) {
            if (!key || !value) return;
            if (store.has(key)) store.delete(key);
            store.set(key, value);
            while (store.size > maxItems) {
                const oldest = store.keys().next().value;
                store.delete(oldest);
            }
        }

        function clear() {
            store.clear();
            hits = 0;
            misses = 0;
        }

        function stats() {
            const total = hits + misses;
            return Object.freeze({
                size: store.size,
                limit: maxItems,
                hits,
                misses,
                hitRate: total ? Math.round((hits / total) * 100) : 0
            });
        }

        return Object.freeze({ get, set, clear, stats, makeFileKey });
    }

    global.AIShortsAnalysisCache = Object.freeze({ createAnalysisCache, makeFileKey });
})(window);
