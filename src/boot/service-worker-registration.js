// AI Shorts Studio v1.3.5 - single-owner service worker registration
'use strict';

(function exposeServiceWorkerRegistration(global) {
    const config = global.AIShortsRuntimeConfig || {};
    let registrationPromise = null;

    function getStore() {
        return global.AIShortsAppState || {};
    }

    function resolveVersion() {
        const synced = global.AIShortsVersionSync && global.AIShortsVersionSync.version;
        return synced || config.APP_VERSION || 'dev';
    }

    function addDiagnostic(event) {
        const store = getStore();
        if (store && typeof store.addDiagnostic === 'function') store.addDiagnostic(event);
    }

    function canRegister() {
        return Boolean(
            global.navigator &&
            global.navigator.serviceWorker &&
            global.location &&
            global.location.protocol !== 'file:'
        );
    }

    function register(options) {
        const opts = Object.assign({ scriptUrl: 'sw.js' }, options || {});
        if (!canRegister()) return Promise.resolve({ status: 'unsupported', registration: null, version: resolveVersion() });
        if (registrationPromise) return registrationPromise;

        registrationPromise = global.navigator.serviceWorker.register(opts.scriptUrl).then(registration => {
            if (registration && typeof registration.update === 'function') registration.update().catch(() => {});
            const version = resolveVersion();
            addDiagnostic({ type: 'service-worker-ready', version, scope: registration && registration.scope || '' });
            return { status: 'ready', registration, version };
        }).catch(error => {
            const normalized = error instanceof Error ? error : new Error(String(error || '서비스워커 등록 실패'));
            addDiagnostic({ type: 'service-worker-error', message: normalized.message });
            registrationPromise = null;
            return { status: 'error', registration: null, version: resolveVersion(), error: normalized };
        });

        return registrationPromise;
    }

    global.AIShortsServiceWorkerRegistration = Object.freeze({ register, canRegister, resolveVersion });
})(window);
