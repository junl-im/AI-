// AI Shorts Studio v1.3.1 - vector flow polish controller
'use strict';
(function bootFlowPolish(global) {
    const store = global.AIShortsAppState || {};
    const state = store.state || {};
    let raf = 0;
    let compareMode = false;
    let lastSyncSignature = '';

    function byId(id) { return document.getElementById(id); }
    function selectedRecommendation() {
        const list = Array.isArray(state.recommendations) ? state.recommendations : [];
        return list.find(item => item && item.id === state.selectedRecommendationId) || null;
    }
    function hasFile() { return Boolean(state.file); }
    function hasAnalysis() { return Boolean(state.audioAnalysis || state.motionAnalysis); }
    function hasRecommendations() { return Array.isArray(state.recommendations) && state.recommendations.length > 0; }
    function hasCaptions() { return Array.isArray(state.captions) && state.captions.length > 0; }
    function setTab(tab) {
        if (global.AIShortsHyperFlowTabs && global.AIShortsHyperFlowTabs.setActiveFlowTab) {
            global.AIShortsHyperFlowTabs.setActiveFlowTab(tab, { reveal: true, force: true });
        } else {
            document.body.dataset.activeFlowTab = tab;
        }
    }
    function setTabState(tab, status) {
        const desired = 'is-' + status;
        document.querySelectorAll('[data-flow-tab="' + tab + '"]').forEach(el => {
            const current = ['is-done', 'is-live', 'is-warn', 'is-idle'].find(name => el.classList.contains(name)) || '';
            if (current === desired) return;
            el.classList.remove('is-done', 'is-live', 'is-warn', 'is-idle');
            el.classList.add(desired);
        });
    }
    function updateTabBadges() {
        setTabState('file', hasFile() ? 'done' : 'live');
        setTabState('recommend', state.isAnalyzing ? 'live' : hasRecommendations() ? 'done' : hasAnalysis() ? 'warn' : 'idle');
        setTabState('candidates', selectedRecommendation() ? 'done' : hasRecommendations() ? 'live' : hasAnalysis() ? 'warn' : 'idle');
        setTabState('preview', selectedRecommendation() ? 'done' : hasRecommendations() ? 'warn' : 'idle');
        setTabState('waveform', selectedRecommendation() ? 'done' : hasRecommendations() ? 'warn' : 'idle');
        setTabState('cut', state.autoCuts ? 'done' : hasAnalysis() ? 'warn' : 'idle');
        setTabState('edit', selectedRecommendation() ? 'done' : 'idle');
        setTabState('export', selectedRecommendation() ? 'warn' : 'idle');
    }
    function updateSelectionSummary() {
        const selected = selectedRecommendation();
        const title = byId('flowSelectionTitle');
        const meta = byId('flowSelectionMeta');
        const icon = byId('flowSelectionIcon');
        const candidatesBtn = byId('flowGoCandidatesBtn');
        const previewBtn = byId('flowGoPreviewBtn');
        const exportBtn = byId('flowGoExportBtn');
        document.body.classList.toggle('has-selected-recommendation', Boolean(selected));
        document.body.classList.toggle('flow-autoplay-preview', Boolean(byId('autoplayPreviewToggle') && byId('autoplayPreviewToggle').checked));
        if (selected) {
            if (candidatesBtn) candidatesBtn.disabled = false;
            if (icon) { icon.textContent = ''; icon.classList.add('studio-icon'); icon.dataset.icon = 'check'; }
            if (title) title.textContent = selected.title || '선택 후보';
            if (meta) meta.textContent = `${selected.rangeText || ''} · ${Math.round(Number(selected.score) || 0)}점 · 미리보기/파형/저장으로 바로 연결됩니다.`;
            if (previewBtn) previewBtn.disabled = false;
            if (exportBtn) exportBtn.disabled = false;
        } else if (hasRecommendations()) {
            if (candidatesBtn) candidatesBtn.disabled = false;
            if (icon) { icon.textContent = ''; icon.classList.add('studio-icon'); icon.dataset.icon = 'candidates'; }
            if (title) title.textContent = '후보 카드를 선택하세요';
            if (meta) meta.textContent = '후보 탭에서 마음에 드는 구간을 누르면 미리보기로 자동 이동합니다.';
            if (previewBtn) previewBtn.disabled = true;
            if (exportBtn) exportBtn.disabled = true;
        } else if (state.isAnalyzing) {
            if (candidatesBtn) candidatesBtn.disabled = true;
            if (icon) { icon.textContent = ''; icon.classList.add('studio-icon'); icon.dataset.icon = 'render'; }
            if (title) title.textContent = '자동 분석 중입니다';
            if (meta) meta.textContent = '분석이 끝나면 추천 탭으로 연결됩니다.';
            if (previewBtn) previewBtn.disabled = true;
            if (exportBtn) exportBtn.disabled = true;
        } else if (hasAnalysis()) {
            if (candidatesBtn) candidatesBtn.disabled = true;
            if (icon) { icon.textContent = ''; icon.classList.add('studio-icon'); icon.dataset.icon = 'spark'; }
            if (title) title.textContent = '추천 생성만 누르면 후보가 나옵니다';
            if (meta) meta.textContent = '추천 탭에서 후보 길이와 스타일을 확인한 뒤 생성하세요.';
            if (previewBtn) previewBtn.disabled = true;
            if (exportBtn) exportBtn.disabled = true;
        } else {
            if (candidatesBtn) candidatesBtn.disabled = true;
            if (icon) { icon.textContent = ''; icon.classList.add('studio-icon'); icon.dataset.icon = 'upload'; }
            if (title) title.textContent = '원본을 불러오면 자동 분석합니다';
            if (meta) meta.textContent = '원본 불러오기 → 자동 분석 → 추천 생성 → 후보 선택 → 미리보기';
            if (previewBtn) previewBtn.disabled = true;
            if (exportBtn) exportBtn.disabled = true;
        }
    }
    function updateCompareMode() {
        const list = byId('recommendationList');
        const btn = byId('compareModeBtn');
        if (list) list.classList.toggle('recommendations-compare', compareMode);
        if (btn) {
            btn.setAttribute('aria-pressed', compareMode ? 'true' : 'false');
            btn.textContent = compareMode ? '기본 보기' : '비교 모드'; btn.dataset.icon = compareMode ? 'retry' : 'compare';
        }
    }
    function scheduleSync() {
        if (raf) return;
        raf = requestAnimationFrame(() => {
            raf = 0;
            const autoToggle = byId('autoplayPreviewToggle');
            const signature = [hasFile(), hasAnalysis(), hasRecommendations(), state.isAnalyzing, state.selectedRecommendationId || '', Boolean(state.autoCuts), compareMode, Boolean(autoToggle && autoToggle.checked)].join('|');
            if (signature === lastSyncSignature) return;
            lastSyncSignature = signature;
            updateTabBadges();
            updateSelectionSummary();
            updateCompareMode();
        });
    }
    function install() {
        const compareBtn = byId('compareModeBtn');
        if (compareBtn) compareBtn.addEventListener('click', () => {
            compareMode = !compareMode;
            if (global.AIShortsFeedbackUX && global.AIShortsFeedbackUX.vibrate) global.AIShortsFeedbackUX.vibrate('select');
            scheduleSync();
        });
        const autoToggle = byId('autoplayPreviewToggle');
        if (autoToggle) autoToggle.addEventListener('change', scheduleSync);
        const goRecommend = byId('flowGoRecommendBtn');
        const goCandidates = byId('flowGoCandidatesBtn');
        const goPreview = byId('flowGoPreviewBtn');
        const goExport = byId('flowGoExportBtn');
        if (goRecommend) goRecommend.addEventListener('click', () => setTab('recommend'));
        if (goCandidates) goCandidates.addEventListener('click', () => setTab('candidates'));
        if (goPreview) goPreview.addEventListener('click', () => setTab('preview'));
        if (goExport) goExport.addEventListener('click', () => setTab('export'));
        const observer = new MutationObserver(scheduleSync);
        ['recommendationList', 'recommendationCount', 'analysisStatus', 'previewStatus', 'captionStatus', 'renderQueueStatus'].map(byId).filter(Boolean).forEach(node => observer.observe(node, { attributes: true, childList: true, subtree: true, characterData: true }));
        global.addEventListener('resize', scheduleSync, { passive: true });
        scheduleSync();
    }
    global.AIShortsFlowPolish = { scheduleSync, updateSelectionSummary, updateTabBadges };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
    else install();
})(window);
