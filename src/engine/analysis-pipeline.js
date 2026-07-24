// AI Shorts Studio v1.5.28 - resilient adaptive parallel media analysis pipeline
'use strict';

(function exposeAnalysisPipeline(global) {
    const audioExtractor = global.AIShortsAudioFeatureExtractor || {};
    const motionAnalyzer = global.AIShortsVideoMotionAnalyzer || {};
    const autoCutDetector = global.AIShortsAutoCutDetector || {};
    const utils = global.AIShortsCoreUtils || {};
    const config = global.AIShortsRuntimeConfig || {};
    const ENGINE_VERSION = String(config.APP_VERSION || 'v1.5.28').replace(/^v/i, '');

    function clamp(value, min, max) {
        if (utils.clamp) return utils.clamp(value, min, max);
        return Math.min(max, Math.max(min, Number(value) || 0));
    }

    function isAbortError(error) {
        return Boolean(error && (error.name === 'AbortError' || error.code === 20));
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
        return { duration: total, frames, summary: { fallback: true, engine: `v${ENGINE_VERSION}` } };
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
        const timings = { totalMs: 0, audioMs: 0, motionMs: 0, finalizeMs: 0 };
        const analysisStartedAt = Date.now();
        let lastProgress = 0;

        function throwIfAborted() {
            if (signal && signal.aborted) {
                const error = new Error(String(signal.reason || '분석이 취소되었습니다.'));
                error.name = 'AbortError';
                throw error;
            }
        }

        function progress(percent, message) {
            const next = Math.max(lastProgress, Math.round(clamp(percent, 0, 100)));
            lastProgress = next;
            onProgress(next, message);
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
                version: ENGINE_VERSION,
                mode: budget.label || '모듈형 엔진',
                analysisStrategy: 'sequential',
                budget,
                timings
            }
        };

        function warn(message) {
            result.warnings.push(message);
            onWarning(message);
        }

        async function runAudio(report) {
            const startedAt = Date.now();
            try {
                if (!audioExtractor.analyzeFileAudio) throw new Error('오디오 분석 모듈이 비활성화되어 있습니다.');
                return await audioExtractor.analyzeFileAudio(file, report, signal, {
                    maxSeconds: Number(budget.audioMaxSeconds || 1800),
                    targetSampleRate: Number(budget.analysisSampleRate || 8000),
                    retainDecoded: Boolean(budget.retainDecoded),
                    retainChannelData: Boolean(budget.retainChannelData)
                });
            } finally {
                timings.audioMs = Math.max(0, Date.now() - startedAt);
            }
        }

        async function runMotion(report) {
            const startedAt = Date.now();
            try {
                if (!motionAnalyzer.analyzeVideoMotion) throw new Error('영상 움직임 분석 모듈이 비활성화되어 있습니다.');
                return await motionAnalyzer.analyzeVideoMotion(fileUrl, report, signal, {
                    maxSamples: Number(budget.motionSamples || 120)
                });
            } finally {
                timings.motionMs = Math.max(0, Date.now() - startedAt);
            }
        }

        throwIfAborted();
        progress(6, '모듈형 엔진 준비 중');

        let audioResult = null;
        let motionResult = null;
        const canAnalyzeMotion = fileKind === 'video' && Boolean(motionAnalyzer.analyzeVideoMotion);
        const useParallel = canAnalyzeMotion && Boolean(budget.parallelAnalysis);

        if (useParallel) {
            result.engine.analysisStrategy = 'parallel';
            let audioRatio = 0;
            let motionRatio = 0;
            function reportParallel(kind, percent, message) {
                if (kind === 'audio') audioRatio = Math.max(audioRatio, clamp((Number(percent) - 6) / 70, 0, 1));
                else motionRatio = Math.max(motionRatio, clamp((Number(percent) - 72) / 18, 0, 1));
                const combined = 6 + (audioRatio * 55) + (motionRatio * 27);
                progress(combined, `동시 분석 · ${message || (kind === 'audio' ? '오디오' : '영상')}`);
            }

            const settled = await Promise.allSettled([
                runAudio((percent, message) => reportParallel('audio', percent, message)),
                runMotion((percent, message) => reportParallel('motion', percent, message))
            ]);
            throwIfAborted();

            const audioSettled = settled[0];
            const motionSettled = settled[1];
            if (audioSettled.status === 'fulfilled') audioResult = audioSettled.value;
            else if (isAbortError(audioSettled.reason)) throw audioSettled.reason;
            else warn('비디오 오디오 디코딩 제한으로 움직임 중심 보조 분석을 사용합니다.');

            if (motionSettled.status === 'fulfilled') motionResult = motionSettled.value;
            else if (isAbortError(motionSettled.reason)) throw motionSettled.reason;
            else warn('영상 프레임 샘플링에 실패해 오디오 중심 분석으로 계속합니다.');
            progress(88, '동시 분석 결과 병합 중');
        } else {
            result.engine.analysisStrategy = canAnalyzeMotion ? 'sequential-safe' : 'audio-only';
            try {
                audioResult = await runAudio(progress);
                throwIfAborted();
            } catch (audioError) {
                if (isAbortError(audioError)) throw audioError;
                if (fileKind !== 'video') throw audioError;
                warn('비디오 오디오 디코딩 제한으로 움직임 중심 보조 분석을 사용합니다.');
            }

            if (canAnalyzeMotion) {
                try {
                    progress(72, '영상 움직임 샘플링 중');
                    motionResult = await runMotion(progress);
                    throwIfAborted();
                } catch (motionError) {
                    if (isAbortError(motionError)) throw motionError;
                    warn('영상 프레임 샘플링에 실패해 오디오 중심 분석으로 계속합니다.');
                }
            }
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
            result.audioAnalysis = createFallbackAudioAnalysis(Number(fileMeta.duration) || Number(motionResult && motionResult.duration) || 30);
            result.waveformBins = createFallbackWaveform();
            result.fileMeta.duration = Number(result.audioAnalysis.duration) || Number(result.fileMeta.duration) || 30;
            result.engine.compatibilityFallback = true;
        }

        if (motionResult) {
            result.motionAnalysis = motionResult;
            result.fileMeta.duration = Number(result.fileMeta.duration) || Number(motionResult.duration) || 0;
        }

        throwIfAborted();
        const finalizeStartedAt = Date.now();
        if (autoCutDetector.createAutoCuts) {
            progress(90, '자동 컷 포인트 계산 중');
            result.autoCuts = autoCutDetector.createAutoCuts(result.audioAnalysis, result.motionAnalysis, getAutoCutOptions());
        }

        throwIfAborted();
        progress(93, '엔진 분석 결과 정리 중');
        timings.finalizeMs = Math.max(0, Date.now() - finalizeStartedAt);
        timings.totalMs = Math.max(0, Date.now() - analysisStartedAt);
        result.engine.parallelGainEligible = useParallel;
        return result;
    }

    global.AIShortsAnalysisPipeline = Object.freeze({ analyzeMedia, createFallbackAudioAnalysis, createFallbackWaveform });
})(window);
