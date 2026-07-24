// AI Shorts Studio v1.6.4 - adaptive decode, concurrency, and responsiveness budget
'use strict';

(function exposePerformanceBudget(global) {
    const config = global.AIShortsRuntimeConfig || {};
    const ENGINE_VERSION = String(config.APP_VERSION || 'v1.6.4').replace(/^v/i, '');
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
        const maxCoverage = Number(runtimeConfig && runtimeConfig.MAX_ANALYSIS_SECONDS || 1800);
        const fileName = String(fileMeta && fileMeta.name || '').toLowerCase();
        const fileType = String(fileMeta && fileMeta.type || '').toLowerCase();
        const isUncompressedAudio = /\.(wav|wave|aif|aiff)$/.test(fileName) || /audio\/(wav|wave|x-wav|aiff)/.test(fileType);
        const assumedChannels = 2;
        const assumedSampleRate = 48000;
        const estimatedDecodeMemoryMb = duration > 0
            ? Math.round((duration * assumedSampleRate * assumedChannels * 4 / 1024 / 1024) * 10) / 10
            : Math.round(Math.max(sizeMb * (isUncompressedAudio ? 2.2 : 5.5), sizeMb) * 10) / 10;
        const memoryHeadroomMb = Math.max(1024, memory * 1024);
        let memoryRisk = 'low';
        if (estimatedDecodeMemoryMb >= 650 || sizeMb >= 700 || (duration >= 1200 && memory <= 4)) memoryRisk = 'high';
        else if (estimatedDecodeMemoryMb >= 320 || sizeMb >= 350 || duration >= 600) memoryRisk = 'medium';
        const hardBlock = sizeMb >= 1800 || (isUncompressedAudio && estimatedDecodeMemoryMb > Math.max(1800, memoryHeadroomMb * 0.72));
        let tier = 'balanced';
        if (sizeMb > 650 || duration > 900 || cores <= 2 || memory <= 2) tier = 'safe';
        if (sizeMb < 180 && duration > 0 && duration < 360 && cores >= 6 && memory >= 6) tier = 'max';
        const longMedia = duration >= 300 || sizeMb >= 250;
        let analysisSampleRate = tier === 'safe' ? 6000 : tier === 'max' ? 12000 : 8000;
        if (duration > 900) analysisSampleRate = Math.min(analysisSampleRate, 6000);
        else if (duration > 300) analysisSampleRate = Math.min(analysisSampleRate, 8000);
        const audioMaxSeconds = Math.min(maxCoverage, duration > 0 ? duration : maxCoverage);
        const motionSamples = duration > 900 ? 64 : duration > 300 ? 88 : tier === 'safe' ? 72 : tier === 'max' ? 160 : 120;
        const estimatedAnalysisMemoryMb = Math.round((audioMaxSeconds * analysisSampleRate * 4 / 1024 / 1024) * 10) / 10;
        const parallelAnalysis = Boolean(
            duration > 0 && duration <= 8 * 60 && sizeMb <= 300 &&
            cores >= 6 && memory >= 6 && memoryRisk === 'low' && tier !== 'safe'
        );
        const parallelReason = parallelAnalysis
            ? '오디오와 영상 움직임 동시 분석'
            : longMedia ? '장시간 미디어 메모리 안정 우선' : memoryRisk !== 'low' ? '디코딩 메모리 안정 우선' : '기기 자원 안정 우선';
        const responsivenessSliceMs = tier === 'safe' ? 8 : tier === 'max' ? 14 : 10;
        return {
            tier,
            sizeMb: Math.round(sizeMb * 10) / 10,
            duration,
            cores,
            memory,
            longMedia,
            audioMaxSeconds,
            analysisSampleRate,
            motionSamples,
            estimatedAnalysisMemoryMb,
            estimatedDecodeMemoryMb,
            memoryRisk,
            memoryRiskLabel: memoryRisk === 'high' ? '메모리 주의' : memoryRisk === 'medium' ? '메모리 확인' : '메모리 안정',
            hardBlock,
            isUncompressedAudio,
            rawBufferCopyAvoided: true,
            retainDecoded: false,
            retainChannelData: false,
            parallelAnalysis,
            parallelReason,
            responsivenessSliceMs,
            cacheNamespace: `engine-v${ENGINE_VERSION}`,
            recommendationCount: tier === 'safe' ? 5 : tier === 'max' ? 9 : 7,
            uiThrottleMs: tier === 'safe' ? 180 : tier === 'max' ? 70 : 110,
            label: longMedia ? (tier === 'safe' ? '장시간 안전 모드' : '장시간 균형 모드') : tier === 'safe' ? '안전 모드' : tier === 'max' ? '최대 성능' : '균형 성능'
        };
    }

    global.AIShortsPerformanceBudget = Object.freeze({ createProfiler, createBudget });
})(window);
