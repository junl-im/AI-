// AI Shorts Studio v1.0.0 - Flow Doctor runtime guard
'use strict';
(function bootFlowDoctor(global) {
    const store = global.AIShortsAppState || {};
    const state = store.state || {};
    const ORDER = ['file', 'recommend', 'candidates', 'preview', 'waveform', 'cut', 'edit', 'export'];
    let raf = 0;
    let lastAutoTab = '';

    function byId(id) { return document.getElementById(id); }
    function activeTab() { return document.body && document.body.dataset ? document.body.dataset.activeFlowTab || 'file' : 'file'; }
    function hasAnalysis() { return Boolean(state.audioAnalysis || state.motionAnalysis || state.autoCuts); }
    function hasRecommendations() { return Array.isArray(state.recommendations) && state.recommendations.length > 0; }
    function hasSelection() { return Boolean(state.selectedRecommendationId); }
    function tabApi() { return global.AIShortsHyperFlowTabs || null; }
    function setTab(tab, reveal) {
        if (!ORDER.includes(tab)) return;
        const api = tabApi();
        if (api && api.setActiveFlowTab) api.setActiveFlowTab(tab, { reveal: Boolean(reveal) });
        else if (document.body && document.body.dataset) document.body.dataset.activeFlowTab = tab;
    }
    function setText(id, text) {
        const node = byId(id);
        if (node && node.textContent !== text) node.textContent = text;
    }
    function normalizeClickableTabs() {
        document.querySelectorAll('[data-flow-tab]').forEach((tab, index) => {
            tab.setAttribute('aria-posinset', String(index + 1));
            tab.setAttribute('aria-setsize', String(ORDER.length));
            tab.removeAttribute('href');
        });
    }
    function normalizeCandidateEmptyState() {
        const list = byId('recommendationList');
        if (!list) return;
        if (!hasRecommendations()) {
            list.classList.add('empty-state');
            const text = hasAnalysis()
                ? '분석은 완료되었습니다. ✨ 추천 탭에서 추천 생성을 누르면 후보가 여기에 표시됩니다.'
                : '파일을 열면 자동 분석됩니다. 분석 후 추천을 생성하세요.';
            if (!list.querySelector('.recommendation-card') && list.textContent.trim() !== text) {
                list.textContent = '';
                const p = document.createElement('p');
                p.textContent = text;
                list.appendChild(p);
            }
        }
    }
    function updateGuideText() {
        if (!state.file) {
            setText('flowSelectionTitle', '파일을 열면 자동 분석합니다');
            setText('flowSelectionMeta', '하단 📂 파일 탭에서 원본을 열어주세요.');
            return;
        }
        if (state.isAnalyzing) {
            setText('flowSelectionTitle', '자동 분석 중입니다');
            setText('flowSelectionMeta', '완료되면 ✨ 추천 단계로 이어집니다.');
            return;
        }
        if (hasAnalysis() && !hasRecommendations()) {
            setText('flowSelectionTitle', '분석 완료 · 추천을 생성하세요');
            setText('flowSelectionMeta', '✨ 추천 탭의 추천 생성 버튼만 누르면 됩니다.');
            return;
        }
        if (hasRecommendations() && !hasSelection()) {
            setText('flowSelectionTitle', '👆 후보 탭에서 구간을 선택하세요');
            setText('flowSelectionMeta', '후보 카드를 선택하면 📱 미리보기로 자동 연결됩니다.');
            return;
        }
        if (hasSelection()) {
            setText('flowSelectionTitle', '선택 완료 · 미리보기로 연결됨');
            setText('flowSelectionMeta', '파형·컷·편집·저장에서 이어서 다듬으세요.');
        }
    }
    function healBrokenFlow() {
        const current = activeTab();
        if (state.isAnalyzing) return;
        if (hasRecommendations() && !hasSelection() && current === 'recommend' && lastAutoTab !== 'candidates') {
            lastAutoTab = 'candidates';
            setTab('candidates', true);
            return;
        }
        if (hasSelection() && current === 'candidates' && lastAutoTab !== 'preview') {
            lastAutoTab = 'preview';
            setTab('preview', true);
        }
    }
    function tick() {
        raf = 0;
        normalizeClickableTabs();
        normalizeCandidateEmptyState();
        updateGuideText();
        healBrokenFlow();
        if (tabApi() && tabApi().scheduleSync) tabApi().scheduleSync();
    }
    function schedule() {
        if (raf) return;
        raf = requestAnimationFrame(tick);
    }
    function install() {
        normalizeClickableTabs();
        document.addEventListener('ai-shorts-flow-sync', () => { lastAutoTab = ''; schedule(); });
        document.addEventListener('click', event => {
            const tab = event.target && event.target.closest && event.target.closest('[data-flow-tab]');
            if (tab) {
                lastAutoTab = '';
                // Manual tab navigation should never force the page to the hero/top.
                schedule();
            }
            const card = event.target && event.target.closest && event.target.closest('.recommendation-card');
            if (card) {
                lastAutoTab = '';
                setTimeout(schedule, 60);
            }
        }, true);
        const observer = new MutationObserver(schedule);
        ['analysisStatus', 'recommendationCount', 'recommendationList', 'selectedRangeText', 'previewStatus', 'progressBar'].map(byId).filter(Boolean).forEach(node => {
            observer.observe(node, { attributes: true, childList: true, subtree: true, characterData: true });
        });
        global.addEventListener('resize', schedule, { passive: true });
        schedule();
    }
    global.AIShortsFlowDoctor = { schedule, healBrokenFlow, normalizeClickableTabs };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
    else install();
})(window);
