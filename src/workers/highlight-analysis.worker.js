// AI Shorts Studio v0.3.0 - highlight analysis worker
'use strict';

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

function analyzeAudio(channelData, sampleRate, duration) {
    const data = channelData || new Float32Array(0);
    const sr = Math.max(8000, Number(sampleRate) || 44100);
    const windowSize = Math.max(1024, Math.floor(sr * 1.0));
    const hopSize = Math.max(512, Math.floor(sr * 0.25));
    const frameCount = Math.max(1, Math.floor(Math.max(0, data.length - windowSize) / hopSize) + 1);
    const raw = [];
    const rmsValues = [];
    const peakValues = [];
    const transientValues = [];
    const zcrValues = [];
    let previousRms = 0;
    for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
        if (frameIndex % 64 === 0) {
            self.postMessage({ type: 'progress', progress: 40 + Math.round((frameIndex / frameCount) * 36), status: '에너지 분석 중' });
        }
        const start = frameIndex * hopSize;
        const end = Math.min(data.length, start + windowSize);
        let sumSquares = 0;
        let peak = 0;
        let zcr = 0;
        let prev = data[start] || 0;
        for (let i = start; i < end; i += 1) {
            const value = data[i] || 0;
            const abs = Math.abs(value);
            sumSquares += value * value;
            if (abs > peak) peak = abs;
            if ((value >= 0 && prev < 0) || (value < 0 && prev >= 0)) zcr += 1;
            prev = value;
        }
        const size = Math.max(1, end - start);
        const rms = Math.sqrt(sumSquares / size);
        const transient = Math.max(0, rms - previousRms);
        previousRms = rms;
        const zcrRate = zcr / size;
        const time = start / sr;
        raw.push({ time, rms, peak, transient, zcr: zcrRate });
        rmsValues.push(rms);
        peakValues.push(peak);
        transientValues.push(transient);
        zcrValues.push(zcrRate);
    }
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
    const peak = Math.max.apply(null, peakValues.concat([0]));
    return {
        duration: Number(duration) || (data.length / sr),
        sampleRate: sr,
        frameHopSec: hopSize / sr,
        frameWindowSec: windowSize / sr,
        frames,
        summary: {
            avgRms,
            peak,
            loudnessDensity: loudFrames / Math.max(1, frames.length),
            silenceRatio: silentFrames / Math.max(1, frames.length),
            dynamicRangeProxy: percentile(rmsValues, 0.94) - percentile(rmsValues, 0.12),
            transientDensity: transientValues.filter(value => value > percentile(transientValues, 0.7)).length / Math.max(1, transientValues.length)
        }
    };
}

self.onmessage = event => {
    const message = event.data || {};
    if (message.type !== 'analyzeAudio') return;
    try {
        const analysis = analyzeAudio(message.channelData, message.sampleRate, message.duration);
        self.postMessage({ type: 'progress', progress: 78, status: '추천 후보 계산 준비' });
        self.postMessage({ type: 'result', analysis });
    } catch (error) {
        self.postMessage({ type: 'error', message: error && error.message ? error.message : '분석 실패' });
    }
};
