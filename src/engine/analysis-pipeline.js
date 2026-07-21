// AI Shorts Studio v1.4.0 - long-media aware modular analysis pipeline
'use strict';

(function exposeAnalysisPipeline(global) {
    const audioExtractor = global.AIShortsAudioFeatureExtractor || {};
    const motionAnalyzer = global.AIShortsVideoMotionAnalyzer || {};
    const autoCutDetector = global.AIShortsAutoCutDetector || {};
    const utils = global.AIShortsCoreUtils || {};

    function clamp(value, min, max) {
        if (utils.clamp) return utils.clamp(value, min, max);
        return Math.min(max, Math.max(min, Number(value) || 0));
    }

    function createFallbackAudioAnalysis(duration) {
        const total = Number(duration) || 30;
        const frames = [];
        for (let time = 0; time < total; time += 0.5) {
            const waveA = Math.sin(time * 0.7);
            const waveB = Math.sin(time * 0.17);
            const value = clamp(0.35 + waveA * 0.18 + waveB * 0.12, 0, 1);
            frames.push({
                time,
                rmsNorm: value,
                peakNorm: clamp(value + 0.12, 0, 1),
                transientNorm: clamp(Math.abs(Math.sin(time * 1.4)) * 0.5, 0, 1),
                silent: false
            });
        }
        return { duration: total, frames, summary: { fallback: true, engine: 'v0.9.6' } };
    }

    function createFallbackWaveform() {
        return new Array(160).fill(0).map((_, i) => 0.18 + Math.sin(i * 0.29) * 0.08);
    }

    async function analyzeMedia(input) {
        const file = input && input.file;
        const fileKind = input && input.fileKind;
        const fileUrl = input && input.fileUrl;
        const fileMeta = Object.assign({}, input && input.fileMeta || {});
        const budget = input && input.budget || {};
        const onProgress = input && input.onProgress || function progressNoop() {};
        const onWarning = input && input.onWarning || function warningNoop() {};
        const getAutoCutOptions = input && input.getAutoCutOptions || function empty() { return {}; };
        const signal = input && input.signal || null;
        function throwIfAborted() {
            if (signal && signal.aborted) {
                const error = new Error(String(signal.reason || '분석이 취소되었습니다.'));
                error.name = 'AbortError';
                throw error;
            }
        }
        const result = {
            audioBuffer: null,
            channelData: null,
            audioAnalysis: null,
            motionAnalysis: null,
            autoCuts: null,
            waveformBins: [],
            fileMeta,
            warnings: [],
            engine: {
                version: '0.9.6',
                mode: budget.label || '모듈형 엔진',
                budget
            }
        };

        function warn(message) {
            result.warnings.push(message);
            onWarning(message);
        }

        throwIfAborted();
        onProgress(6, '모듈형 엔진 준비 중');
        let audioResult = null;
        try {
            if (!audioExtractor.analyzeFileAudio) throw new Error('오디오 분석 모듈이 비활성화되어 있습니다.');
            audioResult = await audioExtractor.analyzeFileAudio(file, onProgress, signal, {
                maxSeconds: Number(budget.audioMaxSeconds || 1800),
                targetSampleRate: Number(budget.analysisSampleRate || 8000),
                retainDecoded: Boolean(budget.retainDecoded),
                retainChannelData: Boolean(budget.retainChannelData)
            });
            throwIfAborted();
        } catch (audioError) {
            if (audioError && audioError.name === 'AbortError') throw audioError;
            if (fileKind !== 'video') throw audioError;
            warn('비디오 오디오 디코딩 제한으로 움직임 중심 보조 분석을 사용합니다.');
        }

        if (audioResult) {
            result.audioBuffer = audioResult.decoded || null;
            result.channelData = audioResult.channelData || null;
            result.audioAnalysis = audioResult.analysis;
            result.waveformBins = audioResult.waveformBins;
            result.engine.audioPreparation = audioResult.preparation || null;
            if (audioResult.preparation && audioResult.preparation.truncated) {
                warn(`원본이 ${Math.round(audioResult.preparation.sourceDuration / 60)}분을 넘어 앞 ${Math.round(audioResult.preparation.analyzedDuration / 60)}분을 분석했습니다.`);
            }
            result.fileMeta.duration = Number(audioResult.analysis && audioResult.analysis.duration) || Number(result.fileMeta.duration) || 0;
        } else {
            result.audioAnalysis = createFallbackAudioAnalysis(Number(fileMeta.duration) || 30);
            result.waveformBins = createFallbackWaveform();
            result.fileMeta.duration = Number(result.audioAnalysis.duration) || Number(result.fileMeta.duration) || 30;
        }

        if (fileKind === 'video' && motionAnalyzer.analyzeVideoMotion) {
            onProgress(72, '영상 움직임 샘플링 중');
            result.motionAnalysis = await motionAnalyzer.analyzeVideoMotion(fileUrl, onProgress, signal, {
                maxSamples: Number(budget.motionSamples || 120)
            });
            throwIfAborted();
            result.fileMeta.duration = Number(result.fileMeta.duration) || Number(result.motionAnalysis && result.motionAnalysis.duration) || 0;
        }

        throwIfAborted();
        if (autoCutDetector.createAutoCuts) {
            onProgress(90, '자동 컷 포인트 계산 중');
            result.autoCuts = autoCutDetector.createAutoCuts(result.audioAnalysis, result.motionAnalysis, getAutoCutOptions());
        }

        throwIfAborted();
        onProgress(93, '엔진 분석 결과 정리 중');
        return result;
    }

    global.AIShortsAnalysisPipeline = Object.freeze({ analyzeMedia, createFallbackAudioAnalysis, createFallbackWaveform });
})(window);
