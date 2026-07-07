// AI Shorts Studio v0.9.0 - engine kernel facade
'use strict';

(function exposeEngineKernel(global) {
    const registryFactory = global.AIShortsModuleRegistry || {};
    const perf = global.AIShortsPerformanceBudget || {};
    const analysis = global.AIShortsAnalysisPipeline || {};
    const scoring = global.AIShortsScoringPipeline || {};

    const registry = registryFactory.createRegistry ? registryFactory.createRegistry('ai-shorts-studio-engine') : null;

    if (registry) {
        registry.register({ id: 'audio.feature.extractor', stage: 'analysis', priority: 10, capabilities: ['decode', 'waveform', 'rms', 'transient'] });
        registry.register({ id: 'video.motion.sampler', stage: 'analysis', priority: 20, capabilities: ['motion', 'scene-hint'] });
        registry.register({ id: 'auto.cut.detector', stage: 'cut', priority: 30, capabilities: ['silence', 'beat', 'motion-cut'] });
        registry.register({ id: 'recommendation.scoring.pipeline', stage: 'recommendation', priority: 40, capabilities: ['quality-gate', 'engine-badge', 'rerank'] });
        registry.register({ id: 'render.quality.effects', stage: 'render', priority: 50, capabilities: ['caption', 'quality', 'watermark'] });
    }

    function createBudget(fileMeta, config) {
        return perf.createBudget ? perf.createBudget(fileMeta, config) : { tier: 'balanced', label: '균형 성능' };
    }

    async function analyzeMedia(input) {
        const profiler = perf.createProfiler ? perf.createProfiler('analysis') : null;
        const budget = input && input.budget || createBudget(input && input.fileMeta, input && input.config);
        if (profiler) profiler.mark('budget', budget);
        const result = await analysis.analyzeMedia(Object.assign({}, input || {}, { budget }));
        if (profiler) profiler.mark('analysis-complete');
        result.engine = Object.assign({}, result.engine || {}, {
            registry: registry && registry.snapshot ? registry.snapshot() : null,
            profile: profiler && profiler.summary ? profiler.summary() : null
        });
        return result;
    }

    function createRecommendations(input) {
        const budget = input && input.budget || createBudget(input && input.fileMeta, input && input.config);
        const options = Object.assign({}, input && input.options || {});
        if (!options.count) options.count = budget.recommendationCount || 7;
        return scoring.createRecommendations ? scoring.createRecommendations(Object.assign({}, input || {}, { options, budget })) : [];
    }

    function getHealthReport() {
        return {
            version: '0.9.0',
            mode: 'modular-engine',
            registry: registry && registry.snapshot ? registry.snapshot() : null,
            modules: registry && registry.list ? registry.list().length : 0
        };
    }

    global.AIShortsEngineKernel = Object.freeze({ createBudget, analyzeMedia, createRecommendations, getHealthReport });
})(window);
