// AI Shorts Studio v1.5.27 - contract-aware persistent cache invalidation and bounded diagnostics
'use strict';

(function exposeAnalysisCache(global) {
    const config = global.AIShortsRuntimeConfig || {};
    const ENGINE_VERSION = String(config.APP_VERSION || 'v1.5.27').replace(/^v/i, '');
    const BASE_SAMPLE_BYTES = Math.max(4096, Math.min(128 * 1024, Number(config.ANALYSIS_CACHE_FINGERPRINT_SAMPLE_BYTES) || 16 * 1024));
    const MAX_SAMPLE_BYTES = Math.max(BASE_SAMPLE_BYTES, Math.min(256 * 1024, Number(config.ANALYSIS_CACHE_MAX_SAMPLE_BYTES) || 128 * 1024));
    const FULL_HASH_MAX_BYTES = Math.max(BASE_SAMPLE_BYTES, Number(config.ANALYSIS_CACHE_FULL_HASH_MAX_BYTES) || 2 * 1024 * 1024);
    const METADATA_HISTORY_LIMIT = Math.max(16, Math.min(256, Number(config.ANALYSIS_CACHE_METADATA_HISTORY_LIMIT) || 64));
    const DIAGNOSTIC_EVENT_LIMIT = Math.max(20, Math.min(200, Number(config.ANALYSIS_CACHE_DIAGNOSTIC_EVENT_LIMIT) || 80));
    const fingerprintPromises = typeof WeakMap === 'function' ? new WeakMap() : null;
    const objectIds = typeof WeakMap === 'function' ? new WeakMap() : null;
    const metadataFingerprints = new Map();
    const diagnosticEvents = [];
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

    function nowIso() {
        return new Date().toISOString();
    }

    function textToken(value) {
        const text = String(value || '');
        let hash = 0x811c9dc5;
        for (let index = 0; index < text.length; index += 1) {
            hash ^= text.charCodeAt(index) & 0xff;
            hash = Math.imul(hash, 0x01000193) >>> 0;
            hash ^= text.charCodeAt(index) >>> 8;
            hash = Math.imul(hash, 0x01000193) >>> 0;
        }
        return hash.toString(16).padStart(8, '0');
    }

    function recordEvent(type, detail) {
        const source = detail || {};
        const safe = { type: String(type || 'unknown'), at: nowIso() };
        ['layer', 'reason', 'mode', 'algorithm', 'state'].forEach(key => {
            if (source[key] != null) safe[key] = String(source[key]).slice(0, 80);
        });
        ['size', 'bytes', 'elapsedMs', 'count', 'limit', 'ageMs'].forEach(key => {
            if (Number.isFinite(Number(source[key]))) safe[key] = Math.max(0, Number(source[key]));
        });
        if (source.key) safe.keyToken = textToken(source.key);
        diagnosticEvents.unshift(Object.freeze(safe));
        if (diagnosticEvents.length > DIAGNOSTIC_EVENT_LIMIT) diagnosticEvents.length = DIAGNOSTIC_EVENT_LIMIT;
        return safe;
    }

    function getDiagnosticEvents(limit) {
        const max = Math.max(1, Math.min(DIAGNOSTIC_EVENT_LIMIT, Number(limit) || DIAGNOSTIC_EVENT_LIMIT));
        return diagnosticEvents.slice(0, max).map(event => Object.assign({}, event));
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
        if (previous && previous !== fingerprint) {
            collisionAvoidanceCount += 1;
            recordEvent('fingerprint-collision-avoided', { reason: 'same-metadata-different-content', count: collisionAvoidanceCount });
        }
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
        recordEvent('fingerprint-computed', { mode: plan.mode, algorithm, bytes, elapsedMs: Math.round(elapsed * 10) / 10, count: plan.starts.length });
    }

    async function computeFileFingerprint(file) {
        if (!file || typeof file.slice !== 'function' || !Number.isFinite(Number(file.size)) || Number(file.size) <= 0) return '';
        if (fingerprintPromises && fingerprintPromises.has(file)) {
            fingerprintPromiseHits += 1;
            recordEvent('fingerprint-promise-hit', { count: fingerprintPromiseHits });
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
        })().catch(error => {
            fingerprintFailures += 1;
            recordEvent('fingerprint-failed', { reason: error && error.message || 'unknown', count: fingerprintFailures });
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
                recordEvent('memory-cache-expired', { layer: 'memory', key, ageMs: now - entry.createdAt, size: store.size });
            }
        }

        function get(key) {
            const now = Date.now();
            removeExpired(now);
            if (!key || !store.has(key)) {
                misses += 1;
                recordEvent('memory-cache-miss', { layer: 'memory', key, size: store.size });
                return null;
            }
            const entry = store.get(key);
            entry.lastAccessAt = now;
            store.delete(key);
            store.set(key, entry);
            hits += 1;
            lastHitAgeMs = Math.max(0, now - entry.createdAt);
            recordEvent('memory-cache-hit', { layer: 'memory', key, ageMs: lastHitAgeMs, size: store.size });
            return cloneValue(entry.value);
        }

        function set(key, value) {
            if (!key || !value) return;
            const now = Date.now();
            removeExpired(now);
            if (store.has(key)) store.delete(key);
            store.set(key, { createdAt: now, lastAccessAt: now, value: cloneValue(value) });
            recordEvent('memory-cache-write', { layer: 'memory', key, size: store.size, limit: maxItems });
            while (store.size > maxItems) {
                const oldestKey = store.keys().next().value;
                store.delete(oldestKey);
                evictions += 1;
                recordEvent('memory-cache-evicted', { layer: 'memory', key: oldestKey, reason: 'lru-limit', size: store.size, limit: maxItems });
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
                    recordEvent('memory-cache-pruned', { layer: 'memory', key, reason: 'idle-limit', size: store.size });
                }
            }
            const targetItems = Math.max(0, Number.isFinite(Number(settings.maxItems)) ? Number(settings.maxItems) : maxItems);
            while (store.size > targetItems) {
                const oldestKey = store.keys().next().value;
                store.delete(oldestKey);
                manualPruned += 1;
                recordEvent('memory-cache-pruned', { layer: 'memory', key: oldestKey, reason: 'manual-limit', size: store.size, limit: targetItems });
            }
            return stats();
        }

        function clear() {
            const removed = store.size;
            store.clear();
            hits = 0;
            misses = 0;
            evictions = 0;
            expired = 0;
            manualPruned = 0;
            lastHitAgeMs = 0;
            recordEvent('memory-cache-cleared', { layer: 'memory', count: removed });
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
                diagnosticEventCount: diagnosticEvents.length,
                fingerprint: fingerprintStats()
            });
        }

        function diagnostics() {
            return Object.freeze({ stats: stats(), recentEvents: getDiagnosticEvents() });
        }

        return Object.freeze({ get, set, prune, clear, stats, diagnostics, makeFileKey, makeFileKeyAsync });
    }

    function estimateValueBytes(value) {
        try {
            const text = JSON.stringify(value);
            return text ? text.length * 2 : 0;
        } catch (_) { return 0; }
    }

    function cacheProfileFromKey(key, metadata) {
        const source = metadata && typeof metadata === 'object' ? metadata : {};
        const parts = String(key || '').split('::');
        return Object.freeze({
            appVersion: String(source.appVersion || ENGINE_VERSION),
            contractVersion: String(source.contractVersion || source.analysisContract || '1'),
            tier: String(source.tier || source.budgetTier || parts[7] || 'balanced'),
            analysisSampleRate: Math.max(0, Number(source.analysisSampleRate != null ? source.analysisSampleRate : parts[8]) || 0),
            motionSamples: Math.max(0, Number(source.motionSamples != null ? source.motionSamples : parts[9]) || 0),
            optionSignature: String(source.optionSignature || source.optionsToken || ''),
            cacheNamespace: String(source.cacheNamespace || parts[10] || '')
        });
    }

    function createPersistentAnalysisCache(options) {
        const opts = options || {};
        const indexedDB = global.indexedDB;
        const supported = Boolean(indexedDB && typeof indexedDB.open === 'function');
        const enabled = opts.enabled !== false && supported;
        const databaseName = String(opts.databaseName || `ai-shorts-analysis-cache-v${ENGINE_VERSION.replace(/[^0-9.]/g, '') || '1'}`);
        const storeName = String(opts.storeName || 'analysis-results');
        const baseMaxItems = Math.max(1, Math.min(32, Number(opts.maxItems) || 8));
        const baseMaxBytes = Math.max(1024 * 1024, Number(opts.maxBytes) || 16 * 1024 * 1024);
        const minItems = Math.max(1, Math.min(baseMaxItems, Number(opts.minItems) || 2));
        const minBytes = Math.max(512 * 1024, Math.min(baseMaxBytes, Number(opts.minBytes) || 4 * 1024 * 1024));
        const warningRatio = Math.max(0.5, Math.min(0.95, Number(opts.warningRatio) || 0.8));
        const criticalRatio = Math.max(warningRatio, Math.min(0.99, Number(opts.criticalRatio) || 0.92));
        const maxAgeMs = Math.max(60_000, Number(opts.maxAgeMs) || 7 * 24 * 60 * 60 * 1000);
        const namespace = String(opts.namespace || `analysis-contract-v1`);
        const appVersion = String(opts.appVersion || ENGINE_VERSION);
        const contractVersion = String(opts.contractVersion || '1');
        let effectiveMaxItems = baseMaxItems;
        let effectiveMaxBytes = baseMaxBytes;
        let databasePromise = null;
        let hits = 0;
        let misses = 0;
        let writes = 0;
        let writeFailures = 0;
        let evictions = 0;
        let expired = 0;
        let clears = 0;
        let selectiveDeletes = 0;
        let bulkDeletes = 0;
        let invalidations = 0;
        let oldNamespaceDeletes = 0;
        let size = 0;
        let totalBytes = 0;
        let lastError = '';
        let lastOperationAt = '';
        let quotaLevel = 'unknown';
        let quotaRatio = 0;
        let quotaUsage = 0;
        let quotaLimit = 0;
        let quotaChecks = 0;
        let quotaErrors = 0;
        let quotaCleanups = 0;
        let lastQuotaAt = '';
        let state = enabled ? 'idle' : (supported ? 'disabled' : 'unsupported');

        function persistentStats() {
            const total = hits + misses;
            return Object.freeze({
                supported,
                enabled,
                state,
                databaseName,
                namespace,
                appVersion,
                contractVersion,
                size,
                totalBytes,
                maxItems: baseMaxItems,
                maxBytes: baseMaxBytes,
                effectiveMaxItems,
                effectiveMaxBytes,
                minItems,
                minBytes,
                maxAgeMs,
                hits,
                misses,
                hitRate: total ? Math.round((hits / total) * 100) : 0,
                writes,
                writeFailures,
                evictions,
                expired,
                clears,
                selectiveDeletes,
                bulkDeletes,
                invalidations,
                oldNamespaceDeletes,
                quotaLevel,
                quotaRatio,
                quotaUsage,
                quotaLimit,
                quotaChecks,
                quotaErrors,
                quotaCleanups,
                lastQuotaAt,
                lastError,
                lastOperationAt
            });
        }

        function requestResult(request) {
            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error || new Error('IndexedDB request failed'));
            });
        }

        function transactionDone(transaction) {
            return new Promise((resolve, reject) => {
                transaction.oncomplete = () => resolve(true);
                transaction.onerror = () => reject(transaction.error || new Error('IndexedDB transaction failed'));
                transaction.onabort = () => reject(transaction.error || new Error('IndexedDB transaction aborted'));
            });
        }

        function isQuotaError(error) {
            const name = String(error && error.name || '');
            const message = String(error && error.message || '');
            return /QuotaExceededError/i.test(name) || /quota|storage.*full|disk.*full/i.test(message);
        }

        async function refreshQuotaPolicy(force) {
            const storage = global.navigator && global.navigator.storage;
            if (!enabled || !storage || typeof storage.estimate !== 'function') return persistentStats();
            if (!force && lastQuotaAt && Date.now() - Date.parse(lastQuotaAt) < 60_000) return persistentStats();
            try {
                const estimate = await storage.estimate();
                quotaUsage = Math.max(0, Number(estimate && estimate.usage) || 0);
                quotaLimit = Math.max(0, Number(estimate && estimate.quota) || 0);
                quotaRatio = quotaLimit ? Math.max(0, Math.min(1, quotaUsage / quotaLimit)) : 0;
                quotaChecks += 1;
                lastQuotaAt = nowIso();
                const previousLevel = quotaLevel;
                const previousItems = effectiveMaxItems;
                const previousBytes = effectiveMaxBytes;
                if (!quotaLimit) {
                    quotaLevel = 'unknown';
                    effectiveMaxItems = baseMaxItems;
                    effectiveMaxBytes = baseMaxBytes;
                } else if (quotaRatio >= criticalRatio) {
                    quotaLevel = 'critical';
                    effectiveMaxItems = minItems;
                    effectiveMaxBytes = minBytes;
                } else if (quotaRatio >= warningRatio) {
                    quotaLevel = 'warning';
                    effectiveMaxItems = Math.max(minItems, Math.floor(baseMaxItems * 0.6));
                    effectiveMaxBytes = Math.max(minBytes, Math.floor(baseMaxBytes * 0.6));
                } else {
                    quotaLevel = 'normal';
                    effectiveMaxItems = baseMaxItems;
                    effectiveMaxBytes = baseMaxBytes;
                }
                if (previousLevel !== quotaLevel || previousItems !== effectiveMaxItems || previousBytes !== effectiveMaxBytes) {
                    recordEvent('persistent-cache-quota-policy', { layer: 'persistent', state: quotaLevel, bytes: effectiveMaxBytes, count: effectiveMaxItems, size: Math.round(quotaRatio * 100) });
                }
            } catch (error) {
                lastQuotaAt = nowIso();
                recordEvent('persistent-cache-quota-estimate-error', { layer: 'persistent', reason: error && error.message || 'estimate-failed' });
            }
            return persistentStats();
        }

        function openDatabase() {
            if (!enabled) return Promise.resolve(null);
            if (databasePromise) return databasePromise;
            state = 'opening';
            databasePromise = new Promise((resolve, reject) => {
                const request = indexedDB.open(databaseName, 1);
                request.onupgradeneeded = () => {
                    const database = request.result;
                    if (!database.objectStoreNames.contains(storeName)) {
                        const objectStore = database.createObjectStore(storeName, { keyPath: 'key' });
                        objectStore.createIndex('lastAccessAt', 'lastAccessAt', { unique: false });
                        objectStore.createIndex('createdAt', 'createdAt', { unique: false });
                    }
                };
                request.onsuccess = () => {
                    const database = request.result;
                    database.onversionchange = () => { try { database.close(); } catch (_) { /* no-op */ } databasePromise = null; };
                    state = 'ready';
                    lastError = '';
                    resolve(database);
                };
                request.onerror = () => reject(request.error || new Error('IndexedDB open failed'));
                request.onblocked = () => reject(new Error('IndexedDB upgrade blocked'));
            }).catch(error => {
                state = 'error';
                lastError = error && error.message || 'IndexedDB open failed';
                databasePromise = null;
                recordEvent('persistent-cache-error', { layer: 'persistent', state, reason: lastError });
                return null;
            });
            return databasePromise;
        }

        async function readAll(database) {
            if (!database) return [];
            const transaction = database.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            if (typeof store.getAll === 'function') return requestResult(store.getAll());
            return new Promise((resolve, reject) => {
                const rows = [];
                const request = store.openCursor();
                request.onsuccess = () => {
                    const cursor = request.result;
                    if (!cursor) { resolve(rows); return; }
                    rows.push(cursor.value);
                    cursor.continue();
                };
                request.onerror = () => reject(request.error || new Error('IndexedDB cursor failed'));
            });
        }

        async function removeKeys(database, keys) {
            if (!database || !keys.length) return;
            const transaction = database.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            keys.forEach(key => store.delete(key));
            await transactionDone(transaction);
        }

        async function refreshStats(database) {
            const rows = await readAll(database);
            const active = rows.filter(row => row && row.namespace === namespace);
            size = active.length;
            totalBytes = active.reduce((sum, row) => sum + Math.max(0, Number(row && row.bytes) || 0), 0);
            lastOperationAt = nowIso();
            return rows;
        }

        async function listEntries() {
            const database = await openDatabase();
            if (!database) return [];
            try {
                const rows = await refreshStats(database);
                return rows.filter(row => row && row.namespace === namespace).sort((a, b) => Number(b.lastAccessAt || b.createdAt || 0) - Number(a.lastAccessAt || a.createdAt || 0)).map(row => Object.freeze({
                    token: textToken(row.key),
                    bytes: Math.max(0, Number(row.bytes) || 0),
                    createdAt: new Date(Number(row.createdAt) || 0).toISOString(),
                    lastAccessAt: new Date(Number(row.lastAccessAt || row.createdAt) || 0).toISOString(),
                    ageMs: Math.max(0, Date.now() - Number(row.createdAt || 0)),
                    appVersion: String(row.profile && row.profile.appVersion || ''),
                    contractVersion: String(row.profile && row.profile.contractVersion || ''),
                    tier: String(row.profile && row.profile.tier || 'balanced'),
                    analysisSampleRate: Math.max(0, Number(row.profile && row.profile.analysisSampleRate) || 0),
                    motionSamples: Math.max(0, Number(row.profile && row.profile.motionSamples) || 0),
                    optionSignature: String(row.profile && row.profile.optionSignature || '')
                }));
            } catch (error) {
                lastError = error && error.message || 'Persistent cache listing failed';
                recordEvent('persistent-cache-error', { layer: 'persistent', reason: lastError });
                return [];
            }
        }

        async function deleteByToken(token) {
            const normalized = String(token || '').trim();
            if (!normalized) return Object.freeze({ removed: false, token: normalized, stats: persistentStats() });
            const database = await openDatabase();
            if (!database) return Object.freeze({ removed: false, token: normalized, stats: persistentStats() });
            try {
                const rows = await readAll(database);
                const row = rows.find(item => item && item.namespace === namespace && textToken(item.key) === normalized);
                if (!row) return Object.freeze({ removed: false, token: normalized, stats: persistentStats() });
                await removeKeys(database, [row.key]);
                selectiveDeletes += 1;
                await refreshStats(database);
                recordEvent('persistent-cache-entry-deleted', { layer: 'persistent', key: row.key, bytes: row.bytes, size });
                return Object.freeze({ removed: true, token: normalized, bytes: Math.max(0, Number(row.bytes) || 0), stats: persistentStats() });
            } catch (error) {
                lastError = error && error.message || 'Persistent cache delete failed';
                recordEvent('persistent-cache-error', { layer: 'persistent', reason: lastError });
                return Object.freeze({ removed: false, token: normalized, stats: persistentStats(), error: lastError });
            }
        }

        async function deleteByTokens(tokens) {
            const normalized = Array.from(new Set((Array.isArray(tokens) ? tokens : [tokens]).map(value => String(value || '').trim()).filter(Boolean))).slice(0, baseMaxItems);
            if (!normalized.length) return Object.freeze({ removed: 0, tokens: [], bytes: 0, stats: persistentStats() });
            const database = await openDatabase();
            if (!database) return Object.freeze({ removed: 0, tokens: normalized, bytes: 0, stats: persistentStats() });
            try {
                const tokenSet = new Set(normalized);
                const rows = (await readAll(database)).filter(row => row && row.namespace === namespace && tokenSet.has(textToken(row.key)));
                await removeKeys(database, rows.map(row => row.key));
                selectiveDeletes += rows.length;
                bulkDeletes += rows.length ? 1 : 0;
                await refreshStats(database);
                const bytes = rows.reduce((sum, row) => sum + Math.max(0, Number(row.bytes) || 0), 0);
                rows.forEach(row => recordEvent('persistent-cache-entry-deleted', { layer: 'persistent', key: row.key, bytes: row.bytes, size }));
                return Object.freeze({ removed: rows.length, tokens: rows.map(row => textToken(row.key)), bytes, stats: persistentStats() });
            } catch (error) {
                lastError = error && error.message || 'Persistent cache bulk delete failed';
                recordEvent('persistent-cache-error', { layer: 'persistent', reason: lastError });
                return Object.freeze({ removed: 0, tokens: normalized, bytes: 0, stats: persistentStats(), error: lastError });
            }
        }

        function matchesInvalidation(row, criteria) {
            const profile = row && row.profile || {};
            const rule = criteria || {};
            if (Array.isArray(rule.tokens) && rule.tokens.length && rule.tokens.includes(textToken(row.key))) return true;
            if (rule.tier && String(profile.tier || '') === String(rule.tier)) return true;
            if (rule.optionSignature && String(profile.optionSignature || '') === String(rule.optionSignature)) return true;
            if (rule.contractVersion && String(profile.contractVersion || '') !== String(rule.contractVersion)) return true;
            if (rule.appVersion && String(profile.appVersion || '') !== String(rule.appVersion)) return true;
            if (Number.isFinite(Number(rule.analysisSampleRate)) && Number(profile.analysisSampleRate || 0) === Number(rule.analysisSampleRate)) return true;
            if (Number.isFinite(Number(rule.motionSamples)) && Number(profile.motionSamples || 0) === Number(rule.motionSamples)) return true;
            if (Number.isFinite(Number(rule.olderThanMs)) && Date.now() - Number(row.createdAt || 0) > Math.max(0, Number(rule.olderThanMs))) return true;
            return false;
        }

        async function invalidate(criteria) {
            const rule = criteria && typeof criteria === 'object' ? criteria : {};
            const database = await openDatabase();
            if (!database) return Object.freeze({ removed: 0, bytes: 0, criteria: Object.freeze({}), stats: persistentStats() });
            try {
                const rows = (await readAll(database)).filter(row => row && row.namespace === namespace && matchesInvalidation(row, rule));
                await removeKeys(database, rows.map(row => row.key));
                invalidations += rows.length ? 1 : 0;
                selectiveDeletes += rows.length;
                await refreshStats(database);
                const bytes = rows.reduce((sum, row) => sum + Math.max(0, Number(row.bytes) || 0), 0);
                recordEvent('persistent-cache-invalidated', { layer: 'persistent', reason: String(rule.reason || 'criteria'), count: rows.length, bytes, size });
                return Object.freeze({ removed: rows.length, bytes, criteria: Object.freeze({ reason: String(rule.reason || 'criteria'), tier: String(rule.tier || ''), contractVersion: String(rule.contractVersion || ''), appVersion: String(rule.appVersion || '') }), stats: persistentStats() });
            } catch (error) {
                lastError = error && error.message || 'Persistent cache invalidation failed';
                recordEvent('persistent-cache-error', { layer: 'persistent', reason: lastError });
                return Object.freeze({ removed: 0, bytes: 0, criteria: Object.freeze({}), stats: persistentStats(), error: lastError });
            }
        }

        async function prunePersistent(options) {
            const settings = options || {};
            await refreshQuotaPolicy(Boolean(settings.forceQuota));
            const database = await openDatabase();
            if (!database) return persistentStats();
            try {
                state = 'pruning';
                const now = Date.now();
                const rows = await readAll(database);
                const deleteKeys = [];
                const active = [];
                const itemLimit = Math.max(1, Math.min(effectiveMaxItems, Number(settings.maxItems) || effectiveMaxItems));
                const byteLimit = Math.max(minBytes, Math.min(effectiveMaxBytes, Number(settings.maxBytes) || effectiveMaxBytes));
                rows.forEach(row => {
                    if (!row || row.namespace !== namespace) {
                        if (row && row.key) { deleteKeys.push(row.key); oldNamespaceDeletes += 1; }
                    } else if (now - Number(row.createdAt || 0) > maxAgeMs) {
                        if (row.key) deleteKeys.push(row.key);
                        expired += 1;
                    } else active.push(row);
                });
                active.sort((a, b) => Number(b.lastAccessAt || b.createdAt || 0) - Number(a.lastAccessAt || a.createdAt || 0));
                let bytes = 0;
                active.forEach((row, index) => {
                    const rowBytes = Math.max(0, Number(row.bytes) || 0);
                    if (index >= itemLimit || bytes + rowBytes > byteLimit) {
                        deleteKeys.push(row.key);
                        evictions += 1;
                    } else bytes += rowBytes;
                });
                await removeKeys(database, Array.from(new Set(deleteKeys)));
                await refreshStats(database);
                state = 'ready';
                lastError = '';
                if (deleteKeys.length) recordEvent('persistent-cache-pruned', { layer: 'persistent', count: deleteKeys.length, size, bytes: totalBytes, limit: itemLimit });
            } catch (error) {
                state = 'error';
                lastError = error && error.message || 'Persistent cache prune failed';
                recordEvent('persistent-cache-error', { layer: 'persistent', reason: lastError });
            }
            return persistentStats();
        }

        async function getPersistent(key) {
            if (!key || !enabled) return null;
            const database = await openDatabase();
            if (!database) return null;
            try {
                const transaction = database.transaction(storeName, 'readonly');
                const row = await requestResult(transaction.objectStore(storeName).get(key));
                const now = Date.now();
                if (!row || row.namespace !== namespace) {
                    misses += 1;
                    recordEvent('persistent-cache-miss', { layer: 'persistent', key, size });
                    return null;
                }
                if (now - Number(row.createdAt || 0) > maxAgeMs) {
                    expired += 1;
                    await removeKeys(database, [key]);
                    misses += 1;
                    await refreshStats(database);
                    recordEvent('persistent-cache-expired', { layer: 'persistent', key, ageMs: now - Number(row.createdAt || 0), size });
                    return null;
                }
                hits += 1;
                lastOperationAt = nowIso();
                const update = Object.assign({}, row, { lastAccessAt: now });
                try {
                    const writeTransaction = database.transaction(storeName, 'readwrite');
                    writeTransaction.objectStore(storeName).put(update);
                    await transactionDone(writeTransaction);
                } catch (_) { /* access timestamp is best-effort */ }
                recordEvent('persistent-cache-hit', { layer: 'persistent', key, ageMs: now - Number(row.createdAt || 0), bytes: row.bytes, size });
                return cloneValue(row.value);
            } catch (error) {
                misses += 1;
                state = 'error';
                lastError = error && error.message || 'Persistent cache read failed';
                recordEvent('persistent-cache-error', { layer: 'persistent', key, reason: lastError });
                return null;
            }
        }

        async function writeRow(database, row) {
            const transaction = database.transaction(storeName, 'readwrite');
            transaction.objectStore(storeName).put(row);
            await transactionDone(transaction);
        }

        async function setPersistent(key, value, metadata) {
            if (!key || !value || !enabled) return false;
            await refreshQuotaPolicy(false);
            const database = await openDatabase();
            if (!database) return false;
            const bytes = estimateValueBytes(value);
            if (!bytes || bytes > effectiveMaxBytes) {
                writeFailures += 1;
                recordEvent('persistent-cache-write-skipped', { layer: 'persistent', key, reason: bytes ? 'entry-too-large' : 'size-unknown', bytes, limit: effectiveMaxBytes });
                return false;
            }
            const now = Date.now();
            const profile = cacheProfileFromKey(key, Object.assign({ appVersion, contractVersion }, metadata || {}));
            const row = { key, namespace, createdAt: now, lastAccessAt: now, bytes, profile, value: cloneValue(value) };
            try {
                state = 'writing';
                await writeRow(database, row);
                writes += 1;
                lastOperationAt = nowIso();
                lastError = '';
                recordEvent('persistent-cache-write', { layer: 'persistent', key, bytes, size: size + 1 });
                await prunePersistent();
                return true;
            } catch (error) {
                if (isQuotaError(error)) {
                    quotaErrors += 1;
                    quotaCleanups += 1;
                    recordEvent('persistent-cache-quota-error', { layer: 'persistent', key, bytes, count: quotaErrors });
                    await refreshQuotaPolicy(true);
                    await prunePersistent({ maxItems: minItems, maxBytes: minBytes, forceQuota: true });
                    try {
                        await writeRow(database, row);
                        writes += 1;
                        lastOperationAt = nowIso();
                        lastError = '';
                        recordEvent('persistent-cache-quota-retry-success', { layer: 'persistent', key, bytes, count: quotaCleanups });
                        await prunePersistent();
                        return true;
                    } catch (retryError) {
                        error = retryError;
                    }
                }
                writeFailures += 1;
                state = 'error';
                lastError = error && error.message || 'Persistent cache write failed';
                recordEvent('persistent-cache-error', { layer: 'persistent', key, reason: lastError });
                return false;
            }
        }

        async function clearPersistent() {
            const database = await openDatabase();
            if (!database) return persistentStats();
            try {
                const rows = await readAll(database);
                const keys = rows.filter(row => row && row.namespace === namespace).map(row => row.key);
                await removeKeys(database, keys);
                clears += 1;
                size = 0;
                totalBytes = 0;
                state = 'ready';
                lastOperationAt = nowIso();
                lastError = '';
                recordEvent('persistent-cache-cleared', { layer: 'persistent', count: keys.length });
            } catch (error) {
                state = 'error';
                lastError = error && error.message || 'Persistent cache clear failed';
                recordEvent('persistent-cache-error', { layer: 'persistent', reason: lastError });
            }
            return persistentStats();
        }

        if (enabled) prunePersistent({ forceQuota: true }).catch(() => {});
        return Object.freeze({ get: getPersistent, set: setPersistent, prune: prunePersistent, clear: clearPersistent, stats: persistentStats, list: listEntries, deleteByToken, deleteByTokens, invalidate, refreshQuotaPolicy });
    }

    global.AIShortsAnalysisCache = Object.freeze({
        createAnalysisCache,
        createPersistentAnalysisCache,
        makeFileKey,
        makeFileKeyAsync,
        computeFileFingerprint,
        fingerprintPlan,
        fingerprintStats,
        getDiagnosticEvents,
        cloneValue,
        cacheProfileFromKey
    });
})(window);
