// AI Shorts Studio v1.1.8 - max-stable engine capability profile
'use strict';

(function installEngineBoostProfile(global) {
    function toNumber(value, fallback) {
        const number = Number(value);
        return Number.isFinite(number) && number > 0 ? number : fallback;
    }

    function collect() {
        const nav = global.navigator || {};
        const connection = nav.connection || nav.mozConnection || nav.webkitConnection || null;
        const cores = toNumber(nav.hardwareConcurrency, 2);
        const memory = toNumber(nav.deviceMemory, cores >= 8 ? 8 : 4);
        const worker = typeof global.Worker !== 'undefined';
        const offscreenCanvas = typeof global.OffscreenCanvas !== 'undefined';
        const mediaRecorder = typeof global.MediaRecorder !== 'undefined';
        const webCodecs = typeof global.VideoEncoder !== 'undefined' || typeof global.VideoDecoder !== 'undefined';
        const saveData = Boolean(connection && connection.saveData);
        const effectiveType = connection && connection.effectiveType || 'unknown';
        const score = [cores >= 8, memory >= 8, worker, offscreenCanvas, mediaRecorder, webCodecs, !saveData]
            .reduce((sum, yes) => sum + (yes ? 1 : 0), 0);
        const tier = score >= 6 ? 'MAX' : score >= 4 ? 'PRO' : 'SAFE';
        const label = tier === 'MAX' ? 'MAX-STABLE' : tier === 'PRO' ? 'PRO-STABLE' : 'SAFE-STABLE';
        return Object.freeze({
            label,
            tier,
            score,
            cores,
            memory,
            worker,
            offscreenCanvas,
            mediaRecorder,
            webCodecs,
            saveData,
            effectiveType,
            recommendedParallelism: Math.max(1, Math.min(4, Math.floor(cores / 2))),
            maxMotionSamples: tier === 'MAX' ? 220 : tier === 'PRO' ? 180 : 120,
            renderQueueLimit: tier === 'MAX' ? 16 : tier === 'PRO' ? 12 : 8
        });
    }

    function applyToRuntimeConfig() {
        const config = global.AIShortsRuntimeConfig;
        const profile = collect();
        if (!config) return profile;
        try {
            global.AIShortsActiveEngineBoostProfile = profile;
            document.documentElement.dataset.engineBoostProfile = profile.label;
        } catch (_) {}
        return profile;
    }

    const initialProfile = applyToRuntimeConfig();

    global.AIShortsEngineBoostProfile = Object.freeze({
        collect,
        apply: applyToRuntimeConfig,
        initialProfile
    });
})(window);
