// AI Shorts Studio v0.9.6 - modular scoring pipeline
'use strict';

(function exposeScoringPipeline(global) {
    const recEngine = global.AIShortsRecommendationEngine || {};
    const autoCutDetector = global.AIShortsAutoCutDetector || {};
    const utils = global.AIShortsCoreUtils || {};
    const clamp = utils.clamp || ((value, min, max) => Math.min(max, Math.max(min, Number(value) || 0)));

    function computeEngineBadges(candidate) {
        const stats = candidate && candidate.stats || {};
        const badges = [];
        if (Number(stats.peak) > 0.72) badges.push('강한 피크');
        if (Number(stats.transient) > 0.54) badges.push('비트감');
        if (Number(stats.ramp) > 0.58) badges.push('상승감');
        if (Number(stats.motion) > 0.55) badges.push('움직임');
        if (Number(stats.silence) < 0.08) badges.push('무음 낮음');
        return badges.slice(0, 3);
    }

    function applyQualityGate(candidate, autoCuts) {
        const stats = candidate && candidate.stats || {};
        const silence = Number(stats.silence) || 0;
        const motion = Number(stats.motion) || 0;
        const transient = Number(stats.transient) || 0;
        const ramp = Number(stats.ramp) || 0;
        let bonus = 0;
        let penalty = 0;
        if (silence > 0.18) penalty += 5;
        if (silence > 0.32) penalty += 8;
        if (transient > 0.58) bonus += 3;
        if (ramp > 0.62) bonus += 3;
        if (motion > 0.58) bonus += 2;
        if (autoCuts && autoCuts.summary && autoCuts.summary.totalCuts > 12) bonus += 1;
        const original = Number(candidate.score) || 0;
        const score = Math.round(clamp(original + bonus - penalty, 0, 100));
        return Object.assign({}, candidate, {
            score,
            engineScore: score,
            engineBadges: computeEngineBadges(candidate),
            engineQuality: {
                originalScore: original,
                bonus,
                penalty,
                silenceRisk: silence > 0.22 ? 'high' : silence > 0.12 ? 'medium' : 'low'
            }
        });
    }

    function createRecommendations(input) {
        const audioAnalysis = input && input.audioAnalysis;
        const motionAnalysis = input && input.motionAnalysis;
        const autoCuts = input && input.autoCuts;
        const options = Object.assign({}, input && input.options || {});
        if (!recEngine.createRecommendations) return [];
        let recommendations = recEngine.createRecommendations(audioAnalysis, motionAnalysis, options);
        if (autoCutDetector.enhanceRecommendations) {
            recommendations = autoCutDetector.enhanceRecommendations(recommendations, autoCuts, options.autoCutOptions || {});
        }
        recommendations = recommendations.map(item => applyQualityGate(item, autoCuts));
        recommendations.sort((a, b) => Number(b.score) - Number(a.score) || Number(a.start) - Number(b.start));
        return recommendations.map((item, index) => Object.assign({}, item, {
            rank: index + 1,
            title: String(item.title || '').replace(/추천 \d+/, `추천 ${index + 1}`),
            engineVersion: 'v0.9.6-modular'
        }));
    }

    global.AIShortsScoringPipeline = Object.freeze({ createRecommendations, applyQualityGate, computeEngineBadges });
})(window);
