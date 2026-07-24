// AI Shorts Studio v1.6.9 - observable lifecycle with targeted retry and audit history controls
'use strict';

(function exposeServiceWorkerRegistration(global) {
    const config = global.AIShortsRuntimeConfig || {};
    const MAX_UPDATE_ATTEMPTS = Math.max(1, Math.min(4, Number(config.SW_UPDATE_MAX_ATTEMPTS) || 3));
    const UPDATE_BACKOFF_BASE_MS = Math.max(100, Math.min(10000, Number(config.SW_UPDATE_BACKOFF_BASE_MS) || 500));
    const INTEGRITY_AUDIT_INTERVAL_MS = Math.max(60_000, Number(config.SW_INTEGRITY_AUDIT_INTERVAL_MS) || 15 * 60 * 1000);
    const INTEGRITY_AUDIT_INITIAL_DELAY_MS = Math.max(5000, Number(config.SW_INTEGRITY_AUDIT_INITIAL_DELAY_MS) || 30 * 1000);
    const INTEGRITY_AUDIT_SAMPLE_SIZE = Math.max(4, Math.min(32, Number(config.SW_INTEGRITY_AUDIT_SAMPLE_SIZE) || 12));
    let registrationPromise = null;
    let registrationRef = null;
    let updatePromise = null;
    let repairPromise = null;
    let integrityAuditPromise = null;
    let integrityAuditTimer = 0;
    let repairSequence = 0;
    let integrityAuditSequence = 0;
    let integrityCommandSequence = 0;
    const repairWaiters = new Map();
    const integrityAuditWaiters = new Map();
    const integrityCommandWaiters = new Map();
    let listenersBound = false;
    let visibilityBound = false;
    let controllerChangeCount = 0;
    let lastInstallReport = null;
    let updateStatus = Object.freeze({ state: 'idle', attempts: 0, lastCheckedAt: '', lastSuccessAt: '', lastError: '', nextRetryAt: '' });
    let repairStatus = Object.freeze({ state: 'idle', requestedAt: '', completedAt: '', repaired: 0, failed: 0, lastError: '' });
    let integrityAuditStatus = Object.freeze({ state: 'idle', requestedAt: '', completedAt: '', checked: 0, healthy: 0, repaired: 0, failed: 0, cursor: 0, nextCursor: 0, lastError: '', nextAuditAt: '' });

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
            repair: repairStatus,
            integrityAudit: integrityAuditStatus
        });
    }
    function emitStatus() {
        if (!global.document || typeof global.document.dispatchEvent !== 'function' || typeof global.CustomEvent !== 'function') return;
        try { global.document.dispatchEvent(new global.CustomEvent('ai-shorts-service-worker-status', { detail: getStatus() })); } catch (_) { /* optional */ }
    }
    function normalizePeriodicIntegrity(value) {
        const audit = value && typeof value === 'object' ? value : null;
        if (!audit) return null;
        return Object.freeze({
            checkedAt: String(audit.checkedAt || ''),
            checked: Number(audit.checked) || 0,
            healthy: Number(audit.healthy) || 0,
            repaired: Number(audit.repaired) || 0,
            failed: Number(audit.failed) || 0,
            cursor: Number(audit.cursor) || 0,
            nextCursor: Number(audit.nextCursor) || 0,
            sampleSize: Number(audit.sampleSize) || 0,
            missing: Array.isArray(audit.missing) ? audit.missing.slice(0, 24) : [],
            invalid: Array.isArray(audit.invalid) ? audit.invalid.slice(0, 24) : [],
            corrupted: Array.isArray(audit.corrupted) ? audit.corrupted.slice(0, 24) : [],
            repairFailed: Array.isArray(audit.repairFailed) ? audit.repairFailed.slice(0, 24) : [],
            source: String(audit.source || ''),
            skippedBackoff: Number(audit.skippedBackoff) || 0
        });
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
            periodicIntegrity: normalizePeriodicIntegrity(value.periodicIntegrity),
            integrityHistory: Array.isArray(value.integrityHistory) ? value.integrityHistory.slice(0, 40).map(item => Object.freeze({ checkedAt: String(item && item.checkedAt || ''), source: String(item && item.source || ''), checked: Number(item && item.checked) || 0, healthy: Number(item && item.healthy) || 0, repaired: Number(item && item.repaired) || 0, failed: Number(item && item.failed) || 0, skippedBackoff: Number(item && item.skippedBackoff) || 0, cursor: Number(item && item.cursor) || 0, nextCursor: Number(item && item.nextCursor) || 0 })) : [],
            integrityBackoff: value.integrityBackoff && typeof value.integrityBackoff === 'object' ? Object.freeze(Object.fromEntries(Object.entries(value.integrityBackoff).slice(0, 64).map(([file, item]) => [String(file), Object.freeze({ failures: Number(item && item.failures) || 0, lastFailedAt: String(item && item.lastFailedAt || ''), nextRetryAt: String(item && item.nextRetryAt || '') })]))): Object.freeze({}),
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
        if (lastInstallReport.periodicIntegrity) {
            const audit = lastInstallReport.periodicIntegrity;
            integrityAuditStatus = Object.freeze({
                state: audit.failed ? 'error' : 'ready',
                requestedAt: integrityAuditStatus.requestedAt || audit.checkedAt,
                completedAt: audit.checkedAt,
                checked: audit.checked,
                healthy: audit.healthy,
                repaired: audit.repaired,
                failed: audit.failed,
                cursor: audit.cursor,
                nextCursor: audit.nextCursor,
                lastError: audit.failed ? '일부 오프라인 자산의 주기 검증 또는 복구에 실패했습니다.' : '',
                nextAuditAt: integrityAuditStatus.nextAuditAt || ''
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
            scheduleIntegrityAudit(INTEGRITY_AUDIT_INITIAL_DELAY_MS);
            emitStatus();
        });
        serviceWorker.addEventListener('message', event => {
            const data = event && event.data || {};
            if (data.type !== 'ai-shorts-service-worker-install-report') return;
            const report = acceptInstallReport(data.report || {});
            const requestId = String(data.requestId || '');
            const repairWaiter = requestId && repairWaiters.get(requestId);
            if (repairWaiter) {
                repairWaiters.delete(requestId);
                repairWaiter.resolve(report);
            }
            const auditWaiter = requestId && integrityAuditWaiters.get(requestId);
            if (auditWaiter) {
                integrityAuditWaiters.delete(requestId);
                auditWaiter.resolve(report);
            }
            const commandWaiter = requestId && integrityCommandWaiters.get(requestId);
            if (commandWaiter) {
                integrityCommandWaiters.delete(requestId);
                commandWaiter.resolve({ report, commandResult: data.commandResult || null });
            }
        });
    }
    function bindVisibilityListeners() {
        if (visibilityBound || !global.document || typeof global.document.addEventListener !== 'function') return;
        visibilityBound = true;
        global.document.addEventListener('visibilitychange', () => {
            if (global.document.hidden) {
                if (integrityAuditTimer && global.clearTimeout) global.clearTimeout(integrityAuditTimer);
                integrityAuditTimer = 0;
                return;
            }
            scheduleIntegrityAudit(5000);
        });
        if (global.addEventListener) global.addEventListener('online', () => { addDiagnostic({ type: 'service-worker-online-integrity-resume', version: resolveVersion() }); scheduleIntegrityAudit(1000); });
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
    function requestTarget() {
        const serviceWorker = global.navigator && global.navigator.serviceWorker;
        return serviceWorker && serviceWorker.controller || registrationRef && (registrationRef.active || registrationRef.waiting || registrationRef.installing) || null;
    }
    function requestInstallReport() {
        const target = requestTarget();
        if (!target || typeof target.postMessage !== 'function') return false;
        try { target.postMessage({ type: 'ai-shorts-service-worker-status-request', version: resolveVersion() }); return true; }
        catch (_) { return false; }
    }
    function repairCache(options) {
        if (repairPromise) return repairPromise;
        const opts = options || {};
        const target = requestTarget();
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
    function requestIntegrityAudit(options) {
        if (integrityAuditPromise) return integrityAuditPromise;
        const opts = options || {};
        const target = requestTarget();
        if (!target || typeof target.postMessage !== 'function') return Promise.resolve({ status: 'unsupported', report: lastInstallReport });
        const requestId = `integrity-${Date.now()}-${++integrityAuditSequence}`;
        const requestedAt = new Date().toISOString();
        const sampleSize = Math.max(4, Math.min(32, Number(opts.sampleSize) || INTEGRITY_AUDIT_SAMPLE_SIZE));
        integrityAuditStatus = Object.freeze(Object.assign({}, integrityAuditStatus, { state: 'checking', requestedAt, completedAt: '', checked: 0, healthy: 0, repaired: 0, failed: 0, lastError: '' }));
        emitStatus();
        integrityAuditPromise = new Promise(resolve => {
            const timeoutMs = Math.max(3000, Math.min(30000, Number(opts.timeoutMs) || 15000));
            const timeoutId = global.setTimeout ? global.setTimeout(() => {
                integrityAuditWaiters.delete(requestId);
                integrityAuditStatus = Object.freeze(Object.assign({}, integrityAuditStatus, { state: 'error', completedAt: new Date().toISOString(), failed: 1, lastError: '오프라인 셸 표본 검증 응답 시간이 초과되었습니다.' }));
                addDiagnostic({ type: 'service-worker-integrity-audit-timeout', requestId, timeoutMs, sampleSize });
                emitStatus();
                resolve({ status: 'timeout', report: lastInstallReport });
            }, timeoutMs) : null;
            integrityAuditWaiters.set(requestId, {
                resolve(report) {
                    if (timeoutId && global.clearTimeout) global.clearTimeout(timeoutId);
                    const audit = report && report.periodicIntegrity || {};
                    integrityAuditStatus = Object.freeze({
                        state: audit.failed ? 'error' : 'ready',
                        requestedAt,
                        completedAt: audit.checkedAt || new Date().toISOString(),
                        checked: Number(audit.checked) || 0,
                        healthy: Number(audit.healthy) || 0,
                        repaired: Number(audit.repaired) || 0,
                        failed: Number(audit.failed) || 0,
                        cursor: Number(audit.cursor) || 0,
                        nextCursor: Number(audit.nextCursor) || 0,
                        lastError: audit.failed ? '일부 오프라인 자산의 검증 또는 복구에 실패했습니다.' : '',
                        nextAuditAt: new Date(Date.now() + INTEGRITY_AUDIT_INTERVAL_MS).toISOString()
                    });
                    addDiagnostic({ type: 'service-worker-integrity-audit-complete', requestId, checked: integrityAuditStatus.checked, repaired: integrityAuditStatus.repaired, failed: integrityAuditStatus.failed, cursor: integrityAuditStatus.cursor, nextCursor: integrityAuditStatus.nextCursor });
                    emitStatus();
                    resolve({ status: integrityAuditStatus.state, report });
                }
            });
            try { target.postMessage({ type: 'ai-shorts-service-worker-integrity-sample-request', requestId, version: resolveVersion(), sampleSize, source: String(opts.source || 'manual') }); }
            catch (error) {
                if (timeoutId && global.clearTimeout) global.clearTimeout(timeoutId);
                integrityAuditWaiters.delete(requestId);
                integrityAuditStatus = Object.freeze(Object.assign({}, integrityAuditStatus, { state: 'error', completedAt: new Date().toISOString(), failed: 1, lastError: error && error.message || '표본 검증 요청 전송 실패' }));
                emitStatus();
                resolve({ status: 'error', report: lastInstallReport, error });
            }
        }).finally(() => { integrityAuditPromise = null; });
        return integrityAuditPromise;
    }
    function requestIntegrityCommand(type, payload, options) {
        const target = requestTarget();
        if (!target || typeof target.postMessage !== 'function') return Promise.resolve({ status: 'unsupported', report: lastInstallReport, commandResult: null });
        const opts = options || {};
        const requestId = `integrity-command-${Date.now()}-${++integrityCommandSequence}`;
        return new Promise(resolve => {
            const timeoutMs = Math.max(3000, Math.min(30000, Number(opts.timeoutMs) || 15000));
            const timeoutId = global.setTimeout ? global.setTimeout(() => {
                integrityCommandWaiters.delete(requestId);
                addDiagnostic({ type: 'service-worker-integrity-command-timeout', requestId, command: type, timeoutMs });
                resolve({ status: 'timeout', report: lastInstallReport, commandResult: null });
            }, timeoutMs) : null;
            integrityCommandWaiters.set(requestId, {
                resolve(value) {
                    if (timeoutId && global.clearTimeout) global.clearTimeout(timeoutId);
                    resolve({ status: 'ready', report: value.report, commandResult: value.commandResult || null });
                }
            });
            try { target.postMessage(Object.assign({ type, requestId, version: resolveVersion() }, payload || {})); }
            catch (error) {
                if (timeoutId && global.clearTimeout) global.clearTimeout(timeoutId);
                integrityCommandWaiters.delete(requestId);
                resolve({ status: 'error', report: lastInstallReport, commandResult: null, error });
            }
        });
    }

    async function retryFailedIntegrityAssets(options) {
        const opts = options || {};
        const report = lastInstallReport || {};
        const periodic = report.periodicIntegrity || {};
        const files = Array.from(new Set((Array.isArray(opts.files) ? opts.files : [])
            .concat(periodic.repairFailed || [], periodic.missing || [], periodic.invalid || [], periodic.corrupted || [], Object.keys(report.integrityBackoff || {}))
            .map(value => String(value || '')).filter(Boolean))).slice(0, 64);
        const outcome = await requestIntegrityCommand('ai-shorts-service-worker-integrity-retry-request', { files }, opts);
        const result = outcome.commandResult || {};
        addDiagnostic({ type: 'service-worker-integrity-retry-complete', requested: Number(result.requested) || 0, repaired: Number(result.repaired) || 0, failed: Number(result.failed) || 0 });
        emitStatus();
        return Object.freeze({ status: outcome.status, requested: Number(result.requested) || 0, repaired: Number(result.repaired) || 0, failed: Number(result.failed) || 0, files: Array.isArray(result.files) ? result.files.slice(0, 64) : [], report: outcome.report });
    }

    async function clearIntegrityAuditHistory(options) {
        const opts = options || {};
        const outcome = await requestIntegrityCommand('ai-shorts-service-worker-integrity-clear-request', { clearBackoff: Boolean(opts.clearBackoff), clearLatest: Boolean(opts.clearLatest) }, opts);
        const result = outcome.commandResult || {};
        addDiagnostic({ type: 'service-worker-integrity-history-cleared', clearedHistory: Number(result.clearedHistory) || 0, clearedBackoff: Number(result.clearedBackoff) || 0 });
        emitStatus();
        return Object.freeze({ status: outcome.status, clearedHistory: Number(result.clearedHistory) || 0, clearedBackoff: Number(result.clearedBackoff) || 0, report: outcome.report });
    }

    function scheduleIntegrityAudit(delayMs) {
        if (!global.document || typeof global.setTimeout !== 'function' || !canRegister()) return false;
        if (integrityAuditTimer && global.clearTimeout) global.clearTimeout(integrityAuditTimer);
        const waitMs = Math.max(1000, Number(delayMs) || INTEGRITY_AUDIT_INTERVAL_MS);
        const nextAuditAt = new Date(Date.now() + waitMs).toISOString();
        integrityAuditStatus = Object.freeze(Object.assign({}, integrityAuditStatus, { nextAuditAt }));
        integrityAuditTimer = global.setTimeout(() => {
            integrityAuditTimer = 0;
            if (global.document.hidden || global.navigator && global.navigator.onLine === false) {
                scheduleIntegrityAudit(Math.min(INTEGRITY_AUDIT_INTERVAL_MS, 60_000));
                return;
            }
            const run = () => requestIntegrityAudit({ sampleSize: INTEGRITY_AUDIT_SAMPLE_SIZE, source: 'scheduled' }).finally(() => scheduleIntegrityAudit(INTEGRITY_AUDIT_INTERVAL_MS));
            if (typeof global.requestIdleCallback === 'function') global.requestIdleCallback(run, { timeout: 5000 });
            else run();
        }, waitMs);
        emitStatus();
        return true;
    }
    function integrityDiagnosticsFilename() {
        const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z').replace('T', '-');
        return `ai-shorts-service-worker-integrity-${stamp}.json`;
    }
    function exportIntegrityDiagnostics() {
        const report = lastInstallReport || {};
        const payload = {
            app: 'AI Shorts Studio',
            exportType: 'service-worker-integrity-diagnostics',
            appVersion: resolveVersion(),
            exportedAt: new Date().toISOString(),
            cacheName: report.cacheName || '',
            contentVerified: Boolean(report.contentVerified),
            activationVerified: Boolean(report.activationVerified),
            integrityManifest: report.integrityManifest || null,
            latestAudit: report.periodicIntegrity || null,
            auditHistory: Array.isArray(report.integrityHistory) ? report.integrityHistory : [],
            assetBackoff: report.integrityBackoff || {},
            rollbackPreserved: Array.isArray(report.rollbackPreserved) ? report.rollbackPreserved : []
        };
        const filename = integrityDiagnosticsFilename();
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const downloadService = global.AIShortsDownloadService || {};
        if (typeof downloadService.saveBlob === 'function') {
            downloadService.saveBlob(blob, filename);
            return Object.freeze({ saved: true, filename, historyCount: payload.auditHistory.length, backoffCount: Object.keys(payload.assetBackoff).length, payload });
        }
        if (!global.URL || typeof global.URL.createObjectURL !== 'function' || !global.document) return Object.freeze({ saved: false, filename, historyCount: payload.auditHistory.length, backoffCount: Object.keys(payload.assetBackoff).length, payload });
        const url = global.URL.createObjectURL(blob);
        const anchor = global.document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        anchor.rel = 'noopener';
        global.document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        global.setTimeout(() => { try { global.URL.revokeObjectURL(url); } catch (_) { /* no-op */ } }, Math.max(10000, Number(config.DOWNLOAD_URL_REVOKE_DELAY_MS) || 45000));
        return Object.freeze({ saved: true, filename, historyCount: payload.auditHistory.length, backoffCount: Object.keys(payload.assetBackoff).length, payload });
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
        bindVisibilityListeners();
        registrationPromise = global.navigator.serviceWorker.register(opts.scriptUrl).then(async registration => {
            registrationRef = registration || null;
            watchRegistration(registrationRef);
            await requestUpdate(registrationRef, 'register');
            requestInstallReport();
            scheduleIntegrityAudit(INTEGRITY_AUDIT_INITIAL_DELAY_MS);
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
        await Promise.race([serviceWorker.ready, delay(Math.max(0, Number(opts.timeoutMs) || 0))]);
        return Object.assign({}, result, { controlled: Boolean(serviceWorker.controller), lifecycle: getStatus() });
    }
    async function checkForUpdate(options) {
        const hadRegistration = Boolean(registrationPromise || registrationRef);
        const result = await register(options);
        if (!result || result.status !== 'ready') return result;
        const checked = hadRegistration ? await requestUpdate(result.registration || registrationRef, 'manual') : true;
        return Object.assign({}, result, { updateChecked: checked, lifecycle: getStatus() });
    }

    global.AIShortsServiceWorkerRegistration = Object.freeze({ register, checkForUpdate, waitUntilControlled, getStatus, canRegister, resolveVersion, requestInstallReport, repairCache, requestIntegrityAudit, retryFailedIntegrityAssets, clearIntegrityAuditHistory, scheduleIntegrityAudit, exportIntegrityDiagnostics });
})(window);
