// AI Shorts Studio v1.0.5 - flow integrity hotfix guard
'use strict';
(function bootFlowHotfix(global) {
    const store = global.AIShortsAppState || {};
    const state = store.state || {};
    let lastRecommendationCount = 0;
    let lastSelectedId = '';
    function countRecommendations() {
        return Array.isArray(state.recommendations) ? state.recommendations.length : 0;
    }
    function setTab(tab) {
        if (global.AIShortsHyperFlowTabs && global.AIShortsHyperFlowTabs.setActiveFlowTab) {
            global.AIShortsHyperFlowTabs.setActiveFlowTab(tab, { scroll: false });
        } else if (document && document.body) {
            document.body.dataset.activeFlowTab = tab;
        }
    }
    function sync() {
        const count = countRecommendations();
        const selected = state.selectedRecommendationId || '';
        if (count > 0 && lastRecommendationCount === 0 && !selected) {
            setTab('candidates');
        }
        if (selected && selected !== lastSelectedId) {
            setTab('preview');
        }
        lastRecommendationCount = count;
        lastSelectedId = selected;
    }
    function install() {
        document.addEventListener('click', function (event) {
            const tab = event.target && event.target.closest && event.target.closest('[data-flow-tab]');
            if (tab && tab.tagName !== 'LABEL') {
                // 탭 버튼은 브라우저 기본 동작이나 상단 스크롤을 만들지 않습니다.
                event.preventDefault();
            }
        }, true);
        const observer = new MutationObserver(sync);
        ['recommendationList','recommendationCount','previewStatus','analysisStatus'].map(id => document.getElementById(id)).filter(Boolean).forEach(node => observer.observe(node, { childList: true, subtree: true, attributes: true, characterData: true }));
        window.addEventListener('resize', sync, { passive: true });
        document.addEventListener('ai-shorts-flow-sync', sync);
        sync();
    }
    global.AIShortsFlowHotfix = { sync, setTab };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
    else install();
})(window);
