// AI Shorts Studio v0.9.6 - pro engine tuning helpers
'use strict';

(function exposeProEngineTuner(global) {
    const utils = global.AIShortsCoreUtils || {};
    const clamp = utils.clamp || ((value, min, max) => Math.min(max, Math.max(min, Number(value) || 0)));

    function enhanceBudget(baseBudget, fileMeta, runtimeConfig) {
        const budget = Object.assign({}, baseBudget || {});
        const duration = Number(fileMeta && fileMeta.duration || budget.duration || 0);
        const sizeMb = Number(budget.sizeMb || 0);
        budget.engineClass = budget.tier === 'max' ? 'pro-max' : budget.tier === 'safe' ? 'pro-safe' : 'pro-balanced';
        budget.analysisWindow = budget.tier === 'safe' ? 'light' : duration > 480 || sizeMb > 350 ? 'adaptive' : 'full';
        budget.cutSensitivity = budget.tier === 'max' ? 0.68 : budget.tier === 'safe' ? 0.46 : 0.58;
        budget.scoreDepth = budget.tier === 'max' ? 'deep' : budget.tier === 'safe' ? 'stable' : 'balanced';
        budget.renderHint = budget.tier === 'safe' ? '안정 우선' : budget.tier === 'max' ? '품질 우선' : '균형 우선';
        budget.cacheLimit = budget.tier === 'safe' ? 2 : budget.tier === 'max' ? 6 : 4;
        budget.label = budget.label || '프로 엔진';
        return Object.freeze(budget);
    }

    function computeConfidence(candidate) {
        const stats = candidate && candidate.stats || {};
        const score = Number(candidate && candidate.score || 0);
        const peak = Number(stats.peak || 0);
        const transient = Number(stats.transient || 0);
        const ramp = Number(stats.ramp || 0);
        const silence = Number(stats.silence || 0);
        const motion = Number(stats.motion || 0);
        const confidence = clamp(score * 0.64 + peak * 10 + transient * 9 + ramp * 8 + motion * 5 - silence * 16, 0, 100);
        return Math.round(confidence);
    }

    function labelGrade(confidence) {
        if (confidence >= 88) return 'S급 후보';
        if (confidence >= 78) return 'A급 후보';
        if (confidence >= 66) return 'B급 후보';
        return '보정 필요';
    }

    function tuneRecommendations(recommendations, context) {
        const budget = context && context.budget || {};
        return (recommendations || []).map((item, index) => {
            const confidence = computeConfidence(item);
            const grade = labelGrade(confidence);
            const badges = Array.isArray(item.engineBadges) ? item.engineBadges.slice() : [];
            if (!badges.includes(grade)) badges.unshift(grade);
            if (budget.scoreDepth === 'deep' && !badges.includes('정밀 점수')) badges.push('정밀 점수');
            return Object.assign({}, item, {
                rank: index + 1,
                proConfidence: confidence,
                proGrade: grade,
                engineBadges: badges.slice(0, 4),
                engineVersion: 'v0.9.6-pro',
                proEngine: {
                    confidence,
                    grade,
                    scoreDepth: budget.scoreDepth || 'balanced',
                    renderHint: budget.renderHint || '균형 우선'
                }
            });
        }).sort((a, b) => Number(b.proConfidence || b.score) - Number(a.proConfidence || a.score) || Number(b.score) - Number(a.score));
    }

    function summarizeAnalysis(result, budget) {
        const frames = result && result.audioAnalysis && result.audioAnalysis.frames || [];
        const autoCuts = result && result.autoCuts || {};
        const silentFrames = frames.filter(frame => frame && frame.silent).length;
        const silenceRatio = frames.length ? silentFrames / frames.length : 0;
        return Object.freeze({
            version: '0.9.6',
            class: budget && budget.engineClass || 'pro-balanced',
            frames: frames.length,
            silenceRatio: Math.round(silenceRatio * 100),
            cutPoints: autoCuts && autoCuts.summary && autoCuts.summary.totalCuts || 0,
            renderHint: budget && budget.renderHint || '균형 우선'
        });
    }

    global.AIShortsProEngineTuner = Object.freeze({ enhanceBudget, tuneRecommendations, summarizeAnalysis, computeConfidence });
})(window);
