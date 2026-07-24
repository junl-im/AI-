// AI Shorts Studio v1.6.9 - download diagnostics with storage and offline lifecycle state
'use strict';

(function exposeDownloadService(global) {
    const utils = global.AIShortsCoreUtils || {};
    const appState = global.AIShortsAppState || {};
    const state = appState.state || { diagnostics: [] };
    const config = global.AIShortsRuntimeConfig || {};
    const REVOKE_DELAY_MS = Math.max(10000, Math.min(5 * 60 * 1000, Number(config.DOWNLOAD_URL_REVOKE_DELAY_MS) || 45000));
    const MAX_ACTIVE_URLS = Math.max(2, Math.min(32, Number(config.MAX_ACTIVE_DOWNLOAD_URLS) || 12));
    const MIN_URL_AGE_MS = Math.max(3000, Math.min(REVOKE_DELAY_MS, Number(config.MIN_DOWNLOAD_URL_AGE_MS) || 10000));
    const activeUrls = new Map();

    function revokeUrl(url, reason) {
        const entry = activeUrls.get(url);
        if (!entry) return false;
        activeUrls.delete(url);
        if (entry.timer) global.clearTimeout(entry.timer);
        try { global.URL.revokeObjectURL(url); } catch (_) { /* no-op */ }
        if (appState.addDiagnostic) appState.addDiagnostic({ type: 'download-url-release', reason: reason || 'scheduled', ageMs: Math.max(0, Date.now() - entry.createdAt), activeUrls: activeUrls.size });
        return true;
    }

    function trimActiveUrls() {
        if (activeUrls.size <= MAX_ACTIVE_URLS) return;
        const now = Date.now();
        for (const [url, entry] of activeUrls.entries()) {
            if (activeUrls.size <= MAX_ACTIVE_URLS) break;
            if (now - entry.createdAt < MIN_URL_AGE_MS) continue;
            revokeUrl(url, 'capacity');
        }
    }

    function scheduleUrlRelease(url) {
        const entry = {
            createdAt: Date.now(),
            timer: global.setTimeout(() => revokeUrl(url, 'scheduled'), REVOKE_DELAY_MS)
        };
        activeUrls.set(url, entry);
        trimActiveUrls();
        return url;
    }

    function releaseAllDownloadUrls(reason) {
        Array.from(activeUrls.keys()).forEach(url => revokeUrl(url, reason || 'manual'));
        return true;
    }

    function getObjectUrlStats() {
        const now = Date.now();
        const ages = Array.from(activeUrls.values()).map(entry => Math.max(0, now - entry.createdAt));
        return Object.freeze({
            active: activeUrls.size,
            limit: MAX_ACTIVE_URLS,
            revokeDelayMs: REVOKE_DELAY_MS,
            oldestAgeMs: ages.length ? Math.max(...ages) : 0
        });
    }

    function saveBlob(blob, filename) {
        if (!blob) throw new Error('저장할 파일이 없습니다.');
        if (!global.URL || typeof global.URL.createObjectURL !== 'function') throw new Error('이 브라우저에서는 파일 저장 URL을 만들 수 없습니다.');
        const url = scheduleUrlRelease(global.URL.createObjectURL(blob));
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename || 'ai-shorts-export.webm';
        anchor.rel = 'noopener';
        document.body.appendChild(anchor);
        try {
            anchor.click();
        } catch (error) {
            revokeUrl(url, 'click-error');
            throw error;
        } finally {
            anchor.remove();
        }
        if (appState.addDiagnostic) appState.addDiagnostic({ type: 'download', filename, size: blob.size, mimeType: blob.type, objectUrlReleaseMs: REVOKE_DELAY_MS });
        return true;
    }

    async function shareBlob(blob, filename, text) {
        if (!navigator.canShare || !navigator.share || typeof File === 'undefined') return false;
        const file = new File([blob], filename, { type: blob.type || 'video/webm' });
        if (!navigator.canShare({ files: [file] })) return false;
        await navigator.share({ files: [file], title: filename, text: text || 'AI 쇼츠 제작 스튜디오 내보내기' });
        if (appState.addDiagnostic) appState.addDiagnostic({ type: 'share', filename, size: blob.size, mimeType: blob.type });
        return true;
    }

    function createDiagnosticsSnapshot(extra) {
        const mediaRecorderTypes = [];
        const candidates = (global.AIShortsRuntimeConfig && global.AIShortsRuntimeConfig.EXPORT_MIME_CANDIDATES) || [];
        if (global.MediaRecorder && typeof global.MediaRecorder.isTypeSupported === 'function') {
            candidates.forEach(type => mediaRecorderTypes.push({ type, supported: global.MediaRecorder.isTypeSupported(type) }));
        }
        return {
            app: 'AI Shorts Studio',
            version: global.AIShortsRuntimeConfig && global.AIShortsRuntimeConfig.APP_VERSION || 'dev',
            at: new Date().toISOString(),
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            standalone: Boolean(navigator.standalone || matchMedia('(display-mode: standalone)').matches),
            capabilities: {
                mediaRecorder: Boolean(global.MediaRecorder),
                canvasCaptureStream: Boolean(HTMLCanvasElement.prototype.captureStream),
                mediaCaptureStream: Boolean(HTMLMediaElement.prototype.captureStream || HTMLMediaElement.prototype.mozCaptureStream),
                webAudio: Boolean(global.AudioContext || global.webkitAudioContext),
                clipboard: Boolean(navigator.clipboard && navigator.clipboard.writeText),
                share: Boolean(navigator.share),
                canShare: Boolean(navigator.canShare),
                fileSystemAccess: Boolean(global.showSaveFilePicker)
            },
            objectUrls: getObjectUrlStats(),
            storage: global.AIShortsStorageManager && global.AIShortsStorageManager.status ? global.AIShortsStorageManager.status() : null,
            serviceWorker: global.AIShortsServiceWorkerRegistration && global.AIShortsServiceWorkerRegistration.getStatus ? global.AIShortsServiceWorkerRegistration.getStatus() : null,
            sessionContinuity: global.AIShortsSessionContinuity && global.AIShortsSessionContinuity.getStatus ? global.AIShortsSessionContinuity.getStatus() : null,
            mediaRecorderTypes,
            currentFile: state.file ? {
                name: state.file.name,
                type: state.file.type,
                size: state.file.size,
                kind: state.fileKind,
                duration: state.fileMeta && state.fileMeta.duration
            } : null,
            selectedRange: state.selectedRange,
            exportInfo: state.exportInfo,
            recentEvents: state.diagnostics || [],
            extra: extra || null
        };
    }

    async function copyDiagnostics(extra) {
        const snapshot = createDiagnosticsSnapshot(extra);
        const copied = await utils.copyText(JSON.stringify(snapshot, null, 2));
        if (!copied) throw new Error('클립보드에 복사할 수 없습니다. 브라우저 권한과 포커스를 확인해주세요.');
        return snapshot;
    }

    if (typeof global.addEventListener === 'function') global.addEventListener('pagehide', () => releaseAllDownloadUrls('pagehide'));

    global.AIShortsDownloadService = Object.freeze({
        saveBlob,
        shareBlob,
        createDiagnosticsSnapshot,
        copyDiagnostics,
        releaseAllDownloadUrls,
        getObjectUrlStats
    });
})(window);
