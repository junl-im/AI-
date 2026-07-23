// AI Shorts Studio v1.5.24 - adaptive fingerprint diagnostics and bounded in-session analysis cache
'use strict';

(function exposeAnalysisCache(global) {
    const config = global.AIShortsRuntimeConfig || {};
    const ENGINE_VERSION = String(config.APP_VERSION || 'v1.5.24').replace(/^v/i, '');
    const BASE_SAMPLE_BYTES = Math.max(4096, Math.min(128 * 1024, Number(config.ANALYSIS_CACHE_FINGERPRINT_SAMPLE_BYTES) || 16 * 1024));
    const MAX_SAMPLE_BYTES = Math.max(BASE_SAMPLE_BYTES, Math.min(256 * 1024, Number(config.ANALYSIS_CACHE_MAX_SAMPLE_BYTES) || 128 * 1024));
    const FULL_HASH_MAX_BYTES = Math.max(BASE_SAMPLE_BYTES, Number(config.ANALYSIS_CACHE_FULL_HASH_MAX_BYTES) || 2 * 1024 * 1024);
    const METADATA_HISTORY_LIMIT = Math.max(16, Math.min(256, Number(config.ANALYSIS_CACHE_METADATA_HISTORY_LIMIT) || 64));
    const fingerprintPromises = typeof WeakMap === 'function' ? new WeakMap() : null;
    const objectIds = typeof WeakMap === 'function' ? new WeakMap() : null;
    const metadataFingerprints = new Map();
    let objectIdSequence = 0;
    let fingerprintComputations = 0;
    let fingerprintPromiseHits = 0;
    let fingerprintFailures = 0;
    let totalFingerprintMs = 0;
    let lastFingerprintMs = 0;
    let maxFingerprintMs = 0;
    let totalFingerprintBytes = 0;
    let lastFingerprintBytes = 0;
    let fullFileHashes = 0;
    let sampledHashes = 0;
    let fallbackHashes = 0;
    let collisionAvoidanceCount = 0;
    let lastFingerprintMode = 'none';
    let lastFingerprintAlgorithm = 'none';

    function safePart(value) {
        return String(value == null ? '' : value).trim().replace(/\s+/g, '_').slice(0, 240);
    }

    function nowMs() {
        return global.performance && typeof global.performance.now === 'function' ? global.performance.now() : Date.now();
    }

    function objectIdentity(file) {
        if (!file || (typeof file !== 'object' && typeof file !== 'function') || !objectIds) return '';
        if (!objectIds.has(file)) objectIds.set(file, `object-${++objectIdSequence}`);
        return objectIds.get(file);
    }

    function metadataSignature(file) {
        if (!file) return '';
        return [file.name || '', file.type || '', file.webkitRelativePath || '', Number(file.size) || 0, Number(file.lastModified) || 0].map(safePart).join('::');
    }

    function rememberMetadataFingerprint(file, fingerprint) {
        const signature = metadataSignature(file);
        if (!signature || !fingerprint) return;
        const previous = metadataFingerprints.get(signature);
        if (previous && previous !== fingerprint) collisionAvoidanceCount += 1;
        if (metadataFingerprints.has(signature)) metadataFingerprints.delete(signature);
        metadataFingerprints.set(signature, fingerprint);
        while (metadataFingerprints.size > METADATA_HISTORY_LIMIT) metadataFingerprints.delete(metadataFingerprints.keys().next().value);
    }

    function makeFileKey(file, fileMeta, budget) {
        const meta = fileMeta || {};
        const fingerprint = meta.contentFingerprint || meta.fingerprint || objectIdentity(file) || 'no-fingerprint';
        const parts = [
            file && file.name || meta.name || 'unknown',
            file && file.type || meta.type || '',
            file && file.webkitRelativePath || meta.relativePath || '',
            file && file.size || meta.size || 0,
            file && file.lastModified || meta.lastModified || 0,
            meta.duration ? Math.round(Number(meta.duration) * 10) / 10 : 0,
            fingerprint,
            budget && budget.tier || 'balanced',
            budget && budget.analysisSampleRate || 0,
            budget && budget.motionSamples || 0,
            budget && budget.cacheNamespace || `engine-v${ENGINE_VERSION}`
        ];
        return parts.map(safePart).join('::');
    }

    function fnv1a(bytes) {
        let hash = 0x811c9dc5;
        for (let index = 0; index < bytes.length; index += 1) {
            hash ^= bytes[index];
            hash = Math.imul(hash, 0x01000193) >>> 0;
        }
        return hash.toString(16).padStart(8, '0');
    }

    async function digestBytes(bytes) {
        const subtle = global.crypto && global.crypto.subtle;
        if (subtle && typeof subtle.digest === 'function') {
            try {
                const digest = new Uint8Array(await subtle.digest('SHA-256', bytes));
                return { hash: Array.from(digest, value => value.toString(16).padStart(2, '0')).join(''), algorithm: 'sha256' };
            } catch (_) { /* fallback below */ }
        }
        fallbackHashes += 1;
        return { hash: fnv1a(bytes), algorithm: 'fnv1a' };
    }

    function fingerprintPlan(size) {
        const normalizedSize = Math.max(0, Number(size) || 0);
        if (normalizedSize <= FULL_HASH_MAX_BYTES) {
            return Object.freeze({ mode: 'full', chunkSize: normalizedSize, segments: 1, starts: [0] });
        }
        let segments = 5;
        let chunkSize = BASE_SAMPLE_BYTES;
        if (normalizedSize > 512 * 1024 * 1024) {
            segments = 9;
            chunkSize = MAX_SAMPLE_BYTES;
        } else if (normalizedSize > 64 * 1024 * 1024) {
            segments = 7;
            chunkSize = Math.min(MAX_SAMPLE_BYTES, BASE_SAMPLE_BYTES * 4);
        } else if (normalizedSize > 16 * 1024 * 1024) {
            segments = 7;
            chunkSize = Math.min(MAX_SAMPLE_BYTES, BASE_SAMPLE_BYTES * 2);
        }
        chunkSize = Math.min(chunkSize, normalizedSize);
        const span = Math.max(0, normalizedSize - chunkSize);
        const starts = Array.from({ length: segments }, (_, index) => segments === 1 ? 0 : Math.round((span * index) / (segments - 1)));
        return Object.freeze({ mode: 'sampled', chunkSize, segments: starts.length, starts: Array.from(new Set(starts)) });
    }

    function joinChunks(chunks, starts) {
        const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const joined = new Uint8Array(total + starts.length * 8);
        let offset = 0;
        starts.forEach((start, index) => {
            const view = new DataView(joined.buffer, offset, 8);
            view.setUint32(0, Math.floor(start / 0x100000000), false);
            view.setUint32(4, start >>> 0, false);
            offset += 8;
            const chunk = chunks[index];
            if (chunk) {
                joined.set(chunk, offset);
                offset += chunk.length;
            }
        });
        return joined.subarray(0, offset);
    }

    function recordFingerprintMetric(startedAt, bytes, plan, algorithm) {
        const elapsed = Math.max(0, nowMs() - startedAt);
        fingerprintComputations += 1;
        totalFingerprintMs += elapsed;
        lastFingerprintMs = elapsed;
        maxFingerprintMs = Math.max(maxFingerprintMs, elapsed);
        totalFingerprintBytes += bytes;
        lastFingerprintBytes = bytes;
        lastFingerprintMode = plan.mode;
        lastFingerprintAlgorithm = algorithm;
        if (plan.mode === 'full') fullFileHashes += 1;
        else sampledHashes += 1;
    }

    async function computeFileFingerprint(file) {
        if (!file || typeof file.slice !== 'function' || !Number.isFinite(Number(file.size)) || Number(file.size) <= 0) return '';
        if (fingerprintPromises && fingerprintPromises.has(file)) {
            fingerprintPromiseHits += 1;
            return fingerprintPromises.get(file);
        }
        const task = (async () => {
            const startedAt = nowMs();
            const size = Math.max(0, Number(file.size) || 0);
            const plan = fingerprintPlan(size);
            const chunks = [];
            const starts = [];
            let total = 0;
            for (const start of plan.starts) {
                const blob = file.slice(start, Math.min(size, start + plan.chunkSize));
                if (!blob || typeof blob.arrayBuffer !== 'function') continue;
                const bytes = new Uint8Array(await blob.arrayBuffer());
                starts.push(start);
                chunks.push(bytes);
                total += bytes.length;
            }
            if (!total) throw new Error('파일 지문 표본을 읽지 못했습니다.');
            const payload = plan.mode === 'full' && chunks.length === 1 ? chunks[0] : joinChunks(chunks, starts);
            const digest = await digestBytes(payload);
            const fingerprint = `${digest.algorithm}-${plan.mode}:${digest.hash}:${size}:${starts.length}x${plan.chunkSize}`;
            recordFingerprintMetric(startedAt, total, plan, digest.algorithm);
            rememberMetadataFingerprint(file, fingerprint);
            return fingerprint;
        })().catch(() => {
            fingerprintFailures += 1;
            return '';
        });
        if (fingerprintPromises) fingerprintPromises.set(file, task);
        return task;
    }

    async function makeFileKeyAsync(file, fileMeta, budget) {
        const meta = Object.assign({}, fileMeta || {});
        if (!meta.contentFingerprint && !meta.fingerprint) meta.contentFingerprint = await computeFileFingerprint(file);
        return makeFileKey(file, meta, budget);
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

    function fingerprintStats() {
        return Object.freeze({
            computations: fingerprintComputations,
            promiseHits: fingerprintPromiseHits,
            failures: fingerprintFailures,
            averageMs: fingerprintComputations ? Math.round((totalFingerprintMs / fingerprintComputations) * 10) / 10 : 0,
            lastMs: Math.round(lastFingerprintMs * 10) / 10,
            maxMs: Math.round(maxFingerprintMs * 10) / 10,
            totalBytes: totalFingerprintBytes,
            lastBytes: lastFingerprintBytes,
            fullFileHashes,
            sampledHashes,
            fallbackHashes,
            collisionAvoidanceCount,
            metadataHistorySize: metadataFingerprints.size,
            fullHashMaxBytes: FULL_HASH_MAX_BYTES,
            baseSampleBytes: BASE_SAMPLE_BYTES,
            maxSampleBytes: MAX_SAMPLE_BYTES,
            lastMode: lastFingerprintMode,
            lastAlgorithm: lastFingerprintAlgorithm
        });
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
        let manualPruned = 0;
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
            entry.lastAccessAt = now;
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
            store.set(key, { createdAt: now, lastAccessAt: now, value: cloneValue(value) });
            while (store.size > maxItems) {
                store.delete(store.keys().next().value);
                evictions += 1;
            }
        }

        function prune(pruneOptions) {
            const settings = pruneOptions || {};
            const now = Date.now();
            removeExpired(now);
            const maxIdleMs = Math.max(0, Number(settings.maxIdleMs) || 0);
            if (maxIdleMs) {
                for (const [key, entry] of store.entries()) {
                    if (now - (entry.lastAccessAt || entry.createdAt) <= maxIdleMs) continue;
                    store.delete(key);
                    manualPruned += 1;
                }
            }
            const targetItems = Math.max(0, Number.isFinite(Number(settings.maxItems)) ? Number(settings.maxItems) : maxItems);
            while (store.size > targetItems) {
                store.delete(store.keys().next().value);
                manualPruned += 1;
            }
            return stats();
        }

        function clear() {
            store.clear();
            hits = 0;
            misses = 0;
            evictions = 0;
            expired = 0;
            manualPruned = 0;
            lastHitAgeMs = 0;
        }

        function stats() {
            const now = Date.now();
            removeExpired(now);
            const total = hits + misses;
            const ages = Array.from(store.values(), entry => Math.max(0, now - entry.createdAt));
            return Object.freeze({
                size: store.size,
                limit: maxItems,
                maxAgeMs,
                hits,
                misses,
                evictions,
                expired,
                manualPruned,
                lastHitAgeMs,
                oldestAgeMs: ages.length ? Math.max(...ages) : 0,
                cloneSafe: true,
                fingerprintedKeys: true,
                adaptiveFingerprinting: true,
                fingerprintSampleBytes: BASE_SAMPLE_BYTES,
                hitRate: total ? Math.round((hits / total) * 100) : 0,
                fingerprint: fingerprintStats()
            });
        }

        return Object.freeze({ get, set, prune, clear, stats, makeFileKey, makeFileKeyAsync });
    }

    global.AIShortsAnalysisCache = Object.freeze({
        createAnalysisCache,
        makeFileKey,
        makeFileKeyAsync,
        computeFileFingerprint,
        fingerprintPlan,
        fingerprintStats,
        cloneValue
    });
})(window);
