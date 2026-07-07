// AI Shorts Studio v0.8.2 - lean two-button bottom dock with feedback labels
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
        analyze: 'bottomAnalyzeBtn',
        analyzeSource: 'analyzeBtn',
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

    function mirrorAnalyzeButton() {
        if (!els.analyze || !els.analyzeSource) return;
        const disabled = Boolean(els.analyzeSource.disabled);
        els.analyze.disabled = disabled;
        els.analyze.setAttribute('aria-disabled', disabled ? 'true' : 'false');
    }

    function clickAnalyzeWhenEnabled() {
        if (!els.analyzeSource || els.analyzeSource.disabled) return;
        if (global.AIShortsFeedbackUX && global.AIShortsFeedbackUX.vibrate) global.AIShortsFeedbackUX.vibrate('analyze');
        els.analyzeSource.click();
    }

    function syncBottomDockNow() {
        syncRaf = 0;
        const hasFile = Boolean(state.file);
        const selected = selectedRecommendation();
        const hasRecommendations = Array.isArray(state.recommendations) && state.recommendations.length > 0;

        document.body.classList.toggle('has-media', hasFile);
        document.body.classList.toggle('has-recommendations', hasRecommendations);
        document.body.classList.toggle('is-analyzing', Boolean(state.isAnalyzing));

        mirrorAnalyzeButton();

        if (els.title) {
            if (!hasFile) els.title.textContent = '파일을 열어주세요';
            else els.title.textContent = compactName(state.file && state.file.name, 44) || '파일 준비됨';
        }

        if (els.meta) {
            if (!hasFile) els.meta.textContent = '📂 파일 열기 후 ⚡ 분석하기를 누르세요.';
            else if (state.isAnalyzing) els.meta.textContent = '⚡ 쇼츠 후보를 분석 중입니다.';
            else if (selected) els.meta.textContent = `선택 구간 ${selected.rangeText || ''} · 점수 ${Math.round(Number(selected.score) || 0)}`;
            else els.meta.textContent = '⚡ 분석하기 버튼으로 후보를 생성하세요.';
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
        if (els.analyze) els.analyze.addEventListener('click', clickAnalyzeWhenEnabled);
        if (els.file) els.file.addEventListener('click', scheduleSync);
        if (els.fileInput) els.fileInput.addEventListener('change', scheduleSync);
        if (els.analyzeSource) els.analyzeSource.addEventListener('click', scheduleSync);
    }

    function installBottomDockObservers() {
        const observer = new MutationObserver(scheduleSync);
        [els.analyzeSource, els.analysisStatus, els.importStatus]
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
