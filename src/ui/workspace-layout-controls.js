// AI Shorts Studio v1.6.4 - quota-aware desktop workspace resizing and focus view controller
'use strict';
(function bootWorkspaceLayoutControls(global) {
    const STORAGE_KEY = 'ai-shorts-workspace-layout-v1';
    const storageManager = global.AIShortsStorageManager || {};
    const DEFAULT_WEIGHTS = Object.freeze({ left: 0.82, center: 1.18, right: 0.9 });
    const MIN_PIXELS = Object.freeze({ left: 260, center: 350, right: 300 });
    const MODES = Object.freeze(['balanced', 'preview', 'waveform']);
    const MODE_ALLOWED_TABS = Object.freeze({
        preview: new Set(['preview', 'candidates', 'edit', 'export']),
        waveform: new Set(['waveform', 'cut', 'edit', 'preview', 'export'])
    });
    let grid = null;
    let toolbar = null;
    let status = null;
    let dividers = [];
    let buttons = [];
    let weights = Object.assign({}, DEFAULT_WEIGHTS);
    let mode = 'balanced';
    let drag = null;
    let resizeRaf = 0;

    function isDesktop() {
        return Boolean(global.matchMedia && global.matchMedia('(min-width: 1180px)').matches);
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function normalize(source) {
        const raw = source || DEFAULT_WEIGHTS;
        const left = Number(raw.left);
        const center = Number(raw.center);
        const right = Number(raw.right);
        if (![left, center, right].every(Number.isFinite)) return Object.assign({}, DEFAULT_WEIGHTS);
        const total = left + center + right;
        if (!(total > 0)) return Object.assign({}, DEFAULT_WEIGHTS);
        const scale = (DEFAULT_WEIGHTS.left + DEFAULT_WEIGHTS.center + DEFAULT_WEIGHTS.right) / total;
        return {
            left: Math.max(0.1, left * scale),
            center: Math.max(0.1, center * scale),
            right: Math.max(0.1, right * scale)
        };
    }

    function readSaved() {
        try {
            const raw = storageManager.safeGet ? storageManager.safeGet(STORAGE_KEY, 'null') : global.localStorage.getItem(STORAGE_KEY) || 'null';
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object') return;
            weights = normalize(parsed.weights);
            mode = 'balanced';
        } catch (_) {
            weights = Object.assign({}, DEFAULT_WEIGHTS);
            mode = 'balanced';
        }
    }

    function save() {
        try {
            const text = JSON.stringify({ weights });
            if (storageManager.safeSet) storageManager.safeSet(STORAGE_KEY, text, { maxCleanupRemovals: 1 });
            else global.localStorage.setItem(STORAGE_KEY, text);
        } catch (_) { /* storage is optional */ }
    }

    function trackValue(value) {
        return `${Math.max(0.1, Number(value) || 0.1).toFixed(4)}fr`;
    }

    function applyWeights(options) {
        const opts = options || {};
        if (!grid) return;
        weights = normalize(weights);
        grid.style.setProperty('--workspace-left-track', trackValue(weights.left));
        grid.style.setProperty('--workspace-center-track', trackValue(weights.center));
        grid.style.setProperty('--workspace-right-track', trackValue(weights.right));
        updateDividerAria();
        updateStatus();
        if (opts.persist !== false) save();
        document.dispatchEvent(new CustomEvent('ai-shorts-workspace-layout', { detail: { mode, weights: Object.assign({}, weights) } }));
    }

    function currentPercent(key) {
        const total = weights.left + weights.center + weights.right;
        return total ? Math.round((weights[key] / total) * 100) : 0;
    }

    function updateDividerAria() {
        dividers.forEach(divider => {
            const side = divider.dataset.workspaceDivider;
            const value = side === 'left' ? currentPercent('left') : currentPercent('left') + currentPercent('center');
            divider.setAttribute('aria-valuenow', String(value));
            divider.setAttribute('aria-valuetext', side === 'left' ? `왼쪽 작업 영역 ${currentPercent('left')}%` : `가운데 작업 영역까지 ${value}%`);
        });
    }

    function updateStatus() {
        if (!status) return;
        if (mode === 'preview') status.textContent = '미리보기와 후보·편집에 집중하는 배치';
        else if (mode === 'waveform') status.textContent = '파형과 컷 편집을 넓게 보는 배치';
        else status.textContent = `3열 ${currentPercent('left')} · ${currentPercent('center')} · ${currentPercent('right')}%`;
    }

    function applyMode(nextMode, options) {
        const opts = options || {};
        mode = MODES.includes(nextMode) ? nextMode : 'balanced';
        if (document.body) document.body.dataset.workspaceView = mode;
        buttons.forEach(button => {
            const active = button.dataset.workspaceMode === mode;
            button.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        updateStatus();
        if (opts.persist !== false) save();
        if (opts.navigate !== false && mode !== 'balanced') {
            const tab = mode === 'preview' ? 'preview' : 'waveform';
            const director = global.AIShortsFlowDirectorFinal;
            if (director && typeof director.setActive === 'function') director.setActive(tab, { force: true, source: 'workspace-layout' });
        }
        global.requestAnimationFrame(() => global.dispatchEvent(new Event('resize')));
        document.dispatchEvent(new CustomEvent('ai-shorts-workspace-mode', { detail: { mode } }));
    }

    function resetLayout() {
        weights = Object.assign({}, DEFAULT_WEIGHTS);
        applyMode('balanced', { persist: false, navigate: false });
        applyWeights({ persist: true });
    }

    function panelWidths() {
        const leftPanel = document.querySelector('[data-flow-panel="file"]');
        const centerPanel = document.querySelector('[data-flow-panel="preview"]');
        const rightPanel = document.querySelector('[data-flow-panel="candidates"]');
        const left = leftPanel && leftPanel.getBoundingClientRect().width;
        const center = centerPanel && centerPanel.getBoundingClientRect().width;
        const right = rightPanel && rightPanel.getBoundingClientRect().width;
        return {
            left: Math.max(MIN_PIXELS.left, left || MIN_PIXELS.left),
            center: Math.max(MIN_PIXELS.center, center || MIN_PIXELS.center),
            right: Math.max(MIN_PIXELS.right, right || MIN_PIXELS.right)
        };
    }

    function beginDrag(event, divider) {
        if (!isDesktop() || mode !== 'balanced' || event.button !== 0) return;
        const side = divider.dataset.workspaceDivider;
        const widths = panelWidths();
        drag = {
            side,
            startX: event.clientX,
            widths,
            pair: side === 'left' ? widths.left + widths.center : widths.center + widths.right
        };
        divider.classList.add('is-dragging');
        document.body.classList.add('is-workspace-resizing');
        divider.setPointerCapture(event.pointerId);
        event.preventDefault();
    }

    function moveDrag(event) {
        if (!drag) return;
        const delta = event.clientX - drag.startX;
        const next = Object.assign({}, drag.widths);
        if (drag.side === 'left') {
            next.left = clamp(drag.widths.left + delta, MIN_PIXELS.left, drag.pair - MIN_PIXELS.center);
            next.center = drag.pair - next.left;
        } else {
            next.center = clamp(drag.widths.center + delta, MIN_PIXELS.center, drag.pair - MIN_PIXELS.right);
            next.right = drag.pair - next.center;
        }
        const total = next.left + next.center + next.right;
        weights = normalize({ left: next.left / total, center: next.center / total, right: next.right / total });
        applyWeights({ persist: false });
    }

    function endDrag(event) {
        if (!drag) return;
        const active = dividers.find(item => item.dataset.workspaceDivider === drag.side);
        if (active) {
            active.classList.remove('is-dragging');
            try { active.releasePointerCapture(event.pointerId); } catch (_) { /* ignore */ }
        }
        document.body.classList.remove('is-workspace-resizing');
        drag = null;
        save();
    }

    function keyboardResize(event, divider) {
        if (!isDesktop() || mode !== 'balanced') return;
        if (event.key === 'Home') {
            resetLayout();
            event.preventDefault();
            return;
        }
        if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        const direction = event.key === 'ArrowRight' ? 1 : -1;
        const step = event.shiftKey ? 0.12 : 0.05;
        const side = divider.dataset.workspaceDivider;
        if (side === 'left') {
            weights.left = Math.max(0.35, weights.left + direction * step);
            weights.center = Math.max(0.45, weights.center - direction * step);
        } else {
            weights.center = Math.max(0.45, weights.center + direction * step);
            weights.right = Math.max(0.35, weights.right - direction * step);
        }
        applyWeights();
        event.preventDefault();
    }

    function installDivider(divider) {
        divider.addEventListener('pointerdown', event => beginDrag(event, divider));
        divider.addEventListener('pointermove', moveDrag);
        divider.addEventListener('pointerup', endDrag);
        divider.addEventListener('pointercancel', endDrag);
        divider.addEventListener('keydown', event => keyboardResize(event, divider));
        divider.addEventListener('dblclick', resetLayout);
    }

    function installModeButtons() {
        buttons.forEach(button => {
            button.addEventListener('click', () => applyMode(button.dataset.workspaceMode || 'balanced'));
        });
        const reset = document.getElementById('workspaceLayoutResetBtn');
        if (reset) reset.addEventListener('click', resetLayout);
    }

    function guardFocusMode(nextTab) {
        if (mode === 'balanced') return;
        const active = String(nextTab || 'file');
        const allowed = MODE_ALLOWED_TABS[mode];
        if (allowed && !allowed.has(active)) applyMode('balanced', { navigate: false });
    }

    function installFocusModeExitGuard() {
        document.addEventListener('click', event => {
            const tab = event.target && event.target.closest && event.target.closest('[data-flow-tab]');
            if (tab) guardFocusMode(tab.getAttribute('data-flow-tab'));
        }, true);
        document.addEventListener('ai-shorts-navigation-request', event => {
            guardFocusMode(event && event.detail && event.detail.tab);
        });
    }

    function scheduleResizeSync() {
        if (resizeRaf) return;
        resizeRaf = global.requestAnimationFrame(() => {
            resizeRaf = 0;
            if (!isDesktop() && mode !== 'balanced') applyMode('balanced', { persist: false, navigate: false });
            updateDividerAria();
        });
    }

    function init() {
        grid = document.getElementById('studioGrid');
        toolbar = document.getElementById('workspaceLayoutToolbar');
        status = document.getElementById('workspaceLayoutStatus');
        dividers = Array.from(document.querySelectorAll('[data-workspace-divider]'));
        buttons = Array.from(document.querySelectorAll('[data-workspace-mode]'));
        if (!grid || !toolbar || dividers.length !== 2) return;
        readSaved();
        dividers.forEach(installDivider);
        installModeButtons();
        applyWeights({ persist: false });
        applyMode(mode, { persist: false, navigate: false });
        installFocusModeExitGuard();
        global.addEventListener('resize', scheduleResizeSync, { passive: true });
        global.addEventListener('orientationchange', scheduleResizeSync, { passive: true });
        document.body.dataset.workspaceLayout = 'ready';
    }

    global.AIShortsWorkspaceLayout = Object.freeze({
        getMode: () => mode,
        getWeights: () => Object.assign({}, weights),
        setMode: applyMode,
        reset: resetLayout
    });

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})(window);
