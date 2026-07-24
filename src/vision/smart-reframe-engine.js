// AI Shorts Studio v1.6.5 - local subject tracking and caption-safe smart reframe engine
'use strict';

(function exposeSmartReframeEngine(global) {
    const config = global.AIShortsRuntimeConfig || {};
    const DEFAULTS = Object.freeze({
        sampleCount: Math.max(8, Number(config.SMART_REFRAME_SAMPLE_COUNT || 36)),
        minDetectionConfidence: Math.max(0.1, Math.min(0.95, Number(config.SMART_REFRAME_MIN_CONFIDENCE || 0.45))),
        smoothing: 0.30,
        deadZone: 0.018,
        maxStep: Math.max(0.02, Math.min(0.3, Number(config.SMART_REFRAME_MAX_STEP || 0.12))),
        zoom: 1.08,
        motionZoom: 1.04,
        captionAvoidance: true
    });
    let detectorProvider = null;
    let nativeDetectorPromise = null;

    function clamp(value, min, max) {
        const number = Number(value);
        if (!Number.isFinite(number)) return min;
        return Math.max(min, Math.min(max, number));
    }

    function finite(value, fallback) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }

    function abortError(reason) {
        const error = new Error(String(reason || '피사체 추적이 취소되었습니다.'));
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
            function onError() { cleanup(); reject(new Error('영상 프레임을 읽지 못했습니다.')); }
            function onAbort() { cleanup(); reject(abortError(signal && signal.reason)); }
            if (signal && signal.aborted) { reject(abortError(signal.reason)); return; }
            target.addEventListener(eventName, onEvent, { once: true });
            target.addEventListener('error', onError, { once: true });
            if (signal) signal.addEventListener('abort', onAbort, { once: true });
            if (timeoutMs) timer = setTimeout(() => { cleanup(); reject(new Error('영상 프레임 응답 시간이 너무 깁니다.')); }, timeoutMs);
        });
    }

    async function seekVideo(video, time, signal) {
        const ceiling = Math.max(0, finite(video.duration, 0) - 0.04);
        const target = clamp(time, 0, ceiling);
        if (Math.abs(finite(video.currentTime, 0) - target) < 0.035) return;
        const pending = waitForEvent(video, 'seeked', 3000, signal);
        video.currentTime = target;
        await pending;
        throwIfAborted(signal);
    }

    function safePoint(input, fallbackTime) {
        const point = input || {};
        const box = point.box && typeof point.box === 'object' ? {
            x: clamp(point.box.x, 0, 1),
            y: clamp(point.box.y, 0, 1),
            width: clamp(point.box.width, 0, 1),
            height: clamp(point.box.height, 0, 1)
        } : null;
        return {
            time: Math.max(0, finite(point.time, fallbackTime || 0)),
            x: clamp(point.x, 0, 1),
            y: clamp(point.y, 0, 1),
            confidence: clamp(point.confidence, 0, 1),
            source: String(point.source || 'motion').slice(0, 24),
            box
        };
    }

    function smoothPoints(points, options) {
        const opts = Object.assign({}, DEFAULTS, options || {});
        const ordered = (Array.isArray(points) ? points : []).map((point, index) => safePoint(point, index)).sort((a, b) => a.time - b.time);
        if (!ordered.length) return [];
        let x = ordered[0].x;
        let y = ordered[0].y;
        return ordered.map((point, index) => {
            if (!index) return Object.assign({}, point, { x: Number(x.toFixed(5)), y: Number(y.toFixed(5)) });
            const confidenceWeight = 0.42 + point.confidence * 0.58;
            const alpha = clamp(opts.smoothing * confidenceWeight, 0.08, 0.82);
            let dx = point.x - x;
            let dy = point.y - y;
            if (Math.abs(dx) < opts.deadZone) dx = 0;
            if (Math.abs(dy) < opts.deadZone) dy = 0;
            dx = clamp(dx, -opts.maxStep, opts.maxStep);
            dy = clamp(dy, -opts.maxStep, opts.maxStep);
            x = clamp(x + dx * alpha, 0, 1);
            y = clamp(y + dy * alpha, 0, 1);
            return Object.assign({}, point, { x: Number(x.toFixed(5)), y: Number(y.toFixed(5)) });
        });
    }

    function trackId(points, source) {
        let hash = 2166136261;
        const text = `${source || 'motion'}|${points.map(point => `${point.time.toFixed(2)}:${point.x.toFixed(3)}:${point.y.toFixed(3)}:${point.confidence.toFixed(2)}`).join('|')}`;
        for (let index = 0; index < text.length; index += 1) {
            hash ^= text.charCodeAt(index);
            hash = Math.imul(hash, 16777619);
        }
        return `reframe-${(hash >>> 0).toString(16).padStart(8, '0')}`;
    }

    function buildTrack(points, source, options, extraSummary) {
        const smoothed = smoothPoints(points, options);
        const confidences = smoothed.map(point => point.confidence);
        const facePoints = smoothed.filter(point => point.source === 'face');
        const averageConfidence = confidences.length ? confidences.reduce((sum, value) => sum + value, 0) / confidences.length : 0;
        const summary = Object.assign({
            source: source || 'motion',
            samples: smoothed.length,
            averageConfidence: Number(averageConfidence.toFixed(4)),
            faceCoverage: Number((facePoints.length / Math.max(1, smoothed.length)).toFixed(4)),
            captionSafe: options && options.captionAvoidance !== false
        }, extraSummary || {});
        return Object.freeze({
            id: trackId(smoothed, source),
            version: 1,
            source: source || 'motion',
            points: Object.freeze(smoothed.map(point => Object.freeze(point))),
            summary: Object.freeze(summary)
        });
    }

    function createTrackFromMotion(motionAnalysis, options) {
        const frames = Array.isArray(motionAnalysis && motionAnalysis.frames) ? motionAnalysis.frames : [];
        const points = frames.map(frame => ({
            time: finite(frame.time, 0),
            x: Number.isFinite(Number(frame.motionX)) ? Number(frame.motionX) : 0.5,
            y: Number.isFinite(Number(frame.motionY)) ? Number(frame.motionY) : 0.46,
            confidence: Number.isFinite(Number(frame.spatialConfidence)) ? Number(frame.spatialConfidence) : clamp((Number(frame.diffNorm) || 0) * 0.72, 0.08, 0.58),
            source: 'motion',
            box: frame.motionBox || null
        }));
        if (!points.length) points.push({ time: 0, x: 0.5, y: 0.46, confidence: 0.15, source: 'motion' });
        return buildTrack(points, 'motion', options, { detector: 'motion-saliency' });
    }

    function normalizeDetection(item, width, height) {
        const detection = item || {};
        const box = detection.boundingBox || detection.box || detection;
        const rawX = finite(box.x, finite(box.originX, 0));
        const rawY = finite(box.y, finite(box.originY, 0));
        const rawWidth = finite(box.width, 0);
        const rawHeight = finite(box.height, 0);
        const normalized = rawWidth <= 1 && rawHeight <= 1 && rawX <= 1 && rawY <= 1;
        const x = normalized ? rawX : rawX / Math.max(1, width);
        const y = normalized ? rawY : rawY / Math.max(1, height);
        const boxWidth = normalized ? rawWidth : rawWidth / Math.max(1, width);
        const boxHeight = normalized ? rawHeight : rawHeight / Math.max(1, height);
        const category = Array.isArray(detection.categories) ? detection.categories[0] : null;
        const confidence = clamp(detection.confidence != null ? detection.confidence : category && category.score != null ? category.score : 0.5, 0, 1);
        return {
            x: clamp(x, 0, 1),
            y: clamp(y, 0, 1),
            width: clamp(boxWidth, 0, 1),
            height: clamp(boxHeight, 0, 1),
            confidence
        };
    }

    function choosePrimary(detections, previous) {
        const list = Array.isArray(detections) ? detections : [];
        let best = null;
        let bestScore = -Infinity;
        list.forEach(box => {
            const cx = clamp(box.x + box.width / 2, 0, 1);
            const cy = clamp(box.y + box.height * 0.42, 0, 1);
            const area = clamp(box.width * box.height, 0, 1);
            const centerDistance = Math.hypot(cx - 0.5, cy - 0.42);
            const continuityDistance = previous ? Math.hypot(cx - previous.x, cy - previous.y) : centerDistance;
            const score = box.confidence * 0.48 + Math.sqrt(area) * 0.24 + (1 - clamp(continuityDistance, 0, 1)) * 0.22 + (1 - clamp(centerDistance, 0, 1)) * 0.06;
            if (score > bestScore) {
                bestScore = score;
                best = { x: cx, y: cy, confidence: box.confidence, source: 'face', box };
            }
        });
        return best;
    }

    function registerDetectorProvider(provider) {
        if (provider == null) { detectorProvider = null; return true; }
        if (typeof provider.detect !== 'function') throw new Error('피사체 감지 제공자는 detect(frame) 함수를 제공해야 합니다.');
        detectorProvider = provider;
        return true;
    }

    function registerMediaPipeFaceDetector(detector) {
        if (!detector || typeof detector.detectForVideo !== 'function') {
            throw new Error('MediaPipe Face Detector는 detectForVideo(frame, timestamp) 함수를 제공해야 합니다.');
        }
        return registerDetectorProvider({
            name: 'mediapipe-face-detector',
            detect(frame, meta) {
                const timestampMs = Math.max(0, Math.round(finite(meta && meta.time, 0) * 1000));
                return detector.detectForVideo(frame, timestampMs);
            }
        });
    }

    async function getNativeDetector() {
        if (detectorProvider) return detectorProvider;
        if (nativeDetectorPromise) return nativeDetectorPromise;
        if (typeof global.FaceDetector !== 'function') return null;
        nativeDetectorPromise = Promise.resolve().then(() => {
            const detector = new global.FaceDetector({ fastMode: true, maxDetectedFaces: 6 });
            return { name: 'browser-face-detector', detect: frame => detector.detect(frame), close: () => {} };
        }).catch(() => null);
        return nativeDetectorPromise;
    }

    function getMotionPointAt(motionTrack, time) {
        return getFocusAt(motionTrack, time) || { time, x: 0.5, y: 0.46, confidence: 0.12, source: 'motion', box: null };
    }

    async function analyzeVideoSubjects(fileUrl, onProgress, signal, options) {
        const opts = Object.assign({}, DEFAULTS, options || {});
        const motionTrack = createTrackFromMotion(opts.motionAnalysis || null, opts);
        const provider = opts.detectorProvider || await getNativeDetector();
        if (!provider || !fileUrl || typeof document === 'undefined') return motionTrack;
        throwIfAborted(signal);
        const video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;
        video.preload = 'metadata';
        video.src = fileUrl;
        try {
            await waitForEvent(video, 'loadedmetadata', 6000, signal);
            const duration = finite(video.duration, finite(opts.motionAnalysis && opts.motionAnalysis.duration, 0));
            if (!duration) return motionTrack;
            const canvas = document.createElement('canvas');
            const sourceWidth = Math.max(1, finite(video.videoWidth, 640));
            const sourceHeight = Math.max(1, finite(video.videoHeight, 360));
            const scale = Math.min(1, 480 / Math.max(sourceWidth, sourceHeight));
            canvas.width = Math.max(96, Math.round(sourceWidth * scale));
            canvas.height = Math.max(96, Math.round(sourceHeight * scale));
            const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: false });
            if (!ctx) return motionTrack;
            const samples = Math.max(8, Math.min(72, Math.round(opts.sampleCount || DEFAULTS.sampleCount), Math.ceil(duration * 1.5)));
            const points = [];
            let previous = null;
            let detectedFrames = 0;
            for (let index = 0; index < samples; index += 1) {
                throwIfAborted(signal);
                const time = duration * (index / Math.max(1, samples - 1));
                if (onProgress) onProgress(10 + Math.round((index / Math.max(1, samples - 1)) * 84), `피사체 추적 중 · ${index + 1}/${samples}`);
                await seekVideo(video, time, signal);
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                let detections = [];
                try {
                    const result = await provider.detect(canvas, { time, signal });
                    const raw = Array.isArray(result) ? result : Array.isArray(result && result.detections) ? result.detections : [];
                    detections = raw.map(item => normalizeDetection(item, canvas.width, canvas.height)).filter(item => item.confidence >= opts.minDetectionConfidence && item.width > 0 && item.height > 0);
                } catch (error) {
                    if (error && error.name === 'AbortError') throw error;
                    detections = [];
                }
                const primary = choosePrimary(detections, previous);
                if (primary) {
                    previous = primary;
                    detectedFrames += 1;
                    points.push(Object.assign({ time }, primary));
                } else {
                    const fallback = getMotionPointAt(motionTrack, time);
                    points.push(Object.assign({}, fallback, { time, confidence: clamp(fallback.confidence * 0.82, 0.08, 0.56), source: 'motion' }));
                }
                await new Promise(resolve => setTimeout(resolve, 0));
            }
            const faceCoverage = detectedFrames / Math.max(1, samples);
            const source = detectedFrames ? (detectedFrames === samples ? 'face' : 'hybrid') : 'motion';
            return buildTrack(points, source, opts, {
                detector: String(provider.name || 'face-detector').slice(0, 48),
                faceCoverage: Number(faceCoverage.toFixed(4)),
                duration: Number(duration.toFixed(3))
            });
        } finally {
            try {
                video.pause();
                video.removeAttribute('src');
                video.load();
            } catch (error) { /* ignored */ }
        }
    }

    function getFocusAt(track, time) {
        const points = Array.isArray(track && track.points) ? track.points : [];
        if (!points.length) return null;
        const target = Math.max(0, finite(time, 0));
        if (target <= points[0].time) return points[0];
        if (target >= points[points.length - 1].time) return points[points.length - 1];
        let low = 0;
        let high = points.length - 1;
        while (low + 1 < high) {
            const middle = Math.floor((low + high) / 2);
            if (points[middle].time <= target) low = middle;
            else high = middle;
        }
        const left = points[low];
        const right = points[high];
        const span = Math.max(0.001, right.time - left.time);
        const ratio = clamp((target - left.time) / span, 0, 1);
        const preferred = ratio < 0.5 ? left : right;
        return {
            time: target,
            x: left.x + (right.x - left.x) * ratio,
            y: left.y + (right.y - left.y) * ratio,
            confidence: left.confidence + (right.confidence - left.confidence) * ratio,
            source: left.source === 'face' || right.source === 'face' ? 'face' : preferred.source,
            box: preferred.box || null
        };
    }

    function desiredSubjectY(captionOptions, captionAvoidance) {
        if (!captionAvoidance) return 0.46;
        const position = String(captionOptions && captionOptions.position || 'lower');
        if (position === 'middle') return 0.25;
        if (position === 'lower' || position === 'safe-bottom') return 0.34;
        if (position === 'upper') return 0.66;
        return 0.44;
    }

    function resolveCropRect(sourceWidth, sourceHeight, targetWidth, targetHeight, focusInput, options) {
        const swidth = Math.max(1, finite(sourceWidth, 1));
        const sheight = Math.max(1, finite(sourceHeight, 1));
        const twidth = Math.max(1, finite(targetWidth, 1));
        const theight = Math.max(1, finite(targetHeight, 1));
        const opts = Object.assign({}, DEFAULTS, options || {});
        const focus = safePoint(focusInput || { x: 0.5, y: 0.46, confidence: 0.1 }, 0);
        const targetRatio = twidth / theight;
        const sourceRatio = swidth / sheight;
        const isFace = focus.source === 'face' || focus.box;
        const requestedZoom = isFace ? opts.zoom : opts.motionZoom;
        const zoom = clamp(requestedZoom, 1, 1.25);
        let cropWidth;
        let cropHeight;
        if (sourceRatio >= targetRatio) {
            cropHeight = sheight / zoom;
            cropWidth = cropHeight * targetRatio;
            if (cropWidth > swidth) {
                cropWidth = swidth;
                cropHeight = cropWidth / targetRatio;
            }
        } else {
            cropWidth = swidth / zoom;
            cropHeight = cropWidth / targetRatio;
            if (cropHeight > sheight) {
                cropHeight = sheight;
                cropWidth = cropHeight * targetRatio;
            }
        }
        const desiredX = 0.5;
        const desiredY = desiredSubjectY(opts.captionOptions, opts.captionAvoidance !== false);
        let sx = focus.x * swidth - desiredX * cropWidth;
        let sy = focus.y * sheight - desiredY * cropHeight;
        sx = clamp(sx, 0, Math.max(0, swidth - cropWidth));
        sy = clamp(sy, 0, Math.max(0, sheight - cropHeight));
        return Object.freeze({
            sx: Number(sx.toFixed(4)),
            sy: Number(sy.toFixed(4)),
            sw: Number(cropWidth.toFixed(4)),
            sh: Number(cropHeight.toFixed(4)),
            focusX: focus.x,
            focusY: focus.y,
            confidence: focus.confidence,
            source: focus.source,
            zoom
        });
    }

    function scoreRange(track, start, end) {
        const points = Array.isArray(track && track.points) ? track.points : [];
        const from = Math.max(0, finite(start, 0));
        const to = Math.max(from, finite(end, from));
        const inside = points.filter(point => point.time >= from && point.time <= to);
        const selected = inside.length ? inside : [getFocusAt(track, (from + to) / 2)].filter(Boolean);
        if (!selected.length) return Object.freeze({ confidence: 0, edgeRisk: 1, faceCoverage: 0, samples: 0 });
        const confidence = selected.reduce((sum, point) => sum + point.confidence, 0) / selected.length;
        const edgeRisk = selected.reduce((sum, point) => {
            const horizontal = Math.max(0, 0.14 - point.x, point.x - 0.86) / 0.14;
            const vertical = Math.max(0, 0.10 - point.y, point.y - 0.9) / 0.10;
            return sum + clamp(Math.max(horizontal, vertical), 0, 1);
        }, 0) / selected.length;
        const faceCoverage = selected.filter(point => point.source === 'face').length / selected.length;
        return Object.freeze({
            confidence: Number(confidence.toFixed(4)),
            edgeRisk: Number(edgeRisk.toFixed(4)),
            faceCoverage: Number(faceCoverage.toFixed(4)),
            samples: selected.length
        });
    }

    function getStatus(track) {
        const summary = track && track.summary || {};
        if (!track || !Array.isArray(track.points) || !track.points.length) return Object.freeze({ ready: false, label: '피사체 추적 대기', detail: '영상 분석 후 사용할 수 있습니다.' });
        const facePercent = Math.round(clamp(summary.faceCoverage, 0, 1) * 100);
        const confidencePercent = Math.round(clamp(summary.averageConfidence, 0, 1) * 100);
        return Object.freeze({
            ready: true,
            label: summary.source === 'face' ? '얼굴 추적 준비 완료' : summary.source === 'hybrid' ? '얼굴·모션 추적 준비 완료' : '모션 추적 준비 완료',
            detail: `${summary.samples || track.points.length}개 지점 · 신뢰도 ${confidencePercent}%${facePercent ? ` · 얼굴 ${facePercent}%` : ''}`
        });
    }

    global.AIShortsSmartReframe = Object.freeze({
        defaults: DEFAULTS,
        registerDetectorProvider,
        registerMediaPipeFaceDetector,
        createTrackFromMotion,
        analyzeVideoSubjects,
        getFocusAt,
        resolveCropRect,
        scoreRange,
        getStatus,
        _test: Object.freeze({ smoothPoints, normalizeDetection, choosePrimary, buildTrack })
    });
})(window);
