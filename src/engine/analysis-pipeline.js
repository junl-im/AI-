// AI Shorts Studio v0.9.5 - modular analysis pipeline
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
        return { duration: total, frames, summary: { fallback: true, engine: 'v0.9.5' } };
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
                version: '0.9.5',
                mode: budget.label || '모듈형 엔진',
                budget
            }
        };

        function warn(message) {
            result.warnings.push(message);
            onWarning(message);
        }

        onProgress(6, '모듈형 엔진 준비 중');
        let audioResult = null;
        try {
            if (!audioExtractor.analyzeFileAudio) throw new Error('오디오 분석 모듈이 비활성화되어 있습니다.');
            audioResult = await audioExtractor.analyzeFileAudio(file, onProgress);
        } catch (audioError) {
            if (fileKind !== 'video') throw audioError;
            warn('비디오 오디오 디코딩 제한으로 움직임 중심 보조 분석을 사용합니다.');
        }

        if (audioResult) {
            result.audioBuffer = audioResult.decoded;
            result.channelData = audioResult.channelData;
            result.audioAnalysis = audioResult.analysis;
            result.waveformBins = audioResult.waveformBins;
            result.fileMeta.duration = Number(audioResult.analysis && audioResult.analysis.duration) || Number(result.fileMeta.duration) || 0;
        } else {
            result.audioAnalysis = createFallbackAudioAnalysis(Number(fileMeta.duration) || 30);
            result.waveformBins = createFallbackWaveform();
            result.fileMeta.duration = Number(result.audioAnalysis.duration) || Number(result.fileMeta.duration) || 30;
        }

        if (fileKind === 'video' && motionAnalyzer.analyzeVideoMotion) {
            onProgress(72, '영상 움직임 샘플링 중');
            result.motionAnalysis = await motionAnalyzer.analyzeVideoMotion(fileUrl, onProgress);
            result.fileMeta.duration = Number(result.fileMeta.duration) || Number(result.motionAnalysis && result.motionAnalysis.duration) || 0;
        }

        if (autoCutDetector.createAutoCuts) {
            onProgress(90, '자동 컷 포인트 계산 중');
            result.autoCuts = autoCutDetector.createAutoCuts(result.audioAnalysis, result.motionAnalysis, getAutoCutOptions());
        }

        onProgress(93, '엔진 분석 결과 정리 중');
        return result;
    }

    global.AIShortsAnalysisPipeline = Object.freeze({ analyzeMedia, createFallbackAudioAnalysis, createFallbackWaveform });
})(window);
