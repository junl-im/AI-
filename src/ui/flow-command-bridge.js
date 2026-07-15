// AI Shorts Studio v1.2.1 - no-shake command bridge
// Keeps menu-bar/navigation commands single-owned after legacy modules have loaded.
'use strict';
(function bootFlowCommandBridge(global) {
    const ORDER = ['file', 'recommend', 'candidates', 'preview', 'waveform', 'cut', 'edit', 'export'];
    const META = {
        file: ['📂', '파일 열기'],
        recommend: ['✨', '추천'],
        candidates: ['🎯', '후보'],
        preview: ['📱', '미리보기'],
        waveform: ['〰️', '파형'],
        cut: ['✂️', '컷'],
        edit: ['🎛️', '편집'],
        export: ['📦', '저장']
    };
    let lastCommand = '';
    let lastAt = 0;
    let clearTimer = 0;

    function byId(id) { return document.getElementById(id); }
    function isAllowed(tab) { return ORDER.includes(tab); }
    function currentTab() {
        return document.body && document.body.dataset && document.body.dataset.activeFlowTab ? document.body.dataset.activeFlowTab : 'file';
    }
    function director() { return global.AIShortsFlowDirectorFinal || null; }
    function tabs() { return Array.from(document.querySelectorAll('[data-flow-tab]')); }
    function panelFor(tab) {
        const api = director();
        if (api && api.panelFor) return api.panelFor(tab);
        return Array.from(document.querySelectorAll('[data-flow-panel]')).find(panel => String(panel.getAttribute('data-flow-panel') || '').split(/\s+/).includes(tab)) || null;
    }
    function mark(panel) {
        if (!panel) return;
        panel.classList.remove('is-motion-stable-revealed', 'is-workspace-revealed', 'is-director-revealed', 'is-command-bridge-revealed');
        panel.classList.add('is-command-bridge-revealed');
        clearTimeout(clearTimer);
        clearTimer = global.setTimeout(() => panel.classList.remove('is-command-bridge-revealed'), 240);
    }
    function relabel() {
        tabs().forEach(node => {
            const key = node.getAttribute('data-flow-tab');
            const meta = META[key];
            if (!meta) return;
            const icon = node.querySelector('span');
            const label = node.querySelector('b');
            if (icon) icon.textContent = meta[0];
            if (label) label.textContent = meta[1];
        });
        const compat = document.querySelector('.brand-compat-pill');
        if (compat) {
            const label = compat.querySelector('[data-compat-label]') || compat.querySelector('span:last-child');
            if (label && label.textContent !== 'LOCAL RENDER · 9:16 READY') label.textContent = 'LOCAL RENDER · 9:16 READY';
        }
    }
    function syncTopLine() {
        const line = document.querySelector('.brand-topline');
        if (!line) return;
        if (!line.querySelector('.brand-compat-pill')) {
            const compat = document.createElement('div');
            compat.className = 'brand-compat-pill';
            compat.setAttribute('aria-label', '로컬 쇼츠 제작 상태');
            const pulse = document.createElement('span');
            pulse.className = 'compat-pulse';
            pulse.setAttribute('aria-hidden', 'true');
            const label = document.createElement('span');
            label.setAttribute('data-compat-label', '');
            label.textContent = 'LOCAL RENDER · 9:16 READY';
            compat.append(pulse, label);
            const right = line.querySelector('.brand-right-actions');
            if (right) line.insertBefore(compat, right);
            else line.appendChild(compat);
        }
    }
    function setTab(tab, options) {
        const key = isAllowed(tab) ? tab : 'file';
        const opts = options || {};
        const now = Date.now();
        const duplicate = key === lastCommand && (now - lastAt) < 160;
        lastCommand = key;
        lastAt = now;
        if (document.body) {
            document.body.dataset.activeFlowTab = key;
            document.body.dataset.flowCommandBridge = 'ready';
        }
        const api = director();
        if (api && api.setActive && !duplicate) {
            api.setActive(key, { force: opts.force !== false, source: opts.source || 'command-bridge' });
        } else if (api && api.setVisible) {
            api.setVisible(key);
        } else if (global.AIShortsMotionStability && global.AIShortsMotionStability.reveal && !duplicate) {
            global.AIShortsMotionStability.reveal(key, { force: opts.force !== false, source: 'command-bridge' });
        }
        mark(panelFor(key));
        return key;
    }
    function installCaptureGuard() {
        document.addEventListener('click', event => {
            const tab = event.target && event.target.closest && event.target.closest('[data-flow-tab]');
            if (!tab) return;
            const key = tab.getAttribute('data-flow-tab') || 'file';
            if (!isAllowed(key)) return;
            if (tab.classList.contains('is-disabled') || tab.getAttribute('aria-disabled') === 'true') return;
            if (tab.tagName !== 'LABEL') event.preventDefault();
            setTab(key, { force: true, source: 'dock-capture' });
            if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
        }, true);
    }
    function patchLegacyApis() {
        const api = {
            setActiveFlowTab: setTab,
            revealActivePanel: (tab, options) => setTab(tab || currentTab(), options || { force: false }),
            syncTabs: () => { relabel(); return currentTab(); },
            scheduleSync: () => global.requestAnimationFrame ? global.requestAnimationFrame(relabel) : relabel()
        };
        global.AIShortsHyperFlowTabs = Object.assign({}, global.AIShortsHyperFlowTabs || {}, api);
        global.AIShortsMotionStability = Object.assign({}, global.AIShortsMotionStability || {}, {
            reveal: (tab, options) => { setTab(tab || currentTab(), Object.assign({ force: false }, options || {})); return true; },
            panelFor
        });
    }
    function install() {
        if (document.body) {
            document.body.dataset.flowCommandBridge = 'ready';
            document.body.dataset.noShakeCommand = 'true';
        }
        syncTopLine();
        relabel();
        patchLegacyApis();
        installCaptureGuard();
        document.addEventListener('ai-shorts-flow-sync', () => { syncTopLine(); relabel(); });
        global.addEventListener('orientationchange', () => setTab(currentTab(), { force: false, source: 'orientation' }), { passive: true });
    }
    global.AIShortsFlowCommandBridge = Object.freeze({ setTab, relabel, panelFor, syncTopLine });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
    else install();
})(window);
