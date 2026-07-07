// AI Shorts Studio v0.3.0 - convenience controls and workflow polish
'use strict';

(function bootAIShortsUxControls(global) {
    const store = global.AIShortsAppState || {};
    const state = store.state || {};

    const ids = {
        durationSelect: 'durationSelect',
        quickDurationChips: 'quickDurationChips',
        analyzeBtn: 'analyzeBtn',
        exportBtn: 'exportBtn',
        previewBtn: 'previewBtn',
        heroAnalyzeBtn: 'heroAnalyzeBtn',
        mobileAnalyzeBtn: 'mobileAnalyzeBtn',
        mobilePreviewBtn: 'mobilePreviewBtn',
        mobileExportBtn: 'mobileExportBtn',
        dockPreviewBtn: 'dockPreviewBtn',
        dockExportBtn: 'dockExportBtn',
        dockTitle: 'dockTitle',
        dockMeta: 'dockMeta',
        dockStatusDot: 'dockStatusDot',
        rangeStartInput: 'rangeStartInput',
        rangeEndInput: 'rangeEndInput',
        applyRangeBtn: 'applyRangeBtn',
        stepImport: 'stepImport',
        stepAnalyze: 'stepAnalyze',
        stepEdit: 'stepEdit',
        stepExport: 'stepExport',
        selectedBadge: 'selectedBadge',
        recommendationCount: 'recommendationCount',
        previewStatus: 'previewStatus'
    };
    const els = {};

    function uxById(id) {
        return document.getElementById(id);
    }

    function uxCollectElements() {
        Object.keys(ids).forEach(key => { els[key] = uxById(ids[key]); });
    }

    function uxClickWhenEnabled(target) {
        if (!target || target.disabled) return;
        target.click();
    }

    function uxSetButtonMirror(mirror, source) {
        if (!mirror || !source) return;
        mirror.disabled = Boolean(source.disabled);
        mirror.setAttribute('aria-disabled', mirror.disabled ? 'true' : 'false');
    }

    function uxSetWorkflowClass(element, isActive, isDone) {
        if (!element) return;
        element.classList.toggle('is-active', Boolean(isActive));
        element.classList.toggle('is-done', Boolean(isDone));
    }

    function uxSelectedRecommendation() {
        const recommendations = Array.isArray(state.recommendations) ? state.recommendations : [];
        return recommendations.find(item => item && item.id === state.selectedRecommendationId) || null;
    }

    function uxSyncDurationChips() {
        if (!els.quickDurationChips || !els.durationSelect) return;
        const current = String(els.durationSelect.value || 'auto');
        Array.from(els.quickDurationChips.querySelectorAll('[data-duration]')).forEach(button => {
            button.classList.toggle('is-selected', String(button.dataset.duration) === current);
        });
    }

    function uxUpdateDock() {
        const hasFile = Boolean(state.file);
        const selected = uxSelectedRecommendation();
        const hasExport = Boolean(state.exportInfo);
        if (els.dockTitle) {
            if (!hasFile) els.dockTitle.textContent = '원본 파일을 열어주세요';
            else if (!selected) els.dockTitle.textContent = state.file && state.file.name ? state.file.name : '분석 준비 완료';
            else els.dockTitle.textContent = selected.title || '선택된 추천 구간';
        }
        if (els.dockMeta) {
            if (!hasFile) els.dockMeta.textContent = '파일 열기 버튼으로 노래 또는 영상을 선택하세요.';
            else if (!selected) els.dockMeta.textContent = '분석하고 추천받기를 누르면 후보 카드가 생성됩니다.';
            else els.dockMeta.textContent = `${selected.rangeText || ''} · 점수 ${Math.round(Number(selected.score) || 0)} · 바로 미리보기/내보내기 가능`;
        }
        if (els.dockStatusDot) {
            els.dockStatusDot.classList.toggle('is-ready', Boolean(selected));
            els.dockStatusDot.classList.toggle('is-export', hasExport);
        }
    }

    function uxUpdateWorkflow() {
        const hasFile = Boolean(state.file);
        const hasRecommendations = Boolean(state.recommendations && state.recommendations.length);
        const hasSelected = Boolean(uxSelectedRecommendation());
        const hasExport = Boolean(state.exportInfo);
        uxSetWorkflowClass(els.stepImport, !hasFile, hasFile);
        uxSetWorkflowClass(els.stepAnalyze, hasFile && !hasRecommendations, hasRecommendations);
        uxSetWorkflowClass(els.stepEdit, hasRecommendations && !hasExport, hasSelected && hasExport);
        uxSetWorkflowClass(els.stepExport, hasExport, false);
    }

    function uxSyncMirrors() {
        uxSetButtonMirror(els.heroAnalyzeBtn, els.analyzeBtn);
        uxSetButtonMirror(els.mobileAnalyzeBtn, els.analyzeBtn);
        uxSetButtonMirror(els.mobilePreviewBtn, els.previewBtn);
        uxSetButtonMirror(els.mobileExportBtn, els.exportBtn);
        uxSetButtonMirror(els.dockPreviewBtn, els.previewBtn);
        uxSetButtonMirror(els.dockExportBtn, els.exportBtn);
    }

    function uxSyncAll() {
        uxSyncMirrors();
        uxSyncDurationChips();
        uxUpdateDock();
        uxUpdateWorkflow();
    }

    function uxInstallQuickDurations() {
        if (!els.quickDurationChips || !els.durationSelect) return;
        els.quickDurationChips.addEventListener('click', event => {
            const button = event.target && event.target.closest('[data-duration]');
            if (!button) return;
            els.durationSelect.value = button.dataset.duration || 'auto';
            els.durationSelect.dispatchEvent(new Event('change', { bubbles: true }));
            uxSyncAll();
        });
    }

    function uxInstallMirrorButtons() {
        if (els.heroAnalyzeBtn) els.heroAnalyzeBtn.addEventListener('click', () => uxClickWhenEnabled(els.analyzeBtn));
        if (els.mobileAnalyzeBtn) els.mobileAnalyzeBtn.addEventListener('click', () => uxClickWhenEnabled(els.analyzeBtn));
        if (els.mobilePreviewBtn) els.mobilePreviewBtn.addEventListener('click', () => uxClickWhenEnabled(els.previewBtn));
        if (els.mobileExportBtn) els.mobileExportBtn.addEventListener('click', () => uxClickWhenEnabled(els.exportBtn));
        if (els.dockPreviewBtn) els.dockPreviewBtn.addEventListener('click', () => uxClickWhenEnabled(els.previewBtn));
        if (els.dockExportBtn) els.dockExportBtn.addEventListener('click', () => uxClickWhenEnabled(els.exportBtn));
    }

    function uxInstallNudgeControls() {
        document.addEventListener('click', event => {
            const button = event.target && event.target.closest('[data-nudge]');
            if (!button || !els.rangeStartInput || !els.rangeEndInput) return;
            const parts = String(button.dataset.nudge || '').split(':');
            const target = parts[0];
            const delta = Number(parts[1]) || 0;
            const input = target === 'end' ? els.rangeEndInput : els.rangeStartInput;
            const next = Math.max(0, (Number(input.value) || 0) + delta);
            input.value = next.toFixed(1);
            if (els.applyRangeBtn && !els.applyRangeBtn.disabled) els.applyRangeBtn.click();
            uxSyncAll();
        });
    }

    function uxInstallKeyboardShortcuts() {
        document.addEventListener('keydown', event => {
            const tag = event.target && event.target.tagName ? event.target.tagName.toLowerCase() : '';
            if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
            if (event.key === ' ' && els.previewBtn && !els.previewBtn.disabled) {
                event.preventDefault();
                els.previewBtn.click();
            }
            if ((event.key === 'e' || event.key === 'E') && els.exportBtn && !els.exportBtn.disabled) {
                event.preventDefault();
                els.exportBtn.click();
            }
        });
    }

    function uxInstallObservers() {
        const observer = new MutationObserver(uxSyncAll);
        [els.analyzeBtn, els.previewBtn, els.exportBtn, els.selectedBadge, els.recommendationCount, els.previewStatus].forEach(node => {
            if (node) observer.observe(node, { attributes: true, childList: true, subtree: true, characterData: true });
        });
        setInterval(uxSyncAll, 700);
    }

    function uxInit() {
        uxCollectElements();
        uxInstallQuickDurations();
        uxInstallMirrorButtons();
        uxInstallNudgeControls();
        uxInstallKeyboardShortcuts();
        uxInstallObservers();
        uxSyncAll();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', uxInit);
    else uxInit();
})(window);
