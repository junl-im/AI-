// AI Shorts Studio v0.9.0 - adaptive performance budget
'use strict';

(function exposePerformanceBudget(global) {
    function now() {
        return global.performance && global.performance.now ? global.performance.now() : Date.now();
    }

    function createProfiler(label) {
        const marks = [];
        const started = now();
        function mark(name, meta) {
            marks.push({ name, t: Math.round(now() - started), meta: meta || null });
        }
        function summary() {
            return {
                label: label || 'engine',
                totalMs: Math.round(now() - started),
                marks: marks.slice()
            };
        }
        return { mark, summary };
    }

    function createBudget(fileMeta, runtimeConfig) {
        const sizeMb = Number(fileMeta && fileMeta.size || 0) / 1024 / 1024;
        const duration = Number(fileMeta && fileMeta.duration || 0);
        const cores = Number(global.navigator && global.navigator.hardwareConcurrency || 4);
        const memory = Number(global.navigator && global.navigator.deviceMemory || 4);
        let tier = 'balanced';
        if (sizeMb > 650 || duration > 900 || cores <= 2 || memory <= 2) tier = 'safe';
        if (sizeMb < 180 && duration < 360 && cores >= 6 && memory >= 6) tier = 'max';
        return {
            tier,
            sizeMb: Math.round(sizeMb * 10) / 10,
            duration,
            cores,
            memory,
            audioMaxSeconds: tier === 'safe' ? Math.min(Number(runtimeConfig && runtimeConfig.MAX_ANALYSIS_SECONDS || 1200), 420) : Number(runtimeConfig && runtimeConfig.MAX_ANALYSIS_SECONDS || 1200),
            motionSampleStep: tier === 'safe' ? 1.2 : tier === 'max' ? 0.45 : 0.75,
            recommendationCount: tier === 'safe' ? 5 : tier === 'max' ? 9 : 7,
            uiThrottleMs: tier === 'safe' ? 180 : tier === 'max' ? 70 : 110,
            label: tier === 'safe' ? '안전 모드' : tier === 'max' ? '최대 성능' : '균형 성능'
        };
    }

    global.AIShortsPerformanceBudget = Object.freeze({ createProfiler, createBudget });
})(window);
