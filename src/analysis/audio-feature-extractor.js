// AI Shorts Studio v0.3.0 - audio decode and worker bridge
'use strict';

(function exposeAudioFeatureExtractor(global) {
    const config = global.AIShortsRuntimeConfig || {};
    const utils = global.AIShortsCoreUtils || {};

    async function decodeFileToAudioBuffer(file, onProgress) {
        if (!file) throw new Error('파일이 없습니다.');
        const AudioContextClass = global.AudioContext || global.webkitAudioContext;
        if (!AudioContextClass) throw new Error('이 브라우저는 Web Audio 디코딩을 지원하지 않습니다.');
        if (onProgress) onProgress(8, '파일 읽는 중');
        const arrayBuffer = await file.arrayBuffer();
        if (onProgress) onProgress(18, '오디오 디코딩 중');
        const context = new AudioContextClass();
        try {
            const decoded = await context.decodeAudioData(arrayBuffer.slice(0));
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

    function analyzeChannelData(channelData, sampleRate, duration, onProgress) {
        return new Promise((resolve, reject) => {
            const workerUrl = config.ANALYSIS_WORKER_URL || 'src/workers/highlight-analysis.worker.js';
            let worker;
            try {
                worker = new Worker(workerUrl);
            } catch (error) {
                reject(new Error('분석 워커를 시작할 수 없습니다: ' + error.message));
                return;
            }
            worker.onmessage = event => {
                const message = event.data || {};
                if (message.type === 'progress' && onProgress) {
                    onProgress(message.progress, message.status || '분석 중');
                    return;
                }
                if (message.type === 'result') {
                    worker.terminate();
                    resolve(message.analysis);
                    return;
                }
                if (message.type === 'error') {
                    worker.terminate();
                    reject(new Error(message.message || '분석 실패'));
                }
            };
            worker.onerror = error => {
                worker.terminate();
                reject(new Error(error.message || '분석 워커 오류'));
            };
            const copy = new Float32Array(channelData || 0);
            worker.postMessage({
                type: 'analyzeAudio',
                channelData: copy,
                sampleRate: Number(sampleRate) || 44100,
                duration: Number(duration) || 0
            }, [copy.buffer]);
        });
    }

    async function analyzeFileAudio(file, onProgress) {
        const decoded = await decodeFileToAudioBuffer(file, onProgress);
        const maxSeconds = Number(config.MAX_ANALYSIS_SECONDS || 1200);
        const channelData = mixToMono(decoded, maxSeconds);
        const waveformBins = utils.createWaveformBins ? utils.createWaveformBins(channelData, 220) : [];
        const analysis = await analyzeChannelData(channelData, decoded.sampleRate, Math.min(decoded.duration, maxSeconds), onProgress);
        return { decoded, channelData, waveformBins, analysis };
    }

    global.AIShortsAudioFeatureExtractor = Object.freeze({
        decodeFileToAudioBuffer,
        mixToMono,
        analyzeChannelData,
        analyzeFileAudio
    });
})(window);
