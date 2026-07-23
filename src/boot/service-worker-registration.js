// AI Shorts Studio v1.5.24 - observable service worker lifecycle with content integrity and rollback reports
'use strict';

(function exposeServiceWorkerRegistration(global) {
    const config = global.AIShortsRuntimeConfig || {};
    const MAX_UPDATE_ATTEMPTS = Math.max(1, Math.min(4, Number(config.SW_UPDATE_MAX_ATTEMPTS) || 3));
    const UPDATE_BACKOFF_BASE_MS = Math.max(100, Math.min(10000, Number(config.SW_UPDATE_BACKOFF_BASE_MS) || 500));
    let registrationPromise = null;
    let registrationRef = null;
    let updatePromise = null;
    let repairPromise = null;
    let repairSequence = 0;
    const repairWaiters = new Map();
    let listenersBound = false;
    let controllerChangeCount = 0;
    let lastInstallReport = null;
    let updateStatus = Object.freeze({ state: 'idle', attempts: 0, lastCheckedAt: '', lastSuccessAt: '', lastError: '', nextRetryAt: '' });
    let repairStatus = Object.freeze({ state: 'idle', requestedAt: '', completedAt: '', repaired: 0, failed: 0, lastError: '' });

    function getStore() { return global.AIShortsAppState || {}; }
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
            version: resolveVersion(),
            installReport: lastInstallReport,
            update: updateStatus,
            repair: repairStatus
        });
    }
    function emitStatus() {
        if (!global.document || typeof global.document.dispatchEvent !== 'function' || typeof global.CustomEvent !== 'function') return;
        try { global.document.dispatchEvent(new global.CustomEvent('ai-shorts-service-worker-status', { detail: getStatus() })); } catch (_) { /* optional */ }
    }
    function normalizeInstallReport(report) {
        const value = report || {};
        return Object.freeze({
            cacheName: String(value.cacheName || ''),
            attempted: Number(value.attempted) || 0,
            cached: Number(value.cached) || 0,
            failed: Number(value.failed) || 0,
            cacheEntries: Number(value.cacheEntries) || 0,
            requiredMissing: Array.isArray(value.requiredMissing) ? value.requiredMissing.slice(0, 12) : [],
            failures: Array.isArray(value.failures) ? value.failures.slice(0, 12) : [],
            repaired: Array.isArray(value.repaired) ? value.repaired.slice(0, 24) : [],
            repairFailed: Array.isArray(value.repairFailed) ? value.repairFailed.slice(0, 24) : [],
            repairAttempts: Number(value.repairAttempts) || 0,
            repairReason: String(value.repairReason || ''),
            lastRepairedAt: String(value.lastRepairedAt || ''),
            verified: Boolean(value.verified),
            contentVerified: Boolean(value.contentVerified),
            activationVerified: Boolean(value.activationVerified),
            rollbackCandidates: Array.isArray(value.rollbackCandidates) ? value.rollbackCandidates.slice(0, 8) : [],
            rollbackPreserved: Array.isArray(value.rollbackPreserved) ? value.rollbackPreserved.slice(0, 8) : [],
            integrityManifest: value.integrityManifest && typeof value.integrityManifest === 'object' ? Object.freeze({ supported: Boolean(value.integrityManifest.supported), verified: Boolean(value.integrityManifest.verified), source: String(value.integrityManifest.source || ''), hash: String(value.integrityManifest.hash || ''), generatedAt: String(value.integrityManifest.generatedAt || ''), error: String(value.integrityManifest.error || '') }) : null,
            integrity: value.integrity && typeof value.integrity === 'object' ? Object.freeze({
                checked: Number(value.integrity.checked) || 0,
                healthy: Number(value.integrity.healthy) || 0,
                hashVerified: Number(value.integrity.hashVerified) || 0,
                hashUnsupported: Number(value.integrity.hashUnsupported) || 0,
                manifestVerified: Boolean(value.integrity.manifestVerified),
                manifestError: String(value.integrity.manifestError || ''),
                missing: Array.isArray(value.integrity.missing) ? value.integrity.missing.slice(0, 24) : [],
                invalid: Array.isArray(value.integrity.invalid) ? value.integrity.invalid.slice(0, 24) : [],
                corrupted: Array.isArray(value.integrity.corrupted) ? value.integrity.corrupted.slice(0, 24) : []
            }) : null,
            installedAt: String(value.installedAt || ''),
            reportedAt: new Date().toISOString()
        });
    }
    function acceptInstallReport(report) {
        lastInstallReport = normalizeInstallReport(report);
        addDiagnostic({
            type: 'service-worker-install-report',
            version: resolveVersion(),
            cached: lastInstallReport.cached,
            failed: lastInstallReport.failed,
            cacheEntries: lastInstallReport.cacheEntries,
            repaired: lastInstallReport.repaired.length,
            repairFailed: lastInstallReport.repairFailed.length,
            verified: lastInstallReport.verified,
            contentVerified: lastInstallReport.contentVerified,
            corrupted: lastInstallReport.integrity && lastInstallReport.integrity.corrupted.length || 0,
            rollbackPreserved: lastInstallReport.rollbackPreserved.length,
            requiredMissing: lastInstallReport.requiredMissing
        });
        if (lastInstallReport.repairReason) {
            repairStatus = Object.freeze({
                state: lastInstallReport.repairFailed.length || lastInstallReport.requiredMissing.length ? 'error' : 'ready',
                requestedAt: repairStatus.requestedAt || '',
                completedAt: lastInstallReport.lastRepairedAt || new Date().toISOString(),
                repaired: lastInstallReport.repaired.length,
                failed: lastInstallReport.repairFailed.length + lastInstallReport.requiredMissing.length,
                lastError: lastInstallReport.repairFailed.length || lastInstallReport.requiredMissing.length ? '일부 오프라인 자산을 복구하지 못했습니다.' : ''
            });
        }
        emitStatus();
        return lastInstallReport;
    }
    function bindLifecycleListeners() {
        const serviceWorker = global.navigator && global.navigator.serviceWorker;
        if (listenersBound || !serviceWorker || typeof serviceWorker.addEventListener !== 'function') return;
        listenersBound = true;
        serviceWorker.addEventListener('controllerchange', () => {
            controllerChangeCount += 1;
            addDiagnostic({ type: 'service-worker-controller-change', count: controllerChangeCount, controlled: Boolean(serviceWorker.controller), version: resolveVersion() });
            requestInstallReport();
            emitStatus();
        });
        serviceWorker.addEventListener('message', event => {
            const data = event && event.data || {};
            if (data.type !== 'ai-shorts-service-worker-install-report') return;
            const report = acceptInstallReport(data.report || {});
            const requestId = String(data.requestId || '');
            const waiter = requestId && repairWaiters.get(requestId);
            if (waiter) {
                repairWaiters.delete(requestId);
                waiter.resolve(report);
            }
        });
    }
    function watchRegistration(registration) {
        if (!registration || typeof registration.addEventListener !== 'function') return;
        registration.addEventListener('updatefound', () => {
            const worker = registration.installing;
            addDiagnostic({ type: 'service-worker-update-found', version: resolveVersion() });
            emitStatus();
            if (!worker || typeof worker.addEventListener !== 'function') return;
            worker.addEventListener('statechange', () => {
                addDiagnostic({ type: 'service-worker-state-change', state: worker.state || '', version: resolveVersion() });
                emitStatus();
            });
        });
    }
    function delay(ms) {
        if (typeof global.setTimeout !== 'function') return Promise.resolve();
        return new Promise(resolve => global.setTimeout(resolve, Math.max(0, Number(ms) || 0)));
    }
    function requestInstallReport() {
        const serviceWorker = global.navigator && global.navigator.serviceWorker;
        const target = serviceWorker && serviceWorker.controller || registrationRef && (registrationRef.active || registrationRef.waiting || registrationRef.installing);
        if (!target || typeof target.postMessage !== 'function') return false;
        try { target.postMessage({ type: 'ai-shorts-service-worker-status-request', version: resolveVersion() }); return true; }
        catch (_) { return false; }
    }
    function repairCache(options) {
        if (repairPromise) return repairPromise;
        const opts = options || {};
        const serviceWorker = global.navigator && global.navigator.serviceWorker;
        const target = serviceWorker && serviceWorker.controller || registrationRef && (registrationRef.active || registrationRef.waiting || registrationRef.installing);
        if (!target || typeof target.postMessage !== 'function') return Promise.resolve({ status: 'unsupported', report: lastInstallReport });
        const requestId = `repair-${Date.now()}-${++repairSequence}`;
        const requestedAt = new Date().toISOString();
        repairStatus = Object.freeze({ state: 'checking', requestedAt, completedAt: '', repaired: 0, failed: 0, lastError: '' });
        emitStatus();
        repairPromise = new Promise(resolve => {
            const timeoutMs = Math.max(3000, Math.min(30000, Number(opts.timeoutMs) || 15000));
            const timeoutId = global.setTimeout ? global.setTimeout(() => {
                repairWaiters.delete(requestId);
                repairStatus = Object.freeze({ state: 'error', requestedAt, completedAt: new Date().toISOString(), repaired: 0, failed: 1, lastError: '오프라인 셸 복구 응답 시간이 초과되었습니다.' });
                addDiagnostic({ type: 'service-worker-repair-timeout', requestId, timeoutMs });
                emitStatus();
                resolve({ status: 'timeout', report: lastInstallReport });
            }, timeoutMs) : null;
            repairWaiters.set(requestId, {
                resolve(report) {
                    if (timeoutId && global.clearTimeout) global.clearTimeout(timeoutId);
                    repairStatus = Object.freeze({
                        state: report && !report.requiredMissing.length && !report.repairFailed.length ? 'ready' : 'error',
                        requestedAt,
                        completedAt: new Date().toISOString(),
                        repaired: report && report.repaired.length || 0,
                        failed: report ? report.requiredMissing.length + report.repairFailed.length : 1,
                        lastError: report && !report.requiredMissing.length && !report.repairFailed.length ? '' : '일부 오프라인 자산 복구에 실패했습니다.'
                    });
                    addDiagnostic({ type: 'service-worker-repair-complete', requestId, repaired: repairStatus.repaired, failed: repairStatus.failed });
                    emitStatus();
                    resolve({ status: repairStatus.state, report });
                }
            });
            try { target.postMessage({ type: 'ai-shorts-service-worker-repair-request', requestId, version: resolveVersion() }); }
            catch (error) {
                if (timeoutId && global.clearTimeout) global.clearTimeout(timeoutId);
                repairWaiters.delete(requestId);
                repairStatus = Object.freeze({ state: 'error', requestedAt, completedAt: new Date().toISOString(), repaired: 0, failed: 1, lastError: error && error.message || '복구 요청 전송 실패' });
                emitStatus();
                resolve({ status: 'error', report: lastInstallReport, error });
            }
        }).finally(() => { repairPromise = null; });
        return repairPromise;
    }
    function requestUpdate(registration, source) {
        if (!registration || typeof registration.update !== 'function') return Promise.resolve(false);
        if (updatePromise) return updatePromise;
        const updateSource = source || 'manual';
        updatePromise = (async () => {
            let lastError = null;
            for (let attempt = 1; attempt <= MAX_UPDATE_ATTEMPTS; attempt += 1) {
                const checkedAt = new Date().toISOString();
                updateStatus = Object.freeze({ state: 'checking', attempts: attempt, lastCheckedAt: checkedAt, lastSuccessAt: updateStatus.lastSuccessAt || '', lastError: '', nextRetryAt: '' });
                emitStatus();
                try {
                    await registration.update();
                    const successAt = new Date().toISOString();
                    updateStatus = Object.freeze({ state: 'ready', attempts: attempt, lastCheckedAt: checkedAt, lastSuccessAt: successAt, lastError: '', nextRetryAt: '' });
                    addDiagnostic({ type: 'service-worker-update-check', source: updateSource, attempt, version: resolveVersion() });
                    requestInstallReport();
                    emitStatus();
                    return true;
                } catch (error) {
                    lastError = error instanceof Error ? error : new Error(String(error || '업데이트 확인 실패'));
                    if (attempt >= MAX_UPDATE_ATTEMPTS) break;
                    const waitMs = UPDATE_BACKOFF_BASE_MS * (2 ** (attempt - 1));
                    const nextRetryAt = new Date(Date.now() + waitMs).toISOString();
                    updateStatus = Object.freeze({ state: 'backoff', attempts: attempt, lastCheckedAt: checkedAt, lastSuccessAt: updateStatus.lastSuccessAt || '', lastError: lastError.message, nextRetryAt });
                    addDiagnostic({ type: 'service-worker-update-retry', source: updateSource, attempt, waitMs, message: lastError.message });
                    emitStatus();
                    await delay(waitMs);
                }
            }
            updateStatus = Object.freeze({ state: 'error', attempts: MAX_UPDATE_ATTEMPTS, lastCheckedAt: new Date().toISOString(), lastSuccessAt: updateStatus.lastSuccessAt || '', lastError: lastError && lastError.message || '업데이트 확인 실패', nextRetryAt: '' });
            addDiagnostic({ type: 'service-worker-update-error', source: updateSource, attempts: MAX_UPDATE_ATTEMPTS, message: updateStatus.lastError });
            emitStatus();
            return false;
        })().finally(() => { updatePromise = null; });
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
            requestInstallReport();
            const version = resolveVersion();
            const lifecycle = getStatus();
            addDiagnostic({ type: 'service-worker-ready', version, scope: lifecycle.scope, active: lifecycle.active, controlled: lifecycle.controlled });
            emitStatus();
            return { status: 'ready', registration, version, lifecycle };
        }).catch(error => {
            const normalized = error instanceof Error ? error : new Error(String(error || '서비스워커 등록 실패'));
            addDiagnostic({ type: 'service-worker-error', message: normalized.message });
            registrationPromise = null;
            registrationRef = null;
            emitStatus();
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
            delay(Math.max(0, Number(opts.timeoutMs) || 0))
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

    global.AIShortsServiceWorkerRegistration = Object.freeze({ register, checkForUpdate, waitUntilControlled, getStatus, canRegister, resolveVersion, requestInstallReport, repairCache });
})(window);
