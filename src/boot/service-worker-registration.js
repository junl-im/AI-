// AI Shorts Studio v1.4.0 - single-owner service worker registration
'use strict';

(function exposeServiceWorkerRegistration(global) {
    const config = global.AIShortsRuntimeConfig || {};
    let registrationPromise = null;
    let registrationRef = null;
    let updatePromise = null;

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
        const location = global.location || {};
        const protocol = String(location.protocol || '');
        const hostname = String(location.hostname || '');
        const secureOrigin = protocol === 'https:' || (protocol === 'http:' && /^(localhost|127\.0\.0\.1|\[::1\])$/i.test(hostname));
        return Boolean(global.navigator && global.navigator.serviceWorker && secureOrigin && global.isSecureContext !== false);
    }

    function requestUpdate(registration, source) {
        if (!registration || typeof registration.update !== 'function') return Promise.resolve(false);
        if (updatePromise) return updatePromise;
        updatePromise = Promise.resolve().then(() => registration.update()).then(() => {
            addDiagnostic({ type: 'service-worker-update-check', source: source || 'manual', version: resolveVersion() });
            return true;
        }).catch(error => {
            addDiagnostic({ type: 'service-worker-update-error', source: source || 'manual', message: error && error.message || String(error || '업데이트 확인 실패') });
            return false;
        }).finally(() => { updatePromise = null; });
        return updatePromise;
    }

    function register(options) {
        const opts = Object.assign({ scriptUrl: 'sw.js' }, options || {});
        if (!canRegister()) return Promise.resolve({ status: 'unsupported', registration: null, version: resolveVersion() });
        if (registrationPromise) return registrationPromise;

        registrationPromise = global.navigator.serviceWorker.register(opts.scriptUrl).then(async registration => {
            registrationRef = registration || null;
            await requestUpdate(registrationRef, 'register');
            const version = resolveVersion();
            addDiagnostic({ type: 'service-worker-ready', version, scope: registration && registration.scope || '' });
            return { status: 'ready', registration, version };
        }).catch(error => {
            const normalized = error instanceof Error ? error : new Error(String(error || '서비스워커 등록 실패'));
            addDiagnostic({ type: 'service-worker-error', message: normalized.message });
            registrationPromise = null;
            registrationRef = null;
            return { status: 'error', registration: null, version: resolveVersion(), error: normalized };
        });

        return registrationPromise;
    }

    async function checkForUpdate(options) {
        const hadRegistration = Boolean(registrationPromise || registrationRef);
        const result = await register(options);
        if (!result || result.status !== 'ready') return result;
        const checked = hadRegistration ? await requestUpdate(result.registration || registrationRef, 'manual') : true;
        return Object.assign({}, result, { updateChecked: checked });
    }

    global.AIShortsServiceWorkerRegistration = Object.freeze({ register, checkForUpdate, canRegister, resolveVersion });
})(window);
