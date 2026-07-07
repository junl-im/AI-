// AI Shorts Studio v0.2.0 - runtime health
'use strict';

(function exposeRuntimeHealth(global) {
    function collect() {
        return {
            webAudio: Boolean(global.AudioContext || global.webkitAudioContext),
            worker: Boolean(global.Worker),
            mediaRecorder: Boolean(global.MediaRecorder),
            canvasCaptureStream: Boolean(HTMLCanvasElement.prototype.captureStream),
            mediaCaptureStream: Boolean(HTMLMediaElement.prototype.captureStream || HTMLMediaElement.prototype.mozCaptureStream),
            serviceWorker: Boolean(navigator.serviceWorker),
            secureContext: Boolean(global.isSecureContext)
        };
    }

    function summaryText() {
        const health = collect();
        const missing = Object.entries(health).filter(([, ok]) => !ok).map(([key]) => key);
        return missing.length ? `제한 기능: ${missing.join(', ')}` : '주요 기능 지원 확인';
    }

    global.AIShortsRuntimeHealth = Object.freeze({ collect, summaryText });
})(window);
