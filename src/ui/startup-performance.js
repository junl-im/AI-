// AI Shorts Studio v1.2.1 - adaptive startup and rendering profile
'use strict';

(function bootStartupPerformance(global) {
    const doc = global.document;
    if (!doc) return;
    let profile = 'full';
    let longTaskTotal = 0;
    let longTaskCount = 0;
    let longTaskObserver = null;

    function mediaMatches(query) {
        return Boolean(global.matchMedia && global.matchMedia(query).matches);
    }

    function detectProfile() {
        const nav = global.navigator || {};
        const connection = nav.connection || nav.mozConnection || nav.webkitConnection || {};
        const cores = Number(nav.hardwareConcurrency) || 8;
        const memory = Number(nav.deviceMemory) || 8;
        const constrained = Boolean(connection.saveData) || cores <= 4 || memory <= 4 || mediaMatches('(prefers-reduced-motion: reduce)');
        return constrained ? 'lite' : 'full';
    }

    function applyProfile(next, reason) {
        profile = next === 'lite' ? 'lite' : 'full';
        const body = doc.body;
        if (!body) return;
        body.dataset.performanceProfile = profile;
        body.dataset.performanceReason = reason || 'device';
        body.classList.toggle('performance-lite', profile === 'lite');
        body.classList.toggle('performance-full', profile === 'full');
    }

    function settleUi() {
        if (!doc.body) return;
        doc.body.classList.add('is-ui-ready');
        const settle = () => doc.body && doc.body.classList.add('is-ui-settled');
        if ('requestIdleCallback' in global) global.requestIdleCallback(settle, { timeout: 1200 });
        else global.setTimeout(settle, 180);
    }

    function installVisibilityGuard() {
        const sync = () => {
            if (doc.body) doc.body.classList.toggle('is-page-hidden', doc.hidden);
        };
        doc.addEventListener('visibilitychange', sync, { passive: true });
        sync();
    }

    function installLongTaskGuard() {
        if (!('PerformanceObserver' in global) || profile === 'lite') return;
        try {
            longTaskObserver = new PerformanceObserver(list => {
                list.getEntries().forEach(entry => {
                    longTaskCount += 1;
                    longTaskTotal += Number(entry.duration) || 0;
                });
                if (longTaskCount >= 3 && longTaskTotal >= 280) {
                    applyProfile('lite', 'runtime-long-task');
                    if (longTaskObserver) longTaskObserver.disconnect();
                }
            });
            longTaskObserver.observe({ entryTypes: ['longtask'] });
            global.setTimeout(() => {
                if (longTaskObserver) longTaskObserver.disconnect();
                longTaskObserver = null;
            }, 6000);
        } catch (_) {
            longTaskObserver = null;
        }
    }

    function install() {
        applyProfile(detectProfile(), 'device');
        installVisibilityGuard();
        settleUi();
        installLongTaskGuard();
    }

    global.AIShortsStartupPerformance = Object.freeze({
        getProfile: () => profile,
        setProfile: next => applyProfile(next, 'manual'),
        getRuntimeCost: () => ({ longTaskCount, longTaskTotal: Math.round(longTaskTotal) })
    });

    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', install, { once: true });
    else install();
})(window);
