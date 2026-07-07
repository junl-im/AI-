// AI Shorts Studio v0.9.3 - runtime stability auditor
'use strict';

(function exposeStabilityAuditor(global) {
    function scoreFrom(items) {
        return Math.max(0, Math.min(100, 100 - items.filter(item => item.level === 'error').length * 18 - items.filter(item => item.level === 'warning').length * 7));
    }

    function auditState(state, engineHealth) {
        const findings = [];
        if (!state) findings.push({ level: 'error', message: '앱 상태 객체가 없습니다.' });
        if (state && state.file && !state.fileUrl) findings.push({ level: 'warning', message: '파일 URL이 아직 준비되지 않았습니다.' });
        if (state && state.isAnalyzing && state.recommendations && state.recommendations.length) findings.push({ level: 'warning', message: '분석 중 추천 목록이 남아 있습니다.' });
        if (state && state.selectedRecommendationId && !(state.recommendations || []).some(item => item.id === state.selectedRecommendationId)) {
            findings.push({ level: 'warning', message: '선택된 추천 ID가 목록과 맞지 않습니다.' });
        }
        const modules = engineHealth && Number(engineHealth.modules || 0);
        if (engineHealth && modules < 5) findings.push({ level: 'warning', message: '활성 엔진 모듈 수가 적습니다.' });
        return Object.freeze({
            version: '0.9.3',
            ok: !findings.some(item => item.level === 'error'),
            score: scoreFrom(findings),
            findings,
            checkedAt: new Date().toISOString()
        });
    }

    function createHeartbeat(intervalMs, onReport) {
        let timer = 0;
        function start(provider) {
            stop();
            timer = global.setInterval(() => {
                try {
                    const report = auditState(provider && provider.state, provider && provider.engineHealth);
                    if (typeof onReport === 'function') onReport(report);
                } catch (error) {
                    if (typeof onReport === 'function') onReport({ ok: false, score: 0, findings: [{ level: 'error', message: error.message }] });
                }
            }, Math.max(5000, Number(intervalMs) || 15000));
        }
        function stop() {
            if (timer) global.clearInterval(timer);
            timer = 0;
        }
        return Object.freeze({ start, stop });
    }

    global.AIShortsStabilityAuditor = Object.freeze({ auditState, createHeartbeat });
})(window);
