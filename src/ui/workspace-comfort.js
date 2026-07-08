// AI Shorts Studio v1.0.5 - workspace comfort controller
'use strict';
(function bootWorkspaceComfort(global) {
    const store = global.AIShortsAppState || {};
    const state = store.state || {};
    const PANEL_LABELS = {
        file: '파일 열기',
        recommend: '추천 생성',
        candidates: '후보 선택',
        preview: '미리보기',
        waveform: '파형',
        cut: '자동 컷',
        edit: '편집',
        export: '저장'
    };
    let revealTimer = 0;
    let decorateTimer = 0;

    function byId(id) { return document.getElementById(id); }
    function activeTab() { return document.body && document.body.dataset ? document.body.dataset.activeFlowTab || 'file' : 'file'; }
    function panels() { return Array.from(document.querySelectorAll('[data-flow-panel]')); }
    function panelFor(tab) {
        const key = tab || activeTab();
        return panels().find(panel => String(panel.getAttribute('data-flow-panel') || '').split(/\s+/).includes(key)) || null;
    }
    function dockHeight() {
        const dock = byId('bottomDock');
        if (!dock || !dock.getBoundingClientRect) return 0;
        return Math.max(0, dock.getBoundingClientRect().height || 0);
    }
    function toast(message, kind) {
        const node = byId('toast');
        if (!node) return;
        if (global.AIShortsFeedbackUX && global.AIShortsFeedbackUX.setToastKind) {
            global.AIShortsFeedbackUX.setToastKind(node, kind || 'action');
        }
        node.textContent = message;
        node.classList.add('toast-visible');
        clearTimeout(node._workspaceComfortTimer);
        node._workspaceComfortTimer = setTimeout(() => node.classList.remove('toast-visible'), 2200);
    }
    function reveal(tab, options) {
        const opts = options || {};
        const key = tab || activeTab();
        const panel = panelFor(key);
        if (!panel || !global.requestAnimationFrame) return;
        global.requestAnimationFrame(() => {
            const rect = panel.getBoundingClientRect && panel.getBoundingClientRect();
            if (!rect) return;
            const topOffset = Number(opts.offset) || 14;
            const target = Math.max(0, global.scrollY + rect.top - topOffset);
            const behavior = opts.instant ? 'auto' : 'smooth';
            if (Math.abs(global.scrollY - target) > 6) global.scrollTo({ top: target, behavior });
            panel.classList.remove('is-workspace-revealed');
            // Force reflow to replay pulse in a controlled way.
            void panel.offsetWidth;
            panel.classList.add('is-workspace-revealed');
            clearTimeout(revealTimer);
            revealTimer = setTimeout(() => panel.classList.remove('is-workspace-revealed'), 1250);
            try { panel.focus({ preventScroll: true }); } catch (error) { /* no-op */ }
        });
    }
    function decorateCards() {
        clearTimeout(decorateTimer);
        decorateTimer = setTimeout(() => {
            document.querySelectorAll('.recommendation-card').forEach((card, index) => {
                card.setAttribute('role', 'button');
                card.setAttribute('aria-label', `${index + 1}번 후보 선택 후 미리보기로 이동`);
                card.classList.add('is-selectable-candidate');
            });
            const list = byId('recommendationList');
            if (list) {
                const count = list.querySelectorAll('.recommendation-card').length;
                list.dataset.candidateCount = String(count);
                list.classList.toggle('has-candidates', count > 0);
            }
        }, 0);
    }
    function stabilizeGuide() {
        const guide = byId('recommendFlowGuide');
        if (guide) {
            guide.classList.add('is-stable-guide');
            if (Array.isArray(state.recommendations) && state.recommendations.length && !state.selectedRecommendationId) {
                guide.innerHTML = '<span>1</span> 마음에 드는 후보 카드를 누르면 <b>미리보기 탭</b>으로 바로 이동합니다.';
            }
        }
    }
    function syncPanelLabels() {
        const title = byId('hyperflowStageTitle');
        const active = activeTab();
        if (document.body) document.body.dataset.workspaceComfort = 'ready';
        if (title && PANEL_LABELS[active]) title.dataset.currentPanel = PANEL_LABELS[active];
    }
    function handleTabClick(event) {
        const tab = event.target && event.target.closest && event.target.closest('[data-flow-tab]');
        if (!tab) return;
        const key = tab.getAttribute('data-flow-tab') || 'file';
        // Let the existing tab controller decide state/disabled rules, then reveal the resulting panel.
        setTimeout(() => reveal(key, { offset: 14, force: true }), key === 'file' ? 80 : 30);
    }
    function handleCandidateClick(event) {
        const card = event.target && event.target.closest && event.target.closest('.recommendation-card');
        if (!card) return;
        setTimeout(() => reveal('preview', { offset: 14, force: true }), 140);
    }
    function handleFlowSync() {
        decorateCards();
        stabilizeGuide();
        syncPanelLabels();
    }
    function installObservers() {
        const list = byId('recommendationList');
        if (list && global.MutationObserver) {
            const observer = new MutationObserver(handleFlowSync);
            observer.observe(list, { childList: true, subtree: true, attributes: true });
        }
        ['recommendationCount', 'previewStatus', 'selectedRangeText', 'analysisStatus'].map(byId).filter(Boolean).forEach(node => {
            if (!global.MutationObserver) return;
            const observer = new MutationObserver(handleFlowSync);
            observer.observe(node, { childList: true, subtree: true, characterData: true, attributes: true });
        });
    }
    function install() {
        document.addEventListener('click', handleTabClick, false);
        document.addEventListener('click', handleCandidateClick, false);
        document.addEventListener('ai-shorts-flow-sync', handleFlowSync);
        global.addEventListener('resize', () => setTimeout(() => reveal(activeTab(), { instant: true }), 80), { passive: true });
        installObservers();
        handleFlowSync();
    }
    global.AIShortsWorkspaceComfort = Object.freeze({ reveal, decorateCards, stabilizeGuide, dockHeight });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
    else install();
})(window);
