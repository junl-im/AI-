// AI Shorts Studio v1.6.9 - local transcript-to-face speaker direction without remote inference
'use strict';

(function exposeSpeakerFaceLinker(global) {
    const config = global.AIShortsRuntimeConfig || {};
    const MAX_CUES = Math.max(24, Number(config.SPEAKER_FACE_MAX_CUES || 2000));
    const DEFAULTS = Object.freeze({
        segmentPadding: 0.12,
        maxSubjectGap: 1.6,
        minScore: 0.22,
        switchPenalty: 0.12,
        mergeGap: 0.24
    });

    function clamp(value, min, max) {
        const number = Number(value);
        if (!Number.isFinite(number)) return min;
        return Math.max(min, Math.min(max, number));
    }

    function finite(value, fallback) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }

    function safeToken(value, fallback) {
        const text = String(value == null ? '' : value).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 40);
        return text || fallback || '';
    }

    function safeSubjectId(value) {
        const text = String(value == null ? '' : value);
        return /^subject-[1-9][0-9]{0,2}$/.test(text) ? text : 'auto';
    }

    function normalizeSegments(items) {
        return (Array.isArray(items) ? items : []).slice(0, MAX_CUES).map((item, index) => {
            const start = Math.max(0, finite(item && item.start, 0));
            const requestedEnd = finite(item && item.end, start + 2.5);
            return {
                index: index + 1,
                start: Number(start.toFixed(3)),
                end: Number(Math.max(start + 0.05, requestedEnd).toFixed(3)),
                speaker: safeToken(item && (item.speaker || item.speakerId || item.speakerLabel), ''),
                textLength: String(item && item.text || '').trim().length
            };
        }).filter(item => item.end > item.start);
    }

    function pointArea(point) {
        const box = point && point.box;
        return box ? clamp(finite(box.width, 0) * finite(box.height, 0), 0, 1) : 0;
    }

    function subjectWindow(subject, start, end, maxGap) {
        const points = Array.isArray(subject && subject.points) ? subject.points : [];
        if (!points.length) return [];
        const inside = points.filter(point => finite(point.time, -1) >= start && finite(point.time, -1) <= end);
        if (inside.length) return inside;
        const midpoint = (start + end) / 2;
        let nearest = null;
        let distance = Infinity;
        points.forEach(point => {
            const next = Math.abs(finite(point.time, 0) - midpoint);
            if (next < distance) { nearest = point; distance = next; }
        });
        return nearest && distance <= maxGap ? [nearest] : [];
    }

    function subjectActivity(subject, segment, options) {
        const opts = Object.assign({}, DEFAULTS, options || {});
        const start = Math.max(0, segment.start - opts.segmentPadding);
        const end = segment.end + opts.segmentPadding;
        const points = subjectWindow(subject, start, end, opts.maxSubjectGap);
        if (!points.length) return Object.freeze({ score: 0, presence: 0, movement: 0, areaChange: 0, confidence: 0, samples: 0 });
        let movement = 0;
        let areaChange = 0;
        let confidence = 0;
        points.forEach((point, index) => {
            confidence += clamp(point.confidence, 0, 1);
            if (!index) return;
            const previous = points[index - 1];
            movement += Math.hypot(finite(point.x, 0.5) - finite(previous.x, 0.5), finite(point.y, 0.46) - finite(previous.y, 0.46));
            areaChange += Math.abs(pointArea(point) - pointArea(previous));
        });
        const duration = Math.max(0.05, end - start);
        const sampleSpan = points.length > 1 ? Math.max(0.05, finite(points[points.length - 1].time, end) - finite(points[0].time, start)) : duration;
        const presence = clamp(points.length / Math.max(1, Math.ceil(duration / Math.max(0.16, sampleSpan / Math.max(1, points.length - 1)))), 0, 1);
        const normalizedMovement = clamp((movement / Math.max(1, points.length - 1)) * 8.5, 0, 1);
        const normalizedArea = clamp((areaChange / Math.max(1, points.length - 1)) * 18, 0, 1);
        const averageConfidence = clamp(confidence / points.length, 0, 1);
        const coverage = clamp(subject && subject.coverage, 0, 1);
        const score = clamp(presence * 0.34 + normalizedMovement * 0.28 + normalizedArea * 0.16 + averageConfidence * 0.16 + coverage * 0.06, 0, 1);
        return Object.freeze({
            score: Number(score.toFixed(4)),
            presence: Number(presence.toFixed(4)),
            movement: Number(normalizedMovement.toFixed(4)),
            areaChange: Number(normalizedArea.toFixed(4)),
            confidence: Number(averageConfidence.toFixed(4)),
            samples: points.length
        });
    }

    function scoreMatrix(segments, subjects, options) {
        return segments.map(segment => subjects.map(subject => subjectActivity(subject, segment, options)));
    }

    function mapDiarizedSpeakers(segments, subjects, matrix) {
        const labels = Array.from(new Set(segments.map(item => item.speaker).filter(Boolean))).slice(0, subjects.length);
        const candidates = [];
        labels.forEach(label => {
            subjects.forEach((subject, subjectIndex) => {
                const indexes = segments.map((segment, index) => segment.speaker === label ? index : -1).filter(index => index >= 0);
                const score = indexes.length ? indexes.reduce((sum, index) => sum + matrix[index][subjectIndex].score, 0) / indexes.length : 0;
                candidates.push({ label, subjectId: subject.id, score });
            });
        });
        candidates.sort((left, right) => right.score - left.score);
        const mapping = new Map();
        const usedSubjects = new Set();
        candidates.forEach(candidate => {
            if (mapping.has(candidate.label) || usedSubjects.has(candidate.subjectId)) return;
            mapping.set(candidate.label, candidate.subjectId);
            usedSubjects.add(candidate.subjectId);
        });
        return mapping;
    }

    function chooseSubject(subjects, activities, previousSubjectId, options) {
        const opts = Object.assign({}, DEFAULTS, options || {});
        let best = null;
        subjects.forEach((subject, index) => {
            const activity = activities[index] || { score: 0 };
            const continuity = previousSubjectId && subject.id === previousSubjectId ? opts.switchPenalty : 0;
            const score = clamp(activity.score + continuity, 0, 1.2);
            if (!best || score > best.score) best = { subjectId: subject.id, score, activity };
        });
        if (!best || best.activity.score < opts.minScore) return { subjectId: 'auto', score: best ? best.activity.score : 0, activity: best && best.activity || null };
        return { subjectId: best.subjectId, score: Math.min(1, best.score), activity: best.activity };
    }

    function mergeCues(cues, options) {
        const opts = Object.assign({}, DEFAULTS, options || {});
        const output = [];
        cues.forEach(cue => {
            const previous = output[output.length - 1];
            if (previous && previous.subjectId === cue.subjectId && previous.speaker === cue.speaker && cue.start - previous.end <= opts.mergeGap && previous.source === cue.source) {
                previous.end = cue.end;
                previous.confidence = Number(((previous.confidence + cue.confidence) / 2).toFixed(4));
                previous.segmentCount += cue.segmentCount;
                return;
            }
            output.push(Object.assign({}, cue));
        });
        return output;
    }

    function linkSegmentsToFaces(segmentInput, track, options) {
        const opts = Object.assign({}, DEFAULTS, options || {});
        const segments = normalizeSegments(segmentInput);
        const subjects = Array.isArray(track && track.subjects) ? track.subjects.filter(subject => safeSubjectId(subject.id) !== 'auto') : [];
        if (!segments.length || !subjects.length) {
            return Object.freeze({
                cues: Object.freeze([]),
                mappings: Object.freeze({}),
                summary: Object.freeze({ segments: segments.length, subjects: subjects.length, linked: 0, diarized: 0, switches: 0, averageConfidence: 0 })
            });
        }
        const matrix = scoreMatrix(segments, subjects, opts);
        const mappings = mapDiarizedSpeakers(segments, subjects, matrix);
        let previousSubjectId = '';
        let previousEnd = -Infinity;
        const cues = segments.map((segment, segmentIndex) => {
            const mapped = segment.speaker && mappings.get(segment.speaker);
            const mappedIndex = mapped ? subjects.findIndex(subject => subject.id === mapped) : -1;
            const closeToPrevious = segment.start - previousEnd <= 1.3;
            const mappedActivity = mappedIndex >= 0 ? matrix[segmentIndex][mappedIndex] : null;
            const choice = mappedActivity && mappedActivity.score >= opts.minScore
                ? { subjectId: mapped, score: mappedActivity.score, activity: mappedActivity }
                : chooseSubject(subjects, matrix[segmentIndex], closeToPrevious ? previousSubjectId : '', opts);
            if (choice.subjectId !== 'auto') previousSubjectId = choice.subjectId;
            previousEnd = segment.end;
            return {
                start: segment.start,
                end: segment.end,
                speaker: segment.speaker || '',
                subjectId: choice.subjectId,
                confidence: Number(clamp(choice.score, 0, 1).toFixed(4)),
                source: mappedActivity && mappedActivity.score >= opts.minScore ? 'diarization-face' : choice.subjectId === 'auto' ? 'fallback' : 'face-activity',
                segmentCount: 1
            };
        });
        const merged = mergeCues(cues, opts);
        const linked = merged.filter(cue => cue.subjectId !== 'auto');
        let switches = 0;
        linked.forEach((cue, index) => { if (index && linked[index - 1].subjectId !== cue.subjectId) switches += 1; });
        const averageConfidence = linked.length ? linked.reduce((sum, cue) => sum + cue.confidence, 0) / linked.length : 0;
        return Object.freeze({
            cues: Object.freeze(merged.map(cue => Object.freeze(cue))),
            mappings: Object.freeze(Object.fromEntries(mappings.entries())),
            summary: Object.freeze({
                segments: segments.length,
                subjects: subjects.length,
                linked: linked.length,
                diarized: merged.filter(cue => cue.source === 'diarization-face').length,
                switches,
                averageConfidence: Number(averageConfidence.toFixed(4))
            })
        });
    }

    function status(result) {
        const summary = result && result.summary || {};
        if (!summary.segments) return Object.freeze({ ready: false, label: '발화 구간 없음', detail: '로컬 전사 또는 자막을 먼저 적용하세요.' });
        if (!summary.subjects) return Object.freeze({ ready: false, label: '얼굴 추적 필요', detail: '얼굴 감지 모델로 피사체를 먼저 추적하세요.' });
        if (!summary.linked) return Object.freeze({ ready: false, label: '화자 연결 보류', detail: '얼굴 활동 신뢰도가 낮아 자동 피사체 추적을 유지합니다.' });
        return Object.freeze({
            ready: true,
            label: `말하는 사람 우선 · ${summary.linked}구간`,
            detail: `화자 전환 ${summary.switches}회 · 연결 신뢰도 ${Math.round(clamp(summary.averageConfidence, 0, 1) * 100)}%${summary.diarized ? ` · 화자 라벨 ${summary.diarized}구간` : ''}`
        });
    }

    global.AIShortsSpeakerFaceLinker = Object.freeze({
        defaults: DEFAULTS,
        normalizeSegments,
        subjectActivity,
        linkSegmentsToFaces,
        status,
        _test: Object.freeze({ scoreMatrix, mapDiarizedSpeakers, chooseSubject, mergeCues })
    });
})(window);
