// AI Shorts Studio v1.6.2 - cancellable adaptive video motion analyzer
'use strict';

(function exposeVideoMotionAnalyzer(global) {
    const config = global.AIShortsRuntimeConfig || {};
    const utils = global.AIShortsCoreUtils || {};

    function abortError(reason) {
        const error = new Error(String(reason || '영상 분석이 취소되었습니다.'));
        error.name = 'AbortError';
        return error;
    }

    function throwIfAborted(signal) {
        if (signal && signal.aborted) throw abortError(signal.reason);
    }

    function waitForEvent(target, eventName, timeoutMs, signal) {
        return new Promise((resolve, reject) => {
            let timer = 0;
            function cleanup() {
                target.removeEventListener(eventName, onEvent);
                target.removeEventListener('error', onError);
                if (signal) signal.removeEventListener('abort', onAbort);
                if (timer) clearTimeout(timer);
            }
            function onEvent() { cleanup(); resolve(); }
            function onError() { cleanup(); reject(new Error('비디오를 읽을 수 없습니다.')); }
            function onAbort() { cleanup(); reject(abortError(signal && signal.reason)); }
            if (signal && signal.aborted) { reject(abortError(signal.reason)); return; }
            target.addEventListener(eventName, onEvent, { once: true });
            target.addEventListener('error', onError, { once: true });
            if (signal) signal.addEventListener('abort', onAbort, { once: true });
            if (timeoutMs) {
                timer = setTimeout(() => {
                    cleanup();
                    reject(new Error('비디오 응답 시간이 너무 깁니다.'));
                }, timeoutMs);
            }
        });
    }

    async function seekVideo(video, time, signal) {
        const target = Math.max(0, Math.min(Number(time) || 0, Math.max(0, (video.duration || 0) - 0.05)));
        if (Math.abs((video.currentTime || 0) - target) < 0.04) return;
        throwIfAborted(signal);
        const promise = waitForEvent(video, 'seeked', 2600, signal).catch(error => {
            if (error && error.name === 'AbortError') throw error;
        });
        video.currentTime = target;
        await promise;
        throwIfAborted(signal);
    }

    function frameDiff(current, previous) {
        if (!current || !previous || current.length !== previous.length) return 0;
        let sum = 0;
        const step = 4;
        for (let i = 0; i < current.length; i += step) {
            sum += Math.abs(current[i] - previous[i]);
            sum += Math.abs(current[i + 1] - previous[i + 1]);
            sum += Math.abs(current[i + 2] - previous[i + 2]);
        }
        return sum / (current.length / step * 3 * 255);
    }

    async function analyzeVideoMotion(fileUrl, onProgress, signal, options) {
        throwIfAborted(signal);
        const opts = options || {};
        const video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;
        video.preload = 'metadata';
        video.src = fileUrl;
        try {
            await waitForEvent(video, 'loadedmetadata', 5000, signal);
            throwIfAborted(signal);
            const duration = Number(video.duration) || 0;
            if (!duration) return { duration: 0, frames: [], summary: { motionDensity: 0, samples: 0 } };
            const configuredMax = Math.max(18, Number(opts.maxSamples || config.MAX_VIDEO_MOTION_SAMPLES || 160));
            const naturalSamples = Math.max(18, Math.floor(duration * 1.2));
            const samples = Math.min(configuredMax, naturalSamples);
            const width = 96;
            const height = 170;
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            let previous = null;
            const raw = [];
            for (let i = 0; i < samples; i += 1) {
                const time = duration * (i / Math.max(1, samples - 1));
                if (onProgress && i % 6 === 0) onProgress(78 + Math.round((i / samples) * 12), `영상 움직임 샘플링 중 · ${i + 1}/${samples}`);
                throwIfAborted(signal);
                await seekVideo(video, time, signal);
                try {
                    ctx.drawImage(video, 0, 0, width, height);
                    const image = ctx.getImageData(0, 0, width, height).data;
                    const diff = previous ? frameDiff(image, previous) : 0;
                    previous = new Uint8ClampedArray(image);
                    raw.push({ time, diff });
                } catch (error) {
                    raw.push({ time, diff: 0 });
                }
            }
            throwIfAborted(signal);
            const normalized = utils.normalizeList ? utils.normalizeList(raw.map(item => item.diff)) : raw.map(item => item.diff);
            const frames = raw.map((item, index) => ({ time: Number(item.time.toFixed(3)), diff: item.diff, diffNorm: Number((normalized[index] || 0).toFixed(4)) }));
            const active = frames.filter(frame => frame.diffNorm > 0.58).length;
            return {
                duration,
                frames,
                summary: {
                    motionDensity: active / Math.max(1, frames.length),
                    maxMotion: Math.max.apply(null, frames.map(frame => frame.diffNorm).concat([0])),
                    samples: frames.length,
                    adaptive: true
                }
            };
        } finally {
            try {
                video.pause();
                video.removeAttribute('src');
                video.load();
            } catch (error) { /* ignored */ }
        }
    }

    global.AIShortsVideoMotionAnalyzer = Object.freeze({ analyzeVideoMotion });
})(window);
