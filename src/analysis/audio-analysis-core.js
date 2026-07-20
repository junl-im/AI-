// AI Shorts Studio v1.3.5 - shared adaptive-rate audio analysis core
'use strict';

(function exposeAudioAnalysisCore(global) {
    function clamp(value, min, max) {
        const number = Number(value);
        if (!Number.isFinite(number)) return min;
        return Math.min(max, Math.max(min, number));
    }

    function percentile(values, pct) {
        const list = Array.from(values || []).filter(Number.isFinite).sort((a, b) => a - b);
        if (!list.length) return 0;
        const index = clamp(Math.round((list.length - 1) * pct), 0, list.length - 1);
        return list[index];
    }

    function normalize(values) {
        const list = Array.from(values || []).map(value => Number(value) || 0);
        if (!list.length) return [];
        const low = percentile(list, 0.08);
        const high = percentile(list, 0.96);
        const span = Math.max(1e-9, high - low);
        return list.map(value => clamp((value - low) / span, 0, 1));
    }

    function abortError(reason) {
        const error = new Error(String(reason || '오디오 분석이 취소되었습니다.'));
        error.name = 'AbortError';
        return error;
    }

    function throwIfAborted(signal) {
        if (signal && signal.aborted) throw abortError(signal.reason);
    }

    function createPlan(channelData, sampleRate) {
        const data = channelData || new Float32Array(0);
        const sr = Math.max(4000, Number(sampleRate) || 8000);
        const windowSize = Math.max(1024, Math.floor(sr * 1.0));
        const hopSize = Math.max(512, Math.floor(sr * 0.25));
        const frameCount = Math.max(1, Math.floor(Math.max(0, data.length - windowSize) / hopSize) + 1);
        return { data, sr, windowSize, hopSize, frameCount };
    }

    function analyzeFrame(plan, frameIndex, previousRms) {
        const start = frameIndex * plan.hopSize;
        const end = Math.min(plan.data.length, start + plan.windowSize);
        let sumSquares = 0;
        let peak = 0;
        let zcr = 0;
        let prev = plan.data[start] || 0;
        for (let i = start; i < end; i += 1) {
            const value = plan.data[i] || 0;
            const abs = Math.abs(value);
            sumSquares += value * value;
            if (abs > peak) peak = abs;
            if ((value >= 0 && prev < 0) || (value < 0 && prev >= 0)) zcr += 1;
            prev = value;
        }
        const size = Math.max(1, end - start);
        const rms = Math.sqrt(sumSquares / size);
        return {
            item: {
                time: start / plan.sr,
                rms,
                peak,
                transient: Math.max(0, rms - previousRms),
                zcr: zcr / size
            },
            rms
        };
    }

    function finalize(plan, raw, duration) {
        const rmsValues = raw.map(item => item.rms);
        const peakValues = raw.map(item => item.peak);
        const transientValues = raw.map(item => item.transient);
        const zcrValues = raw.map(item => item.zcr);
        const rmsNorm = normalize(rmsValues);
        const peakNorm = normalize(peakValues);
        const transientNorm = normalize(transientValues);
        const zcrNorm = normalize(zcrValues);
        const silenceGate = percentile(rmsValues, 0.18) * 0.75;
        const frames = raw.map((frame, index) => ({
            time: Number(frame.time.toFixed(3)),
            rms: frame.rms,
            peak: frame.peak,
            transient: frame.transient,
            zcr: frame.zcr,
            rmsNorm: rmsNorm[index] || 0,
            peakNorm: peakNorm[index] || 0,
            transientNorm: transientNorm[index] || 0,
            zcrNorm: zcrNorm[index] || 0,
            silent: frame.rms <= silenceGate
        }));
        const loudFrames = frames.filter(frame => frame.rmsNorm > 0.68).length;
        const silentFrames = frames.filter(frame => frame.silent).length;
        const avgRms = rmsValues.reduce((sum, value) => sum + value, 0) / Math.max(1, rmsValues.length);
        return {
            duration: Number(duration) || (plan.data.length / plan.sr),
            sampleRate: plan.sr,
            frameHopSec: plan.hopSize / plan.sr,
            frameWindowSec: plan.windowSize / plan.sr,
            frames,
            summary: {
                avgRms,
                peak: Math.max.apply(null, peakValues.concat([0])),
                loudnessDensity: loudFrames / Math.max(1, frames.length),
                silenceRatio: silentFrames / Math.max(1, frames.length),
                dynamicRangeProxy: percentile(rmsValues, 0.94) - percentile(rmsValues, 0.12),
                transientDensity: transientValues.filter(value => value > percentile(transientValues, 0.7)).length / Math.max(1, transientValues.length)
            }
        };
    }

    function analyzeAudio(channelData, sampleRate, duration, onProgress, signal) {
        const plan = createPlan(channelData, sampleRate);
        const raw = [];
        let previousRms = 0;
        for (let frameIndex = 0; frameIndex < plan.frameCount; frameIndex += 1) {
            throwIfAborted(signal);
            if (frameIndex % 64 === 0 && onProgress) onProgress(40 + Math.round((frameIndex / plan.frameCount) * 36), '에너지 분석 중');
            const frame = analyzeFrame(plan, frameIndex, previousRms);
            raw.push(frame.item);
            previousRms = frame.rms;
        }
        throwIfAborted(signal);
        return finalize(plan, raw, duration);
    }

    async function analyzeAudioAsync(channelData, sampleRate, duration, onProgress, signal) {
        const plan = createPlan(channelData, sampleRate);
        const raw = [];
        let previousRms = 0;
        const batchSize = 12;
        for (let frameIndex = 0; frameIndex < plan.frameCount; frameIndex += 1) {
            throwIfAborted(signal);
            const frame = analyzeFrame(plan, frameIndex, previousRms);
            raw.push(frame.item);
            previousRms = frame.rms;
            if (frameIndex % batchSize === 0) {
                if (onProgress) onProgress(40 + Math.round((frameIndex / plan.frameCount) * 36), '호환 분석 중');
                await new Promise(resolve => global.setTimeout(resolve, 0));
            }
        }
        throwIfAborted(signal);
        return finalize(plan, raw, duration);
    }

    global.AIShortsAudioAnalysisCore = Object.freeze({ analyzeAudio, analyzeAudioAsync, percentile, normalize });
})(typeof self !== 'undefined' ? self : window);
