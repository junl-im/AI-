
// AI Shorts Studio v1.2.8 - stable vector menu bar workflow controller
'use strict';
(function bootHyperFlowTabs(global) {
    const store = global.AIShortsAppState || {};
    const state = store.state || {};
    const ORDER = ['file', 'recommend', 'candidates', 'preview', 'waveform', 'cut', 'edit', 'export'];
    const META = {
        file: ['upload', '파일 열기', '파일을 열면 자동 분석이 시작됩니다.'],
        recommend: ['spark', '추천 생성', '분석 결과로 쇼츠 후보를 생성합니다.'],
        candidates: ['candidates', '후보 선택', '마음에 드는 구간을 고르면 미리보기로 연결됩니다.'],
        preview: ['preview', '미리보기', '선택한 후보의 세로 화면을 확인합니다.'],
        waveform: ['waveform', '파형', '시작/끝과 컷 마커를 맞춥니다.'],
        cut: ['cut', '자동 컷', '비트·장면·무음 회피 포인트를 확인합니다.'],
        edit: ['edit', '편집', '구간, 템플릿, 수동 조정을 관리합니다.'],
        caption: ['caption', '자막', '자막 스타일과 싱크를 다듬습니다.'],
        export: ['export', '저장', '썸네일과 쇼츠 결과물을 저장합니다.'],
        project: ['project', '프로젝트', '작업 JSON과 카피를 관리합니다.']
    };
    let active = 'file';
    let raf = 0;

    function byId(id) { return document.getElementById(id); }
    function setTextIfChanged(node, value) { if (node && node.textContent !== value) node.textContent = value; }
    function setAttrIfChanged(node, name, value) { if (node && node.getAttribute(name) !== value) node.setAttribute(name, value); }
    function setDisabledIfChanged(node, value) { const next = Boolean(value); if (node && node.disabled !== next) node.disabled = next; }
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
        if (global.AIShortsMotionStability && global.AIShortsMotionStability.reveal) {
            // Compatibility note: stable reveal still honors the old comfortable-panel guard semantics.
            // if (alreadyComfortable && !opts.force) return;
            global.AIShortsMotionStability.reveal(tab, { source: 'hyperflow-tabs', force: opts.force, instant: true });
            return;
        }
        const panel = getPanelForTab(tab);
        if (!panel || !global || !global.requestAnimationFrame) return;
        global.requestAnimationFrame(() => {
            const panelRect = panel.getBoundingClientRect ? panel.getBoundingClientRect() : null;
            if (!panelRect) return;
            const target = Math.max(0, global.scrollY + panelRect.top - 18);
            if (Math.abs(global.scrollY - target) > 12) global.scrollTo({ top: target, behavior: 'auto' });
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
        if (icon) { setTextIfChanged(icon, ''); icon.classList.add('studio-icon'); if (icon.dataset.icon !== meta[0]) icon.dataset.icon = meta[0]; }
        if (title) {
            const titleText = state.isAnalyzing ? '자동 분석 중입니다'
                : tab === 'recommend' && hasAnalysis() && !hasRecommendations() ? '분석 완료 · 추천을 생성하세요'
                    : tab === 'candidates' && hasRecommendations() && !hasSelection() ? '후보를 선택하세요' : meta[1];
            setTextIfChanged(title, titleText);
        }
        if (small) {
            const smallText = !state.file ? '하단 메뉴바의 파일 열기에서 원본을 선택해주세요.'
                : state.isAnalyzing ? '파일을 읽고 오디오·영상·컷 엔진을 자동으로 돌리는 중입니다.'
                    : tab === 'recommend' && hasAnalysis() && !hasRecommendations() ? '추천 메뉴의 추천 생성 버튼을 누르면 됩니다.'
                        : tab === 'candidates' && hasRecommendations() && !hasSelection() ? '카드를 누르면 선택 즉시 미리보기로 이동합니다.' : meta[2];
            setTextIfChanged(small, smallText);
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
            setDisabledIfChanged(mirror, source.disabled);
        });
    }
    function syncTabs() {
        const requested = document.body && document.body.dataset ? document.body.dataset.activeFlowTab : '';
        if ((ORDER.includes(requested) || requested === 'project') && requested !== active) active = requested;
        tabs().forEach(tab => {
            const key = tab.getAttribute('data-flow-tab');
            const disabled = isDisabled(key);
            tab.classList.toggle('is-active', key === active);
            tab.classList.toggle('is-disabled', disabled);
            setAttrIfChanged(tab, 'aria-selected', key === active ? 'true' : 'false');
            setAttrIfChanged(tab, 'aria-disabled', disabled ? 'true' : 'false');
        });
        if (document.body.dataset.activeFlowTab !== active) document.body.dataset.activeFlowTab = active;
        updateStage(active);
        syncExportMirrors();
    }
    function setActiveFlowTab(tab, options) {
        const next = ORDER.includes(tab) || tab === 'project' ? tab : 'file';
        const opts = options || {};
        active = next;
        if (document.body.dataset.activeFlowTab !== active) document.body.dataset.activeFlowTab = active;
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
                setActiveFlowTab(key, { reveal: true, force: true });
            });
        });
        // 메뉴바 항목은 누른 즉시 해당 작업 패널을 화면 상단으로 표시합니다.
        // 추천 생성은 추천 탭 안의 단일 버튼만 사용합니다.
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
