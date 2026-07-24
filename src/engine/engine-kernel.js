// AI Shorts Studio v1.6.1 - contract-aware layered analysis cache and selective invalidation facade
'use strict';

(function exposeEngineKernel(global) {
    const registryFactory = global.AIShortsModuleRegistry || {};
    const perf = global.AIShortsPerformanceBudget || {};
    const analysis = global.AIShortsAnalysisPipeline || {};
    const scoring = global.AIShortsScoringPipeline || {};
    const contracts = global.AIShortsModuleContracts || {};
    const cacheFactory = global.AIShortsAnalysisCache || {};
    const tuner = global.AIShortsProEngineTuner || {};
    const stability = global.AIShortsStabilityAuditor || {};
    const config = global.AIShortsRuntimeConfig || {};
    const ENGINE_VERSION = String(config.APP_VERSION || 'v1.6.1').replace(/^v/i, '');
    const ANALYSIS_CONTRACT_VERSION = String(config.ANALYSIS_CACHE_CONTRACT_VERSION || '3');
    const ANALYSIS_CACHE_NAMESPACE = `analysis-contract-v${ANALYSIS_CONTRACT_VERSION}`;

    const registry = registryFactory.createRegistry ? registryFactory.createRegistry('ai-shorts-studio-pro-engine') : null;
    const analysisCache = cacheFactory.createAnalysisCache ? cacheFactory.createAnalysisCache(
        Math.max(1, Number(config.ANALYSIS_CACHE_MAX_ITEMS) || 4),
        { maxAgeMs: Math.max(30_000, Number(config.ANALYSIS_CACHE_MAX_AGE_MS) || 30 * 60 * 1000) }
    ) : null;
    const persistentAnalysisCache = cacheFactory.createPersistentAnalysisCache ? cacheFactory.createPersistentAnalysisCache({
        enabled: config.ANALYSIS_PERSISTENT_CACHE_ENABLED !== false,
        databaseName: String(config.ANALYSIS_PERSISTENT_CACHE_DB_NAME || 'ai-shorts-analysis-cache-v1'),
        namespace: ANALYSIS_CACHE_NAMESPACE,
        appVersion: ENGINE_VERSION,
        contractVersion: ANALYSIS_CONTRACT_VERSION,
        maxItems: Math.max(1, Number(config.ANALYSIS_PERSISTENT_CACHE_MAX_ITEMS) || 8),
        maxBytes: Math.max(1024 * 1024, Number(config.ANALYSIS_PERSISTENT_CACHE_MAX_BYTES) || 16 * 1024 * 1024),
        maxAgeMs: Math.max(60_000, Number(config.ANALYSIS_PERSISTENT_CACHE_MAX_AGE_MS) || 7 * 24 * 60 * 60 * 1000),
        minItems: Math.max(1, Number(config.ANALYSIS_PERSISTENT_CACHE_MIN_ITEMS) || 2),
        minBytes: Math.max(512 * 1024, Number(config.ANALYSIS_PERSISTENT_CACHE_MIN_BYTES) || 4 * 1024 * 1024),
        maintenanceHistoryLimit: Math.max(5, Number(config.ANALYSIS_CACHE_MAINTENANCE_HISTORY_LIMIT) || 20),
        storageTrendLimit: Math.max(8, Number(config.ANALYSIS_CACHE_STORAGE_TREND_LIMIT) || 48),
        warningRatio: Math.max(0.5, Number(config.STORAGE_WARNING_RATIO) || 0.8),
        criticalRatio: Math.max(0.5, Number(config.STORAGE_CRITICAL_RATIO) || 0.92)
    }) : null;
    let lastContractReport = null;
    let lastStabilityReport = null;

    function registerModule(module) {
        if (!registry || !registry.register) return null;
        if (contracts.validateModule) {
            const check = contracts.validateModule(module);
            if (!check.ok) return null;
        }
        return registry.register(module);
    }

    [
        { id: 'audio.feature.extractor', stage: 'analysis', priority: 10, capabilities: ['decode', 'waveform', 'rms', 'transient', 'local-only'] },
        { id: 'video.motion.sampler', stage: 'analysis', priority: 20, capabilities: ['motion', 'scene-hint', 'adaptive-sampling'] },
        { id: 'auto.cut.detector', stage: 'cut', priority: 30, capabilities: ['silence', 'beat', 'motion-cut', 'snap-range'] },
        { id: 'recommendation.scoring.pipeline', stage: 'recommendation', priority: 40, capabilities: ['quality-gate', 'engine-badge', 'rerank'] },
        { id: 'pro.engine.tuner', stage: 'recommendation', priority: 45, capabilities: ['confidence', 'grade', 'score-depth'] },
        { id: 'render.quality.effects', stage: 'render', priority: 50, capabilities: ['caption', 'quality', 'watermark'] },
        { id: 'analysis.cache', stage: 'utility', priority: 60, capabilities: ['session-cache', 'indexeddb-cache', 'repeat-open-boost', 'adaptive-fingerprint', 'cache-diagnostics'] },
        { id: 'stability.auditor', stage: 'stability', priority: 70, capabilities: ['health-score', 'contract-report'] }
    ].forEach(registerModule);

    function createBudget(fileMeta, configOverride) {
        const base = perf.createBudget ? perf.createBudget(fileMeta, configOverride) : { tier: 'balanced', label: '균형 성능' };
        return tuner.enhanceBudget ? tuner.enhanceBudget(base, fileMeta, configOverride) : base;
    }

    function cacheStats() {
        const memory = analysisCache && analysisCache.stats ? analysisCache.stats() : null;
        const persistent = persistentAnalysisCache && persistentAnalysisCache.stats ? persistentAnalysisCache.stats() : null;
        if (!memory) return persistent ? { persistent } : null;
        return Object.freeze(Object.assign({}, memory, { persistent }));
    }

    function annotateEngine(result, budget, profile, extra) {
        const registrySnapshot = registry && registry.snapshot ? registry.snapshot() : null;
        const summary = tuner.summarizeAnalysis ? tuner.summarizeAnalysis(result, budget) : null;
        result.engine = Object.assign({}, result.engine || {}, {
            version: ENGINE_VERSION,
            mode: 'adaptive-parallel-engine',
            budget,
            registry: registrySnapshot,
            profile,
            summary,
            cache: cacheStats()
        }, extra || {});
        if (contracts.createContractReport) {
            lastContractReport = contracts.createContractReport(registrySnapshot, result, []);
            result.engine.contract = lastContractReport;
        }
        return result;
    }

    async function analyzeMedia(input) {
        const profiler = perf.createProfiler ? perf.createProfiler('analysis') : null;
        const budget = input && input.budget || createBudget(input && input.fileMeta, input && input.config);
        const autoCutOptions = input && typeof input.getAutoCutOptions === 'function' ? input.getAutoCutOptions() : {};
        const optionSignature = cacheFactory.makeOptionSignature ? cacheFactory.makeOptionSignature({
            autoCut: autoCutOptions,
            explicit: input && input.config && input.config.analysisOptionSignature || ''
        }) : String(input && input.config && input.config.analysisOptionSignature || '');
        if (profiler) profiler.mark('budget', budget);
        const cacheBudget = Object.assign({}, budget, { cacheNamespace: ANALYSIS_CACHE_NAMESPACE, optionSignature });
        const cacheKey = analysisCache && analysisCache.makeFileKeyAsync
            ? await analysisCache.makeFileKeyAsync(input && input.file, input && input.fileMeta, cacheBudget)
            : analysisCache && analysisCache.makeFileKey
                ? analysisCache.makeFileKey(input && input.file, input && input.fileMeta, cacheBudget)
                : '';
        if (profiler) profiler.mark('fingerprint-complete', cacheStats() && cacheStats().fingerprint || null);
        const memoryCached = analysisCache && analysisCache.get ? analysisCache.get(cacheKey) : null;
        if (memoryCached) {
            if (profiler) profiler.mark('cache-hit-memory');
            return annotateEngine(memoryCached, budget, profiler && profiler.summary ? profiler.summary() : null, { cacheHit: true, cacheLayer: 'memory' });
        }
        const persistentCached = persistentAnalysisCache && persistentAnalysisCache.get ? await persistentAnalysisCache.get(cacheKey) : null;
        if (persistentCached) {
            if (analysisCache && analysisCache.set) analysisCache.set(cacheKey, persistentCached);
            if (profiler) profiler.mark('cache-hit-persistent');
            return annotateEngine(persistentCached, budget, profiler && profiler.summary ? profiler.summary() : null, { cacheHit: true, cacheLayer: 'persistent' });
        }
        let result = await analysis.analyzeMedia(Object.assign({}, input || {}, { budget, getAutoCutOptions: () => autoCutOptions }));
        if (contracts.normalizeAnalysisResult) result = contracts.normalizeAnalysisResult(result);
        if (profiler) profiler.mark('analysis-complete');
        if (analysisCache && analysisCache.set) analysisCache.set(cacheKey, result);
        if (persistentAnalysisCache && persistentAnalysisCache.set) persistentAnalysisCache.set(cacheKey, result, {
            appVersion: ENGINE_VERSION,
            contractVersion: ANALYSIS_CONTRACT_VERSION,
            tier: budget && budget.tier || 'balanced',
            analysisSampleRate: budget && budget.analysisSampleRate || 0,
            motionSamples: budget && budget.motionSamples || 0,
            optionSignature,
            cacheNamespace: ANALYSIS_CACHE_NAMESPACE
        }).catch(() => {});
        return annotateEngine(result, budget, profiler && profiler.summary ? profiler.summary() : null, { cacheHit: false, cacheLayer: 'none' });
    }

    function createRecommendations(input) {
        const budget = input && input.budget || createBudget(input && input.fileMeta, input && input.config);
        const options = Object.assign({}, input && input.options || {});
        if (!options.count) options.count = budget.recommendationCount || 7;
        let recommendations = scoring.createRecommendations ? scoring.createRecommendations(Object.assign({}, input || {}, { options, budget })) : [];
        if (tuner.tuneRecommendations) recommendations = tuner.tuneRecommendations(recommendations, { budget, input });
        if (contracts.createContractReport) {
            const registrySnapshot = registry && registry.snapshot ? registry.snapshot() : null;
            lastContractReport = contracts.createContractReport(registrySnapshot, input, recommendations);
        }
        return recommendations.map((item, index) => Object.assign({}, item, {
            rank: index + 1,
            title: String(item.title || '').replace(/추천 \d+/, `추천 ${index + 1}`)
        }));
    }

    function auditRuntime(state) {
        const health = getHealthReport();
        lastStabilityReport = stability.auditState ? stability.auditState(state, health) : { ok: true, score: 100, findings: [] };
        return lastStabilityReport;
    }

    async function clearAnalysisCache() {
        if (analysisCache && analysisCache.clear) analysisCache.clear();
        if (persistentAnalysisCache && persistentAnalysisCache.clear) await persistentAnalysisCache.clear();
        return cacheStats();
    }

    async function pruneAnalysisCache(options) {
        if (analysisCache && analysisCache.prune) analysisCache.prune(options || {});
        if (persistentAnalysisCache && persistentAnalysisCache.prune) await persistentAnalysisCache.prune(options || {});
        return cacheStats();
    }

    async function listPersistentAnalysisCacheEntries() {
        if (!persistentAnalysisCache || !persistentAnalysisCache.list) return [];
        return persistentAnalysisCache.list();
    }

    async function deletePersistentAnalysisCacheEntry(token) {
        if (!persistentAnalysisCache || !persistentAnalysisCache.deleteByToken) return Object.freeze({ removed: false, token: String(token || ''), stats: cacheStats() });
        const result = await persistentAnalysisCache.deleteByToken(token);
        return Object.freeze(Object.assign({}, result, { cache: cacheStats() }));
    }

    async function deletePersistentAnalysisCacheEntries(tokens) {
        if (!persistentAnalysisCache || !persistentAnalysisCache.deleteByTokens) return Object.freeze({ removed: 0, tokens: [], bytes: 0, cache: cacheStats() });
        const result = await persistentAnalysisCache.deleteByTokens(tokens);
        if (analysisCache && analysisCache.clear) analysisCache.clear();
        return Object.freeze(Object.assign({}, result, { cache: cacheStats() }));
    }

    async function invalidateAnalysisCache(criteria) {
        if (analysisCache && analysisCache.clear) analysisCache.clear();
        if (!persistentAnalysisCache || !persistentAnalysisCache.invalidate) return Object.freeze({ removed: 0, bytes: 0, cache: cacheStats() });
        const result = await persistentAnalysisCache.invalidate(criteria || {});
        return Object.freeze(Object.assign({}, result, { cache: cacheStats() }));
    }

    async function getPersistentAnalysisCacheNamespaceStatus() {
        if (!persistentAnalysisCache) return Object.freeze({ current: null, legacy: Object.freeze([]), namespaceCount: 0, legacyNamespaceCount: 0, legacyItems: 0, legacyBytes: 0, generatedAt: '' });
        if (persistentAnalysisCache.getNamespaceStatus) return persistentAnalysisCache.getNamespaceStatus();
        return persistentAnalysisCache.namespaceStatus ? persistentAnalysisCache.namespaceStatus() : Object.freeze({ current: null, legacy: Object.freeze([]), namespaceCount: 0, legacyNamespaceCount: 0, legacyItems: 0, legacyBytes: 0, generatedAt: '' });
    }

    async function deletePersistentAnalysisCacheNamespaces(tokens) {
        if (!persistentAnalysisCache || !persistentAnalysisCache.deleteNamespaces) return Object.freeze({ removedNamespaces: 0, removed: 0, bytes: 0, tokens: Object.freeze([]), cache: cacheStats() });
        const result = await persistentAnalysisCache.deleteNamespaces(tokens);
        if (analysisCache && analysisCache.clear) analysisCache.clear();
        return Object.freeze(Object.assign({}, result, { cache: cacheStats() }));
    }

    function getAnalysisCacheMaintenanceHistory(limit) {
        if (!persistentAnalysisCache || !persistentAnalysisCache.maintenanceHistory) return [];
        return persistentAnalysisCache.maintenanceHistory(limit);
    }

    async function getPersistentAnalysisCacheMaintenanceSnapshot(options) {
        if (!persistentAnalysisCache || !persistentAnalysisCache.maintenanceSnapshot) return Object.freeze({ entries: Object.freeze([]), namespaceStatus: null, optionSignatures: Object.freeze({ groups: Object.freeze([]), unprofiledCount: 0, unprofiledBytes: 0 }), storageTrend: Object.freeze([]), maintenanceHistory: Object.freeze([]), stats: cacheStats(), generatedAt: '' });
        return persistentAnalysisCache.maintenanceSnapshot(options || {});
    }

    async function refreshPersistentAnalysisCachePolicy() {
        if (persistentAnalysisCache && persistentAnalysisCache.prune) await persistentAnalysisCache.prune({ forceQuota: true });
        else if (persistentAnalysisCache && persistentAnalysisCache.refreshQuotaPolicy) await persistentAnalysisCache.refreshQuotaPolicy(true);
        if (persistentAnalysisCache && persistentAnalysisCache.maintenanceSnapshot) return persistentAnalysisCache.maintenanceSnapshot({ refresh: false, trendLimit: 12, historyLimit: 8 });
        return Object.freeze({ stats: cacheStats() });
    }

    function getAnalysisCacheDiagnostics() {
        const memoryDiagnostics = analysisCache && analysisCache.diagnostics ? analysisCache.diagnostics() : { stats: cacheStats(), recentEvents: [] };
        return Object.freeze({
            app: 'AI Shorts Studio',
            exportType: 'analysis-cache-diagnostics',
            appVersion: config.APP_VERSION || 'dev',
            buildKey: config.BUILD_KEY || '',
            generatedAt: new Date().toISOString(),
            privacy: Object.freeze({ includesFileNames: false, includesPaths: false, keyRepresentation: 'fnv1a-token' }),
            cache: cacheStats(),
            namespaceStatus: persistentAnalysisCache && persistentAnalysisCache.namespaceStatus ? persistentAnalysisCache.namespaceStatus() : null,
            optionSignatures: persistentAnalysisCache && persistentAnalysisCache.optionSignatures ? persistentAnalysisCache.optionSignatures() : null,
            storageTrend: persistentAnalysisCache && persistentAnalysisCache.storageTrend ? persistentAnalysisCache.storageTrend(24) : [],
            maintenanceHistory: getAnalysisCacheMaintenanceHistory(40),
            recentEvents: Array.isArray(memoryDiagnostics.recentEvents) ? memoryDiagnostics.recentEvents.slice(0, 80) : []
        });
    }

    function diagnosticsFilename() {
        const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z').replace('T', '-');
        return `ai-shorts-analysis-cache-diagnostics-${stamp}.json`;
    }

    function saveDiagnosticsBlob(blob, filename) {
        const downloadService = global.AIShortsDownloadService || {};
        if (typeof downloadService.saveBlob === 'function') {
            downloadService.saveBlob(blob, filename);
            return true;
        }
        if (!global.URL || typeof global.URL.createObjectURL !== 'function' || !global.document) return false;
        const url = global.URL.createObjectURL(blob);
        const anchor = global.document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        anchor.rel = 'noopener';
        global.document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        global.setTimeout(() => { try { global.URL.revokeObjectURL(url); } catch (_) { /* no-op */ } }, Math.max(10000, Number(config.DOWNLOAD_URL_REVOKE_DELAY_MS) || 45000));
        return true;
    }

    function exportAnalysisCacheDiagnostics() {
        const payload = getAnalysisCacheDiagnostics();
        const filename = diagnosticsFilename();
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        return Object.freeze({ saved: saveDiagnosticsBlob(blob, filename), filename, eventCount: payload.recentEvents.length, payload });
    }

    function getHealthReport() {
        return {
            version: ENGINE_VERSION,
            mode: 'adaptive-parallel-engine',
            registry: registry && registry.snapshot ? registry.snapshot() : null,
            modules: registry && registry.list ? registry.list().length : 0,
            analysisContractVersion: ANALYSIS_CONTRACT_VERSION,
            analysisCacheNamespace: ANALYSIS_CACHE_NAMESPACE,
            cache: cacheStats(),
            contract: lastContractReport,
            stability: lastStabilityReport
        };
    }

    global.AIShortsEngineKernel = Object.freeze({
        createBudget,
        analyzeMedia,
        createRecommendations,
        auditRuntime,
        getHealthReport,
        getAnalysisCacheDiagnostics,
        exportAnalysisCacheDiagnostics,
        clearAnalysisCache,
        pruneAnalysisCache,
        listPersistentAnalysisCacheEntries,
        deletePersistentAnalysisCacheEntry,
        deletePersistentAnalysisCacheEntries,
        invalidateAnalysisCache,
        getPersistentAnalysisCacheNamespaceStatus,
        deletePersistentAnalysisCacheNamespaces,
        getAnalysisCacheMaintenanceHistory,
        getPersistentAnalysisCacheMaintenanceSnapshot,
        refreshPersistentAnalysisCachePolicy
    });
})(window);
