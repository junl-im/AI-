
// AI Shorts Studio v1.0.2 - HyperConnect tab workflow controller with stable panel reveal
'use strict';
(function bootHyperFlowTabs(global) {
    const store = global.AIShortsAppState || {};
    const state = store.state || {};
    const ORDER = ['file', 'recommend', 'candidates', 'preview', 'waveform', 'cut', 'edit', 'export'];
    const META = {
        file: ['📂', '파일 열기', '파일을 열면 자동 분석이 시작됩니다.'],
        recommend: ['✨', '추천 생성', '분석 결과로 쇼츠 후보를 생성합니다.'],
        candidates: ['👆', '후보 선택', '마음에 드는 구간을 고르면 미리보기로 연결됩니다.'],
        preview: ['📱', '미리보기', '선택한 후보의 세로 화면을 확인합니다.'],
        waveform: ['〰️', '파형', '시작/끝과 컷 마커를 맞춥니다.'],
        cut: ['✂️', '자동 컷', '비트·장면·무음 회피 포인트를 확인합니다.'],
        edit: ['🎛️', '편집', '구간, 템플릿, 수동 조정을 관리합니다.'],
        caption: ['💬', '자막', '자막 스타일과 싱크를 다듬습니다.'],
        export: ['⬇️', '저장', '썸네일과 쇼츠 결과물을 저장합니다.'],
        project: ['🗂️', '프로젝트', '작업 JSON과 카피를 관리합니다.']
    };
    let active = 'file';
    let raf = 0;

    function byId(id) { return document.getElementById(id); }
    function tabs() { return Array.from(document.querySelectorAll('[data-flow-tab]')); }
    function panels() { return Array.from(document.querySelectorAll('[data-flow-panel]')); }
    function getPanelForTab(tab) {
        return panels().find(panel => {
            const value = String(panel.getAttribute('data-flow-panel') || '');
            return value.split(/\s+/).includes(tab);
        }) || null;
    }
    function revealActivePanel(tab, options) {
        const opts = options || {};
        if (opts.reveal === false) return;
        const panel = getPanelForTab(tab);
        if (!panel || !global || !global.requestAnimationFrame) return;
        global.requestAnimationFrame(() => {
            const dock = byId('bottomDock');
            const dockRect = dock && dock.getBoundingClientRect ? dock.getBoundingClientRect() : null;
            const panelRect = panel.getBoundingClientRect ? panel.getBoundingClientRect() : null;
            if (!panelRect) return;
            const topGuard = 10;
            const bottomGuard = dockRect ? Math.max(120, global.innerHeight - dockRect.height - 14) : Math.max(260, global.innerHeight - 130);
            const alreadyComfortable = panelRect.top >= topGuard && panelRect.top <= bottomGuard && panelRect.bottom > 120;
            if (alreadyComfortable) return;
            const absoluteTop = global.scrollY + panelRect.top;
            const target = Math.max(0, absoluteTop - topGuard);
            // Never jump to the document top for tab switching. Reveal the active workspace panel only.
            if (Math.abs(global.scrollY - target) > 8) {
                global.scrollTo({ top: target, behavior: opts.instant ? 'auto' : 'smooth' });
            }
        });
    }
    function hasRecommendations() { return Array.isArray(state.recommendations) && state.recommendations.length > 0; }
    function hasAnalysis() { return Boolean(state.audioAnalysis || state.motionAnalysis); }
    function hasSelection() { return Boolean(state.selectedRecommendationId); }
    function isDisabled(tab) {
        if (tab === 'file') return false;
        if (tab === 'recommend') return !hasAnalysis() && !state.isAnalyzing && !state.file;
        if (tab === 'candidates') return !hasRecommendations();
        if (tab === 'preview' || tab === 'waveform' || tab === 'cut' || tab === 'edit' || tab === 'export') return !hasRecommendations();
        return false;
    }
    function updateStage(tab) {
        const meta = META[tab] || META.file;
        const icon = byId('hyperflowStageIcon');
        const title = byId('hyperflowStageTitle');
        const small = byId('hyperflowStageMeta');
        if (icon) icon.textContent = meta[0];
        if (title) {
            if (state.isAnalyzing) title.textContent = '자동 분석 중입니다';
            else if (tab === 'recommend' && hasAnalysis() && !hasRecommendations()) title.textContent = '분석 완료 · 추천을 생성하세요';
            else if (tab === 'candidates' && hasRecommendations() && !hasSelection()) title.textContent = '후보를 선택하세요';
            else title.textContent = meta[1];
        }
        if (small) {
            if (!state.file) small.textContent = '하단 Dock의 📂 파일 탭에서 원본을 열어주세요.';
            else if (state.isAnalyzing) small.textContent = '파일을 읽고 오디오·영상·컷 엔진을 자동으로 돌리는 중입니다.';
            else if (tab === 'recommend' && hasAnalysis() && !hasRecommendations()) small.textContent = '추천 탭의 ✨ 추천 생성 버튼 하나만 사용하면 됩니다.';
            else if (tab === 'candidates' && hasRecommendations() && !hasSelection()) small.textContent = '카드를 누르면 선택 즉시 미리보기 탭으로 이동합니다.';
            else small.textContent = meta[2];
        }
    }
    function syncExportMirrors() {
        const map = [
            ['flowPreviewBtn', 'previewBtn'],
            ['flowThumbnailBtn', 'thumbnailBtn'],
            ['flowExportBtn', 'exportBtn'],
            ['flowExportAllBtn', 'exportAllBtn']
        ];
        map.forEach(([mirrorId, sourceId]) => {
            const mirror = byId(mirrorId);
            const source = byId(sourceId);
            if (!mirror || !source) return;
            mirror.disabled = Boolean(source.disabled);
        });
    }
    function syncTabs() {
        tabs().forEach(tab => {
            const key = tab.getAttribute('data-flow-tab');
            const disabled = isDisabled(key);
            tab.classList.toggle('is-active', key === active);
            tab.classList.toggle('is-disabled', disabled);
            tab.setAttribute('aria-selected', key === active ? 'true' : 'false');
            tab.setAttribute('aria-disabled', disabled ? 'true' : 'false');
        });
        document.body.dataset.activeFlowTab = active;
        updateStage(active);
        syncExportMirrors();
    }
    function setActiveFlowTab(tab, options) {
        const next = ORDER.includes(tab) || tab === 'project' ? tab : 'file';
        const opts = options || {};
        active = next;
        document.body.dataset.activeFlowTab = active;
        syncTabs();
        revealActivePanel(active, opts);
        if (global.AIShortsFeedbackUX && global.AIShortsFeedbackUX.vibrate) global.AIShortsFeedbackUX.vibrate('button');
    }
    function scheduleSync() {
        if (raf) return;
        raf = requestAnimationFrame(() => { raf = 0; syncTabs(); });
    }
    function install() {
        tabs().forEach(tab => {
            tab.addEventListener('click', event => {
                const key = tab.getAttribute('data-flow-tab');
                if (!key) return;
                if (tab.tagName !== 'LABEL') event.preventDefault();
                if (isDisabled(key)) {
                    if (global.AIShortsFeedbackUX && global.AIShortsFeedbackUX.vibrate) global.AIShortsFeedbackUX.vibrate('warning');
                    return;
                }
                setActiveFlowTab(key, { reveal: false });
            });
        });
        const analyzeBtn = byId('analyzeBtn');
        // v0.9.7: 추천 생성은 추천 탭 안의 단일 버튼만 사용합니다.
        [
            ['flowPreviewBtn', 'previewBtn'],
            ['flowThumbnailBtn', 'thumbnailBtn'],
            ['flowExportBtn', 'exportBtn'],
            ['flowExportAllBtn', 'exportAllBtn']
        ].forEach(([mirrorId, sourceId]) => {
            const mirror = byId(mirrorId);
            const source = byId(sourceId);
            if (mirror && source) mirror.addEventListener('click', () => { if (!source.disabled) source.click(); });
        });
        const observer = new MutationObserver(scheduleSync);
        ['analyzeBtn','previewBtn','thumbnailBtn','exportBtn','exportAllBtn','analysisStatus','recommendationCount'].map(byId).filter(Boolean).forEach(node => observer.observe(node, { attributes: true, childList: true, subtree: true, characterData: true }));
        global.addEventListener('resize', scheduleSync, { passive: true });
        syncTabs();
    }
    global.AIShortsHyperFlowTabs = { setActiveFlowTab, syncTabs, scheduleSync, revealActivePanel };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
    else install();
})(window);
