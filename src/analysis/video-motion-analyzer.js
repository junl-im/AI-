// AI Shorts Studio v1.6.9 - cancellable spatial motion and subject-saliency analyzer
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

    function frameDiffMetrics(current, previous, width, height) {
        if (!current || !previous || current.length !== previous.length) {
            return { diff: 0, motionX: 0.5, motionY: 0.46, spatialConfidence: 0, motionSpread: 1, motionBox: null };
        }
        let sum = 0;
        let weightSum = 0;
        let weightedX = 0;
        let weightedY = 0;
        let active = 0;
        let minX = width;
        let minY = height;
        let maxX = 0;
        let maxY = 0;
        const pixels = Math.max(1, width * height);
        for (let pixel = 0, i = 0; i < current.length; i += 4, pixel += 1) {
            const delta = (Math.abs(current[i] - previous[i]) + Math.abs(current[i + 1] - previous[i + 1]) + Math.abs(current[i + 2] - previous[i + 2])) / (3 * 255);
            sum += delta;
            const weight = Math.max(0, delta - 0.055);
            if (weight <= 0) continue;
            const x = pixel % width;
            const y = Math.floor(pixel / width);
            weightSum += weight;
            weightedX += x * weight;
            weightedY += y * weight;
            if (delta > 0.13) {
                active += 1;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
        const diff = sum / pixels;
        const motionX = weightSum > 0 ? weightedX / weightSum / Math.max(1, width - 1) : 0.5;
        const motionY = weightSum > 0 ? weightedY / weightSum / Math.max(1, height - 1) : 0.46;
        const activeRatio = active / pixels;
        const spread = active ? ((maxX - minX + 1) * (maxY - minY + 1)) / pixels : 1;
        const energy = Math.min(1, weightSum / (pixels * 0.12));
        const globalPenalty = activeRatio > 0.42 ? Math.max(0.12, 1 - (activeRatio - 0.42) * 1.7) : 1;
        const spreadPenalty = spread > 0.72 ? Math.max(0.18, 1 - (spread - 0.72) * 2.2) : 1;
        const spatialConfidence = Math.max(0, Math.min(1, energy * globalPenalty * spreadPenalty));
        const motionBox = active ? {
            x: Number((minX / width).toFixed(4)),
            y: Number((minY / height).toFixed(4)),
            width: Number(((maxX - minX + 1) / width).toFixed(4)),
            height: Number(((maxY - minY + 1) / height).toFixed(4))
        } : null;
        return {
            diff,
            motionX: Number(motionX.toFixed(4)),
            motionY: Number(motionY.toFixed(4)),
            spatialConfidence: Number(spatialConfidence.toFixed(4)),
            motionSpread: Number(spread.toFixed(4)),
            motionBox
        };
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
            const sourceWidth = Math.max(1, Number(video.videoWidth) || 1920);
            const sourceHeight = Math.max(1, Number(video.videoHeight) || 1080);
            const sampleMaxDimension = 144;
            const sampleScale = Math.min(1, sampleMaxDimension / Math.max(sourceWidth, sourceHeight));
            const width = Math.max(48, Math.round(sourceWidth * sampleScale));
            const height = Math.max(48, Math.round(sourceHeight * sampleScale));
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
                    const metrics = previous ? frameDiffMetrics(image, previous, width, height) : { diff: 0, motionX: 0.5, motionY: 0.46, spatialConfidence: 0, motionSpread: 1, motionBox: null };
                    previous = new Uint8ClampedArray(image);
                    raw.push(Object.assign({ time }, metrics));
                } catch (error) {
                    raw.push({ time, diff: 0, motionX: 0.5, motionY: 0.46, spatialConfidence: 0, motionSpread: 1, motionBox: null });
                }
            }
            throwIfAborted(signal);
            const normalized = utils.normalizeList ? utils.normalizeList(raw.map(item => item.diff)) : raw.map(item => item.diff);
            const frames = raw.map((item, index) => ({
                time: Number(item.time.toFixed(3)),
                diff: item.diff,
                diffNorm: Number((normalized[index] || 0).toFixed(4)),
                motionX: Number((item.motionX == null ? 0.5 : item.motionX).toFixed(4)),
                motionY: Number((item.motionY == null ? 0.46 : item.motionY).toFixed(4)),
                spatialConfidence: Number((item.spatialConfidence || 0).toFixed(4)),
                motionSpread: Number((item.motionSpread == null ? 1 : item.motionSpread).toFixed(4)),
                motionBox: item.motionBox || null
            }));
            const active = frames.filter(frame => frame.diffNorm > 0.58).length;
            return {
                duration,
                frames,
                summary: {
                    motionDensity: active / Math.max(1, frames.length),
                    maxMotion: Math.max.apply(null, frames.map(frame => frame.diffNorm).concat([0])),
                    samples: frames.length,
                    spatialSamples: frames.filter(frame => frame.spatialConfidence > 0.08).length,
                    averageSpatialConfidence: Number((frames.reduce((sum, frame) => sum + frame.spatialConfidence, 0) / Math.max(1, frames.length)).toFixed(4)),
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

    global.AIShortsVideoMotionAnalyzer = Object.freeze({ analyzeVideoMotion, _test: Object.freeze({ frameDiffMetrics }) });
})(window);
