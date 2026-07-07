// AI Shorts Studio v0.9.5 - engine module contracts and result validation
'use strict';

(function exposeModuleContracts(global) {
    const ALLOWED_STAGES = Object.freeze(['analysis', 'cut', 'recommendation', 'render', 'utility', 'stability']);

    function unique(values) {
        return Array.from(new Set((values || []).filter(Boolean).map(String)));
    }

    function validateModule(module) {
        const errors = [];
        const warnings = [];
        if (!module || typeof module !== 'object') errors.push('module object missing');
        if (module && !module.id) errors.push('module id missing');
        if (module && module.id && !/^[a-z0-9_.-]+$/i.test(String(module.id))) warnings.push('module id format is not strict');
        if (module && module.stage && !ALLOWED_STAGES.includes(module.stage)) warnings.push(`unknown stage: ${module.stage}`);
        if (module && module.priority != null && !Number.isFinite(Number(module.priority))) warnings.push('priority should be numeric');
        return Object.freeze({ ok: errors.length === 0, errors, warnings });
    }

    function normalizeAnalysisResult(result) {
        const normalized = Object.assign({}, result || {});
        normalized.warnings = unique([].concat(normalized.warnings || []));
        normalized.fileMeta = Object.assign({ duration: 0, size: 0, type: '' }, normalized.fileMeta || {});
        normalized.waveformBins = Array.isArray(normalized.waveformBins) ? normalized.waveformBins : [];
        normalized.engine = Object.assign({ version: '0.9.5', normalized: true }, normalized.engine || {});
        if (!normalized.audioAnalysis && !normalized.motionAnalysis) {
            normalized.warnings.push('분석 결과가 비어 있습니다. 브라우저 제한 또는 파일 형식을 확인하세요.');
        }
        return normalized;
    }

    function validateAnalysisResult(result) {
        const errors = [];
        const warnings = [];
        if (!result) errors.push('analysis result missing');
        if (result && !result.audioAnalysis && !result.motionAnalysis) warnings.push('audio/motion analysis missing');
        if (result && !Array.isArray(result.waveformBins)) warnings.push('waveformBins should be an array');
        if (result && result.fileMeta && Number(result.fileMeta.duration) <= 0) warnings.push('duration is unknown');
        return Object.freeze({ ok: errors.length === 0, errors, warnings });
    }

    function validateRecommendation(candidate) {
        const errors = [];
        const warnings = [];
        if (!candidate || typeof candidate !== 'object') errors.push('candidate missing');
        if (candidate && !candidate.id) warnings.push('candidate id missing');
        if (candidate && Number(candidate.end) <= Number(candidate.start)) errors.push('candidate time range invalid');
        if (candidate && Number(candidate.score) < 0) warnings.push('candidate score below zero');
        return Object.freeze({ ok: errors.length === 0, errors, warnings });
    }

    function createContractReport(registrySnapshot, analysisResult, recommendations) {
        const analysisCheck = validateAnalysisResult(analysisResult);
        const recChecks = (recommendations || []).map(validateRecommendation);
        const failedRecommendations = recChecks.filter(item => !item.ok).length;
        const warnings = unique([].concat(
            analysisCheck.warnings,
            ...recChecks.map(item => item.warnings).flat()
        ));
        const moduleCount = registrySnapshot && registrySnapshot.count || 0;
        return Object.freeze({
            version: '0.9.5',
            ok: analysisCheck.ok && failedRecommendations === 0 && moduleCount >= 5,
            moduleCount,
            failedRecommendations,
            warnings,
            score: Math.max(0, Math.min(100, 72 + Math.min(moduleCount, 12) * 2 - failedRecommendations * 8 - warnings.length * 2))
        });
    }

    global.AIShortsModuleContracts = Object.freeze({
        ALLOWED_STAGES,
        validateModule,
        normalizeAnalysisResult,
        validateAnalysisResult,
        validateRecommendation,
        createContractReport
    });
})(window);
