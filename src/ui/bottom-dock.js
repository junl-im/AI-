// AI Shorts Studio v0.9.6 - HyperConnect dock status controller
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
        file: 'bottomFileBtn',
        recommend: 'analyzeBtn',
        fileInput: 'fileInput',
        analysisStatus: 'analysisStatus',
        importStatus: 'importStatus'
    };

    let syncRaf = 0;

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

    function compactName(name, limit) {
        const text = String(name || '').trim();
        if (!text) return '';
        const max = Number(limit) || 34;
        return text.length > max ? `${text.slice(0, max - 1)}…` : text;
    }

    function syncBottomDockNow() {
        syncRaf = 0;
        const hasFile = Boolean(state.file);
        const selected = selectedRecommendation();
        const hasRecommendations = Array.isArray(state.recommendations) && state.recommendations.length > 0;

        document.body.classList.toggle('has-media', hasFile);
        document.body.classList.toggle('has-recommendations', hasRecommendations);
        document.body.classList.toggle('is-analyzing', Boolean(state.isAnalyzing));


        if (els.title) {
            if (!hasFile) els.title.textContent = '원본을 불러와주세요';
            else els.title.textContent = compactName(state.file && state.file.name, 44) || '파일 준비됨';
        }

        if (els.meta) {
            if (!hasFile) els.meta.textContent = '불러오기 카드에서 원본을 선택하면 자동 분석이 시작됩니다.';
            else if (state.isAnalyzing) els.meta.textContent = '자동 분석 중 · 완료되면 추천 화면으로 이동합니다.';
            else if (selected) els.meta.textContent = `선택 구간 ${selected.rangeText || ''} · 미리보기 연결됨`;
            else if (hasRecommendations) els.meta.textContent = '후보를 선택하면 미리보기로 이동합니다.';
            else els.meta.textContent = '추천 메뉴에서 후보를 생성하세요.';
        }

        if (els.dot) {
            els.dot.classList.toggle('is-ready', hasRecommendations);
            els.dot.classList.toggle('is-analyzing', Boolean(state.isAnalyzing));
        }
    }

    function scheduleSync() {
        if (syncRaf) return;
        syncRaf = requestAnimationFrame(syncBottomDockNow);
    }

    function installBottomDockActions() {
        if (els.file) els.file.addEventListener('click', scheduleSync);
        if (els.fileInput) els.fileInput.addEventListener('change', scheduleSync);
        if (els.recommend) els.recommend.addEventListener('click', scheduleSync);
    }

    function installBottomDockObservers() {
        const observer = new MutationObserver(scheduleSync);
        [els.recommend, els.analysisStatus, els.importStatus]
            .filter(Boolean)
            .forEach(node => observer.observe(node, { attributes: true, childList: true, subtree: true, characterData: true }));
        document.addEventListener('visibilitychange', scheduleSync);
        global.addEventListener('resize', scheduleSync, { passive: true });
    }

    function initBottomDock() {
        collectBottomDockElements();
        if (!els.dock) return;
        installBottomDockActions();
        installBottomDockObservers();
        syncBottomDockNow();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initBottomDock);
    else initBottomDock();
})(window);
