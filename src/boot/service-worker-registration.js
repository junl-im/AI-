// AI Shorts Studio v1.4.1 - observable single-owner service worker lifecycle
'use strict';

(function exposeServiceWorkerRegistration(global) {
    const config = global.AIShortsRuntimeConfig || {};
    let registrationPromise = null;
    let registrationRef = null;
    let updatePromise = null;
    let listenersBound = false;
    let controllerChangeCount = 0;

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

    function getStatus() {
        const serviceWorker = global.navigator && global.navigator.serviceWorker;
        const registration = registrationRef;
        return Object.freeze({
            supported: canRegister(),
            registered: Boolean(registration),
            controlled: Boolean(serviceWorker && serviceWorker.controller),
            scope: registration && registration.scope || '',
            installing: Boolean(registration && registration.installing),
            waiting: Boolean(registration && registration.waiting),
            active: Boolean(registration && registration.active),
            controllerChanges: controllerChangeCount,
            version: resolveVersion()
        });
    }

    function bindLifecycleListeners() {
        const serviceWorker = global.navigator && global.navigator.serviceWorker;
        if (listenersBound || !serviceWorker || typeof serviceWorker.addEventListener !== 'function') return;
        listenersBound = true;
        serviceWorker.addEventListener('controllerchange', () => {
            controllerChangeCount += 1;
            addDiagnostic({ type: 'service-worker-controller-change', count: controllerChangeCount, controlled: Boolean(serviceWorker.controller), version: resolveVersion() });
        });
    }

    function watchRegistration(registration) {
        if (!registration || typeof registration.addEventListener !== 'function') return;
        registration.addEventListener('updatefound', () => {
            const worker = registration.installing;
            addDiagnostic({ type: 'service-worker-update-found', version: resolveVersion() });
            if (!worker || typeof worker.addEventListener !== 'function') return;
            worker.addEventListener('statechange', () => addDiagnostic({ type: 'service-worker-state-change', state: worker.state || '', version: resolveVersion() }));
        });
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
        if (!canRegister()) return Promise.resolve({ status: 'unsupported', registration: null, version: resolveVersion(), lifecycle: getStatus() });
        if (registrationPromise) return registrationPromise;
        bindLifecycleListeners();

        registrationPromise = global.navigator.serviceWorker.register(opts.scriptUrl).then(async registration => {
            registrationRef = registration || null;
            watchRegistration(registrationRef);
            await requestUpdate(registrationRef, 'register');
            const version = resolveVersion();
            const lifecycle = getStatus();
            addDiagnostic({ type: 'service-worker-ready', version, scope: lifecycle.scope, active: lifecycle.active, controlled: lifecycle.controlled });
            return { status: 'ready', registration, version, lifecycle };
        }).catch(error => {
            const normalized = error instanceof Error ? error : new Error(String(error || '서비스워커 등록 실패'));
            addDiagnostic({ type: 'service-worker-error', message: normalized.message });
            registrationPromise = null;
            registrationRef = null;
            return { status: 'error', registration: null, version: resolveVersion(), lifecycle: getStatus(), error: normalized };
        });

        return registrationPromise;
    }

    async function waitUntilControlled(options) {
        const opts = Object.assign({ timeoutMs: 8000 }, options || {});
        const result = await register(opts);
        const serviceWorker = global.navigator && global.navigator.serviceWorker;
        if (!result || result.status !== 'ready' || !serviceWorker) return Object.assign({}, result, { controlled: false });
        if (serviceWorker.controller) return Object.assign({}, result, { controlled: true, lifecycle: getStatus() });
        if (!serviceWorker.ready || typeof serviceWorker.ready.then !== 'function') return Object.assign({}, result, { controlled: false, lifecycle: getStatus() });
        await Promise.race([
            serviceWorker.ready,
            new Promise(resolve => setTimeout(resolve, Math.max(0, Number(opts.timeoutMs) || 0)))
        ]);
        return Object.assign({}, result, { controlled: Boolean(serviceWorker.controller), lifecycle: getStatus() });
    }

    async function checkForUpdate(options) {
        const hadRegistration = Boolean(registrationPromise || registrationRef);
        const result = await register(options);
        if (!result || result.status !== 'ready') return result;
        const checked = hadRegistration ? await requestUpdate(result.registration || registrationRef, 'manual') : true;
        return Object.assign({}, result, { updateChecked: checked, lifecycle: getStatus() });
    }

    global.AIShortsServiceWorkerRegistration = Object.freeze({ register, checkForUpdate, waitUntilControlled, getStatus, canRegister, resolveVersion });
})(window);
