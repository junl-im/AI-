// AI Shorts Studio v0.2.0 - portable project save/load helpers
'use strict';

(function exposeProjectService(global) {
    const captionService = global.AIShortsCaptionService || {};

    function createProjectSnapshot(state, title, hashtags) {
        const fileMeta = state && state.fileMeta ? Object.assign({}, state.fileMeta) : null;
        return {
            app: 'AI Shorts Studio',
            schemaVersion: 2,
            createdAt: new Date().toISOString(),
            note: '원본 미디어 파일은 포함되지 않습니다. 같은 파일을 다시 불러온 뒤 이 프로젝트 JSON을 적용하세요.',
            fileMeta,
            fileName: state && state.file ? state.file.name : fileMeta && fileMeta.name || '',
            fileKind: state && state.fileKind || '',
            settings: Object.assign({}, state && state.settings || {}),
            selectedRecommendationId: state && state.selectedRecommendationId || '',
            selectedRange: state && state.selectedRange ? Object.assign({}, state.selectedRange) : null,
            recommendations: (state && state.recommendations || []).map(item => Object.assign({}, item)),
            captions: (state && state.captions || []).map(cue => Object.assign({}, cue)),
            captionText: captionService.serializeCaptions ? captionService.serializeCaptions(state && state.captions || []) : '',
            copy: {
                title: String(title || ''),
                hashtags: String(hashtags || '')
            }
        };
    }

    function parseProjectText(text) {
        const parsed = JSON.parse(String(text || ''));
        if (!parsed || parsed.app !== 'AI Shorts Studio') throw new Error('AI 쇼츠 스튜디오 프로젝트 파일이 아닙니다.');
        if (Number(parsed.schemaVersion || 0) < 1) throw new Error('지원하지 않는 프로젝트 버전입니다.');
        return parsed;
    }

    function applyProjectSnapshot(state, project) {
        if (!state || !project) return false;
        state.settings = Object.assign({}, state.settings || {}, project.settings || {});
        state.recommendations = Array.isArray(project.recommendations) ? project.recommendations.map(item => Object.assign({}, item)) : [];
        state.captions = Array.isArray(project.captions) ? project.captions.map(cue => Object.assign({}, cue)) : [];
        state.selectedRecommendationId = project.selectedRecommendationId || (state.recommendations[0] && state.recommendations[0].id) || '';
        const selected = state.recommendations.find(item => item.id === state.selectedRecommendationId) || null;
        state.selectedRange = selected ? { start: selected.start, end: selected.end, duration: selected.duration, score: selected.score } : (project.selectedRange || null);
        return true;
    }

    global.AIShortsProjectService = Object.freeze({
        createProjectSnapshot,
        parseProjectText,
        applyProjectSnapshot
    });
})(window);
