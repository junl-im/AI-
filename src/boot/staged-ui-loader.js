// AI Shorts Studio v1.3.2 - staged UI hydration loader with cache-safe phase keys
'use strict';

(function installStagedUiLoader(global) {
    const doc = global.document;
    if (!doc) return;

    const config = global.AIShortsRuntimeConfig || {};
    const VERSION = String(config.APP_VERSION || 'v1.3.2').replace(/^v/i, '');
    const BUILD_KEY = String(config.BUILD_KEY || `${VERSION}-staged-ui`);
    const versioned = (path, label) => `${path}?v=${encodeURIComponent(BUILD_KEY)}-${label}`;
    const phases = Object.freeze({
        shell: [
            versioned('src/ui/ux-controls.js', 'shell'),
            versioned('src/ui/hyperconnect-flow.js', 'shell'),
            versioned('src/ui/flow-polish.js', 'shell'),
            versioned('src/ui/flow-hotfix.js', 'shell'),
            versioned('src/ui/flow-integrity.js', 'shell'),
            versioned('src/ui/flow-doctor.js', 'shell'),
            versioned('src/ui/flow-quality-gate.js', 'shell'),
            versioned('src/ui/workspace-comfort.js', 'shell'),
            versioned('src/ui/session-continuity.js', 'shell')
        ],
        editing: [
            versioned('src/ui/range-drag-controls.js', 'editing'),
            versioned('src/ui/handoff-coach.js', 'editing'),
            versioned('src/ui/save-readiness.js', 'editing'),
            versioned('src/ui/render-quality-planner.js', 'editing'),
            versioned('src/ui/candidate-preview-pro.js', 'editing'),
            versioned('src/ui/candidate-pin-board.js', 'editing')
        ],
        export: [
            versioned('src/ui/export-finish-center.js', 'export')
        ]
    });

    const dependencies = Object.freeze({ editing: ['shell'], export: ['shell', 'editing'] });
    const loadedScripts = new Set();
    const phasePromises = new Map();
    const phaseReady = new Set();
    let interactionArmed = false;

    function normalizedPath(url) {
        try { return new URL(url, doc.baseURI).href; } catch (_) { return String(url || ''); }
    }

    function markBody() {
        if (!doc.body) return;
        doc.body.dataset.hydrationMode = 'staged';
        doc.body.dataset.hydrationReady = Array.from(phaseReady).join(',') || 'core';
    }

    function existingScript(url) {
        const target = normalizedPath(url);
        return Array.from(doc.scripts).some(node => normalizedPath(node.src) === target);
    }

    function loadScript(url) {
        if (loadedScripts.has(url) || existingScript(url)) {
            loadedScripts.add(url);
            return Promise.resolve(url);
        }
        return new Promise((resolve, reject) => {
            const script = doc.createElement('script');
            let settled = false;
            const finish = (error) => {
                if (settled) return;
                settled = true;
                global.clearTimeout(timeoutId);
                script.onload = null;
                script.onerror = null;
                if (error) {
                    script.remove();
                    const store = global.AIShortsAppState;
                    if (store && store.addDiagnostic) store.addDiagnostic({ type: 'staged-ui-load-error', message: error.message, url });
                    reject(error);
                    return;
                }
                loadedScripts.add(url);
                resolve(url);
            };
            const timeoutId = global.setTimeout(() => finish(new Error(`UI 모듈 로드 시간 초과: ${url}`)), 10000);
            script.src = url;
            script.async = false;
            script.dataset.stagedUi = 'true';
            script.onload = () => finish();
            script.onerror = () => finish(new Error(`UI 모듈 로드 실패: ${url}`));
            doc.head.appendChild(script);
        });
    }

    async function ensure(phase) {
        const key = Object.prototype.hasOwnProperty.call(phases, phase) ? phase : 'shell';
        if (phaseReady.has(key)) return { phase: key, cached: true };
        if (phasePromises.has(key)) return phasePromises.get(key);

        const task = (async () => {
            const required = dependencies[key] || [];
            for (const dependency of required) await ensure(dependency);
            const started = global.performance && global.performance.now ? global.performance.now() : Date.now();
            for (const url of phases[key]) await loadScript(url);
            phaseReady.add(key);
            markBody();
            const ended = global.performance && global.performance.now ? global.performance.now() : Date.now();
            const detail = { phase: key, duration: Math.max(0, Math.round(ended - started)), modules: phases[key].length };
            doc.dispatchEvent(new CustomEvent('ai-shorts-hydration-ready', { detail }));
            return detail;
        })().catch(error => {
            phasePromises.delete(key);
            if (doc.body) doc.body.dataset.hydrationError = key;
            global.console && global.console.error && global.console.error(error);
            throw error;
        });

        phasePromises.set(key, task);
        return task;
    }

    function phaseForTarget(target) {
        if (!target || !target.closest) return '';
        const flow = target.closest('[data-flow-tab]');
        const tab = flow && flow.getAttribute('data-flow-tab');
        if (tab === 'export') return 'export';
        if (['candidates', 'preview', 'waveform', 'cut', 'edit'].includes(tab)) return 'editing';
        if (target.closest('#exportBtn, #exportAllBtn, #flowExportBtn, #flowExportAllBtn, #thumbnailBtn')) return 'export';
        if (target.closest('#analyzeBtn, #recommendationList, .recommendation-card, #previewBtn, #applyRangeBtn, #captionTextInput, #saveProjectBtn')) return 'editing';
        if (target.closest('#fileInput, #bottomFileBtn, #dropZone, #programInfoBtn')) return 'shell';
        return '';
    }

    function prewarmFromTarget(target) {
        const phase = phaseForTarget(target);
        if (phase) ensure(phase).catch(() => {});
    }

    function inspectWorkflowState() {
        const state = global.AIShortsAppState && global.AIShortsAppState.state;
        if (!state) return;
        if (Array.isArray(state.recommendations) && state.recommendations.length) ensure('editing').catch(() => {});
        if (state.isRendering || state.exportInfo) ensure('export').catch(() => {});
    }

    function armInteractionPreload() {
        if (interactionArmed) return;
        interactionArmed = true;
        doc.addEventListener('pointerover', event => prewarmFromTarget(event.target), { capture: true, passive: true });
        doc.addEventListener('focusin', event => prewarmFromTarget(event.target), { capture: true });
        doc.addEventListener('pointerdown', event => prewarmFromTarget(event.target), { capture: true, passive: true });
        doc.addEventListener('change', event => prewarmFromTarget(event.target), { capture: true });
        doc.addEventListener('ai-shorts-flow-sync', inspectWorkflowState);
        doc.addEventListener('ai-shorts-navigation-request', event => {
            const tab = event && event.detail && event.detail.tab;
            if (tab === 'export') ensure('export').catch(() => {});
            else if (['candidates', 'preview', 'waveform', 'cut', 'edit'].includes(tab)) ensure('editing').catch(() => {});
            else ensure('shell').catch(() => {});
        });
    }

    function scheduleWarmShell() {
        const warm = () => ensure('shell').catch(() => {});
        if ('requestIdleCallback' in global) global.requestIdleCallback(warm, { timeout: 1800 });
        else global.setTimeout(warm, 900);
    }

    function install() {
        markBody();
        armInteractionPreload();
        scheduleWarmShell();
    }

    global.AIShortsStagedUiLoader = Object.freeze({
        ensure,
        isReady: phase => phaseReady.has(phase),
        readyPhases: () => Array.from(phaseReady),
        phaseModules: phase => (phases[phase] || []).slice()
    });

    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', install, { once: true });
    else install();
})(window);
