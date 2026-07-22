// AI Shorts Studio v1.5.14 - lower-peak audio decode with worker stall recovery
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

    function yieldToMainThread() {
        return new Promise(resolve => global.setTimeout(resolve, 0));
    }

    async function decodeFileToAudioBuffer(file, onProgress, signal) {
        if (!file) throw new Error('파일이 없습니다.');
        throwIfAborted(signal);
        const AudioContextClass = global.AudioContext || global.webkitAudioContext;
        if (!AudioContextClass) throw new Error('이 브라우저는 Web Audio 디코딩을 지원하지 않습니다.');
        if (onProgress) onProgress(8, '파일 읽는 중');
        let arrayBuffer = await file.arrayBuffer();
        throwIfAborted(signal);
        if (onProgress) onProgress(18, '오디오 디코딩 중');
        const context = new AudioContextClass();
        try {
            // Passing the original buffer avoids a second full raw-file copy at peak memory.
            const decoded = await context.decodeAudioData(arrayBuffer);
            arrayBuffer = null;
            throwIfAborted(signal);
            if (onProgress) onProgress(34, '오디오 디코딩 완료');
            return decoded;
        } finally {
            arrayBuffer = null;
            if (context.close) await context.close().catch(() => {});
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

    async function createAnalysisMono(audioBuffer, options, onProgress, signal) {
        if (!audioBuffer) return { channelData: new Float32Array(0), sampleRate: 8000, duration: 0, sourceDuration: 0, truncated: false };
        const opts = options || {};
        const sourceRate = Math.max(8000, Number(audioBuffer.sampleRate) || 44100);
        const sourceDuration = Math.max(0, Number(audioBuffer.duration) || (audioBuffer.length / sourceRate));
        const maxSeconds = Math.max(1, Number(opts.maxSeconds || config.MAX_ANALYSIS_SECONDS || 1800));
        const duration = Math.min(sourceDuration, maxSeconds);
        const targetRate = Math.max(4000, Math.min(sourceRate, Number(opts.targetSampleRate || 8000)));
        const targetLength = Math.max(1, Math.floor(duration * targetRate));
        const output = new Float32Array(targetLength);
        const channels = Math.max(1, Number(audioBuffer.numberOfChannels) || 1);
        const sourceChannels = [];
        for (let ch = 0; ch < channels; ch += 1) sourceChannels.push(audioBuffer.getChannelData(ch));
        const sourcePerTarget = sourceRate / targetRate;
        const batchSize = Math.max(4000, Number(config.ANALYSIS_PREP_YIELD_SAMPLES || 24000));

        for (let i = 0; i < targetLength; i += 1) {
            throwIfAborted(signal);
            const sourceIndex = Math.min(audioBuffer.length - 1, Math.floor(i * sourcePerTarget));
            let mixed = 0;
            for (let ch = 0; ch < channels; ch += 1) mixed += (sourceChannels[ch][sourceIndex] || 0) / channels;
            output[i] = mixed;
            if (i > 0 && i % batchSize === 0) {
                if (onProgress) onProgress(35 + Math.round((i / targetLength) * 10), '장시간 미디어 분석 트랙 준비 중');
                await yieldToMainThread();
            }
        }
        throwIfAborted(signal);
        if (onProgress) onProgress(45, '분석 트랙 준비 완료');
        return {
            channelData: output,
            sampleRate: targetRate,
            duration,
            sourceDuration,
            truncated: sourceDuration > duration + 0.05
        };
    }

    async function analyzeChannelData(channelData, sampleRate, duration, onProgress, signal) {
        const core = global.AIShortsAudioAnalysisCore || {};
        const workerUrl = config.ANALYSIS_WORKER_URL || 'src/workers/highlight-analysis.worker.js';
        const store = global.AIShortsAppState;

        async function fallback(reason) {
            if (!core.analyzeAudioAsync) throw new Error(reason || '호환 분석 코어를 불러오지 못했습니다.');
            if (store && store.addDiagnostic) store.addDiagnostic({ type: 'analysis-worker-fallback', message: String(reason || '워커 사용 불가') });
            if (onProgress) onProgress(46, '분석 워커 대체 모드 시작');
            return core.analyzeAudioAsync(channelData, sampleRate, duration, onProgress, signal);
        }

        if (typeof global.Worker !== 'function') return fallback('이 환경은 Web Worker를 지원하지 않습니다.');

        return new Promise((resolve, reject) => {
            let worker;
            let settled = false;
            let stallTimer = 0;
            const stallMs = Math.max(5000, Number(config.ANALYSIS_WORKER_STALL_MS || 45000));

            function clearStallWatch() {
                if (stallTimer) global.clearTimeout(stallTimer);
                stallTimer = 0;
            }
            function armStallWatch() {
                clearStallWatch();
                stallTimer = global.setTimeout(() => useFallback(`분석 워커가 ${Math.round(stallMs / 1000)}초 동안 응답하지 않았습니다.`), stallMs);
            }
            function cleanup() {
                clearStallWatch();
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
                armStallWatch();
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
            worker.onmessageerror = () => useFallback('분석 워커 응답 데이터를 해석하지 못했습니다.');
            const copy = new Float32Array(channelData || 0);
            try {
                worker.postMessage({
                    type: 'analyzeAudio',
                    channelData: copy,
                    sampleRate: Number(sampleRate) || 8000,
                    duration: Number(duration) || 0
                }, [copy.buffer]);
                armStallWatch();
            } catch (error) {
                useFallback('분석 워커 데이터 전송 실패: ' + error.message);
            }
        });
    }

    async function analyzeFileAudio(file, onProgress, signal, options) {
        const opts = Object.assign({
            maxSeconds: Number(config.MAX_ANALYSIS_SECONDS || 1800),
            targetSampleRate: 8000,
            retainDecoded: false,
            retainChannelData: false
        }, options || {});
        let decoded = await decodeFileToAudioBuffer(file, onProgress, signal);
        throwIfAborted(signal);
        const prepared = await createAnalysisMono(decoded, opts, onProgress, signal);
        throwIfAborted(signal);
        const waveformBins = utils.createWaveformBins ? utils.createWaveformBins(prepared.channelData, 220) : [];
        const analysis = await analyzeChannelData(prepared.channelData, prepared.sampleRate, prepared.duration, onProgress, signal);
        throwIfAborted(signal);
        analysis.summary = Object.assign({}, analysis.summary || {}, {
            sourceDuration: prepared.sourceDuration,
            analyzedDuration: prepared.duration,
            analysisSampleRate: prepared.sampleRate,
            truncated: prepared.truncated
        });
        const retainedDecoded = opts.retainDecoded ? decoded : null;
        const retainedChannelData = opts.retainChannelData ? prepared.channelData : null;
        decoded = null;
        return {
            decoded: retainedDecoded,
            channelData: retainedChannelData,
            waveformBins,
            analysis,
            preparation: {
                sourceDuration: prepared.sourceDuration,
                analyzedDuration: prepared.duration,
                sampleRate: prepared.sampleRate,
                sampleCount: prepared.channelData.length,
                approximateBytes: prepared.channelData.byteLength,
                truncated: prepared.truncated
            }
        };
    }

    global.AIShortsAudioFeatureExtractor = Object.freeze({
        decodeFileToAudioBuffer,
        mixToMono,
        createAnalysisMono,
        analyzeChannelData,
        analyzeFileAudio
    });
})(window);
