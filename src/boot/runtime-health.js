// AI Shorts Studio v1.5.27 - runtime, analysis cache, storage, and service worker health monitor
'use strict';

(function exposeRuntimeHealth(global) {
    const config = global.AIShortsRuntimeConfig || {};
    const errorHistory = [];
    const errorKeys = new Set();
    const maxErrors = Math.max(5, Math.min(50, Number(config.DIAGNOSTIC_HISTORY_LIMIT || 20)));
    let captureInstalled = false;

    function supportsCanvasCapture() {
        return Boolean(global.HTMLCanvasElement && global.HTMLCanvasElement.prototype && global.HTMLCanvasElement.prototype.captureStream);
    }

    function supportsMediaCapture() {
        return Boolean(global.HTMLMediaElement && global.HTMLMediaElement.prototype && (global.HTMLMediaElement.prototype.captureStream || global.HTMLMediaElement.prototype.mozCaptureStream));
    }

    function normalizeError(value, fallback) {
        if (value instanceof Error) return { name: value.name || 'Error', message: value.message || fallback || '알 수 없는 오류', stack: value.stack || '' };
        if (value && typeof value === 'object') return { name: value.name || 'Error', message: value.message || String(value.reason || fallback || '알 수 없는 오류'), stack: value.stack || '' };
        return { name: 'Error', message: String(value || fallback || '알 수 없는 오류'), stack: '' };
    }

    function recordError(value, source) {
        const normalized = normalizeError(value);
        const key = `${source || 'runtime'}|${normalized.name}|${normalized.message}`;
        if (errorKeys.has(key)) return;
        errorKeys.add(key);
        const item = Object.freeze({
            source: source || 'runtime',
            name: normalized.name,
            message: normalized.message,
            stack: normalized.stack,
            at: new Date().toISOString()
        });
        errorHistory.unshift(item);
        if (errorHistory.length > maxErrors) {
            const removed = errorHistory.splice(maxErrors);
            removed.forEach(entry => errorKeys.delete(`${entry.source}|${entry.name}|${entry.message}`));
        }
        const store = global.AIShortsAppState;
        if (store && store.addDiagnostic) store.addDiagnostic({ type: 'runtime-error', source: item.source, message: item.message });
        if (global.document && global.document.body) global.document.body.dataset.runtimeErrorCount = String(errorHistory.length);
    }

    function installErrorCapture() {
        if (captureInstalled) return;
        captureInstalled = true;
        global.addEventListener('error', event => {
            recordError(event && (event.error || event.message), 'window.error');
        });
        global.addEventListener('unhandledrejection', event => {
            recordError(event && event.reason, 'unhandledrejection');
        });
    }

    function collect() {
        const body = global.document && global.document.body;
        return {
            webAudio: Boolean(global.AudioContext || global.webkitAudioContext),
            worker: Boolean(global.Worker),
            mediaRecorder: Boolean(global.MediaRecorder),
            canvasCaptureStream: supportsCanvasCapture(),
            mediaCaptureStream: supportsMediaCapture(),
            serviceWorker: Boolean(global.navigator && global.navigator.serviceWorker),
            serviceWorkerControlled: Boolean(global.navigator && global.navigator.serviceWorker && global.navigator.serviceWorker.controller),
            secureContext: Boolean(global.isSecureContext),
            crossOriginIsolated: Boolean(global.crossOriginIsolated),
            hydrationReady: body && body.dataset.hydrationReady || 'core',
            hydrationError: body && body.dataset.hydrationError || '',
            runtimeErrors: errorHistory.length,
            storage: global.AIShortsStorageManager && global.AIShortsStorageManager.status ? global.AIShortsStorageManager.status() : null,
            serviceWorkerLifecycle: global.AIShortsServiceWorkerRegistration && global.AIShortsServiceWorkerRegistration.getStatus ? global.AIShortsServiceWorkerRegistration.getStatus() : null,
            sessionContinuity: global.AIShortsSessionContinuity && global.AIShortsSessionContinuity.getStatus ? global.AIShortsSessionContinuity.getStatus() : null,
            analysisCache: global.AIShortsEngineKernel && global.AIShortsEngineKernel.getHealthReport ? global.AIShortsEngineKernel.getHealthReport().cache : null
        };
    }

    function summaryText() {
        const health = collect();
        const required = ['webAudio', 'worker', 'mediaRecorder', 'canvasCaptureStream'];
        const missing = required.filter(key => !health[key]);
        if (health.runtimeErrors) return `런타임 오류 ${health.runtimeErrors}건 감지`;
        return missing.length ? `제한 기능: ${missing.join(', ')}` : '주요 기능 지원 확인';
    }

    function recentErrors() {
        return errorHistory.slice();
    }

    installErrorCapture();
    global.AIShortsRuntimeHealth = Object.freeze({ collect, summaryText, recentErrors, recordError, installErrorCapture });
})(window);
