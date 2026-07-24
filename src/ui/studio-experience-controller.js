// AI Shorts Studio v1.5.29 - workspace focus and actionable next-step controller
'use strict';

(function exposeStudioExperience(global) {
    const doc = global.document;
    if (!doc) return;

    const ORDER = ['file', 'recommend', 'candidates', 'preview', 'waveform', 'cut', 'edit', 'export'];
    let introPinnedOpen = false;
    let syncFrame = 0;

    function byId(id) { return doc.getElementById(id); }
    function state() { return global.AIShortsAppState && global.AIShortsAppState.state || {}; }
    function activeTab() {
        const value = doc.body && doc.body.dataset.activeFlowTab || 'file';
        return ORDER.includes(value) ? value : 'file';
    }
    function hasAnalysis(current) { return Boolean(current.audioAnalysis || current.motionAnalysis); }
    function hasRecommendations(current) { return Boolean(Array.isArray(current.recommendations) && current.recommendations.length); }
    function hasSelection(current) { return Boolean(current.selectedRecommendationId); }
    function hasExport(current) { return Boolean(current.exportInfo || (current.renderHistory && current.renderHistory.length)); }

    function navigate(tab) {
        const key = ORDER.includes(tab) ? tab : 'file';
        if (global.AIShortsFlowCommandBridge && global.AIShortsFlowCommandBridge.setTab) {
            global.AIShortsFlowCommandBridge.setTab(key, { force: true, source: 'studio-next-action' });
            return;
        }
        doc.dispatchEvent(new CustomEvent('ai-shorts-navigation-request', { detail: { tab: key, options: { force: true, source: 'studio-next-action' } } }));
    }

    function requestAnalysis() {
        doc.dispatchEvent(new CustomEvent('ai-shorts-analysis-request', { detail: { source: 'studio-next-action' } }));
    }

    function resolveNextAction(current) {
        if (!current.file) return { key: 'go-import', label: '불러오기 위치로', progress: 0, stage: '1/4 원본 선택' };
        if (current.isAnalyzing) return { key: 'cancel-analysis', label: '분석 취소', progress: 34, stage: '2/4 자동 분석 중' };
        if (!hasAnalysis(current)) return { key: 'retry-analysis', label: '분석 다시 시도', progress: 25, stage: '2/4 분석 필요' };
        if (!hasRecommendations(current)) return { key: 'generate', label: '추천 생성', progress: 50, stage: '2/4 분석 완료' };
        if (!hasSelection(current)) return { key: 'choose', label: '후보 고르기', progress: 72, stage: '3/4 후보 선택' };
        if (hasExport(current)) return { key: 'view-export', label: '저장 결과 보기', progress: 100, stage: '4/4 저장 완료' };
        const tab = activeTab();
        if (tab === 'export') return { key: 'export', label: '쇼츠 저장', progress: 92, stage: '4/4 저장 준비' };
        if (tab === 'edit' || tab === 'cut' || tab === 'waveform') return { key: 'go-export', label: '저장으로 이동', progress: 86, stage: '3/4 편집 중' };
        if (tab === 'preview') return { key: 'go-edit', label: '편집 계속', progress: 82, stage: '3/4 미리보기 확인' };
        return { key: 'go-preview', label: '미리보기 확인', progress: 78, stage: '3/4 후보 선택 완료' };
    }

    function focusImportPanel(source) {
        navigate('file');
        const schedule = global.requestAnimationFrame || (callback => global.setTimeout(callback, 0));
        schedule(() => {
            const target = byId('fileDrop') || doc.querySelector('[data-flow-panel~="file"]');
            if (!target) return;
            if (target.scrollIntoView) target.scrollIntoView({ block: 'center', behavior: 'smooth' });
            try { target.focus({ preventScroll: true }); } catch (_) { /* ignore */ }
            target.classList.add('is-import-focus');
            global.setTimeout(() => target.classList.remove('is-import-focus'), 900);
            if (doc.body) doc.body.dataset.importEntrySource = source || 'next-action';
        });
    }

    function runAction(key) {
        const current = state();
        if (key === 'go-import') {
            focusImportPanel('next-action');
            return;
        }
        if (key === 'cancel-analysis') {
            const cancel = byId('analysisCancelBtn');
            if (cancel && !cancel.disabled) cancel.click();
            return;
        }
        if (key === 'retry-analysis') {
            requestAnalysis();
            return;
        }
        if (key === 'generate') {
            const button = byId('analyzeBtn');
            if (button && !button.disabled) button.click();
            return;
        }
        if (key === 'choose') { navigate('candidates'); return; }
        if (key === 'go-preview') { navigate('preview'); return; }
        if (key === 'go-edit') { navigate('edit'); return; }
        if (key === 'go-export' || key === 'view-export') { navigate('export'); return; }
        if (key === 'export') {
            const button = byId('flowExportBtn') || byId('exportBtn');
            if (button && !button.disabled) button.click();
            else navigate('export');
            return;
        }
        if (!current.file) focusImportPanel('fallback');
    }

    function applyFocus(mode, reason) {
        if (!doc.body) return;
        const next = mode === 'intro' ? 'intro' : 'workspace';
        doc.body.dataset.studioFocus = next;
        doc.body.dataset.studioFocusReason = reason || 'state';
        const toggle = byId('studioFocusToggle');
        if (toggle) {
            const intro = next === 'intro';
            toggle.setAttribute('aria-expanded', String(intro));
            toggle.textContent = intro ? '작업실 바로가기' : '소개 보기';
            toggle.setAttribute('aria-label', intro ? '소개를 접고 작업실로 이동' : '프로그램 소개 펼치기');
        }
    }

    function syncFocus(current) {
        const started = Boolean(current.file) || activeTab() !== 'file';
        if (introPinnedOpen) applyFocus('intro', 'manual-open');
        else applyFocus(started ? 'workspace' : 'intro', started ? 'workflow-started' : 'first-visit');
    }

    function syncJourney(current) {
        const action = resolveNextAction(current);
        const button = byId('hyperflowNextBtn');
        const progress = byId('studioJourneyProgress');
        const label = byId('studioJourneyLabel');
        if (button) {
            button.dataset.action = action.key;
            button.textContent = action.label;
            button.disabled = action.key === 'cancel-analysis' && Boolean(byId('analysisCancelBtn') && byId('analysisCancelBtn').disabled);
        }
        if (progress) {
            progress.style.width = `${Math.max(0, Math.min(100, action.progress))}%`;
            progress.parentElement && progress.parentElement.setAttribute('aria-valuenow', String(action.progress));
        }
        if (label) label.textContent = action.stage;
    }

    function sync() {
        syncFrame = 0;
        const current = state();
        syncFocus(current);
        syncJourney(current);
    }

    function scheduleSync() {
        if (syncFrame) return;
        syncFrame = global.requestAnimationFrame ? global.requestAnimationFrame(sync) : global.setTimeout(sync, 0);
    }

    function install() {
        const toggle = byId('studioFocusToggle');
        if (toggle) toggle.addEventListener('click', () => {
            const intro = doc.body && doc.body.dataset.studioFocus === 'intro';
            introPinnedOpen = !intro;
            if (intro) {
                introPinnedOpen = false;
                applyFocus('workspace', 'manual-close');
                const target = byId('hyperflowStage') || byId('studioGrid');
                if (target && target.scrollIntoView) target.scrollIntoView({ block: 'start', behavior: 'smooth' });
            } else {
                introPinnedOpen = true;
                applyFocus('intro', 'manual-open');
                const hero = doc.querySelector('.studio-hero');
                if (hero && hero.scrollIntoView) hero.scrollIntoView({ block: 'start', behavior: 'smooth' });
            }
        });

        const next = byId('hyperflowNextBtn');
        if (next) next.addEventListener('click', () => runAction(next.dataset.action || 'go-import'));

        const heroStart = byId('heroWorkspaceStartBtn');
        if (heroStart) heroStart.addEventListener('click', () => focusImportPanel('hero'));

        ['ai-shorts-flow-sync', 'ai-shorts-experience-sync', 'ai-shorts-session-restored'].forEach(eventName => {
            doc.addEventListener(eventName, scheduleSync);
        });
        global.addEventListener('ai-shorts-operation-change', scheduleSync);

        if (doc.body && typeof MutationObserver === 'function') {
            const observer = new MutationObserver(scheduleSync);
            observer.observe(doc.body, { attributes: true, attributeFilter: ['data-active-flow-tab', 'data-active-operations', 'data-media-session'] });
        }
        sync();
    }

    global.AIShortsStudioExperience = Object.freeze({ sync: scheduleSync, resolveNextAction, applyFocus, focusImportPanel });
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', install, { once: true });
    else install();
})(window);
