// AI Shorts Studio v1.6.15 - isolated preview RAF, timer, playback, and teardown ownership
'use strict';

(function installPreviewController(global) {
    function requireFunction(value, name) {
        if (typeof value !== 'function') throw new Error(`Preview controller requires ${name}`);
        return value;
    }

    function createPreviewController(dependencies) {
        const deps = dependencies || {};
        const state = deps.state || {};
        const elements = deps.elements || {};
        const renderer = deps.renderer || {};
        const qualityEffects = deps.qualityEffects || {};
        const operationCoordinator = deps.operationCoordinator || {};
        const store = deps.store || {};
        const getSelectedRecommendation = requireFunction(deps.getSelectedRecommendation, 'getSelectedRecommendation');
        const getActiveMediaElement = requireFunction(deps.getActiveMediaElement, 'getActiveMediaElement');
        const getSmartReframeOptions = requireFunction(deps.getSmartReframeOptions, 'getSmartReframeOptions');
        const getCaptionOptions = requireFunction(deps.getCaptionOptions, 'getCaptionOptions');
        const getQualityOptions = requireFunction(deps.getQualityOptions, 'getQualityOptions');
        const getActiveCaptionText = requireFunction(deps.getActiveCaptionText, 'getActiveCaptionText');
        const activateFlowTab = requireFunction(deps.activateFlowTab, 'activateFlowTab');
        const updateButtons = requireFunction(deps.updateButtons, 'updateButtons');
        const toast = requireFunction(deps.toast, 'toast');
        const beginOperation = requireFunction(deps.beginOperation, 'beginOperation');
        const assertOperation = requireFunction(deps.assertOperation, 'assertOperation');
        const finishOperation = requireFunction(deps.finishOperation, 'finishOperation');
        const isAbortError = requireFunction(deps.isAbortError, 'isAbortError');

        let playbackRaf = 0;
        let playbackTimer = 0;
        let stillRaf = 0;
        let operationToken = null;
        let disposed = false;

        function requestFrame(callback) {
            return typeof global.requestAnimationFrame === 'function'
                ? global.requestAnimationFrame(callback)
                : global.setTimeout(callback, 16);
        }

        function cancelFrame(handle) {
            if (!handle) return;
            if (typeof global.cancelAnimationFrame === 'function') global.cancelAnimationFrame(handle);
            else global.clearTimeout(handle);
        }

        function renderStillNow() {
            stillRaf = 0;
            if (disposed || !elements.previewCanvas || !renderer.renderStill) return false;
            const selected = getSelectedRecommendation();
            const sourceVideo = elements.sourceVideo;
            const media = state.fileKind === 'video' && sourceVideo && sourceVideo.videoWidth ? sourceVideo : null;
            const qualityOptions = getQualityOptions();
            renderer.renderStill(elements.previewCanvas, media, {
                cropMode: state.settings && state.settings.cropMode,
                smartReframe: state.smartReframe,
                smartReframeOptions: getSmartReframeOptions(),
                title: elements.titleInput ? elements.titleInput.value : 'AI Shorts Studio',
                rangeText: selected ? selected.rangeText : 'AI 추천 대기',
                waveformBins: state.waveformBins,
                time: media ? media.currentTime : 0,
                captionText: getActiveCaptionText(media ? media.currentTime : (selected ? selected.start : 0)),
                captionStyle: state.settings && state.settings.captionStyle,
                captionOptions: getCaptionOptions(),
                thumbnailTemplate: state.settings && state.settings.thumbnailTemplate,
                qualityOptions: Object.assign({}, qualityOptions, { safeGuide: qualityOptions.safeGuide }),
                relativeTime: 0,
                segmentDuration: selected ? selected.duration : 0
            });
            return true;
        }

        function renderStill() {
            if (disposed || stillRaf) return false;
            stillRaf = requestFrame(renderStillNow);
            return true;
        }

        function clearPlaybackHandles() {
            cancelFrame(playbackRaf);
            if (playbackTimer) global.clearInterval(playbackTimer);
            playbackRaf = 0;
            playbackTimer = 0;
        }

        function stop(options) {
            const opts = options || {};
            const media = getActiveMediaElement();
            if (media) {
                try { media.pause(); } catch (_) { /* ignored */ }
                try { media.volume = 1; } catch (_) { /* ignored */ }
            }
            clearPlaybackHandles();
            state.isPreviewing = false;
            if (operationToken) {
                if (opts.cancel && operationCoordinator.cancel) operationCoordinator.cancel('preview', opts.reason || '미리보기 중단');
                else finishOperation(operationToken, opts.result || 'preview-stopped');
                operationToken = null;
            }
            if (elements.previewStatus) elements.previewStatus.textContent = opts.disposed ? '정리됨' : '정지';
            if (!opts.skipStill && !disposed) renderStill();
            updateButtons();
            return true;
        }

        async function playSelectedRange() {
            if (disposed) return false;
            const selected = getSelectedRecommendation();
            const media = getActiveMediaElement();
            if (!selected || !media) return false;
            activateFlowTab('preview', { reveal: true });
            stop({ cancel: true, reason: '새 미리보기 시작', skipStill: true });
            const token = beginOperation('preview', { candidateId: selected.id, start: selected.start, end: selected.end });
            operationToken = token;
            state.isPreviewing = true;
            updateButtons();
            if (elements.previewStatus) elements.previewStatus.textContent = '미리보기 재생 중';
            try {
                media.currentTime = selected.start;
                media.muted = false;
                await media.play();
                assertOperation(token);
            } catch (error) {
                stop({ cancel: true, reason: '미리보기 재생 실패' });
                if (!isAbortError(error)) {
                    if (store.addDiagnostic) store.addDiagnostic({ type: 'preview-playback-error', message: error && error.message || String(error || '') });
                    toast('브라우저가 재생을 막았습니다. 미리보기 버튼을 다시 눌러주세요.', 'warning');
                }
                return false;
            }

            function draw() {
                if (disposed || !state.isPreviewing) return;
                if (token && operationCoordinator.isCurrent && !operationCoordinator.isCurrent(token)) {
                    stop({ cancel: true, reason: '원본 또는 미리보기 변경' });
                    return;
                }
                const isVideo = state.fileKind === 'video' && media.videoWidth;
                const qualityOptions = getQualityOptions();
                renderer.renderStill(elements.previewCanvas, isVideo ? media : null, {
                    cropMode: state.settings && state.settings.cropMode,
                    smartReframe: state.smartReframe,
                    smartReframeOptions: getSmartReframeOptions(),
                    title: elements.titleInput ? elements.titleInput.value : 'AI Shorts Studio',
                    rangeText: selected.rangeText,
                    waveformBins: state.waveformBins,
                    time: media.currentTime,
                    captionText: getActiveCaptionText(media.currentTime),
                    captionStyle: state.settings && state.settings.captionStyle,
                    captionOptions: getCaptionOptions(),
                    thumbnailTemplate: state.settings && state.settings.thumbnailTemplate,
                    qualityOptions: Object.assign({}, qualityOptions, { safeGuide: qualityOptions.safeGuide }),
                    relativeTime: Math.max(0, media.currentTime - selected.start),
                    segmentDuration: selected.duration
                });
                if (qualityEffects.calculateFadeVolume) {
                    const relativeTime = Math.max(0, media.currentTime - selected.start);
                    media.volume = qualityEffects.calculateFadeVolume(relativeTime, selected.duration, qualityOptions);
                }
                playbackRaf = requestFrame(draw);
            }

            draw();
            playbackTimer = global.setInterval(() => {
                if (!media || media.currentTime >= selected.end || media.ended) stop({ result: 'preview-complete' });
            }, 80);
            return true;
        }

        function dispose() {
            if (disposed) return false;
            stop({ cancel: true, reason: '미리보기 컨트롤러 종료', skipStill: true, disposed: true });
            cancelFrame(stillRaf);
            stillRaf = 0;
            disposed = true;
            return true;
        }

        function snapshot() {
            return Object.freeze({
                disposed,
                isPreviewing: Boolean(state.isPreviewing),
                playbackRafActive: Boolean(playbackRaf),
                playbackTimerActive: Boolean(playbackTimer),
                stillRafActive: Boolean(stillRaf),
                operationActive: Boolean(operationToken)
            });
        }

        return Object.freeze({ renderStillNow, renderStill, stop, playSelectedRange, dispose, snapshot });
    }

    global.AIShortsPreviewController = Object.freeze({ createPreviewController });
})(window);
