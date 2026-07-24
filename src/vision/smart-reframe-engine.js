// AI Shorts Studio v1.6.9 - speaker-directed, multi-subject and scene-cut-safe smart reframe engine
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
        captionAvoidance: true,
        sceneCutProtection: true,
        sceneCutThreshold: 0.58,
        subjectMatchDistance: 0.24,
        subjectId: 'auto',
        speakerPriority: true
    });
    const MAX_KEYFRAMES = 120;
    const MAX_SUBJECTS = 12;
    const MAX_SPEAKER_CUES = 2000;
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

    function safeSubjectId(value) {
        const text = String(value == null ? 'auto' : value);
        return text === 'auto' || /^subject-[1-9][0-9]{0,2}$/.test(text) ? text : 'auto';
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

    function safeBox(input) {
        if (!input || typeof input !== 'object') return null;
        return {
            x: clamp(input.x, 0, 1),
            y: clamp(input.y, 0, 1),
            width: clamp(input.width, 0, 1),
            height: clamp(input.height, 0, 1)
        };
    }

    function safePoint(input, fallbackTime) {
        const point = input || {};
        return {
            time: Math.max(0, finite(point.time, fallbackTime || 0)),
            x: clamp(point.x, 0, 1),
            y: clamp(point.y, 0, 1),
            confidence: clamp(point.confidence, 0, 1),
            source: String(point.source || 'motion').slice(0, 24),
            subjectId: safeSubjectId(point.subjectId || 'auto'),
            zoom: clamp(point.zoom == null ? 1 : point.zoom, 1, 1.35),
            scene: Math.max(0, Math.round(finite(point.scene, 0))),
            box: safeBox(point.box)
        };
    }

    function safeKeyframe(input) {
        const keyframe = input || {};
        return {
            time: Number(Math.max(0, finite(keyframe.time, 0)).toFixed(3)),
            x: Number(clamp(keyframe.x, 0, 1).toFixed(5)),
            y: Number(clamp(keyframe.y, 0, 1).toFixed(5)),
            zoom: Number(clamp(keyframe.zoom == null ? 1.08 : keyframe.zoom, 1, 1.35).toFixed(4))
        };
    }

    function normalizeKeyframes(items) {
        const sorted = (Array.isArray(items) ? items : []).slice(0, MAX_KEYFRAMES).map(safeKeyframe).sort((a, b) => a.time - b.time);
        const output = [];
        sorted.forEach(item => {
            const existing = output[output.length - 1];
            if (existing && Math.abs(existing.time - item.time) <= 0.035) output[output.length - 1] = item;
            else output.push(item);
        });
        return output;
    }

    function safeSpeakerCue(input) {
        const cue = input || {};
        const start = Math.max(0, finite(cue.start, 0));
        return {
            start: Number(start.toFixed(3)),
            end: Number(Math.max(start + 0.05, finite(cue.end, start + 0.05)).toFixed(3)),
            speaker: String(cue.speaker || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 40),
            subjectId: safeSubjectId(cue.subjectId),
            confidence: Number(clamp(cue.confidence, 0, 1).toFixed(4)),
            source: String(cue.source || 'face-activity').slice(0, 32),
            segmentCount: Math.max(1, Math.round(finite(cue.segmentCount, 1)))
        };
    }

    function normalizeSpeakerCues(items) {
        return (Array.isArray(items) ? items : []).slice(0, MAX_SPEAKER_CUES).map(safeSpeakerCue).filter(cue => cue.end > cue.start).sort((a, b) => a.start - b.start || a.end - b.end);
    }

    function getSpeakerCueAt(cues, time) {
        const list = Array.isArray(cues) ? cues : [];
        const target = Math.max(0, finite(time, 0));
        let low = 0;
        let high = list.length - 1;
        while (low <= high) {
            const middle = Math.floor((low + high) / 2);
            const cue = list[middle];
            if (target < cue.start) high = middle - 1;
            else if (target > cue.end) low = middle + 1;
            else return cue;
        }
        return null;
    }

    function median(values) {
        const list = values.filter(Number.isFinite).slice().sort((a, b) => a - b);
        if (!list.length) return 0;
        const middle = Math.floor(list.length / 2);
        return list.length % 2 ? list[middle] : (list[middle - 1] + list[middle]) / 2;
    }

    function detectSceneCuts(motionAnalysis, options) {
        const opts = Object.assign({}, DEFAULTS, options || {});
        if (opts.sceneCutProtection === false) return [];
        const frames = (Array.isArray(motionAnalysis && motionAnalysis.frames) ? motionAnalysis.frames : [])
            .map(frame => ({
                time: Math.max(0, finite(frame.time, 0)),
                diff: clamp(frame.diffNorm, 0, 1),
                x: Number.isFinite(Number(frame.motionX)) ? clamp(frame.motionX, 0, 1) : 0.5,
                y: Number.isFinite(Number(frame.motionY)) ? clamp(frame.motionY, 0, 1) : 0.46,
                confidence: clamp(frame.spatialConfidence, 0, 1)
            }))
            .sort((a, b) => a.time - b.time);
        if (frames.length < 3) return [];
        const diffs = frames.map(frame => frame.diff);
        const center = median(diffs);
        const deviation = median(diffs.map(value => Math.abs(value - center)));
        const threshold = clamp(Math.max(opts.sceneCutThreshold, center + Math.max(0.12, deviation * 5)), 0.32, 0.92);
        const cuts = [];
        for (let index = 1; index < frames.length; index += 1) {
            const current = frames[index];
            const previous = frames[index - 1];
            const jump = Math.hypot(current.x - previous.x, current.y - previous.y);
            const strongDiff = current.diff >= threshold && (previous.diff <= 0.01 || current.diff >= previous.diff * 1.12);
            const spatialCut = current.diff >= threshold * 0.78 && jump >= 0.46 && current.confidence >= 0.22;
            if (!strongDiff && !spatialCut) continue;
            if (cuts.length && current.time - cuts[cuts.length - 1] < 0.42) continue;
            cuts.push(Number(current.time.toFixed(3)));
        }
        return cuts;
    }

    function sceneIndexAt(sceneCuts, time) {
        const target = Math.max(0, finite(time, 0));
        let index = 0;
        const cuts = Array.isArray(sceneCuts) ? sceneCuts : [];
        while (index < cuts.length && target >= cuts[index]) index += 1;
        return index;
    }

    function crossesSceneCut(sceneCuts, leftTime, rightTime) {
        const cuts = Array.isArray(sceneCuts) ? sceneCuts : [];
        return cuts.some(cut => cut > leftTime && cut <= rightTime);
    }

    function smoothPoints(points, options) {
        const opts = Object.assign({}, DEFAULTS, options || {});
        const sceneCuts = Array.isArray(opts.sceneCuts) ? opts.sceneCuts : [];
        const ordered = (Array.isArray(points) ? points : []).map((point, index) => safePoint(point, index)).sort((a, b) => a.time - b.time);
        if (!ordered.length) return [];
        let x = ordered[0].x;
        let y = ordered[0].y;
        return ordered.map((point, index) => {
            if (!index || crossesSceneCut(sceneCuts, ordered[index - 1].time, point.time)) {
                x = point.x;
                y = point.y;
                return Object.assign({}, point, { x: Number(x.toFixed(5)), y: Number(y.toFixed(5)), scene: sceneIndexAt(sceneCuts, point.time) });
            }
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
            return Object.assign({}, point, { x: Number(x.toFixed(5)), y: Number(y.toFixed(5)), scene: sceneIndexAt(sceneCuts, point.time) });
        });
    }

    function freezePoints(points) {
        return Object.freeze((Array.isArray(points) ? points : []).map(point => Object.freeze(Object.assign({}, point, { box: point.box ? Object.freeze(Object.assign({}, point.box)) : null }))));
    }

    function getPointAtArray(points, time, sceneCuts) {
        const list = Array.isArray(points) ? points : [];
        if (!list.length) return null;
        const target = Math.max(0, finite(time, 0));
        if (target <= list[0].time) return list[0];
        if (target >= list[list.length - 1].time) return list[list.length - 1];
        let low = 0;
        let high = list.length - 1;
        while (low + 1 < high) {
            const middle = Math.floor((low + high) / 2);
            if (list[middle].time <= target) low = middle;
            else high = middle;
        }
        const left = list[low];
        const right = list[high];
        const cut = (Array.isArray(sceneCuts) ? sceneCuts : []).find(value => value > left.time && value <= right.time);
        if (cut != null) return target < cut ? left : right;
        const span = Math.max(0.001, right.time - left.time);
        const ratio = clamp((target - left.time) / span, 0, 1);
        const preferred = ratio < 0.5 ? left : right;
        return {
            time: target,
            x: left.x + (right.x - left.x) * ratio,
            y: left.y + (right.y - left.y) * ratio,
            confidence: left.confidence + (right.confidence - left.confidence) * ratio,
            source: left.source === 'face' || right.source === 'face' ? 'face' : preferred.source,
            subjectId: preferred.subjectId || 'auto',
            zoom: left.zoom + (right.zoom - left.zoom) * ratio,
            scene: preferred.scene || 0,
            box: preferred.box || null
        };
    }

    function averageSampleGap(points) {
        const list = Array.isArray(points) ? points : [];
        if (list.length < 2) return 1;
        const gaps = [];
        for (let index = 1; index < list.length; index += 1) gaps.push(Math.max(0, list[index].time - list[index - 1].time));
        return clamp(median(gaps), 0.15, 3);
    }

    function composeSubjectPoints(subject, autoPoints, sceneCuts) {
        if (!subject || !Array.isArray(subject.points) || !subject.points.length) return autoPoints.slice();
        const maxGap = clamp(averageSampleGap(autoPoints) * 2.6, 0.65, 3.2);
        return autoPoints.map(autoPoint => {
            const selected = getPointAtArray(subject.points, autoPoint.time, sceneCuts);
            if (!selected) return autoPoint;
            const nearestDistance = subject.points.reduce((best, point) => Math.min(best, Math.abs(point.time - autoPoint.time)), Infinity);
            if (nearestDistance > maxGap || selected.scene !== autoPoint.scene) return Object.assign({}, autoPoint, { subjectId: subject.id });
            return Object.assign({}, selected, { time: autoPoint.time, subjectId: subject.id, source: 'face' });
        });
    }

    function trackId(track) {
        let hash = 2166136261;
        const points = Array.isArray(track && track.points) ? track.points : [];
        const keyframes = Array.isArray(track && track.keyframes) ? track.keyframes : [];
        const speakerCues = Array.isArray(track && track.speakerCues) ? track.speakerCues : [];
        const text = `${track && track.source || 'motion'}|${track && track.activeSubjectId || 'auto'}|${track && track.speakerPriority !== false ? 'speaker-on' : 'speaker-off'}|${points.map(point => `${point.time.toFixed(2)}:${point.x.toFixed(3)}:${point.y.toFixed(3)}:${point.confidence.toFixed(2)}`).join('|')}|${keyframes.map(item => `${item.time}:${item.x}:${item.y}:${item.zoom}`).join('|')}|${speakerCues.map(item => `${item.start}:${item.end}:${item.subjectId}:${item.confidence}`).join('|')}`;
        for (let index = 0; index < text.length; index += 1) {
            hash ^= text.charCodeAt(index);
            hash = Math.imul(hash, 16777619);
        }
        return `reframe-${(hash >>> 0).toString(16).padStart(8, '0')}`;
    }

    function prepareSubjects(subjects, options, sceneCuts, totalSamples) {
        return (Array.isArray(subjects) ? subjects : []).slice(0, MAX_SUBJECTS).map((subject, index) => {
            const points = smoothPoints(subject.points || [], Object.assign({}, options, { sceneCuts }));
            const averageConfidence = points.length ? points.reduce((sum, point) => sum + point.confidence, 0) / points.length : 0;
            const averageArea = points.length ? points.reduce((sum, point) => sum + (point.box ? point.box.width * point.box.height : 0), 0) / points.length : 0;
            return {
                id: safeSubjectId(subject.id || `subject-${index + 1}`),
                label: String(subject.label || `인물 ${index + 1}`).slice(0, 40),
                points,
                coverage: clamp(subject.coverage == null ? points.length / Math.max(1, totalSamples) : subject.coverage, 0, 1),
                averageConfidence: clamp(subject.averageConfidence == null ? averageConfidence : subject.averageConfidence, 0, 1),
                averageArea: clamp(subject.averageArea == null ? averageArea : subject.averageArea, 0, 1)
            };
        }).filter(subject => subject.points.length);
    }

    function finalizeTrack(prepared) {
        const autoPoints = prepared.autoPoints || [];
        const subjects = prepared.subjects || [];
        const requestedSubject = safeSubjectId(prepared.activeSubjectId || 'auto');
        const subject = subjects.find(item => item.id === requestedSubject) || null;
        const activeSubjectId = subject ? subject.id : 'auto';
        const points = activeSubjectId === 'auto' ? autoPoints.slice() : composeSubjectPoints(subject, autoPoints, prepared.sceneCuts);
        const keyframes = normalizeKeyframes(prepared.keyframes);
        const speakerCues = normalizeSpeakerCues(prepared.speakerCues);
        const speakerPriority = prepared.speakerPriority !== false;
        const facePoints = points.filter(point => point.source === 'face');
        const averageConfidence = points.length ? points.reduce((sum, point) => sum + point.confidence, 0) / points.length : 0;
        const summary = Object.assign({}, prepared.summary || {}, {
            source: prepared.source || 'motion',
            samples: points.length,
            averageConfidence: Number(averageConfidence.toFixed(4)),
            faceCoverage: Number((facePoints.length / Math.max(1, points.length)).toFixed(4)),
            captionSafe: prepared.options && prepared.options.captionAvoidance !== false,
            subjectCount: subjects.length,
            activeSubjectId,
            sceneCuts: prepared.sceneCuts.length,
            keyframes: keyframes.length,
            speakerCues: speakerCues.length,
            speakerPriority
        });
        const draft = {
            version: 2,
            source: prepared.source || 'motion',
            points: freezePoints(points),
            autoPoints: freezePoints(autoPoints),
            subjects: Object.freeze(subjects.map(subjectItem => Object.freeze({
                id: subjectItem.id,
                label: subjectItem.label,
                points: freezePoints(subjectItem.points),
                coverage: Number(subjectItem.coverage.toFixed(4)),
                averageConfidence: Number(subjectItem.averageConfidence.toFixed(4)),
                averageArea: Number(subjectItem.averageArea.toFixed(5))
            }))),
            activeSubjectId,
            sceneCuts: Object.freeze(prepared.sceneCuts.slice()),
            keyframes: Object.freeze(keyframes.map(item => Object.freeze(item))),
            speakerCues: Object.freeze(speakerCues.map(item => Object.freeze(item))),
            speakerPriority,
            summary: Object.freeze(summary)
        };
        draft.id = trackId(draft);
        return Object.freeze(draft);
    }

    function buildTrack(points, source, options, extraSummary, extra) {
        const opts = Object.assign({}, DEFAULTS, options || {});
        const additional = extra || {};
        const sceneCuts = (Array.isArray(additional.sceneCuts) ? additional.sceneCuts : []).map(value => Math.max(0, finite(value, 0))).sort((a, b) => a - b);
        const autoPoints = smoothPoints(points, Object.assign({}, opts, { sceneCuts }));
        const subjects = prepareSubjects(additional.subjects, opts, sceneCuts, autoPoints.length);
        return finalizeTrack({
            autoPoints,
            subjects,
            source: source || 'motion',
            options: opts,
            summary: extraSummary || {},
            sceneCuts,
            activeSubjectId: additional.activeSubjectId || opts.subjectId || 'auto',
            keyframes: additional.keyframes || [],
            speakerCues: additional.speakerCues || [],
            speakerPriority: Object.prototype.hasOwnProperty.call(additional, 'speakerPriority') ? additional.speakerPriority : opts.speakerPriority
        });
    }

    function createTrackFromMotion(motionAnalysis, options) {
        const opts = Object.assign({}, DEFAULTS, options || {});
        const frames = Array.isArray(motionAnalysis && motionAnalysis.frames) ? motionAnalysis.frames : [];
        const sceneCuts = detectSceneCuts(motionAnalysis, opts);
        const points = frames.map(frame => ({
            time: finite(frame.time, 0),
            x: Number.isFinite(Number(frame.motionX)) ? Number(frame.motionX) : 0.5,
            y: Number.isFinite(Number(frame.motionY)) ? Number(frame.motionY) : 0.46,
            confidence: Number.isFinite(Number(frame.spatialConfidence)) ? Number(frame.spatialConfidence) : clamp((Number(frame.diffNorm) || 0) * 0.72, 0.08, 0.58),
            source: 'motion',
            scene: sceneIndexAt(sceneCuts, finite(frame.time, 0)),
            box: frame.motionBox || null
        }));
        if (!points.length) points.push({ time: 0, x: 0.5, y: 0.46, confidence: 0.15, source: 'motion', scene: 0 });
        return buildTrack(points, 'motion', opts, { detector: 'motion-saliency' }, { sceneCuts, activeSubjectId: opts.subjectId, keyframes: opts.keyframes });
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
        return { x: clamp(x, 0, 1), y: clamp(y, 0, 1), width: clamp(boxWidth, 0, 1), height: clamp(boxHeight, 0, 1), confidence };
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
        if (!detector || typeof detector.detectForVideo !== 'function') throw new Error('MediaPipe Face Detector는 detectForVideo(frame, timestamp) 함수를 제공해야 합니다.');
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
        const modelPacks = global.AIShortsVisionModelPacks;
        if (modelPacks && typeof modelPacks.ensureActiveProvider === 'function') {
            try {
                const installedProvider = await modelPacks.ensureActiveProvider();
                if (installedProvider) {
                    detectorProvider = installedProvider;
                    return detectorProvider;
                }
            } catch (_) { /* model-pack failure falls back to native or motion tracking */ }
        }
        if (nativeDetectorPromise) return nativeDetectorPromise;
        if (typeof global.FaceDetector !== 'function') return null;
        nativeDetectorPromise = Promise.resolve().then(() => {
            const detector = new global.FaceDetector({ fastMode: true, maxDetectedFaces: 6 });
            return { name: 'browser-face-detector', detect: frame => detector.detect(frame), close: () => {} };
        }).catch(() => null);
        return nativeDetectorPromise;
    }

    function getMotionPointAt(motionTrack, time) {
        return getFocusAt(motionTrack, time) || { time, x: 0.5, y: 0.46, confidence: 0.12, source: 'motion', subjectId: 'auto', box: null };
    }

    function assignSubjects(detections, buckets, time, scene, sampleGap, options) {
        const opts = Object.assign({}, DEFAULTS, options || {});
        const available = buckets.filter(bucket => bucket.scene === scene && time - bucket.lastTime <= Math.max(0.65, sampleGap * 2.8));
        const claimed = new Set();
        const ordered = detections.slice().sort((a, b) => (b.confidence * Math.sqrt(b.width * b.height)) - (a.confidence * Math.sqrt(a.width * a.height)));
        ordered.forEach(box => {
            const x = clamp(box.x + box.width / 2, 0, 1);
            const y = clamp(box.y + box.height * 0.42, 0, 1);
            let selected = null;
            let selectedDistance = Infinity;
            available.forEach(bucket => {
                if (claimed.has(bucket.id)) return;
                const distance = Math.hypot(x - bucket.lastX, y - bucket.lastY);
                if (distance <= opts.subjectMatchDistance && distance < selectedDistance) {
                    selected = bucket;
                    selectedDistance = distance;
                }
            });
            if (!selected && buckets.length < MAX_SUBJECTS) {
                selected = { id: `subject-${buckets.length + 1}`, scene, points: [], lastX: x, lastY: y, lastTime: time };
                buckets.push(selected);
            }
            if (!selected) return;
            claimed.add(selected.id);
            selected.lastX = x;
            selected.lastY = y;
            selected.lastTime = time;
            selected.points.push({ time, x, y, confidence: box.confidence, source: 'face', subjectId: selected.id, scene, box });
        });
    }

    async function analyzeVideoSubjects(fileUrl, onProgress, signal, options) {
        const opts = Object.assign({}, DEFAULTS, options || {});
        const motionTrack = createTrackFromMotion(opts.motionAnalysis || null, opts);
        const provider = opts.detectorProvider || await getNativeDetector();
        if (!provider || !fileUrl || typeof document === 'undefined') return applyEdits(motionTrack, opts);
        throwIfAborted(signal);
        const video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;
        video.preload = 'metadata';
        video.src = fileUrl;
        try {
            await waitForEvent(video, 'loadedmetadata', 6000, signal);
            const duration = finite(video.duration, finite(opts.motionAnalysis && opts.motionAnalysis.duration, 0));
            if (!duration) return applyEdits(motionTrack, opts);
            const canvas = document.createElement('canvas');
            const sourceWidth = Math.max(1, finite(video.videoWidth, 640));
            const sourceHeight = Math.max(1, finite(video.videoHeight, 360));
            const scale = Math.min(1, 480 / Math.max(sourceWidth, sourceHeight));
            canvas.width = Math.max(96, Math.round(sourceWidth * scale));
            canvas.height = Math.max(96, Math.round(sourceHeight * scale));
            const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: false });
            if (!ctx) return applyEdits(motionTrack, opts);
            const samples = Math.max(8, Math.min(72, Math.round(opts.sampleCount || DEFAULTS.sampleCount), Math.ceil(duration * 1.5)));
            const sampleGap = duration / Math.max(1, samples - 1);
            const points = [];
            const subjects = [];
            const sceneCuts = motionTrack.sceneCuts || [];
            let previous = null;
            let previousScene = -1;
            let detectedFrames = 0;
            for (let index = 0; index < samples; index += 1) {
                throwIfAborted(signal);
                const time = duration * (index / Math.max(1, samples - 1));
                const scene = sceneIndexAt(sceneCuts, time);
                if (scene !== previousScene) previous = null;
                previousScene = scene;
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
                assignSubjects(detections, subjects, time, scene, sampleGap, opts);
                const primary = choosePrimary(detections, previous);
                if (primary) {
                    previous = primary;
                    detectedFrames += 1;
                    points.push(Object.assign({ time, scene }, primary));
                } else {
                    const fallback = getMotionPointAt(motionTrack, time);
                    points.push(Object.assign({}, fallback, { time, scene, confidence: clamp(fallback.confidence * 0.82, 0.08, 0.56), source: 'motion', subjectId: 'auto' }));
                }
                await new Promise(resolve => setTimeout(resolve, 0));
            }
            const preparedSubjects = subjects
                .filter(subject => subject.points.length >= 2 || subject.points.length / Math.max(1, samples) >= 0.08)
                .sort((a, b) => {
                    const scoreA = a.points.length * 2 + a.points.reduce((sum, point) => sum + point.confidence, 0);
                    const scoreB = b.points.length * 2 + b.points.reduce((sum, point) => sum + point.confidence, 0);
                    return scoreB - scoreA;
                })
                .map((subject, index) => Object.assign({}, subject, {
                    label: `인물 ${index + 1}`,
                    coverage: subject.points.length / Math.max(1, samples)
                }));
            const faceCoverage = detectedFrames / Math.max(1, samples);
            const source = detectedFrames ? (detectedFrames === samples ? 'face' : 'hybrid') : 'motion';
            return buildTrack(points, source, opts, {
                detector: String(provider.name || 'face-detector').slice(0, 48),
                faceCoverage: Number(faceCoverage.toFixed(4)),
                duration: Number(duration.toFixed(3))
            }, {
                sceneCuts,
                subjects: preparedSubjects,
                activeSubjectId: opts.subjectId,
                keyframes: opts.keyframes
            });
        } finally {
            try {
                video.pause();
                video.removeAttribute('src');
                video.load();
            } catch (error) { /* ignored */ }
        }
    }

    function rebuildTrack(track, changes) {
        if (!track) return null;
        const next = changes || {};
        const options = Object.assign({}, DEFAULTS, next.options || {});
        return finalizeTrack({
            autoPoints: (track.autoPoints || track.points || []).map(point => Object.assign({}, point)),
            subjects: (track.subjects || []).map(subject => ({
                id: subject.id,
                label: subject.label,
                points: (subject.points || []).map(point => Object.assign({}, point)),
                coverage: subject.coverage,
                averageConfidence: subject.averageConfidence,
                averageArea: subject.averageArea
            })),
            source: track.source || 'motion',
            options,
            summary: Object.assign({}, track.summary || {}),
            sceneCuts: (track.sceneCuts || []).slice(),
            activeSubjectId: Object.prototype.hasOwnProperty.call(next, 'activeSubjectId') ? next.activeSubjectId : track.activeSubjectId,
            keyframes: Object.prototype.hasOwnProperty.call(next, 'keyframes') ? next.keyframes : track.keyframes,
            speakerCues: Object.prototype.hasOwnProperty.call(next, 'speakerCues') ? next.speakerCues : track.speakerCues,
            speakerPriority: Object.prototype.hasOwnProperty.call(next, 'speakerPriority') ? next.speakerPriority : track.speakerPriority
        });
    }

    function selectSubject(track, subjectId) {
        return rebuildTrack(track, { activeSubjectId: safeSubjectId(subjectId) });
    }

    function applySpeakerCues(track, cues, enabled) {
        if (!track) return null;
        return rebuildTrack(track, { speakerCues: normalizeSpeakerCues(cues), speakerPriority: enabled !== false });
    }

    function clearSpeakerCues(track) {
        return track ? rebuildTrack(track, { speakerCues: [] }) : null;
    }

    function setSpeakerPriority(track, enabled) {
        return track ? rebuildTrack(track, { speakerPriority: enabled !== false }) : null;
    }

    function upsertKeyframe(track, keyframe) {
        if (!track) return null;
        const next = safeKeyframe(keyframe);
        const keyframes = normalizeKeyframes((track.keyframes || []).filter(item => Math.abs(item.time - next.time) > 0.12).concat(next));
        return rebuildTrack(track, { keyframes });
    }

    function removeKeyframe(track, time, tolerance) {
        if (!track) return null;
        const target = Math.max(0, finite(time, 0));
        const radius = clamp(tolerance == null ? 0.35 : tolerance, 0.03, 3);
        const keyframes = (track.keyframes || []).filter(item => Math.abs(item.time - target) > radius);
        return rebuildTrack(track, { keyframes });
    }

    function clearKeyframes(track) {
        return track ? rebuildTrack(track, { keyframes: [] }) : null;
    }

    function getNearestKeyframe(track, time, tolerance) {
        const target = Math.max(0, finite(time, 0));
        const radius = clamp(tolerance == null ? 0.35 : tolerance, 0.03, 5);
        let nearest = null;
        let distance = Infinity;
        (track && track.keyframes || []).forEach(item => {
            const nextDistance = Math.abs(item.time - target);
            if (nextDistance < distance) { nearest = item; distance = nextDistance; }
        });
        return nearest && distance <= radius ? nearest : null;
    }

    function getKeyframeFocus(keyframes, time) {
        const list = Array.isArray(keyframes) ? keyframes : [];
        if (!list.length) return null;
        const target = Math.max(0, finite(time, 0));
        if (target <= list[0].time) return Object.assign({ time: target }, list[0]);
        if (target >= list[list.length - 1].time) return Object.assign({ time: target }, list[list.length - 1]);
        let low = 0;
        let high = list.length - 1;
        while (low + 1 < high) {
            const middle = Math.floor((low + high) / 2);
            if (list[middle].time <= target) low = middle;
            else high = middle;
        }
        const left = list[low];
        const right = list[high];
        const ratio = clamp((target - left.time) / Math.max(0.001, right.time - left.time), 0, 1);
        return {
            time: target,
            x: left.x + (right.x - left.x) * ratio,
            y: left.y + (right.y - left.y) * ratio,
            zoom: left.zoom + (right.zoom - left.zoom) * ratio
        };
    }

    function getFocusAt(track, time) {
        const target = Math.max(0, finite(time, 0));
        let base = getPointAtArray(track && track.points, target, track && track.sceneCuts);
        if (!base) return null;
        if (track && track.activeSubjectId === 'auto' && track.speakerPriority !== false) {
            const cue = getSpeakerCueAt(track.speakerCues, target);
            const subject = cue && cue.subjectId !== 'auto' ? (track.subjects || []).find(item => item.id === cue.subjectId) : null;
            const selected = subject ? getPointAtArray(subject.points, target, track.sceneCuts) : null;
            if (selected) {
                base = Object.assign({}, selected, {
                    time: target,
                    source: 'speaker-face',
                    subjectId: subject.id,
                    speaker: cue.speaker || '',
                    speakerConfidence: cue.confidence,
                    confidence: clamp((selected.confidence + cue.confidence) / 2, 0, 1)
                });
            }
        }
        const manual = getKeyframeFocus(track && track.keyframes, target);
        if (!manual) return base;
        return Object.assign({}, base, {
            time: manual.time,
            x: manual.x,
            y: manual.y,
            zoom: manual.zoom,
            confidence: 1,
            source: 'manual'
        });
    }

    function applyEdits(track, edits) {
        if (!track) return null;
        const safe = edits || {};
        return rebuildTrack(track, {
            activeSubjectId: safe.subjectId || safe.activeSubjectId || track.activeSubjectId || 'auto',
            keyframes: Array.isArray(safe.keyframes) ? safe.keyframes : track.keyframes,
            speakerCues: Array.isArray(safe.speakerCues) ? safe.speakerCues : track.speakerCues,
            speakerPriority: typeof safe.speakerPriority === 'boolean' ? safe.speakerPriority : track.speakerPriority
        });
    }

    function extractEdits(track) {
        return Object.freeze({
            subjectId: safeSubjectId(track && track.activeSubjectId || 'auto'),
            keyframes: Object.freeze(normalizeKeyframes(track && track.keyframes).map(item => Object.freeze(item))),
            speakerPriority: track && track.speakerPriority !== false,
            speakerCues: Object.freeze(normalizeSpeakerCues(track && track.speakerCues).map(item => Object.freeze(item)))
        });
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
        const isFace = focus.source === 'face' || focus.source === 'speaker-face' || focus.box;
        const requestedZoom = focus.source === 'manual' && focus.zoom > 1 ? focus.zoom : (isFace ? opts.zoom : opts.motionZoom);
        const zoom = clamp(requestedZoom, 1, 1.35);
        let cropWidth;
        let cropHeight;
        if (sourceRatio >= targetRatio) {
            cropHeight = sheight / zoom;
            cropWidth = cropHeight * targetRatio;
            if (cropWidth > swidth) { cropWidth = swidth; cropHeight = cropWidth / targetRatio; }
        } else {
            cropWidth = swidth / zoom;
            cropHeight = cropWidth / targetRatio;
            if (cropHeight > sheight) { cropHeight = sheight; cropWidth = cropHeight * targetRatio; }
        }
        const desiredX = 0.5;
        const desiredY = desiredSubjectY(opts.captionOptions, opts.captionAvoidance !== false);
        let sx = focus.x * swidth - desiredX * cropWidth;
        let sy = focus.y * sheight - desiredY * cropHeight;
        sx = clamp(sx, 0, Math.max(0, swidth - cropWidth));
        sy = clamp(sy, 0, Math.max(0, sheight - cropHeight));
        return Object.freeze({
            sx: Number(sx.toFixed(4)), sy: Number(sy.toFixed(4)), sw: Number(cropWidth.toFixed(4)), sh: Number(cropHeight.toFixed(4)),
            focusX: focus.x, focusY: focus.y, confidence: focus.confidence, source: focus.source, zoom
        });
    }

    function scoreRange(track, start, end) {
        const points = Array.isArray(track && track.points) ? track.points : [];
        const from = Math.max(0, finite(start, 0));
        const to = Math.max(from, finite(end, from));
        const inside = points.filter(point => point.time >= from && point.time <= to);
        const selected = inside.length ? inside : [getFocusAt(track, (from + to) / 2)].filter(Boolean);
        if (!selected.length) return Object.freeze({ confidence: 0, edgeRisk: 1, faceCoverage: 0, samples: 0, sceneCuts: 0 });
        const confidence = selected.reduce((sum, point) => sum + point.confidence, 0) / selected.length;
        const edgeRisk = selected.reduce((sum, point) => {
            const horizontal = Math.max(0, 0.14 - point.x, point.x - 0.86) / 0.14;
            const vertical = Math.max(0, 0.10 - point.y, point.y - 0.9) / 0.10;
            return sum + clamp(Math.max(horizontal, vertical), 0, 1);
        }, 0) / selected.length;
        const faceCoverage = selected.filter(point => point.source === 'face').length / selected.length;
        const sceneCuts = (track && track.sceneCuts || []).filter(time => time >= from && time <= to).length;
        return Object.freeze({ confidence: Number(confidence.toFixed(4)), edgeRisk: Number(edgeRisk.toFixed(4)), faceCoverage: Number(faceCoverage.toFixed(4)), samples: selected.length, sceneCuts });
    }

    function getStatus(track) {
        const summary = track && track.summary || {};
        if (!track || !Array.isArray(track.points) || !track.points.length) return Object.freeze({ ready: false, label: '피사체 추적 대기', detail: '영상 분석 후 사용할 수 있습니다.' });
        const facePercent = Math.round(clamp(summary.faceCoverage, 0, 1) * 100);
        const confidencePercent = Math.round(clamp(summary.averageConfidence, 0, 1) * 100);
        const selected = track.activeSubjectId !== 'auto' ? (track.subjects || []).find(item => item.id === track.activeSubjectId) : null;
        const extras = [];
        if (summary.subjectCount) extras.push(`인물 ${summary.subjectCount}명`);
        if (summary.sceneCuts) extras.push(`장면 전환 ${summary.sceneCuts}곳`);
        if (summary.keyframes) extras.push(`수동 키프레임 ${summary.keyframes}개`);
        if (summary.speakerCues && track.speakerPriority !== false) extras.push(`화자 연결 ${summary.speakerCues}구간`);
        if (selected) extras.push(`${selected.label} 고정`);
        return Object.freeze({
            ready: true,
            label: selected ? `${selected.label} 추적 준비 완료` : summary.speakerCues && track.speakerPriority !== false ? '말하는 사람 우선 추적 준비 완료' : summary.source === 'face' ? '얼굴 추적 준비 완료' : summary.source === 'hybrid' ? '얼굴·모션 추적 준비 완료' : '모션 추적 준비 완료',
            detail: `${summary.samples || track.points.length}개 지점 · 신뢰도 ${confidencePercent}%${facePercent ? ` · 얼굴 ${facePercent}%` : ''}${extras.length ? ` · ${extras.join(' · ')}` : ''}`
        });
    }

    global.AIShortsSmartReframe = Object.freeze({
        defaults: DEFAULTS,
        registerDetectorProvider,
        registerMediaPipeFaceDetector,
        createTrackFromMotion,
        analyzeVideoSubjects,
        detectSceneCuts,
        selectSubject,
        applySpeakerCues,
        clearSpeakerCues,
        setSpeakerPriority,
        getSpeakerCueAt,
        upsertKeyframe,
        removeKeyframe,
        clearKeyframes,
        getNearestKeyframe,
        applyEdits,
        extractEdits,
        getFocusAt,
        resolveCropRect,
        scoreRange,
        getStatus,
        _test: Object.freeze({ smoothPoints, normalizeDetection, choosePrimary, buildTrack, assignSubjects, composeSubjectPoints, getPointAtArray, sceneIndexAt, normalizeSpeakerCues })
    });
})(window);
