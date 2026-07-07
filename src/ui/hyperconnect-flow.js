// AI Shorts Studio v0.9.5 - HyperConnect flow guard
'use strict';
(function bootHyperConnectFlow(global) {
    const store = global.AIShortsAppState || {};
    const state = store.state || {};
    let raf = 0;

    function byId(id) { return document.getElementById(id); }
    function hasAnalysis() { return Boolean(state.audioAnalysis || state.motionAnalysis || state.autoCuts); }
    function hasRecommendations() { return Array.isArray(state.recommendations) && state.recommendations.length > 0; }
    function hasSelection() { return Boolean(state.selectedRecommendationId); }
    function setDockHint() {
        const stageTitle = byId('hyperflowStageTitle');
        const stageMeta = byId('hyperflowStageMeta');
        if (!stageTitle || !stageMeta) return;
        if (!state.file) {
            stageTitle.textContent = '파일을 열면 자동 분석합니다';
            stageMeta.textContent = '분석 버튼은 없습니다. 파일 선택 후 추천 탭으로 연결됩니다.';
        } else if (state.isAnalyzing) {
            stageTitle.textContent = '자동 분석 중입니다';
            stageMeta.textContent = '완료되면 추천 생성 단계로 이동합니다.';
        } else if (hasAnalysis() && !hasRecommendations()) {
            stageTitle.textContent = '분석 완료 · 추천 생성 준비';
            stageMeta.textContent = '추천 탭의 ✨ 추천 생성 버튼 하나만 누르세요.';
        } else if (hasRecommendations() && !hasSelection()) {
            stageTitle.textContent = '후보 선택 단계';
            stageMeta.textContent = '마음에 드는 후보 카드를 누르면 미리보기로 자동 이동합니다.';
        } else if (hasSelection()) {
            stageTitle.textContent = '미리보기 연결 완료';
            stageMeta.textContent = '파형·컷·편집·자막·저장 탭으로 이어서 다듬을 수 있습니다.';
        }
    }
    function update() {
        raf = 0;
        document.body.classList.toggle('hyperconnect-has-analysis', hasAnalysis());
        document.body.classList.toggle('hyperconnect-has-recommendations', hasRecommendations());
        document.body.classList.toggle('hyperconnect-has-selection', hasSelection());
        setDockHint();
    }
    function schedule() {
        if (raf) return;
        raf = requestAnimationFrame(update);
    }
    function install() {
        const topDup = byId('flowRecommendBtn');
        if (topDup) topDup.remove();
        const observer = new MutationObserver(schedule);
        ['analysisStatus', 'recommendationCount', 'recommendationList', 'previewStatus', 'progressBar'].map(byId).filter(Boolean).forEach(node => observer.observe(node, { attributes: true, childList: true, subtree: true, characterData: true }));
        document.addEventListener('click', event => {
            const rec = event.target && event.target.closest && event.target.closest('.recommendation-card');
            if (rec) schedule();
        }, true);
        global.addEventListener('resize', schedule, { passive: true });
        schedule();
    }
    global.AIShortsHyperConnectFlow = { schedule, update };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
    else install();
})(window);
