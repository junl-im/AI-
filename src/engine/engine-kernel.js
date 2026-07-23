// AI Shorts Studio v1.5.24 - adaptive fingerprint cache diagnostics and parallel analysis kernel facade
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
    const ENGINE_VERSION = String(config.APP_VERSION || 'v1.5.24').replace(/^v/i, '');

    const registry = registryFactory.createRegistry ? registryFactory.createRegistry('ai-shorts-studio-pro-engine') : null;
    const analysisCache = cacheFactory.createAnalysisCache ? cacheFactory.createAnalysisCache(
        Math.max(1, Number(config.ANALYSIS_CACHE_MAX_ITEMS) || 4),
        { maxAgeMs: Math.max(30_000, Number(config.ANALYSIS_CACHE_MAX_AGE_MS) || 30 * 60 * 1000) }
    ) : null;
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
        { id: 'analysis.cache', stage: 'utility', priority: 60, capabilities: ['session-cache', 'repeat-open-boost', 'adaptive-fingerprint', 'cache-diagnostics'] },
        { id: 'stability.auditor', stage: 'stability', priority: 70, capabilities: ['health-score', 'contract-report'] }
    ].forEach(registerModule);

    function createBudget(fileMeta, configOverride) {
        const base = perf.createBudget ? perf.createBudget(fileMeta, configOverride) : { tier: 'balanced', label: '균형 성능' };
        return tuner.enhanceBudget ? tuner.enhanceBudget(base, fileMeta, configOverride) : base;
    }

    function cacheStats() {
        return analysisCache && analysisCache.stats ? analysisCache.stats() : null;
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
        if (profiler) profiler.mark('budget', budget);
        const cacheKey = analysisCache && analysisCache.makeFileKeyAsync
            ? await analysisCache.makeFileKeyAsync(input && input.file, input && input.fileMeta, budget)
            : analysisCache && analysisCache.makeFileKey
                ? analysisCache.makeFileKey(input && input.file, input && input.fileMeta, budget)
                : '';
        if (profiler) profiler.mark('fingerprint-complete', cacheStats() && cacheStats().fingerprint || null);
        const cached = analysisCache && analysisCache.get ? analysisCache.get(cacheKey) : null;
        if (cached) {
            if (profiler) profiler.mark('cache-hit');
            return annotateEngine(cached, budget, profiler && profiler.summary ? profiler.summary() : null, { cacheHit: true });
        }
        let result = await analysis.analyzeMedia(Object.assign({}, input || {}, { budget }));
        if (contracts.normalizeAnalysisResult) result = contracts.normalizeAnalysisResult(result);
        if (profiler) profiler.mark('analysis-complete');
        if (analysisCache && analysisCache.set) analysisCache.set(cacheKey, result);
        return annotateEngine(result, budget, profiler && profiler.summary ? profiler.summary() : null, { cacheHit: false });
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

    function clearAnalysisCache() {
        if (analysisCache && analysisCache.clear) analysisCache.clear();
        return cacheStats();
    }

    function pruneAnalysisCache(options) {
        return analysisCache && analysisCache.prune ? analysisCache.prune(options || {}) : cacheStats();
    }

    function getHealthReport() {
        return {
            version: ENGINE_VERSION,
            mode: 'adaptive-parallel-engine',
            registry: registry && registry.snapshot ? registry.snapshot() : null,
            modules: registry && registry.list ? registry.list().length : 0,
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
        clearAnalysisCache,
        pruneAnalysisCache
    });
})(window);
