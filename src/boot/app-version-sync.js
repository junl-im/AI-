// AI Shorts Studio v1.5.29 - single source version sync and delegated update guard
'use strict';

(function installAppVersionSync(global) {
    const FALLBACK_VERSION = 'v1.5.29';
    const FALLBACK_BUILD_KEY = '1.5.29-analysis-signature-storage-trend';
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
        const owner = global.AIShortsServiceWorkerRegistration;
        if (!owner || typeof owner.checkForUpdate !== 'function') return Promise.resolve({ status: 'deferred', version });
        return owner.checkForUpdate();
    }

    function init() {
        applyVersionToDocument();
        rememberVersion();
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
