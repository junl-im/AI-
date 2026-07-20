// AI Shorts Studio v1.3.5 - single source version sync and update guard
'use strict';

(function installAppVersionSync(global) {
    const FALLBACK_VERSION = 'v1.3.5';
    const FALLBACK_BUILD_KEY = '1.3.5-adaptive-mobile';
    const config = global.AIShortsRuntimeConfig || {};
    const normalizeVersion = value => {
        const text = String(value || FALLBACK_VERSION).trim();
        return text.startsWith('v') ? text : `v${text}`;
    };
    const version = normalizeVersion(config.APP_VERSION);
    const plainVersion = version.replace(/^v/i, '');
    const buildKey = String(config.BUILD_KEY || FALLBACK_BUILD_KEY);

    function setText(selector, text) {
        document.querySelectorAll(selector).forEach(node => {
            node.textContent = text;
            node.setAttribute('data-version-source', 'runtime-config');
        });
    }

    function upsertMeta(name, content) {
        let meta = document.querySelector(`meta[name="${name}"]`);
        if (!meta) {
            meta = document.createElement('meta');
            meta.name = name;
            document.head.appendChild(meta);
        }
        meta.content = content;
    }

    function applyVersionToDocument() {
        document.documentElement.dataset.appVersion = version;
        if (document.body) {
            document.body.dataset.build = plainVersion;
            document.body.dataset.buildKey = buildKey;
            document.body.dataset.versionSynced = 'true';
        }
        document.title = `AI 쇼츠 제작 스튜디오 ${version}`;
        setText('#programInfoBtn.badge-version, .badge-version[data-auto-version]', version);
        const title = document.getElementById('infoTitle');
        if (title) title.textContent = `AI 쇼츠 제작 스튜디오 ${version}`;
        upsertMeta('ai-shorts-version', version);
        upsertMeta('ai-shorts-build-key', buildKey);
    }

    function rememberVersion() {
        try {
            const key = 'ai-shorts-studio-visible-version';
            const last = global.localStorage && global.localStorage.getItem(key);
            if (last && last !== version) document.documentElement.dataset.previousAppVersion = last;
            if (global.localStorage) global.localStorage.setItem(key, version);
        } catch (_) {
            // localStorage can be blocked in private modes. Version sync still works in DOM.
        }
    }

    function requestServiceWorkerFreshnessCheck() {
        if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
        navigator.serviceWorker.ready.then(registration => {
            if (registration && registration.update) registration.update().catch(() => {});
        }).catch(() => {});
    }

    function init() {
        applyVersionToDocument();
        rememberVersion();
        requestServiceWorkerFreshnessCheck();
    }

    global.AIShortsVersionSync = Object.freeze({
        version,
        plainVersion,
        buildKey,
        apply: applyVersionToDocument,
        refreshServiceWorker: requestServiceWorkerFreshnessCheck
    });

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
})(window);
