// AI Shorts Studio v1.0.6 - single-owner motion stability guard
'use strict';
(function bootMotionStability(global) {
    const store = global.AIShortsAppState || {};
    const state = store.state || {};
    const PANEL_TOP_GAP = 18;
    let raf = 0;
    let pending = null;
    let lastTarget = -1;
    let lastTime = 0;
    let highlightTimer = 0;

    function byId(id) { return document.getElementById(id); }
    function panelFor(tab) {
        const key = tab || (document.body && document.body.dataset ? document.body.dataset.activeFlowTab : 'file') || 'file';
        return Array.from(document.querySelectorAll('[data-flow-panel]')).find(panel => {
            return String(panel.getAttribute('data-flow-panel') || '').split(/\s+/).includes(key);
        }) || null;
    }
    function dockHeight() {
        const dock = byId('bottomDock');
        if (!dock || !dock.getBoundingClientRect) return 0;
        return Math.max(0, dock.getBoundingClientRect().height || 0);
    }
    function isComfortablyVisible(panel) {
        const rect = panel && panel.getBoundingClientRect ? panel.getBoundingClientRect() : null;
        if (!rect) return false;
        const topLimit = PANEL_TOP_GAP;
        const bottomLimit = Math.max(180, global.innerHeight - dockHeight() - 22);
        return rect.top >= topLimit && rect.top <= bottomLimit && rect.bottom > 160;
    }
    function targetFor(panel) {
        const rect = panel.getBoundingClientRect();
        return Math.max(0, Math.round(global.scrollY + rect.top - PANEL_TOP_GAP));
    }
    function mark(panel) {
        if (!panel) return;
        panel.classList.remove('is-workspace-revealed', 'is-motion-stable-revealed');
        panel.classList.add('is-motion-stable-revealed');
        clearTimeout(highlightTimer);
        highlightTimer = setTimeout(() => panel.classList.remove('is-motion-stable-revealed'), 420);
    }
    function reveal(tab, options) {
        const opts = options || {};
        const panel = panelFor(tab);
        if (!panel || !global.requestAnimationFrame) return false;
        pending = { tab, panel, opts, time: Date.now() };
        if (raf) return true;
        raf = global.requestAnimationFrame(() => {
            raf = 0;
            const job = pending;
            pending = null;
            if (!job || !job.panel || !job.panel.isConnected) return;
            const now = Date.now();
            const target = targetFor(job.panel);
            const nearLast = Math.abs(target - lastTarget) <= 3 && (now - lastTime) < 420;
            const comfortable = isComfortablyVisible(job.panel);
            if ((!comfortable || job.opts.force) && !nearLast && Math.abs(global.scrollY - target) > 10) {
                global.scrollTo({ top: target, behavior: 'auto' });
                lastTarget = target;
                lastTime = now;
            }
            if (job.opts.highlight !== false) mark(job.panel);
            try { job.panel.focus({ preventScroll: true }); } catch (error) { /* ignore */ }
            if (document.body) document.body.dataset.motionStable = 'true';
        });
        return true;
    }
    function cancelLegacyPulse() {
        document.querySelectorAll('.is-workspace-revealed').forEach(node => node.classList.remove('is-workspace-revealed'));
    }
    function install() {
        if (document.body) {
            document.body.dataset.motionStability = 'ready';
            document.body.dataset.motionStable = 'true';
        }
        document.addEventListener('click', event => {
            const tab = event.target && event.target.closest && event.target.closest('[data-flow-tab]');
            if (!tab) return;
            cancelLegacyPulse();
        }, true);
        global.addEventListener('orientationchange', () => {
            lastTarget = -1;
            lastTime = 0;
        }, { passive: true });
    }
    global.AIShortsMotionStability = Object.freeze({ reveal, panelFor, isComfortablyVisible });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
    else install();
})(window);
