// AI Shorts Studio v1.2.1 - flow integrity runtime guard without observer feedback loops
'use strict';
(function bootFlowIntegrity(global) {
    const store = global.AIShortsAppState || {};
    const state = store.state || {};
    const ORDER = ['file', 'recommend', 'candidates', 'preview', 'waveform', 'cut', 'edit', 'export'];
    let raf = 0;
    function byId(id) { return document.getElementById(id); }
    function setTextIfChanged(node, value) {
        if (node && node.textContent !== value) node.textContent = value;
    }
    function setAttrIfChanged(node, name, value) {
        if (node && node.getAttribute(name) !== value) node.setAttribute(name, value);
    }
    function hasRecommendations() { return Array.isArray(state.recommendations) && state.recommendations.length > 0; }
    function hasSelection() { return Boolean(state.selectedRecommendationId); }
    function setTab(tab, options) {
        if (!ORDER.includes(tab)) return;
        if (global.AIShortsHyperFlowTabs && global.AIShortsHyperFlowTabs.setActiveFlowTab) {
            global.AIShortsHyperFlowTabs.setActiveFlowTab(tab, Object.assign({ reveal: true }, options || {}));
        } else if (document && document.body) {
            document.body.dataset.activeFlowTab = tab;
        }
    }
    function normalizeDom() {
        const actions = document.querySelector('.flow-selection-actions');
        if (actions) {
            if (!actions.hidden) actions.hidden = true;
            setAttrIfChanged(actions, 'aria-hidden', 'true');
        }
        document.querySelectorAll('.action-dock').forEach(node => setAttrIfChanged(node, 'aria-hidden', 'true'));
        const tabs = ORDER.map(key => document.querySelector('[data-flow-tab="' + key + '"]')).filter(Boolean);
        tabs.forEach((tab, index) => {
            setAttrIfChanged(tab, 'aria-posinset', String(index + 1));
            setAttrIfChanged(tab, 'aria-setsize', String(ORDER.length));
        });
    }
    function syncFlow() {
        raf = 0;
        normalizeDom();
        const count = hasRecommendations() ? state.recommendations.length : 0;
        const recCount = byId('recommendationCount');
        setTextIfChanged(recCount, count ? `${count}개 · 후보 카드를 선택하세요` : '0개 · 추천 생성 후 여기서 고르세요');
        document.body.classList.toggle('flow-ready-candidates', count > 0 && !hasSelection());
        document.body.classList.toggle('flow-ready-preview', hasSelection());
    }
    function scheduleSync() {
        if (raf) return;
        raf = global.requestAnimationFrame ? global.requestAnimationFrame(syncFlow) : setTimeout(syncFlow, 0);
    }
    function install() {
        normalizeDom();
        document.addEventListener('click', event => {
            const card = event.target && event.target.closest && event.target.closest('.recommendation-card');
            if (card) scheduleSync();
            const tab = event.target && event.target.closest && event.target.closest('[data-flow-tab]');
            if (tab && tab.tagName !== 'LABEL') event.preventDefault();
        }, true);
        const observer = new MutationObserver(scheduleSync);
        ['recommendationList', 'recommendationCount', 'previewStatus', 'analysisStatus', 'flowSelectionSummary'].map(byId).filter(Boolean).forEach(node => observer.observe(node, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class', 'disabled', 'aria-disabled'] }));
        document.addEventListener('ai-shorts-flow-sync', scheduleSync);
        global.addEventListener('resize', scheduleSync, { passive: true });
        scheduleSync();
    }
    global.AIShortsFlowIntegrity = Object.freeze({ setTab, scheduleSync, normalizeDom });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
    else install();
})(window);
