// AI Shorts Studio v1.3.2 - audio decode, worker bridge, and main-thread compatibility fallback
'use strict';

(function exposeAudioFeatureExtractor(global) {
    const config = global.AIShortsRuntimeConfig || {};
    const utils = global.AIShortsCoreUtils || {};

    function abortError(reason) {
        const error = new Error(String(reason || '오디오 분석이 취소되었습니다.'));
        error.name = 'AbortError';
        return error;
    }

    function throwIfAborted(signal) {
        if (signal && signal.aborted) throw abortError(signal.reason);
    }

    async function decodeFileToAudioBuffer(file, onProgress, signal) {
        if (!file) throw new Error('파일이 없습니다.');
        throwIfAborted(signal);
        const AudioContextClass = global.AudioContext || global.webkitAudioContext;
        if (!AudioContextClass) throw new Error('이 브라우저는 Web Audio 디코딩을 지원하지 않습니다.');
        if (onProgress) onProgress(8, '파일 읽는 중');
        const arrayBuffer = await file.arrayBuffer();
        throwIfAborted(signal);
        if (onProgress) onProgress(18, '오디오 디코딩 중');
        const context = new AudioContextClass();
        try {
            const decoded = await context.decodeAudioData(arrayBuffer.slice(0));
            throwIfAborted(signal);
            if (onProgress) onProgress(38, '오디오 디코딩 완료');
            return decoded;
        } finally {
            if (context.close) context.close().catch(() => {});
        }
    }

    function mixToMono(audioBuffer, maxSeconds) {
        if (!audioBuffer) return new Float32Array(0);
        const sampleRate = audioBuffer.sampleRate;
        const totalSamples = Math.min(audioBuffer.length, Math.floor(sampleRate * Math.max(1, Number(maxSeconds || audioBuffer.duration))));
        const output = new Float32Array(totalSamples);
        const channels = Math.max(1, audioBuffer.numberOfChannels || 1);
        for (let ch = 0; ch < channels; ch += 1) {
            const data = audioBuffer.getChannelData(ch);
            for (let i = 0; i < totalSamples; i += 1) output[i] += (data[i] || 0) / channels;
        }
        return output;
    }

    async function analyzeChannelData(channelData, sampleRate, duration, onProgress, signal) {
        const core = global.AIShortsAudioAnalysisCore || {};
        const workerUrl = config.ANALYSIS_WORKER_URL || 'src/workers/highlight-analysis.worker.js';
        const store = global.AIShortsAppState;

        async function fallback(reason) {
            if (!core.analyzeAudioAsync) throw new Error(reason || '호환 분석 코어를 불러오지 못했습니다.');
            if (store && store.addDiagnostic) store.addDiagnostic({ type: 'analysis-worker-fallback', message: String(reason || '워커 사용 불가') });
            if (onProgress) onProgress(40, '분석 워커 대체 모드 시작');
            return core.analyzeAudioAsync(channelData, sampleRate, duration, onProgress, signal);
        }

        if (typeof global.Worker !== 'function') return fallback('이 환경은 Web Worker를 지원하지 않습니다.');

        return new Promise((resolve, reject) => {
            let worker;
            let settled = false;

            function cleanup() {
                if (worker) worker.terminate();
                worker = null;
                if (signal) signal.removeEventListener('abort', onAbort);
            }
            function finish(handler, value) {
                if (settled) return;
                settled = true;
                cleanup();
                handler(value);
            }
            function onAbort() { finish(reject, abortError(signal && signal.reason)); }
            async function useFallback(reason) {
                if (settled) return;
                settled = true;
                cleanup();
                try { resolve(await fallback(reason)); }
                catch (error) { reject(error); }
            }

            if (signal && signal.aborted) {
                reject(abortError(signal.reason));
                return;
            }
            try {
                worker = new global.Worker(workerUrl);
            } catch (error) {
                useFallback('분석 워커 시작 실패: ' + error.message);
                return;
            }
            if (signal) signal.addEventListener('abort', onAbort, { once: true });
            worker.onmessage = event => {
                const message = event.data || {};
                if (message.type === 'progress' && onProgress) {
                    onProgress(message.progress, message.status || '분석 중');
                    return;
                }
                if (message.type === 'result') {
                    finish(resolve, message.analysis);
                    return;
                }
                if (message.type === 'error') useFallback(message.message || '분석 워커 오류');
            };
            worker.onerror = error => useFallback(error.message || '분석 워커 오류');
            const copy = new Float32Array(channelData || 0);
            try {
                worker.postMessage({
                    type: 'analyzeAudio',
                    channelData: copy,
                    sampleRate: Number(sampleRate) || 44100,
                    duration: Number(duration) || 0
                }, [copy.buffer]);
            } catch (error) {
                useFallback('분석 워커 데이터 전송 실패: ' + error.message);
            }
        });
    }

    async function analyzeFileAudio(file, onProgress, signal) {
        const decoded = await decodeFileToAudioBuffer(file, onProgress, signal);
        throwIfAborted(signal);
        const maxSeconds = Number(config.MAX_ANALYSIS_SECONDS || 1200);
        const channelData = mixToMono(decoded, maxSeconds);
        throwIfAborted(signal);
        const waveformBins = utils.createWaveformBins ? utils.createWaveformBins(channelData, 220) : [];
        const analysis = await analyzeChannelData(channelData, decoded.sampleRate, Math.min(decoded.duration, maxSeconds), onProgress, signal);
        throwIfAborted(signal);
        return { decoded, channelData, waveformBins, analysis };
    }

    global.AIShortsAudioFeatureExtractor = Object.freeze({
        decodeFileToAudioBuffer,
        mixToMono,
        analyzeChannelData,
        analyzeFileAudio
    });
})(window);
