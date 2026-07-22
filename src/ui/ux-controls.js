// AI Shorts Studio v1.2.1 - event-driven convenience controls and workflow polish
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
    let syncRaf = 0;

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
        const disabled = Boolean(source.disabled);
        if (mirror.disabled !== disabled) mirror.disabled = disabled;
        mirror.setAttribute('aria-disabled', disabled ? 'true' : 'false');
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

    function uxSetText(node, text) {
        if (node && node.textContent !== text) node.textContent = text;
    }

    function uxUpdateDock() {
        const hasFile = Boolean(state.file);
        const selected = uxSelectedRecommendation();
        const hasExport = Boolean(state.exportInfo);
        if (!hasFile) {
            uxSetText(els.dockTitle, '원본을 불러와주세요');
            uxSetText(els.dockMeta, '불러오기 메뉴에서 노래 또는 영상을 한 번 선택하세요.');
        } else if (!selected) {
            uxSetText(els.dockTitle, state.file && state.file.name ? state.file.name : '분석 준비 완료');
            uxSetText(els.dockMeta, '분석이 끝나면 추천 탭에서 후보를 생성하세요.');
        } else {
            uxSetText(els.dockTitle, selected.title || '선택된 추천 구간');
            uxSetText(els.dockMeta, `${selected.rangeText || ''} · 점수 ${Math.round(Number(selected.score) || 0)} · 미리보기와 저장 준비 완료`);
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
        uxSetButtonMirror(els.dockPreviewBtn, els.previewBtn);
        uxSetButtonMirror(els.dockExportBtn, els.exportBtn);
    }

    function uxSyncAll() {
        uxSyncMirrors();
        uxSyncDurationChips();
        uxUpdateDock();
        uxUpdateWorkflow();
    }

    function uxScheduleSync() {
        if (syncRaf) return;
        const schedule = global.requestAnimationFrame || (callback => global.setTimeout(callback, 16));
        syncRaf = schedule(() => {
            syncRaf = 0;
            uxSyncAll();
        });
    }

    function uxInstallQuickDurations() {
        if (!els.quickDurationChips || !els.durationSelect) return;
        els.quickDurationChips.addEventListener('click', event => {
            const button = event.target && event.target.closest('[data-duration]');
            if (!button) return;
            els.durationSelect.value = button.dataset.duration || 'auto';
            els.durationSelect.dispatchEvent(new Event('change', { bubbles: true }));
            uxScheduleSync();
        });
    }

    function uxInstallMirrorButtons() {
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
            uxScheduleSync();
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
        const observer = new MutationObserver(uxScheduleSync);
        [els.analyzeBtn, els.previewBtn, els.exportBtn, els.selectedBadge, els.recommendationCount, els.previewStatus].forEach(node => {
            if (node) observer.observe(node, { attributes: true, childList: true, subtree: true, characterData: true });
        });
        document.addEventListener('ai-shorts-flow-sync', uxScheduleSync);
        document.addEventListener('change', uxScheduleSync, { passive: true });
        global.addEventListener('focus', uxScheduleSync, { passive: true });
        global.addEventListener('pageshow', uxScheduleSync, { passive: true });
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) uxScheduleSync();
        });
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

    global.AIShortsUxControls = Object.freeze({ sync: uxScheduleSync });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', uxInit, { once: true });
    else uxInit();
})(window);
