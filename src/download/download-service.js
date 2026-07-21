// AI Shorts Studio v0.3.0 - download/share/diagnostics service
'use strict';

(function exposeDownloadService(global) {
    const utils = global.AIShortsCoreUtils || {};
    const appState = global.AIShortsAppState || {};
    const state = appState.state || { diagnostics: [] };

    function saveBlob(blob, filename) {
        if (!blob) throw new Error('저장할 파일이 없습니다.');
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename || 'ai-shorts-export.webm';
        anchor.rel = 'noopener';
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        if (appState.addDiagnostic) appState.addDiagnostic({ type: 'download', filename, size: blob.size, mimeType: blob.type });
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

    global.AIShortsDownloadService = Object.freeze({
        saveBlob,
        shareBlob,
        createDiagnosticsSnapshot,
        copyDiagnostics
    });
})(window);
