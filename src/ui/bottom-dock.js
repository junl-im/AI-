// AI Shorts Studio v0.4.1 - bottom fixed workflow dock
'use strict';

(function bootBottomDock(global) {
    const store = global.AIShortsAppState || {};
    const state = store.state || {};

    const els = {};
    const map = {
        dock: 'bottomDock',
        dot: 'bottomDockDot',
        title: 'bottomDockTitle',
        meta: 'bottomDockMeta',
        analyze: 'bottomAnalyzeBtn',
        recommend: 'bottomRecommendBtn',
        edit: 'bottomEditBtn',
        preview: 'bottomPreviewBtn',
        thumbnail: 'bottomThumbnailBtn',
        export: 'bottomExportBtn',
        analyzeSource: 'analyzeBtn',
        previewSource: 'previewBtn',
        thumbnailSource: 'thumbnailBtn',
        exportSource: 'exportBtn',
        recommendationList: 'recommendationList'
    };

    function byId(id) {
        return document.getElementById(id);
    }

    function collectBottomDockElements() {
        Object.keys(map).forEach(key => { els[key] = byId(map[key]); });
    }

    function selectedRecommendation() {
        const recommendations = Array.isArray(state.recommendations) ? state.recommendations : [];
        return recommendations.find(item => item && item.id === state.selectedRecommendationId) || null;
    }

    function mirrorButton(target, source) {
        if (!target || !source) return;
        target.disabled = Boolean(source.disabled);
        target.setAttribute('aria-disabled', target.disabled ? 'true' : 'false');
    }

    function clickWhenEnabled(source) {
        if (!source || source.disabled) return;
        source.click();
    }

    function scrollToPanel(selector) {
        const panel = document.querySelector(selector);
        if (!panel) return;
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function fileLabel() {
        const file = state.file;
        if (!file || !file.name) return '파일을 열어주세요';
        const type = state.fileKind === 'video' ? '영상' : '오디오';
        return `${type} · ${file.name}`;
    }

    function syncBottomDock() {
        const hasFile = Boolean(state.file);
        const recommendations = Array.isArray(state.recommendations) ? state.recommendations : [];
        const hasRecommendations = recommendations.length > 0;
        const selected = selectedRecommendation();
        const hasExport = Boolean(state.exportInfo);

        document.body.classList.toggle('has-media', hasFile);
        document.body.classList.toggle('has-recommendations', hasRecommendations);

        mirrorButton(els.analyze, els.analyzeSource);
        mirrorButton(els.preview, els.previewSource);
        mirrorButton(els.thumbnail, els.thumbnailSource);
        mirrorButton(els.export, els.exportSource);

        if (els.recommend) els.recommend.disabled = !hasRecommendations;
        if (els.edit) els.edit.disabled = !selected;

        if (els.title) {
            if (!hasFile) els.title.textContent = '파일을 열어주세요';
            else if (!selected) els.title.textContent = fileLabel();
            else els.title.textContent = selected.title || '선택된 추천 구간';
        }

        if (els.meta) {
            if (!hasFile) els.meta.textContent = '하단 Dock에서 파일 선택부터 내보내기까지 바로 실행합니다.';
            else if (state.isAnalyzing) els.meta.textContent = '분석 중입니다. 완료되면 추천 카드가 생성됩니다.';
            else if (!selected) els.meta.textContent = '분석 버튼을 누르면 쇼츠 후보를 추천합니다.';
            else els.meta.textContent = `${selected.rangeText || ''} · 점수 ${Math.round(Number(selected.score) || 0)} · 편집/미리보기/내보내기 가능`;
        }

        if (els.dot) {
            els.dot.classList.toggle('is-ready', Boolean(selected));
            els.dot.classList.toggle('is-export', hasExport);
        }
    }

    function installBottomDockActions() {
        if (els.analyze) els.analyze.addEventListener('click', () => clickWhenEnabled(els.analyzeSource));
        if (els.preview) els.preview.addEventListener('click', () => clickWhenEnabled(els.previewSource));
        if (els.thumbnail) els.thumbnail.addEventListener('click', () => clickWhenEnabled(els.thumbnailSource));
        if (els.export) els.export.addEventListener('click', () => clickWhenEnabled(els.exportSource));
        if (els.recommend) els.recommend.addEventListener('click', () => scrollToPanel('.control-zone[aria-label="AI 추천 구간"]'));
        if (els.edit) els.edit.addEventListener('click', () => scrollToPanel('.edit-tools-card'));
    }

    function installBottomDockObservers() {
        const observer = new MutationObserver(syncBottomDock);
        [els.analyzeSource, els.previewSource, els.thumbnailSource, els.exportSource, els.recommendationList, byId('selectedRangeText'), byId('analysisStatus'), byId('importStatus')]
            .filter(Boolean)
            .forEach(node => observer.observe(node, { attributes: true, childList: true, subtree: true, characterData: true }));
        document.addEventListener('visibilitychange', syncBottomDock);
        setInterval(syncBottomDock, 500);
    }

    function initBottomDock() {
        collectBottomDockElements();
        if (!els.dock) return;
        installBottomDockActions();
        installBottomDockObservers();
        syncBottomDock();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initBottomDock);
    else initBottomDock();
})(window);
