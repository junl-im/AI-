// AI Shorts Studio v0.7.0 - automatic cut point detector
'use strict';

(function exposeAutoCutDetector(global) {
    const utils = global.AIShortsCoreUtils || {};
    const clamp = utils.clamp || ((value, min, max) => Math.min(max, Math.max(min, Number(value) || 0)));

    const DEFAULTS = Object.freeze({
        silenceThreshold: 0.09,
        beatSensitivity: 0.58,
        motionSensitivity: 0.60,
        handlePadding: 0.7,
        maxSnapDistance: 1.4,
        minSilenceDuration: 0.7,
        minCutGap: 0.65
    });

    function normalizeOptions(options) {
        const raw = Object.assign({}, DEFAULTS, options || {});
        return {
            silenceThreshold: clamp(raw.silenceThreshold, 0.04, 0.20),
            beatSensitivity: clamp(raw.beatSensitivity, 0.35, 0.85),
            motionSensitivity: clamp(raw.motionSensitivity, 0.35, 0.90),
            handlePadding: clamp(raw.handlePadding, 0, 1.5),
            maxSnapDistance: clamp(raw.maxSnapDistance, 0.4, 3.0),
            minSilenceDuration: clamp(raw.minSilenceDuration, 0.4, 2.0),
            minCutGap: clamp(raw.minCutGap, 0.3, 1.5)
        };
    }

    function getFrames(analysis) {
        return analysis && Array.isArray(analysis.frames) ? analysis.frames : [];
    }

    function nearestFrameTime(frames, index) {
        const frame = frames[index] || {};
        return Number(frame.time) || 0;
    }

    function detectSilenceSegments(audioAnalysis, options) {
        const frames = getFrames(audioAnalysis);
        const threshold = options.silenceThreshold;
        const segments = [];
        let open = null;
        for (let i = 0; i < frames.length; i += 1) {
            const frame = frames[i] || {};
            const time = Number(frame.time) || 0;
            const isSilent = Boolean(frame.silent) || (Number(frame.rmsNorm) || 0) <= threshold;
            if (isSilent && !open) open = { start: time, end: time };
            if (isSilent && open) open.end = time;
            if ((!isSilent || i === frames.length - 1) && open) {
                const end = open.end;
                if (end - open.start >= options.minSilenceDuration) {
                    segments.push({
                        start: Number(open.start.toFixed(3)),
                        end: Number(end.toFixed(3)),
                        duration: Number((end - open.start).toFixed(3)),
                        type: 'silence'
                    });
                }
                open = null;
            }
        }
        return segments;
    }

    function pushCut(cuts, next, minGap) {
        if (!Number.isFinite(next.time)) return;
        const prev = cuts[cuts.length - 1];
        if (prev && Math.abs(prev.time - next.time) < minGap) {
            if ((next.score || 0) > (prev.score || 0)) cuts[cuts.length - 1] = next;
            return;
        }
        cuts.push(next);
    }

    function detectBeatCutPoints(audioAnalysis, options) {
        const frames = getFrames(audioAnalysis);
        const cuts = [];
        if (frames.length < 3) return cuts;
        for (let i = 1; i < frames.length - 1; i += 1) {
            const prev = Number(frames[i - 1].transientNorm) || 0;
            const current = Number(frames[i].transientNorm) || 0;
            const next = Number(frames[i + 1].transientNorm) || 0;
            const energy = Number(frames[i].rmsNorm) || 0;
            if (current >= options.beatSensitivity && current >= prev && current >= next && energy > options.silenceThreshold * 1.35) {
                pushCut(cuts, {
                    type: 'beat',
                    time: Number(nearestFrameTime(frames, i).toFixed(3)),
                    score: clamp(current * 0.72 + energy * 0.28, 0, 1)
                }, options.minCutGap);
            }
        }
        return cuts;
    }

    function detectMotionCutPoints(motionAnalysis, options) {
        const frames = getFrames(motionAnalysis);
        const cuts = [];
        if (frames.length < 2) return cuts;
        for (let i = 1; i < frames.length; i += 1) {
            const current = Number(frames[i].diffNorm) || 0;
            const prev = Number(frames[i - 1].diffNorm) || 0;
            if (current >= options.motionSensitivity && current >= prev) {
                pushCut(cuts, {
                    type: 'motion',
                    time: Number(nearestFrameTime(frames, i).toFixed(3)),
                    score: clamp(current, 0, 1)
                }, options.minCutGap);
            }
        }
        return cuts;
    }

    function createSilenceExitCuts(segments) {
        return (segments || []).map(segment => ({
            type: 'silence-exit',
            time: Number(segment.end.toFixed(3)),
            score: clamp(segment.duration / 2.4, 0.35, 1),
            segment
        }));
    }

    function mergeTimeline(points, options) {
        const sorted = (points || []).filter(point => Number.isFinite(point.time)).sort((a, b) => a.time - b.time || (b.score || 0) - (a.score || 0));
        const merged = [];
        for (const point of sorted) {
            const prev = merged[merged.length - 1];
            if (prev && Math.abs(prev.time - point.time) < options.minCutGap) {
                if ((point.score || 0) > (prev.score || 0)) merged[merged.length - 1] = point;
            } else {
                merged.push(Object.assign({}, point, { score: Number((Number(point.score) || 0).toFixed(4)) }));
            }
        }
        return merged;
    }

    function createAutoCuts(audioAnalysis, motionAnalysis, inputOptions) {
        const options = normalizeOptions(inputOptions);
        const silenceSegments = detectSilenceSegments(audioAnalysis, options);
        const beatCuts = detectBeatCutPoints(audioAnalysis, options);
        const motionCuts = detectMotionCutPoints(motionAnalysis, options);
        const silenceExitCuts = createSilenceExitCuts(silenceSegments);
        const timeline = mergeTimeline([].concat(beatCuts, motionCuts, silenceExitCuts), options);
        const duration = Number(audioAnalysis && audioAnalysis.duration) || Number(motionAnalysis && motionAnalysis.duration) || 0;
        return {
            duration,
            options,
            silenceSegments,
            beatCuts,
            motionCuts,
            timeline,
            summary: {
                totalCuts: timeline.length,
                beatCuts: beatCuts.length,
                motionCuts: motionCuts.length,
                silenceSegments: silenceSegments.length,
                cutDensity: duration ? timeline.length / Math.max(1, duration / 30) : 0
            }
        };
    }

    function getSilenceOverlap(range, cuts) {
        if (!range || !cuts || !Array.isArray(cuts.silenceSegments)) return 0;
        const duration = Math.max(0.01, Number(range.end) - Number(range.start));
        let total = 0;
        cuts.silenceSegments.forEach(segment => {
            total += Math.max(0, Math.min(Number(range.end), segment.end) - Math.max(Number(range.start), segment.start));
        });
        return clamp(total / duration, 0, 1);
    }

    function countCutsInRange(range, cuts) {
        if (!range || !cuts || !Array.isArray(cuts.timeline)) return 0;
        return cuts.timeline.filter(point => point.time >= range.start && point.time <= range.end).length;
    }

    function nearestTimelinePoint(time, cuts, direction, maxDistance) {
        if (!cuts || !Array.isArray(cuts.timeline) || !cuts.timeline.length) return null;
        let best = null;
        for (const point of cuts.timeline) {
            const delta = point.time - time;
            if (direction === 'before' && delta > maxDistance * 0.35) continue;
            if (direction === 'after' && delta < -maxDistance * 0.35) continue;
            const distance = Math.abs(delta);
            if (distance <= maxDistance && (!best || distance < best.distance || (distance === best.distance && point.score > best.score))) {
                best = Object.assign({}, point, { distance });
            }
        }
        return best;
    }

    function autoTrimRange(range, cuts, inputOptions, totalDuration) {
        const options = normalizeOptions(inputOptions);
        if (!range) return range;
        const duration = Math.max(1, Number(range.end) - Number(range.start));
        const before = nearestTimelinePoint(Number(range.start), cuts, 'before', options.maxSnapDistance);
        const after = nearestTimelinePoint(Number(range.end), cuts, 'after', options.maxSnapDistance);
        const baseStart = before ? before.time : Number(range.start);
        const baseEnd = after ? after.time : Number(range.end);
        let start = Math.max(0, baseStart - options.handlePadding);
        let end = Math.max(start + 1, baseEnd + options.handlePadding);
        const maxDuration = Number(totalDuration) || Number(cuts && cuts.duration) || end;
        if (maxDuration) end = Math.min(maxDuration, end);
        if (end - start < Math.min(duration, 5)) end = Math.min(maxDuration || end + duration, start + duration);
        return {
            start: Number(start.toFixed(2)),
            end: Number(end.toFixed(2)),
            duration: Number(Math.max(1, end - start).toFixed(2)),
            cutInfo: {
                startCutType: before && before.type || '',
                endCutType: after && after.type || '',
                silenceRisk: getSilenceOverlap({ start, end }, cuts),
                cutsInside: countCutsInRange({ start, end }, cuts)
            }
        };
    }

    function createCutInsight(range, cuts) {
        if (!range || !cuts) return null;
        const cutsInside = countCutsInRange(range, cuts);
        const silenceRisk = getSilenceOverlap(range, cuts);
        const duration = Math.max(1, Number(range.end) - Number(range.start));
        const cutDensity = clamp(cutsInside / Math.max(1, duration / 8), 0, 1);
        const tempoScore = Math.round(clamp(46 + cutDensity * 42 - silenceRisk * 26, 0, 100));
        return { cutsInside, silenceRisk, tempoScore };
    }

    function enhanceRecommendations(recommendations, cuts) {
        if (!Array.isArray(recommendations) || !cuts) return recommendations || [];
        const enhanced = recommendations.map(item => {
            const insight = createCutInsight(item, cuts) || { tempoScore: 50, silenceRisk: 0, cutsInside: 0 };
            const boost = Math.round((insight.tempoScore - 50) * 0.18 - insight.silenceRisk * 10);
            const score = clamp((Number(item.score) || 0) + boost, 0, 100);
            const reasons = Array.from(new Set([...(item.reasons || [])]));
            if (insight.cutsInside >= 3) reasons.push('비트·전환 컷 후보가 충분해 쇼츠 템포가 좋습니다.');
            if (insight.silenceRisk < 0.06) reasons.push('무음 겹침이 적어 컷 편집 안정성이 높습니다.');
            if (insight.silenceRisk > 0.18) reasons.push('무음 구간이 일부 겹쳐 자동 컷 보정을 권장합니다.');
            return Object.assign({}, item, {
                score,
                cutInfo: Object.assign({}, item.cutInfo || {}, insight),
                reasons: reasons.slice(0, 5)
            });
        });
        enhanced.sort((a, b) => b.score - a.score || a.start - b.start);
        return enhanced.map((item, index) => Object.assign({}, item, { rank: index + 1 }));
    }

    global.AIShortsAutoCutDetector = Object.freeze({
        DEFAULTS,
        normalizeOptions,
        detectSilenceSegments,
        detectBeatCutPoints,
        detectMotionCutPoints,
        createAutoCuts,
        createCutInsight,
        autoTrimRange,
        enhanceRecommendations
    });
})(window);
