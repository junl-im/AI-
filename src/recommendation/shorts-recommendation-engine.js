// AI Shorts Studio v0.3.0 - explainable shorts recommendation engine
'use strict';

(function exposeRecommendationEngine(global) {
    const utils = global.AIShortsCoreUtils || {};
    const clamp = utils.clamp || ((value, min, max) => Math.min(max, Math.max(min, Number(value) || 0)));

    function getDurations(durationSetting, totalDuration) {
        const total = Number(totalDuration) || 0;
        if (durationSetting && durationSetting !== 'auto') {
            return [Math.min(Number(durationSetting), Math.max(5, Math.floor(total)))].filter(value => value >= 5);
        }
        const base = total >= 190 ? [15, 30, 45, 60, 90, 180] : [15, 30, 45, 60, 90];
        return base.filter(value => value <= Math.max(8, total - 1));
    }

    function averageInRange(frames, start, end, key) {
        let sum = 0;
        let count = 0;
        for (const frame of frames || []) {
            if (frame.time >= start && frame.time <= end) {
                sum += Number(frame[key]) || 0;
                count += 1;
            }
        }
        return count ? sum / count : 0;
    }

    function maxInRange(frames, start, end, key) {
        let value = 0;
        for (const frame of frames || []) {
            if (frame.time >= start && frame.time <= end) value = Math.max(value, Number(frame[key]) || 0);
        }
        return value;
    }

    function ratioInRange(frames, start, end, predicate) {
        let count = 0;
        let hit = 0;
        for (const frame of frames || []) {
            if (frame.time >= start && frame.time <= end) {
                count += 1;
                if (predicate(frame)) hit += 1;
            }
        }
        return count ? hit / count : 0;
    }

    function motionAverage(motionFrames, start, end) {
        return averageInRange(motionFrames || [], start, end, 'diffNorm');
    }

    function energyRamp(frames, start, end) {
        const duration = Math.max(1, end - start);
        const early = averageInRange(frames, start, start + duration * 0.28, 'rmsNorm');
        const late = averageInRange(frames, end - duration * 0.28, end, 'rmsNorm');
        return clamp((late - early + 0.5) / 1.0, 0, 1);
    }

    function styleWeights(style) {
        const map = {
            impact: { energy: 0.33, peak: 0.22, transient: 0.24, ramp: 0.12, motion: 0.09, calm: 0.00 },
            emotional: { energy: 0.24, peak: 0.12, transient: 0.10, ramp: 0.15, motion: 0.04, calm: 0.35 },
            motion: { energy: 0.24, peak: 0.15, transient: 0.13, ramp: 0.08, motion: 0.35, calm: 0.05 },
            balanced: { energy: 0.30, peak: 0.18, transient: 0.17, ramp: 0.13, motion: 0.12, calm: 0.10 }
        };
        return map[style] || map.balanced;
    }

    function scoreWindow(audioFrames, motionFrames, start, duration, style) {
        const end = start + duration;
        const energy = averageInRange(audioFrames, start, end, 'rmsNorm');
        const peak = maxInRange(audioFrames, start, end, 'peakNorm');
        const transient = averageInRange(audioFrames, start, end, 'transientNorm');
        const silence = ratioInRange(audioFrames, start, end, frame => frame.silent || Number(frame.rmsNorm) < 0.08);
        const ramp = energyRamp(audioFrames, start, end);
        const motion = motionAverage(motionFrames, start, end);
        const calm = clamp(1 - Math.abs(0.42 - energy) * 1.6, 0, 1);
        const weights = styleWeights(style);
        let score =
            energy * weights.energy +
            peak * weights.peak +
            transient * weights.transient +
            ramp * weights.ramp +
            motion * weights.motion +
            calm * weights.calm;
        const introPenalty = start < 2 ? 0.05 : 0;
        const silencePenalty = silence * 0.42;
        const endingPenalty = duration > 20 && energy < 0.16 ? 0.08 : 0;
        score = clamp(score - introPenalty - silencePenalty - endingPenalty, 0, 1);
        return { score, end, energy, peak, transient, silence, ramp, motion, calm };
    }

    function explainCandidate(stats, style) {
        const reasons = [];
        if (stats.peak > 0.72) reasons.push('피크가 선명해서 첫 인상이 강합니다.');
        if (stats.transient > 0.54) reasons.push('비트/어택 변화가 많아 짧은 영상 리듬에 적합합니다.');
        if (stats.ramp > 0.58) reasons.push('구간 안에서 에너지가 상승해 후렴·드롭 후보로 좋습니다.');
        if (stats.motion > 0.55) reasons.push('영상 움직임이 많아 시각적 집중도가 높습니다.');
        if (stats.silence < 0.08) reasons.push('무음·저에너지 구간이 적어 이탈 위험이 낮습니다.');
        if (style === 'emotional' && stats.calm > 0.64) reasons.push('에너지가 과하지 않아 감성 하이라이트로 쓰기 좋습니다.');
        if (!reasons.length) reasons.push('전체 에너지와 안정성이 평균 이상인 구간입니다.');
        return reasons.slice(0, 4);
    }

    function labelCandidate(stats, index, style) {
        if (style === 'motion' && stats.motion > 0.55) return `추천 ${index + 1} — 움직임 집중형`;
        if (stats.ramp > 0.6) return `추천 ${index + 1} — 후렴 상승형`;
        if (stats.peak > 0.72 || stats.transient > 0.58) return `추천 ${index + 1} — 첫 3초 임팩트형`;
        if (style === 'emotional') return `추천 ${index + 1} — 감성 하이라이트형`;
        return `추천 ${index + 1} — 균형형 쇼츠 후보`;
    }

    function overlaps(a, b) {
        return Math.max(0, Math.min(a.end, b.end) - Math.max(a.start, b.start));
    }

    function suppressOverlaps(candidates, count) {
        const selected = [];
        for (const candidate of candidates) {
            const badOverlap = selected.some(item => overlaps(item, candidate) / Math.min(item.duration, candidate.duration) > 0.48);
            if (!badOverlap) selected.push(candidate);
            if (selected.length >= count) break;
        }
        return selected;
    }

    function createRecommendations(audioAnalysis, motionAnalysis, options) {
        const audioFrames = audioAnalysis && Array.isArray(audioAnalysis.frames) ? audioAnalysis.frames : [];
        const motionFrames = motionAnalysis && Array.isArray(motionAnalysis.frames) ? motionAnalysis.frames : [];
        const totalDuration = Number(audioAnalysis && audioAnalysis.duration) || Number(motionAnalysis && motionAnalysis.duration) || 0;
        if (!totalDuration || totalDuration < 6) return [];
        const style = options && options.style || 'balanced';
        const count = Number(options && options.count) || 6;
        const durations = getDurations(options && options.duration, totalDuration);
        const candidates = [];
        for (const duration of durations) {
            const step = duration <= 30 ? 1 : duration <= 60 ? 2 : 3;
            const maxStart = Math.max(0, totalDuration - duration - 0.2);
            for (let start = 0; start <= maxStart; start += step) {
                const stats = scoreWindow(audioFrames, motionFrames, start, duration, style);
                candidates.push({
                    id: `rec-${duration}-${Math.round(start * 10)}`,
                    start: Number(start.toFixed(2)),
                    end: Number(stats.end.toFixed(2)),
                    duration,
                    scoreRaw: stats.score,
                    score: Math.round(clamp(42 + stats.score * 58, 0, 100)),
                    stats
                });
            }
        }
        candidates.sort((a, b) => b.scoreRaw - a.scoreRaw || a.start - b.start);
        return suppressOverlaps(candidates, count).map((candidate, index) => Object.assign(candidate, {
            rank: index + 1,
            title: labelCandidate(candidate.stats, index, style),
            rangeText: utils.formatRange ? utils.formatRange(candidate.start, candidate.end) : `${candidate.start}-${candidate.end}`,
            reasons: explainCandidate(candidate.stats, style)
        }));
    }

    function createCopyForCandidate(candidate, fileName, platform) {
        const base = String(fileName || '이 영상').replace(/\.[^.]+$/, '');
        const range = candidate && candidate.rangeText ? candidate.rangeText : '하이라이트';
        const platformTag = platform === 'reels' ? '#Reels' : platform === 'tiktok' ? '#TikTok' : '#Shorts';
        const title = `${base} | ${range} 하이라이트`;
        const hashtags = ['#쇼츠', platformTag, '#음악', '#하이라이트', '#AI추천'].join(' ');
        return { title, hashtags };
    }

    global.AIShortsRecommendationEngine = Object.freeze({
        getDurations,
        createRecommendations,
        createCopyForCandidate
    });
})(window);
