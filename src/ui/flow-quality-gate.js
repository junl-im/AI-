// AI Shorts Studio v1.0.8 - Flow Quality Gate with direct workspace reveal
'use strict';
(function bootFlowQualityGate(global) {
    const store = global.AIShortsAppState || {};
    const state = store.state || {};
    const ORDER = ['file', 'recommend', 'candidates', 'preview', 'waveform', 'cut', 'edit', 'export'];
    const PANEL_LABELS = {
        file: 'file-open',
        recommend: 'recommend',
        candidates: 'candidates',
        preview: 'preview',
        waveform: 'waveform',
        cut: 'cut',
        edit: 'edit',
        export: 'export'
    };
    let raf = 0;
    let lastErrorKey = '';

    function byId(id) { return document.getElementById(id); }
    function currentTab() { return document.body && document.body.dataset ? document.body.dataset.activeFlowTab || 'file' : 'file'; }
    function hasFile() { return Boolean(state.file); }
    function hasAnalysis() { return Boolean(state.audioAnalysis || state.motionAnalysis || state.autoCuts); }
    function hasRecommendations() { return Array.isArray(state.recommendations) && state.recommendations.length > 0; }
    function hasSelection() { return Boolean(state.selectedRecommendationId); }
    function tabs() { return Array.from(document.querySelectorAll('[data-flow-tab]')); }
    function panels() { return Array.from(document.querySelectorAll('[data-flow-panel]')); }
    function panelTabs(panel) { return String(panel.getAttribute('data-flow-panel') || '').split(/\s+/).filter(Boolean); }
    function panelFor(tab) { return panels().find(panel => panelTabs(panel).includes(tab)) || null; }
    function tabApi() { return global.AIShortsHyperFlowTabs || null; }

    function addDiagnostic(type, payload) {
        if (store.addDiagnostic) store.addDiagnostic(Object.assign({ type }, payload || {}));
    }
    function showToast(message, kind) {
        const toast = byId('toast');
        if (!toast) return;
        if (global.AIShortsFeedbackUX && global.AIShortsFeedbackUX.setToastKind) {
            global.AIShortsFeedbackUX.setToastKind(toast, kind || 'warning');
        }
        toast.textContent = message;
        toast.classList.add('toast-visible');
        clearTimeout(toast._flowQualityTimer);
        toast._flowQualityTimer = setTimeout(() => toast.classList.remove('toast-visible'), 3200);
    }
    function setActive(tab, options) {
        const next = ORDER.includes(tab) ? tab : 'file';
        const api = tabApi();
        if (api && api.setActiveFlowTab) api.setActiveFlowTab(next, options || { reveal: false });
        else if (document.body && document.body.dataset) document.body.dataset.activeFlowTab = next;
    }
    function allowedTab(tab) {
        if (tab === 'file') return true;
        if (tab === 'recommend') return hasFile() || hasAnalysis();
        if (tab === 'candidates') return hasRecommendations();
        if (tab === 'preview') return hasSelection();
        if (tab === 'waveform' || tab === 'cut' || tab === 'edit' || tab === 'export') return hasRecommendations();
        return false;
    }
    function bestTabForState(tab) {
        if (!ORDER.includes(tab)) return 'file';
        if (allowedTab(tab)) return tab;
        if (!hasFile()) return 'file';
        if (state.isAnalyzing) return 'file';
        if (hasSelection()) return 'preview';
        if (hasRecommendations()) return 'candidates';
        if (hasAnalysis()) return 'recommend';
        return 'file';
    }
    function setPanelVisibility(active) {
        panels().forEach(panel => {
            const isActive = panelTabs(panel).includes(active);
            panel.hidden = !isActive;
            panel.classList.toggle('is-flow-active', isActive);
            panel.classList.toggle('is-flow-standby', !isActive);
            panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
        });
        tabs().forEach(tab => {
            const key = tab.getAttribute('data-flow-tab') || '';
            const activeTab = key === active;
            tab.classList.toggle('is-active', activeTab);
            tab.setAttribute('aria-selected', activeTab ? 'true' : 'false');
            tab.setAttribute('aria-current', activeTab ? 'step' : 'false');
            tab.classList.toggle('is-disabled', !allowedTab(key));
            tab.setAttribute('aria-disabled', allowedTab(key) ? 'false' : 'true');
        });
    }
    function labelFor(tab) { return PANEL_LABELS[tab] || tab; }
    function updateStage(active) {
        const title = byId('hyperflowStageTitle');
        const meta = byId('hyperflowStageMeta');
        if (!title || !meta) return;
        if (!hasFile()) {
            title.textContent = '파일을 열면 자동 분석합니다';
            meta.textContent = '아래 시작 패널 또는 하단 Dock의 파일 열기를 사용하세요.';
            return;
        }
        if (state.isAnalyzing) {
            title.textContent = '자동 분석 중입니다';
            meta.textContent = '분석 완료 후 추천 생성 단계로 이어집니다.';
            return;
        }
        if (hasAnalysis() && !hasRecommendations()) {
            title.textContent = '분석 완료 · 추천 생성 준비';
            meta.textContent = '추천 탭에서 추천 생성 버튼을 누르면 후보 선택으로 연결됩니다.';
            return;
        }
        if (hasRecommendations() && !hasSelection()) {
            title.textContent = '후보 선택 단계입니다';
            meta.textContent = '후보 카드를 선택하면 미리보기 탭으로 자동 연결됩니다.';
            return;
        }
        if (hasSelection()) {
            title.textContent = '선택 구간이 연결되었습니다';
            meta.textContent = '미리보기, 파형, 컷, 편집, 저장 탭으로 이어서 작업하세요.';
            return;
        }
        meta.textContent = '현재 작업: ' + labelFor(active);
    }
    function normalizeLegacyUi() {
        document.querySelectorAll('.action-dock, .legacy-mobile-action-bar').forEach(node => {
            node.classList.add('flow-quality-hidden-legacy');
            node.setAttribute('aria-hidden', 'true');
        });
        const dockLabel = byId('bottomFileBtn');
        if (dockLabel) {
            const text = dockLabel.querySelector('b');
            if (text) text.textContent = '파일 열기';
        }
    }
    function heal(options) {
        const opts = options || {};
        let active = currentTab();
        const desired = bestTabForState(active);
        let healed = false;
        if (desired !== active || !panelFor(active)) {
            active = desired;
            healed = true;
            setActive(active, { reveal: false, instant: true });
        }
        if (document.body) {
            document.body.dataset.activeFlowTab = active;
            document.body.dataset.flowHealed = healed ? 'true' : 'false';
            document.body.dataset.flowQuality = 'ok';
        }
        setPanelVisibility(active);
        updateStage(active);
        normalizeLegacyUi();
        if (opts.reveal) revealActivePanel(active);
        return { active, healed };
    }
    function revealActivePanel(tab) {
        const key = tab || currentTab();
        if (global.AIShortsMotionStability && global.AIShortsMotionStability.reveal) {
            global.AIShortsMotionStability.reveal(key, { source: 'flow-quality-gate', force: false, instant: true });
            return;
        }
        const panel = panelFor(key);
        if (!panel || !global.requestAnimationFrame) return;
        global.requestAnimationFrame(() => {
            const rect = panel.getBoundingClientRect && panel.getBoundingClientRect();
            if (!rect) return;
            const target = Math.max(0, global.scrollY + rect.top - 18);
            if (Math.abs(global.scrollY - target) > 12) global.scrollTo({ top: target, behavior: 'auto' });
        });
    }
    function schedule(options) {
        if (raf) return;
        raf = global.requestAnimationFrame ? global.requestAnimationFrame(() => { raf = 0; heal(options); }) : setTimeout(() => { raf = 0; heal(options); }, 0);
    }
    function handleRuntimeError(error, source) {
        const message = error && error.message ? error.message : String(error || 'unknown error');
        const key = source + ':' + message;
        if (key === lastErrorKey) return;
        lastErrorKey = key;
        if (document.body) document.body.dataset.flowQuality = 'error';
        addDiagnostic('runtime-error', { source, message });
        showToast('작업 중 오류를 감지했습니다. 진단 복사를 눌러 확인할 수 있습니다.', 'error');
        schedule();
    }
    function installErrorGuards() {
        global.addEventListener('error', event => handleRuntimeError(event.error || event.message, 'window-error'));
        global.addEventListener('unhandledrejection', event => handleRuntimeError(event.reason || 'unhandled rejection', 'promise'));
    }
    function install() {
        normalizeLegacyUi();
        document.addEventListener('click', event => {
            const tab = event.target && event.target.closest && event.target.closest('[data-flow-tab]');
            if (tab && tab.tagName !== 'LABEL') {
                const key = tab.getAttribute('data-flow-tab') || 'file';
                if (!allowedTab(key)) {
                    event.preventDefault();
                    const fallback = bestTabForState(key);
                    setActive(fallback, { reveal: true });
                    showToast('먼저 필요한 단계를 완료해야 합니다.', 'warning');
                    schedule({ reveal: true });
                } else {
                    schedule({ reveal: false });
                }
            }
            const card = event.target && event.target.closest && event.target.closest('.recommendation-card');
            if (card) setTimeout(() => schedule({ reveal: true }), 80);
        }, true);
        document.addEventListener('ai-shorts-flow-sync', () => schedule({ reveal: false }));
        const observer = new MutationObserver(() => schedule());
        ['recommendationList', 'recommendationCount', 'analysisStatus', 'previewStatus', 'selectedRangeText', 'flowSelectionSummary'].map(byId).filter(Boolean).forEach(node => observer.observe(node, { childList: true, subtree: true, attributes: true, characterData: true }));
        global.addEventListener('resize', () => schedule(), { passive: true });
        installErrorGuards();
        heal({ reveal: false });
    }
    global.AIShortsFlowQualityGate = Object.freeze({ heal, schedule, revealActivePanel, bestTabForState, allowedTab });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
    else install();
})(window);
