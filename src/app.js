// AI Shorts Studio v1.5.14 - cancellable analysis, actionable workflow sync, and adaptive engine coordination
'use strict';

(function bootAIShortsStudio(global) {
    const config = global.AIShortsRuntimeConfig || {};
    const utils = global.AIShortsCoreUtils || {};
    const store = global.AIShortsAppState || {};
    const state = store.state;
    const audioExtractor = global.AIShortsAudioFeatureExtractor || {};
    const motionAnalyzer = global.AIShortsVideoMotionAnalyzer || {};
    const autoCutDetector = global.AIShortsAutoCutDetector || {};
    const recEngine = global.AIShortsRecommendationEngine || {};
    const engineKernel = global.AIShortsEngineKernel || {};
    const captionService = global.AIShortsCaptionService || {};
    const projectService = global.AIShortsProjectService || {};
    const projectIOControllerFactory = global.AIShortsProjectIOController || {};
    const mediaImportControllerFactory = global.AIShortsMediaImportController || {};
    const renderer = global.AIShortsVerticalRenderer || {};
    const qualityEffects = global.AIShortsQualityEffects || {};
    const downloadService = global.AIShortsDownloadService || {};
    const renderQueue = global.AIShortsRenderQueue || {};
    const waveformView = global.AIShortsWaveformView || {};
    const cutMarkerOverlay = global.AIShortsCutMarkerOverlay || {};
    const timelineView = global.AIShortsTimelineView || {};
    const siteGuards = global.AIShortsSiteGuards || {};
    const runtimeHealth = global.AIShortsRuntimeHealth || {};
    const serviceWorkerRegistration = global.AIShortsServiceWorkerRegistration || {};
    const operationCoordinator = global.AIShortsOperationCoordinator || {};
    const renderWorkflowController = global.AIShortsRenderWorkflowController || {};
    const settingsControllerFactory = global.AIShortsSettingsController || {};

    const els = {};
    let previewRaf = 0;
    let previewTimer = 0;
    let previewStillRaf = 0;
    let previewOperationToken = null;
    let renderWorkflow = null;
    let settingsController = null;
    let projectIOController = null;
    let mediaImportController = null;


    function isAbortError(error) {
        if (operationCoordinator.isAbortError) return operationCoordinator.isAbortError(error);
        return Boolean(error && error.name === 'AbortError');
    }

    function beginOperation(channel, meta) {
        return operationCoordinator.begin ? operationCoordinator.begin(channel, meta) : null;
    }

    function assertOperation(token, reason) {
        if (token && operationCoordinator.assertCurrent) operationCoordinator.assertCurrent(token, reason);
        return true;
    }

    function finishOperation(token, result) {
        if (token && operationCoordinator.finish) return operationCoordinator.finish(token, { result: result || 'done' });
        return true;
    }

    const CAPTION_DEFAULTS = Object.freeze({
        preset: 'creator',
        position: 'lower',
        size: 58,
        color: '#ffffff',
        accent: '#facc15',
        maxLines: 2,
        boxOpacity: 0.52,
        shadow: 0.78,
        highlightWords: '',
        uppercase: false,
        autoBreak: true
    });

    const CAPTION_PRESETS = Object.freeze({
        creator: { preset: 'creator', position: 'lower', size: 62, color: '#ffffff', accent: '#facc15', maxLines: 2, boxOpacity: 0.58, shadow: 0.86, highlightWords: 'AI,무료,하이라이트', uppercase: false, autoBreak: true },
        news: { preset: 'news', position: 'safe-bottom', size: 52, color: '#111827', accent: '#22d3ee', maxLines: 2, boxOpacity: 0.82, shadow: 0.34, highlightWords: '', uppercase: false, autoBreak: true },
        cinema: { preset: 'cinema', position: 'middle', size: 56, color: '#fef3c7', accent: '#fb7185', maxLines: 2, boxOpacity: 0.36, shadow: 0.92, highlightWords: '', uppercase: false, autoBreak: true },
        minimal: { preset: 'minimal', position: 'lower', size: 46, color: '#cffafe', accent: '#a78bfa', maxLines: 1, boxOpacity: 0.18, shadow: 0.52, highlightWords: '', uppercase: false, autoBreak: true }
    });


    const QUALITY_DEFAULTS = Object.freeze({
        brightness: 1,
        contrast: 1.06,
        saturation: 1.12,
        vignette: 0.22,
        fadeIn: 0.4,
        fadeOut: 1.0,
        introText: '',
        outroText: '',
        introDuration: 1.2,
        outroDuration: 1.2,
        watermarkText: '',
        watermarkPosition: 'bottom-right',
        safeGuide: true
    });

    const AUTO_CUT_DEFAULTS = Object.freeze({
        silenceThreshold: 0.09,
        beatSensitivity: 0.58,
        motionSensitivity: 0.60,
        handlePadding: 0.7,
        maxSnapDistance: 1.4
    });


    function getProjectIOController() {
        if (projectIOController) return projectIOController;
        if (!projectIOControllerFactory.createProjectIOController) return null;
        projectIOController = projectIOControllerFactory.createProjectIOController({
            state, projectService, downloadService, utils, config, store, captionService, elements: els,
            toast, syncSettingsToUI, renderAll
        });
        return projectIOController;
    }


    function getMediaImportController() {
        if (mediaImportController) return mediaImportController;
        if (!mediaImportControllerFactory.createMediaImportController) return null;
        mediaImportController = mediaImportControllerFactory.createMediaImportController({
            state, utils, store, elements: els, operationCoordinator, renderQueue, toast, stopPreview,
            setupMediaPreview, renderAll, updateButtons, activateFlowTab, setProgress, analyzeCurrentFile
        });
        return mediaImportController;
    }

    function getSettingsController() {
        if (settingsController) return settingsController;
        if (!settingsControllerFactory.createSettingsController) return null;
        settingsController = settingsControllerFactory.createSettingsController({
            state, store, elements: els, captionDefaults: CAPTION_DEFAULTS, captionPresets: CAPTION_PRESETS,
            qualityDefaults: QUALITY_DEFAULTS, autoCutDefaults: AUTO_CUT_DEFAULTS, qualityEffects, autoCutDetector
        });
        return settingsController;
    }

    function $(id) { return document.getElementById(id); }

    function initElements() {
        [
            'programInfoBtn', 'selectedBadge', 'dropZone', 'fileDrop', 'fileInput', 'importStatus',
            'durationSelect', 'styleSelect', 'cropModeSelect', 'platformSelect', 'analyzeBtn', 'analysisCancelBtn',
            'analysisStatus', 'progressBar', 'recommendationList', 'recommendationCount', 'previewStatus',
            'previewCanvas', 'sourceVideo', 'sourceAudio', 'previewBtn', 'stopPreviewBtn', 'exportBtn',
            'waveformCanvas', 'timelineView', 'selectedRangeText', 'titleInput', 'hashtagInput',
            'copyCaptionBtn', 'diagnosticsBtn', 'infoDialog', 'infoCloseBtn', 'toast',
            'rangeStartInput', 'rangeEndInput', 'applyRangeBtn', 'thumbnailBtn',
            'captionStatus', 'captionStyleSelect', 'captionOffsetInput', 'captionTextInput',
            'captionFileInput', 'applyCaptionBtn', 'clearCaptionBtn', 'saveProjectBtn', 'projectFileInput',
            'exportAllBtn', 'thumbnailTemplateSelect', 'batchLimitSelect',
            'captionResetBtn', 'captionPositionSelect', 'captionMaxLinesSelect', 'captionSizeInput',
            'captionSizeValue', 'captionBoxOpacityInput', 'captionBoxOpacityValue',
            'captionShadowInput', 'captionShadowValue', 'captionColorSelect', 'captionAccentSelect',
            'captionHighlightInput', 'captionUppercaseToggle', 'captionAutoBreakToggle',
            'brightnessInput', 'brightnessValue', 'contrastInput', 'contrastValue', 'saturationInput', 'saturationValue',
            'vignetteInput', 'vignetteValue', 'fadeInSelect', 'fadeOutSelect', 'introTextInput', 'outroTextInput',
            'introDurationSelect', 'outroDurationSelect', 'watermarkTextInput', 'watermarkPositionSelect',
            'safeGuideToggle', 'qualityResetBtn', 'copyBoostBtn',
            'autoCutSummary', 'tempoScoreText', 'silenceRiskText', 'cutCountText', 'autoCutTimelineList',
            'silenceThresholdInput', 'silenceThresholdValue', 'beatSensitivityInput', 'beatSensitivityValue',
            'motionSensitivityInput', 'motionSensitivityValue', 'handlePaddingSelect', 'autoTrimBtn', 'autoTrimAllBtn', 'refreshCutsBtn',
            'cutMarkerOverlay', 'cutMarkerFocusText', 'snapStartCutBtn', 'snapEndCutBtn', 'engineStatusText',
            'flowPreviewBtn', 'flowThumbnailBtn', 'flowExportBtn', 'flowExportAllBtn',
            'hyperflowStageTitle', 'hyperflowStageMeta', 'hyperflowStageIcon', 'autoplayPreviewToggle',
            'renderQueueStatus', 'renderQueueList', 'renderQueueCancelBtn', 'renderQueueRetryBtn', 'renderQueueClearBtn'
        ].forEach(id => { els[id] = $(id); });
    }

    function toast(message, kind) {
        if (!els.toast) return;
        if (global.AIShortsFeedbackUX && global.AIShortsFeedbackUX.setToastKind) {
            const nextKind = kind || global.AIShortsFeedbackUX.classifyText && global.AIShortsFeedbackUX.classifyText(message) || 'action';
            global.AIShortsFeedbackUX.setToastKind(els.toast, nextKind);
            if (global.AIShortsFeedbackUX.announce) global.AIShortsFeedbackUX.announce(message, nextKind);
        }
        els.toast.textContent = message;
        els.toast.classList.add('toast-visible');
        clearTimeout(els.toast._timer);
        els.toast._timer = setTimeout(() => els.toast.classList.remove('toast-visible'), 2600);
    }

    function setProgress(percent, status) {
        if (els.progressBar) els.progressBar.style.width = `${Math.max(0, Math.min(100, Number(percent) || 0))}%`;
        if (els.analysisStatus && status) els.analysisStatus.textContent = status;
        updateEngineStatus(status);
    }

    function updateEngineStatus(status) {
        if (!els.engineStatusText) return;
        const meta = state && state.engineMeta || null;
        if (status && state && state.isAnalyzing) {
            els.engineStatusText.textContent = status;
            return;
        }
        if (meta && meta.budget) {
            const modules = meta.registry && meta.registry.count ? `${meta.registry.count}개 모듈` : '모듈 활성';
            const cache = meta.cache && meta.cache.hitRate ? ` · 캐시 ${meta.cache.hitRate}%` : '';
            const stability = meta.contract && meta.contract.score ? ` · 안정 ${meta.contract.score}` : '';
            const strategy = meta.analysisStrategy === 'parallel' ? ' · 동시 분석' : meta.analysisStrategy === 'sequential-safe' ? ' · 안전 순차' : '';
            els.engineStatusText.textContent = `${meta.budget.label || '프로 엔진'} · ${modules}${strategy}${stability}${cache}`;
            return;
        }
        els.engineStatusText.textContent = '대기';
    }


    function hasAnalysisReady() {
        return Boolean(state && (state.audioAnalysis || state.motionAnalysis));
    }

    function activateFlowTab(tab, options) {
        const opts = Object.assign({ reveal: true, force: true, source: 'app-progress' }, options || {});
        let handled = false;
        if (global.AIShortsFlowCommandBridge && global.AIShortsFlowCommandBridge.setTab) {
            global.AIShortsFlowCommandBridge.setTab(tab, opts);
            handled = true;
        } else if (global.AIShortsFlowDirectorFinal && global.AIShortsFlowDirectorFinal.setActive) {
            global.AIShortsFlowDirectorFinal.setActive(tab, opts);
            handled = true;
        } else if (global.AIShortsHyperFlowTabs && global.AIShortsHyperFlowTabs.setActiveFlowTab) {
            global.AIShortsHyperFlowTabs.setActiveFlowTab(tab, opts);
            handled = true;
        } else if (document && document.body) {
            document.body.dataset.activeFlowTab = tab;
        }
        if (!handled) document.dispatchEvent(new CustomEvent('ai-shorts-navigation-request', { detail: { tab, options: opts } }));
    }

    function syncHyperFlow() {
        if (global.AIShortsHyperFlowTabs && global.AIShortsHyperFlowTabs.scheduleSync) {
            global.AIShortsHyperFlowTabs.scheduleSync();
        }
    }

    function syncSettingsToUI() {
        if (!state) return;
        if (els.durationSelect) els.durationSelect.value = state.settings.duration || 'auto';
        if (els.styleSelect) els.styleSelect.value = state.settings.style || 'balanced';
        if (els.cropModeSelect) els.cropModeSelect.value = state.settings.cropMode || 'center';
        if (els.platformSelect) els.platformSelect.value = state.settings.platform || 'youtube';
        if (els.captionStyleSelect) els.captionStyleSelect.value = state.settings.captionStyle || 'bold';
        if (els.captionOffsetInput) els.captionOffsetInput.value = Number(state.settings.captionOffset || 0);
        if (els.thumbnailTemplateSelect) els.thumbnailTemplateSelect.value = state.settings.thumbnailTemplate || 'neon';
        syncCaptionOptionsToUI();
        syncQualityOptionsToUI();
        syncAutoCutOptionsToUI();
    }

    function getCaptionOptions() {
        const controller = getSettingsController();
        return controller ? controller.getCaptionOptions() : Object.assign({}, CAPTION_DEFAULTS);
    }

    function saveCaptionOptions(options) {
        const controller = getSettingsController();
        return controller ? controller.saveCaptionOptions(options) : options;
    }

    function syncCaptionOptionsToUI() {
        const controller = getSettingsController();
        return controller ? controller.syncCaptionOptionsToUI() : null;
    }

    function readCaptionOptionsFromUI() {
        const controller = getSettingsController();
        const result = controller ? controller.readCaptionOptionsFromUI() : null;
        renderPreviewStill();
        return result;
    }

    function applyCaptionPreset(name) {
        const controller = getSettingsController();
        if (controller) controller.applyCaptionPreset(name);
        renderPreviewStill();
        toast(`${name === 'creator' ? '크리에이터' : name === 'news' ? '뉴스형' : name === 'cinema' ? '시네마' : '미니멀'} 자막 프리셋을 적용했습니다.`);
    }

    function resetCaptionOptions() {
        const controller = getSettingsController();
        if (controller) controller.resetCaptionOptions();
        renderPreviewStill();
        toast('자막 디자인을 기본값으로 되돌렸습니다.');
    }


    function getQualityOptions() {
        const controller = getSettingsController();
        return controller ? controller.getQualityOptions() : Object.assign({}, QUALITY_DEFAULTS);
    }

    function saveQualityOptions(options) {
        const controller = getSettingsController();
        return controller ? controller.saveQualityOptions(options) : options;
    }

    function syncQualityOptionsToUI() {
        const controller = getSettingsController();
        return controller ? controller.syncQualityOptionsToUI() : null;
    }

    function readQualityOptionsFromUI() {
        const controller = getSettingsController();
        const result = controller ? controller.readQualityOptionsFromUI() : null;
        renderPreviewStill();
        return result;
    }



    function getRenderPreset() {
        const planner = global.AIShortsRenderQualityPlanner || {};
        const key = planner.getPresetKey ? planner.getPresetKey() : (state.settings && state.settings.renderPreset || 'balanced');
        const presets = planner.presets || {};
        const preset = presets[key] || presets.balanced || { fps: config.PREVIEW_FPS || 30, bitrate: 8, label: '균형' };
        return Object.assign({ key: key || 'balanced', fps: config.PREVIEW_FPS || 30, bitrate: 8, label: '균형' }, preset);
    }

    function getExportFrameRate() {
        const preset = getRenderPreset();
        return Math.max(18, Math.min(30, Number(preset.fps) || Number(config.PREVIEW_FPS || 30)));
    }

    function getExportBitrate() {
        const preset = getRenderPreset();
        const mbps = Math.max(3, Math.min(16, Number(preset.bitrate) || 8));
        return Math.round(mbps * 1000000);
    }

    function getAutoCutOptions() {
        const controller = getSettingsController();
        return controller ? controller.getAutoCutOptions() : Object.assign({}, AUTO_CUT_DEFAULTS);
    }

    function saveAutoCutOptions(options) {
        const controller = getSettingsController();
        return controller ? controller.saveAutoCutOptions(options) : options;
    }

    function syncAutoCutOptionsToUI() {
        const controller = getSettingsController();
        return controller ? controller.syncAutoCutOptionsToUI() : null;
    }

    function readAutoCutOptionsFromUI() {
        const controller = getSettingsController();
        if (controller) controller.readAutoCutOptionsFromUI();
        if (state.audioAnalysis || state.motionAnalysis) {
            buildAutoCutTimeline();
            createRecommendations();
        } else {
            renderAutoCutSummary(null);
        }
    }

    function buildAutoCutTimeline() {
        if (!autoCutDetector.createAutoCuts) return null;
        state.autoCuts = autoCutDetector.createAutoCuts(state.audioAnalysis, state.motionAnalysis, getAutoCutOptions());
        if (store.addDiagnostic) store.addDiagnostic({ type: 'auto-cuts-built', cuts: state.autoCuts && state.autoCuts.summary && state.autoCuts.summary.totalCuts || 0 });
        return state.autoCuts;
    }

    function renderAutoCutSummary(selected) {
        if (!els.autoCutSummary && !els.autoCutTimelineList) return;
        const cuts = state.autoCuts || null;
        const summary = cuts && cuts.summary || null;
        const total = summary ? Number(summary.totalCuts || 0) : 0;
        if (els.autoCutSummary) {
            if (!summary) els.autoCutSummary.textContent = '분석 전';
            else els.autoCutSummary.textContent = `비트 ${summary.beatCuts || 0} · 장면 ${summary.motionCuts || 0} · 무음 ${summary.silenceSegments || 0}`;
        }
        const insight = autoCutDetector.createCutInsight ? autoCutDetector.createCutInsight(selected, cuts) : null;
        if (els.tempoScoreText) els.tempoScoreText.textContent = insight ? String(insight.tempoScore) : '--';
        if (els.silenceRiskText) els.silenceRiskText.textContent = insight ? `${Math.round(insight.silenceRisk * 100)}%` : '--';
        if (els.cutCountText) els.cutCountText.textContent = String(total || 0);
        if (els.autoTrimBtn) els.autoTrimBtn.disabled = !selected || !summary;
        if (els.autoTrimAllBtn) els.autoTrimAllBtn.disabled = !(state.recommendations && state.recommendations.length && summary);
        if (els.refreshCutsBtn) els.refreshCutsBtn.disabled = !(state.audioAnalysis || state.motionAnalysis);
        if (els.autoCutTimelineList) {
            const points = cuts && Array.isArray(cuts.timeline) ? cuts.timeline.slice(0, 10) : [];
            if (!points.length) {
                els.autoCutTimelineList.innerHTML = '<p>분석 후 비트·장면전환·무음 회피 지점이 표시됩니다.</p>';
            } else {
                els.autoCutTimelineList.innerHTML = points.map(point => {
                    const label = point.type === 'beat' ? '비트' : point.type === 'motion' ? '장면' : '무음 회피';
                    const time = utils.formatTime ? utils.formatTime(point.time) : `${point.time.toFixed(1)}s`;
                    const score = Math.round((Number(point.score) || 0) * 100);
                    return `<span class="auto-cut-pill auto-cut-${point.type}"><b>${label}</b>${time}<em>${score}</em></span>`;
                }).join('');
            }
        }
    }

    function applyAutoTrimToRecommendation(item) {
        if (!item || !autoCutDetector.autoTrimRange) return item;
        const totalDuration = Number(state.fileMeta && state.fileMeta.duration) || Number(item.end) || 0;
        const adjusted = autoCutDetector.autoTrimRange(item, state.autoCuts, getAutoCutOptions(), totalDuration);
        item.start = adjusted.start;
        item.end = adjusted.end;
        item.duration = adjusted.duration;
        item.rangeText = utils.formatRange ? utils.formatRange(item.start, item.end) : `${item.start.toFixed(1)} ~ ${item.end.toFixed(1)}`;
        item.autoTrimmed = true;
        item.cutInfo = Object.assign({}, item.cutInfo || {}, adjusted.cutInfo || {});
        item.reasons = Array.from(new Set([...(item.reasons || []), '자동 컷 보정으로 무음·전환 지점을 피해 앞뒤 여유를 맞췄습니다.'])).slice(0, 5);
        return item;
    }

    function autoTrimSelectedRange() {
        const selected = getSelectedRecommendation();
        if (!selected || !state.autoCuts) return;
        applyAutoTrimToRecommendation(selected);
        state.selectedRange = { start: selected.start, end: selected.end, duration: selected.duration, score: selected.score };
        const media = getActiveMediaElement();
        if (media) {
            try { media.currentTime = selected.start; } catch (error) { /* ignored */ }
        }
        updateSelectedRangeControls(selected);
        renderAll();
        toast('선택 구간을 자동 컷 기준으로 보정했습니다.');
    }

    function autoTrimAllRecommendations() {
        if (!state.autoCuts || !(state.recommendations || []).length) return;
        state.recommendations.forEach(applyAutoTrimToRecommendation);
        const selected = getSelectedRecommendation();
        if (selected) state.selectedRange = { start: selected.start, end: selected.end, duration: selected.duration, score: selected.score };
        renderAll();
        toast('모든 추천 후보를 자동 컷 기준으로 보정했습니다.');
    }

    function resetQualityOptions() {
        saveQualityOptions(QUALITY_DEFAULTS);
        syncQualityOptionsToUI();
        renderPreviewStill();
        toast('결과물 품질 설정을 기본값으로 되돌렸습니다.');
    }

    function createBoostedCopy() {
        const selected = getSelectedRecommendation();
        const baseName = String(state.file && state.file.name || 'AI 쇼츠').replace(/\.[^.]+$/, '');
        const platform = state.settings.platform || 'youtube';
        const platformWord = platform === 'reels' ? '릴스' : platform === 'tiktok' ? '틱톡' : '쇼츠';
        const mood = selected && selected.title ? selected.title.replace(/^추천\s*\d+\s*—\s*/, '') : '하이라이트';
        const range = selected && selected.rangeText ? selected.rangeText : 'AI 추천 구간';
        const score = selected && selected.score ? `점수 ${selected.score}` : 'AI 추천';
        const title = `${baseName} ${platformWord} 하이라이트 | ${mood} (${range})`;
        const tags = ['#쇼츠', platform === 'reels' ? '#Reels' : platform === 'tiktok' ? '#TikTok' : '#Shorts', '#AI추천', '#하이라이트', '#음악', '#영상편집', `#${score.replace(/\s+/g, '')}`].join(' ');
        if (els.titleInput) els.titleInput.value = title.slice(0, 95);
        if (els.hashtagInput) els.hashtagInput.value = tags;
        renderPreviewStill();
        toast('제목과 해시태그를 다시 추천했습니다.');
    }


    function createRenderWorkflow() {
        if (!renderWorkflowController.create) throw new Error('렌더 워크플로 컨트롤러를 불러오지 못했습니다.');
        renderWorkflow = renderWorkflowController.create({
            state,
            utils,
            store,
            renderer,
            downloadService,
            renderQueue,
            operationCoordinator,
            elements: els,
            document,
            activateFlowTab,
            stopPreview,
            getActiveMediaElement,
            getQualityOptions,
            getCaptionOptions,
            getExportFrameRate,
            getExportBitrate,
            updateSelectedRangeControls,
            renderAll,
            updateButtons,
            setProgress,
            toast
        });
        return renderWorkflow;
    }

    function getRenderWorkflow() {
        return renderWorkflow || createRenderWorkflow();
    }


    function updateButtons() {
        const hasFile = Boolean(state.file);
        const hasRecs = Boolean(state.recommendations && state.recommendations.length);
        const analysisReady = hasAnalysisReady();
        const queueBusy = Boolean(renderQueue && renderQueue.isRunning && renderQueue.isRunning());
        if (els.analyzeBtn) {
            els.analyzeBtn.disabled = !analysisReady || state.isAnalyzing;
            els.analyzeBtn.textContent = state.isAnalyzing ? '자동 분석 중' : '추천 생성';
            els.analyzeBtn.dataset.icon = state.isAnalyzing ? 'render' : 'spark';
        }
        if (els.analysisCancelBtn) {
            els.analysisCancelBtn.hidden = !state.isAnalyzing;
            els.analysisCancelBtn.disabled = !state.isAnalyzing;
            if (!state.isAnalyzing) {
                els.analysisCancelBtn.textContent = '분석 취소';
                delete els.analysisCancelBtn.dataset.cancelRequested;
            }
        }
        if (els.previewBtn) els.previewBtn.disabled = !hasRecs || state.isPreviewing;
        if (els.stopPreviewBtn) els.stopPreviewBtn.disabled = !state.isPreviewing;
        if (els.exportBtn) els.exportBtn.disabled = !hasRecs || state.isPreviewing || queueBusy;
        if (els.applyRangeBtn) els.applyRangeBtn.disabled = !hasRecs;
        if (els.thumbnailBtn) els.thumbnailBtn.disabled = !hasRecs;
        if (els.exportAllBtn) els.exportAllBtn.disabled = !hasRecs || state.isPreviewing || queueBusy;
        if (els.autoTrimBtn) els.autoTrimBtn.disabled = !hasRecs || !state.autoCuts;
        if (els.autoTrimAllBtn) els.autoTrimAllBtn.disabled = !hasRecs || !state.autoCuts;
        if (els.refreshCutsBtn) els.refreshCutsBtn.disabled = !(state.audioAnalysis || state.motionAnalysis);
        if (els.flowPreviewBtn) els.flowPreviewBtn.disabled = !hasRecs || state.isPreviewing;
        if (els.flowThumbnailBtn) els.flowThumbnailBtn.disabled = !hasRecs;
        if (els.flowExportBtn) els.flowExportBtn.disabled = !hasRecs || state.isPreviewing || queueBusy;
        if (els.flowExportAllBtn) els.flowExportAllBtn.disabled = !hasRecs || state.isPreviewing || queueBusy;
        syncHyperFlow();
        document.dispatchEvent(new CustomEvent('ai-shorts-experience-sync'));
    }

    function getSelectedRecommendation() {
        return (state.recommendations || []).find(item => item.id === state.selectedRecommendationId) || null;
    }

    function getActiveMediaElement() {
        return state.fileKind === 'video' ? els.sourceVideo : els.sourceAudio;
    }


    function getActiveCaptionText(time) {
        if (!captionService.getActiveCue) return '';
        const cue = captionService.getActiveCue(state.captions, time, state.settings.captionOffset);
        return cue ? cue.text : '';
    }


    function getMediaDurationFallback(selected) {
        return Number(state.fileMeta && state.fileMeta.duration) || Number(state.autoCuts && state.autoCuts.duration) || Number(selected && selected.end) || 0;
    }

    function setRecommendationRange(item, start, end, reason) {
        if (!item) return null;
        const maxDuration = getMediaDurationFallback(item);
        const fallbackStart = Math.max(0, Number(start) || 0);
        const fallbackEnd = Math.max(fallbackStart + 1, Number(end) || (fallbackStart + 1));
        const normalized = utils.normalizeMediaRange
            ? utils.normalizeMediaRange(start, end, maxDuration, 1)
            : { start: fallbackStart, end: fallbackEnd };
        item.start = Number(normalized.start.toFixed(2));
        item.end = Number(normalized.end.toFixed(2));
        item.duration = Number(Math.max(0.001, item.end - item.start).toFixed(2));
        item.rangeText = utils.formatRange ? utils.formatRange(item.start, item.end) : `${item.start.toFixed(1)} ~ ${item.end.toFixed(1)}`;
        item.custom = true;
        if (reason) item.reasons = Array.from(new Set([...(item.reasons || []), reason])).slice(0, 5);
        state.selectedRange = { start: item.start, end: item.end, duration: item.duration, score: item.score };
        return item;
    }

    function getAutoCutTimelinePoints() {
        const points = state.autoCuts && Array.isArray(state.autoCuts.timeline) ? state.autoCuts.timeline : [];
        return points.filter(point => Number.isFinite(Number(point.time))).sort((a, b) => Number(a.time) - Number(b.time));
    }

    function findNearestCutPoint(time) {
        const points = getAutoCutTimelinePoints();
        let best = null;
        points.forEach(point => {
            const distance = Math.abs(Number(point.time) - Number(time));
            if (!best || distance < best.distance || (distance === best.distance && (point.score || 0) > (best.score || 0))) {
                best = Object.assign({}, point, { distance });
            }
        });
        return best;
    }

    function renderCutMarkerLayer(selected) {
        if (!cutMarkerOverlay.renderCutMarkers || !els.cutMarkerOverlay) return;
        const duration = getMediaDurationFallback(selected);
        cutMarkerOverlay.renderCutMarkers(els.cutMarkerOverlay, state.autoCuts, selected, duration, {
            onMarkerClick: handleCutMarkerClick,
            onMarkerHover: point => {
                if (els.cutMarkerFocusText && cutMarkerOverlay.summarizeFocusedPoint) els.cutMarkerFocusText.textContent = cutMarkerOverlay.summarizeFocusedPoint(point);
            }
        });
    }

    function updateCutMarkerControls(selected) {
        const enabled = Boolean(selected && getAutoCutTimelinePoints().length);
        if (els.snapStartCutBtn) els.snapStartCutBtn.disabled = !enabled;
        if (els.snapEndCutBtn) els.snapEndCutBtn.disabled = !enabled;
        if (els.cutMarkerFocusText && !enabled) els.cutMarkerFocusText.textContent = state.autoCuts ? '사용할 컷 마커가 없습니다.' : '분석 후 컷 마커가 표시됩니다.';
        if (els.cutMarkerFocusText && enabled && cutMarkerOverlay.summarizeFocusedPoint) els.cutMarkerFocusText.textContent = '컷 마커를 클릭하면 해당 위치로 이동합니다.';
    }

    function handleCutMarkerClick(point) {
        const time = Number(point && point.time);
        if (!Number.isFinite(time)) return;
        const media = getActiveMediaElement();
        if (media) {
            try { media.currentTime = Math.max(0, time); } catch (error) { /* ignored */ }
        }
        if (els.cutMarkerFocusText && cutMarkerOverlay.summarizeFocusedPoint) els.cutMarkerFocusText.textContent = cutMarkerOverlay.summarizeFocusedPoint(point);
        const selected = getSelectedRecommendation();
        if (!selected) {
            renderPreviewStill();
            toast('컷 마커 위치로 이동했습니다.');
            return;
        }
        if (time < selected.start - 0.15) {
            setRecommendationRange(selected, time, selected.end, '컷 마커 클릭으로 시작점을 보정했습니다.');
            renderAll();
            toast('선택 구간 시작점을 컷 마커에 맞췄습니다.');
            return;
        }
        if (time > selected.end + 0.15) {
            setRecommendationRange(selected, selected.start, time, '컷 마커 클릭으로 끝점을 보정했습니다.');
            renderAll();
            toast('선택 구간 끝점을 컷 마커에 맞췄습니다.');
            return;
        }
        renderPreviewStill();
        toast('컷 마커 위치로 이동했습니다.');
    }

    function snapSelectedBoundaryToNearestCut(boundary) {
        const selected = getSelectedRecommendation();
        if (!selected) return;
        const baseTime = boundary === 'end' ? selected.end : selected.start;
        const point = findNearestCutPoint(baseTime);
        if (!point) {
            toast('가까운 컷 마커가 없습니다.');
            return;
        }
        if (boundary === 'end') setRecommendationRange(selected, selected.start, Number(point.time), '가까운 컷 마커에 끝점을 맞췄습니다.');
        else setRecommendationRange(selected, Number(point.time), selected.end, '가까운 컷 마커에 시작점을 맞췄습니다.');
        const media = getActiveMediaElement();
        if (media) {
            try { media.currentTime = boundary === 'end' ? selected.end : selected.start; } catch (error) { /* ignored */ }
        }
        renderAll();
        toast(boundary === 'end' ? '끝점을 가까운 컷 마커에 맞췄습니다.' : '시작점을 가까운 컷 마커에 맞췄습니다.');
    }

    function updateSelectedRangeControls(selected) {
        if (!selected) return;
        if (els.rangeStartInput) els.rangeStartInput.value = Number(selected.start || 0).toFixed(1);
        if (els.rangeEndInput) els.rangeEndInput.value = Number(selected.end || 0).toFixed(1);
    }

    function updateCaptionStatus() {
        if (!els.captionStatus) return;
        const count = (state.captions || []).length;
        els.captionStatus.textContent = captionService.summarize ? captionService.summarize(state.captions) : `${count}개 자막`;
        els.captionStatus.classList.toggle('caption-status-ok', count > 0);
        els.captionStatus.classList.toggle('caption-status-warn', count === 0);
    }

    function renderAll() {
        const selected = getSelectedRecommendation();
        if (waveformView.drawWaveform) waveformView.drawWaveform(els.waveformCanvas, state.waveformBins, state.recommendations, state.selectedRecommendationId, state.fileMeta && state.fileMeta.duration);
        renderCutMarkerLayer(selected);
        if (waveformView.renderRecommendations) waveformView.renderRecommendations(els.recommendationList, state.recommendations, state.selectedRecommendationId, selectRecommendation);
        if (timelineView.renderTimeline) timelineView.renderTimeline(els.timelineView, state.recommendations, state.selectedRecommendationId);
        if (els.recommendationCount) els.recommendationCount.textContent = `${(state.recommendations || []).length}개`;
        if (els.selectedRangeText) els.selectedRangeText.textContent = selected ? selected.rangeText : '구간 없음';
        if (selected) updateSelectedRangeControls(selected);
        updateCaptionStatus();
        renderAutoCutSummary(selected);
        updateCutMarkerControls(selected);
        renderPreviewStill();
        updateButtons();
        updateEngineStatus();
        if (global.AIShortsFlowPolish && global.AIShortsFlowPolish.scheduleSync) global.AIShortsFlowPolish.scheduleSync();
    }

    function renderPreviewStillNow() {
        previewStillRaf = 0;
        if (!els.previewCanvas || !renderer.renderStill) return;
        const selected = getSelectedRecommendation();
        const media = state.fileKind === 'video' && els.sourceVideo.videoWidth ? els.sourceVideo : null;
        const qualityOptions = getQualityOptions();
        renderer.renderStill(els.previewCanvas, media, {
            cropMode: state.settings.cropMode,
            title: els.titleInput ? els.titleInput.value : 'AI Shorts Studio',
            rangeText: selected ? selected.rangeText : 'AI 추천 대기',
            waveformBins: state.waveformBins,
            time: media ? media.currentTime : 0,
            captionText: getActiveCaptionText(media ? media.currentTime : (selected ? selected.start : 0)),
            captionStyle: state.settings.captionStyle,
            captionOptions: getCaptionOptions(),
            thumbnailTemplate: state.settings.thumbnailTemplate,
            qualityOptions: Object.assign({}, qualityOptions, { safeGuide: qualityOptions.safeGuide }),
            relativeTime: 0,
            segmentDuration: selected ? selected.duration : 0
        });
    }

    function renderPreviewStill() {
        if (previewStillRaf) return;
        previewStillRaf = requestAnimationFrame(renderPreviewStillNow);
    }

    function selectRecommendation(id) {
        const item = (state.recommendations || []).find(candidate => candidate.id === id);
        if (!item) return;
        state.selectedRecommendationId = item.id;
        state.selectedRange = { start: item.start, end: item.end, duration: item.duration, score: item.score };
        const copy = recEngine.createCopyForCandidate ? recEngine.createCopyForCandidate(item, state.file && state.file.name, state.settings.platform) : null;
        if (copy) {
            if (els.titleInput) els.titleInput.value = copy.title;
            if (els.hashtagInput) els.hashtagInput.value = copy.hashtags;
        }
        const media = getActiveMediaElement();
        if (media && Number.isFinite(item.start)) {
            try { media.currentTime = Math.max(0, item.start); } catch (error) { /* ignored */ }
        }
        updateSelectedRangeControls(item);
        renderAll();
        activateFlowTab('preview', { reveal: true });
        if (els.autoplayPreviewToggle && els.autoplayPreviewToggle.checked) {
            window.setTimeout(() => {
                if (!state.isPreviewing && els.previewBtn && !els.previewBtn.disabled) previewSelectedRange();
            }, 220);
        }
        toast(els.autoplayPreviewToggle && els.autoplayPreviewToggle.checked ? '선택 완료 · 미리보기 자동 재생을 시작합니다.' : '선택 완료 · 미리보기 탭으로 연결했습니다.', 'action');
    }

    function bindEvents() {
        if (els.fileInput) els.fileInput.addEventListener('change', event => handleFiles(event.target.files));
        if (els.dropZone) {
            els.dropZone.addEventListener('dragover', event => {
                event.preventDefault();
                els.dropZone.classList.add('drag-over');
            });
            els.dropZone.addEventListener('dragleave', () => els.dropZone.classList.remove('drag-over'));
            els.dropZone.addEventListener('drop', event => {
                event.preventDefault();
                els.dropZone.classList.remove('drag-over');
                handleFiles(event.dataTransfer && event.dataTransfer.files);
            });
        }
        if (els.analyzeBtn) els.analyzeBtn.addEventListener('click', generateRecommendationsFromAnalysis);
        if (els.analysisCancelBtn) els.analysisCancelBtn.addEventListener('click', () => {
            if (els.analysisCancelBtn.disabled || !state.isAnalyzing) return;
            const cancelled = operationCoordinator.cancel && operationCoordinator.cancel('analysis', '사용자가 자동 분석을 취소했습니다.');
            if (!cancelled) return;
            els.analysisCancelBtn.disabled = true;
            els.analysisCancelBtn.textContent = '중단 중';
            els.analysisCancelBtn.dataset.cancelRequested = 'true';
            setProgress(0, '분석 취소 요청');
            toast('자동 분석을 안전하게 중단하고 있습니다.', 'warning');
            if (store.addDiagnostic) store.addDiagnostic({ type: 'analysis-cancel-request', fileName: state.file && state.file.name || '' });
            document.dispatchEvent(new CustomEvent('ai-shorts-experience-sync'));
        });
        document.addEventListener('ai-shorts-analysis-request', event => {
            if (!state.file || state.isAnalyzing) return;
            analyzeCurrentFile({ autoGenerate: false, source: event && event.detail && event.detail.source || 'external-request' });
        });
        if (els.previewBtn) els.previewBtn.addEventListener('click', previewSelectedRange);
        if (els.stopPreviewBtn) els.stopPreviewBtn.addEventListener('click', stopPreview);
        if (els.exportBtn) els.exportBtn.addEventListener('click', exportSelectedRange);
        if (els.applyRangeBtn) els.applyRangeBtn.addEventListener('click', applyManualRange);
        if (els.thumbnailBtn) els.thumbnailBtn.addEventListener('click', saveThumbnail);
        if (els.exportAllBtn) els.exportAllBtn.addEventListener('click', exportAllCandidates);
        if (els.applyCaptionBtn) els.applyCaptionBtn.addEventListener('click', applyCaptionsFromText);
        if (els.clearCaptionBtn) els.clearCaptionBtn.addEventListener('click', clearCaptions);
        if (els.captionFileInput) els.captionFileInput.addEventListener('change', handleCaptionFile);
        if (els.saveProjectBtn) els.saveProjectBtn.addEventListener('click', saveProject);
        if (els.projectFileInput) els.projectFileInput.addEventListener('change', handleProjectFile);
        if (els.copyCaptionBtn) els.copyCaptionBtn.addEventListener('click', copyCaption);
        if (els.diagnosticsBtn) els.diagnosticsBtn.addEventListener('click', copyDiagnostics);
        if (els.renderQueueCancelBtn) els.renderQueueCancelBtn.addEventListener('click', () => {
            const cancelled = renderQueue.cancel && renderQueue.cancel('사용자가 렌더 작업을 취소했습니다.');
            if (cancelled) {
                els.renderQueueCancelBtn.disabled = true;
                setProgress(0, '렌더 취소 요청');
                toast('현재 렌더를 안전하게 중단하고 있습니다.', 'warning');
                if (store.addDiagnostic) store.addDiagnostic({ type: 'render-cancel-request' });
            }
        });
        if (els.renderQueueRetryBtn) els.renderQueueRetryBtn.addEventListener('click', async () => {
            try { await getRenderWorkflow().retryFailedJobs(); } catch (error) { toast(error.message || '재시도에 실패했습니다.', 'error'); }
        });
        if (els.renderQueueClearBtn) els.renderQueueClearBtn.addEventListener('click', () => {
            if (renderQueue.clear) renderQueue.clear();
            getRenderWorkflow().renderQueue();
            toast('렌더 큐 목록을 정리했습니다.', 'action');
        });
        if (els.programInfoBtn) els.programInfoBtn.addEventListener('click', () => { if (els.infoDialog) els.infoDialog.hidden = false; });
        if (els.infoCloseBtn) els.infoCloseBtn.addEventListener('click', () => { if (els.infoDialog) els.infoDialog.hidden = true; });
        if (els.infoDialog) els.infoDialog.addEventListener('click', event => { if (event.target === els.infoDialog) els.infoDialog.hidden = true; });
        ['durationSelect', 'styleSelect', 'cropModeSelect', 'platformSelect'].forEach(id => {
            const key = id.replace('Select', '').replace('duration', 'duration').replace('style', 'style').replace('cropMode', 'cropMode').replace('platform', 'platform');
            if (!els[id]) return;
            els[id].addEventListener('change', () => {
                store.setSetting(key, els[id].value);
                renderPreviewStill();
                if ((id === 'durationSelect' || id === 'styleSelect') && state.audioAnalysis) createRecommendations();
            });
        });
        if (els.captionStyleSelect) els.captionStyleSelect.addEventListener('change', () => { store.setSetting('captionStyle', els.captionStyleSelect.value); renderPreviewStill(); });
        if (els.thumbnailTemplateSelect) els.thumbnailTemplateSelect.addEventListener('change', () => { store.setSetting('thumbnailTemplate', els.thumbnailTemplateSelect.value); renderPreviewStill(); });
        if (els.captionOffsetInput) els.captionOffsetInput.addEventListener('change', () => { store.setSetting('captionOffset', Number(els.captionOffsetInput.value) || 0); renderPreviewStill(); updateCaptionStatus(); });
        document.querySelectorAll('.caption-preset').forEach(button => button.addEventListener('click', () => applyCaptionPreset(button.getAttribute('data-caption-preset'))));
        ['captionPositionSelect', 'captionMaxLinesSelect', 'captionSizeInput', 'captionBoxOpacityInput', 'captionShadowInput', 'captionColorSelect', 'captionAccentSelect'].forEach(id => {
            if (!els[id]) return;
            els[id].addEventListener('input', readCaptionOptionsFromUI);
            els[id].addEventListener('change', readCaptionOptionsFromUI);
        });
        if (els.captionHighlightInput) els.captionHighlightInput.addEventListener('input', readCaptionOptionsFromUI);
        if (els.captionUppercaseToggle) els.captionUppercaseToggle.addEventListener('change', readCaptionOptionsFromUI);
        if (els.captionAutoBreakToggle) els.captionAutoBreakToggle.addEventListener('change', readCaptionOptionsFromUI);
        if (els.captionResetBtn) els.captionResetBtn.addEventListener('click', resetCaptionOptions);
        ['brightnessInput', 'contrastInput', 'saturationInput', 'vignetteInput', 'fadeInSelect', 'fadeOutSelect', 'introTextInput', 'outroTextInput', 'introDurationSelect', 'outroDurationSelect', 'watermarkTextInput', 'watermarkPositionSelect'].forEach(id => {
            if (!els[id]) return;
            els[id].addEventListener('input', readQualityOptionsFromUI);
            els[id].addEventListener('change', readQualityOptionsFromUI);
        });
        if (els.safeGuideToggle) els.safeGuideToggle.addEventListener('change', readQualityOptionsFromUI);
        if (els.qualityResetBtn) els.qualityResetBtn.addEventListener('click', resetQualityOptions);
        if (els.copyBoostBtn) els.copyBoostBtn.addEventListener('click', createBoostedCopy);
        ['silenceThresholdInput', 'beatSensitivityInput', 'motionSensitivityInput', 'handlePaddingSelect'].forEach(id => {
            if (!els[id]) return;
            els[id].addEventListener('input', readAutoCutOptionsFromUI);
            els[id].addEventListener('change', readAutoCutOptionsFromUI);
        });
        if (els.autoTrimBtn) els.autoTrimBtn.addEventListener('click', autoTrimSelectedRange);
        if (els.autoTrimAllBtn) els.autoTrimAllBtn.addEventListener('click', autoTrimAllRecommendations);
        if (els.refreshCutsBtn) els.refreshCutsBtn.addEventListener('click', () => { buildAutoCutTimeline(); createRecommendations(); toast('컷 포인트를 다시 계산했습니다.'); });
        if (els.snapStartCutBtn) els.snapStartCutBtn.addEventListener('click', () => snapSelectedBoundaryToNearestCut('start'));
        if (els.snapEndCutBtn) els.snapEndCutBtn.addEventListener('click', () => snapSelectedBoundaryToNearestCut('end'));
        if (els.sourceVideo) els.sourceVideo.addEventListener('loadeddata', renderPreviewStill);
        if (els.sourceAudio) els.sourceAudio.addEventListener('timeupdate', renderPreviewStill);
        if (els.sourceVideo) els.sourceVideo.addEventListener('timeupdate', renderPreviewStill);
        if (els.titleInput) els.titleInput.addEventListener('input', renderPreviewStill);
        global.addEventListener('beforeunload', () => { const controller = getMediaImportController(); if (controller) controller.dispose(); }, { once: true });
    }

    async function handleFiles(fileList) {
        const controller = getMediaImportController();
        return controller ? controller.importFiles(fileList) : false;
    }

    function setupMediaPreview() {
        if (!state.fileUrl) return;
        if (els.sourceVideo) {
            els.sourceVideo.pause();
            els.sourceVideo.removeAttribute('src');
            els.sourceVideo.load();
            els.sourceVideo.classList.toggle('is-visible', state.fileKind === 'video');
        }
        if (els.sourceAudio) {
            els.sourceAudio.pause();
            els.sourceAudio.removeAttribute('src');
            els.sourceAudio.load();
            els.sourceAudio.classList.toggle('is-visible', state.fileKind !== 'video');
        }
        const media = getActiveMediaElement();
        if (!media) return;
        const importBaseText = state.fileMeta ? `${state.fileMeta.name || ''} · ${((Number(state.fileMeta.size) || 0) / 1024 / 1024).toFixed(1)} MB` : '';
        media.onloadedmetadata = () => {
            if (!state.fileMeta || media.src !== state.fileUrl && !media.src.endsWith(state.fileUrl)) return;
            state.fileMeta.duration = Number(media.duration) || 0;
            if (els.importStatus) els.importStatus.textContent = importBaseText + (state.fileMeta.duration ? ` · ${utils.formatTime(state.fileMeta.duration)}` : '');
            renderPreviewStill();
        };
        media.preload = 'metadata';
        media.src = state.fileUrl;
    }

    function waitForActiveMediaMetadata(token) {
        const media = getActiveMediaElement();
        if (!media) return Promise.resolve(0);
        const known = Number(media.duration) || Number(state.fileMeta && state.fileMeta.duration) || 0;
        if (known > 0 && Number.isFinite(known)) return Promise.resolve(known);
        const timeoutMs = Number(config.MEDIA_METADATA_WAIT_MS || 5000);
        return new Promise(resolve => {
            let timer = 0;
            let settled = false;
            const signal = token && token.signal || null;
            function cleanup() {
                media.removeEventListener('loadedmetadata', finish);
                media.removeEventListener('durationchange', finish);
                media.removeEventListener('error', finish);
                if (signal) signal.removeEventListener('abort', finish);
                if (timer) clearTimeout(timer);
            }
            function finish() {
                if (settled) return;
                settled = true;
                cleanup();
                const duration = Number(media.duration) || 0;
                if (duration > 0 && Number.isFinite(duration)) state.fileMeta.duration = duration;
                resolve(duration);
            }
            media.addEventListener('loadedmetadata', finish, { once: true });
            media.addEventListener('durationchange', finish, { once: true });
            media.addEventListener('error', finish, { once: true });
            if (signal) signal.addEventListener('abort', finish, { once: true });
            timer = setTimeout(finish, timeoutMs);
        });
    }

    async function analyzeCurrentFile(options) {
        const analysisOptions = Object.assign({ autoGenerate: false }, options || {});
        if (!state.file) return;
        const inputFile = state.file;
        const inputKind = state.fileKind;
        const inputUrl = state.fileUrl;
        const token = beginOperation('analysis', { fileName: inputFile.name, source: analysisOptions.source || 'manual' });
        state.isAnalyzing = true;
        activateFlowTab('recommend', { reveal: true, force: true, source: analysisOptions.source || 'analysis-start' });
        state.recommendations = [];
        state.selectedRecommendationId = '';
        updateButtons();
        setProgress(3, '분석 시작');
        const reportProgress = (percent, message) => {
            if (token && operationCoordinator.isCurrent && !operationCoordinator.isCurrent(token)) return;
            setProgress(percent, message);
        };
        try {
            setProgress(2, '미디어 길이 확인 중');
            await waitForActiveMediaMetadata(token);
            assertOperation(token);
            const inputMeta = Object.assign({}, state.fileMeta || {});
            if (engineKernel.analyzeMedia) {
                const budget = engineKernel.createBudget ? engineKernel.createBudget(inputMeta, config) : null;
                if (budget && budget.longMedia) {
                    setProgress(4, `${budget.label} · 분석 메모리 약 ${budget.estimatedAnalysisMemoryMb || 0}MB`);
                    if (store.addDiagnostic) store.addDiagnostic({
                        type: 'long-media-budget',
                        duration: inputMeta.duration,
                        sizeMb: budget.sizeMb,
                        sampleRate: budget.analysisSampleRate,
                        estimatedMemoryMb: budget.estimatedAnalysisMemoryMb,
                        estimatedDecodeMemoryMb: budget.estimatedDecodeMemoryMb,
                        memoryRisk: budget.memoryRisk
                    });
                }
                if (budget && budget.hardBlock) {
                    throw new Error(`이 파일은 브라우저 디코딩 예상 메모리가 약 ${budget.estimatedDecodeMemoryMb || 0}MB로 너무 큽니다. MP3·AAC로 변환하거나 파일을 나눠 다시 열어주세요.`);
                }
                if (budget && budget.memoryRisk === 'high') {
                    const memoryMessage = `긴 파일 메모리 주의 · 디코딩 예상 약 ${budget.estimatedDecodeMemoryMb || 0}MB`;
                    setProgress(4, memoryMessage);
                    toast('긴 파일을 안전 모드로 분석합니다. 다른 무거운 탭을 닫으면 더 안정적입니다.', 'warning');
                    if (els.importStatus && !els.importStatus.textContent.includes('메모리 주의')) els.importStatus.textContent += ' · 메모리 주의';
                    if (store.addDiagnostic) store.addDiagnostic({ type: 'decode-memory-warning', estimatedDecodeMemoryMb: budget.estimatedDecodeMemoryMb, sizeMb: budget.sizeMb, duration: budget.duration });
                }
                const result = await engineKernel.analyzeMedia({
                    file: inputFile,
                    fileKind: inputKind,
                    fileUrl: inputUrl,
                    fileMeta: inputMeta,
                    config,
                    budget,
                    signal: token && token.signal || null,
                    onProgress: reportProgress,
                    onWarning: message => {
                        if (token && operationCoordinator.isCurrent && !operationCoordinator.isCurrent(token)) return;
                        toast(message, 'warning');
                        if (store.addDiagnostic) store.addDiagnostic({ type: 'engine-warning', message });
                    },
                    getAutoCutOptions
                });
                assertOperation(token, '새 원본이 열려 이전 분석 결과를 폐기했습니다.');
                state.audioBuffer = result.audioBuffer;
                state.channelData = result.channelData;
                state.audioAnalysis = result.audioAnalysis;
                state.motionAnalysis = result.motionAnalysis;
                state.autoCuts = result.autoCuts;
                state.waveformBins = result.waveformBins || [];
                state.fileMeta = Object.assign({}, state.fileMeta || {}, result.fileMeta || {});
                state.engineMeta = result.engine || { version: '1.0.8' };
                if (engineKernel.auditRuntime) state.engineMeta.stability = engineKernel.auditRuntime(state);
                if (store.addDiagnostic) store.addDiagnostic({ type: 'engine-analysis', version: '1.0.8', mode: state.engineMeta.mode, budget: state.engineMeta.budget && state.engineMeta.budget.tier });
            } else {
                let audioResult = null;
                try {
                    audioResult = await audioExtractor.analyzeFileAudio(inputFile, reportProgress, token && token.signal || null, {
                        maxSeconds: Number(config.MAX_ANALYSIS_SECONDS || 1800),
                        targetSampleRate: 8000,
                        retainDecoded: false,
                        retainChannelData: false
                    });
                    assertOperation(token);
                } catch (audioError) {
                    if (isAbortError(audioError)) throw audioError;
                    if (inputKind !== 'video') throw audioError;
                    toast('비디오 오디오 디코딩이 제한되어 움직임 중심으로 분석합니다.');
                    if (store.addDiagnostic) store.addDiagnostic({ type: 'audio-decode-fallback', message: audioError.message });
                }
                if (audioResult) {
                    state.audioBuffer = audioResult.decoded;
                    state.channelData = audioResult.channelData;
                    state.audioAnalysis = audioResult.analysis;
                    state.waveformBins = audioResult.waveformBins;
                    state.fileMeta.duration = Number(audioResult.analysis.duration) || state.fileMeta.duration;
                } else {
                    state.audioAnalysis = createFallbackAudioAnalysis(state.fileMeta.duration || (els.sourceVideo && els.sourceVideo.duration) || 30);
                    state.waveformBins = new Array(160).fill(0).map((_, i) => 0.18 + Math.sin(i * 0.29) * 0.08);
                }
                if (inputKind === 'video' && motionAnalyzer.analyzeVideoMotion) {
                    state.motionAnalysis = await motionAnalyzer.analyzeVideoMotion(inputUrl, reportProgress, token && token.signal || null, { maxSamples: 120 });
                    assertOperation(token);
                    state.fileMeta.duration = state.fileMeta.duration || state.motionAnalysis.duration;
                }
                setProgress(90, '자동 컷 포인트 계산 중');
                buildAutoCutTimeline();
            }
            assertOperation(token);
            if (analysisOptions.autoGenerate) {
                setProgress(92, '모듈형 추천 엔진 계산 중');
                createRecommendations({ autoSelect: false });
                setProgress(100, '추천 완료');
                toast('쇼츠 추천 구간을 만들었습니다.', 'success');
                activateFlowTab('candidates', { reveal: true });
            } else {
                setProgress(100, '분석 완료 · 추천 탭으로 이동');
                toast('자동 분석 완료 · 추천 탭에서 후보를 생성하세요.', 'success');
                activateFlowTab('recommend', { reveal: true });
            }
            finishOperation(token, 'analysis-complete');
        } catch (error) {
            if (isAbortError(error)) {
                setProgress(0, '분석 취소됨');
                toast('자동 분석을 취소했습니다. 다음 작업 버튼에서 다시 시작할 수 있습니다.', 'warning');
                if (store.addDiagnostic) store.addDiagnostic({ type: 'analysis-cancelled', message: error.message });
            } else {
                setProgress(0, '분석 실패');
                toast(error.message || '분석에 실패했습니다.', 'error');
                if (store.addDiagnostic) store.addDiagnostic({ type: 'analysis-error', message: error.message });
            }
        } finally {
            const current = !token || !operationCoordinator.isCurrent || operationCoordinator.isCurrent(token);
            const operationState = operationCoordinator.snapshot ? operationCoordinator.snapshot() : null;
            const newerAnalysisActive = Boolean(operationState && operationState.active && operationState.active.some(item => item.channel === 'analysis' && (!token || item.id !== token.id)));
            if (current) finishOperation(token, 'analysis-finalized');
            if (state.file === inputFile && !newerAnalysisActive) {
                state.isAnalyzing = false;
                updateButtons();
            }
        }
    }


    function generateRecommendationsFromAnalysis() {
        if (state.isAnalyzing) {
            toast('자동 분석이 끝난 뒤 추천을 생성할 수 있습니다.', 'warning');
            return;
        }
        if (!hasAnalysisReady()) {
            if (state.file) {
                toast('아직 분석 데이터가 없습니다. 파일 자동 분석을 다시 시작합니다.', 'warning');
                analyzeCurrentFile({ autoGenerate: false, source: 'recommend-retry' });
            } else {
                toast('먼저 파일을 열어주세요.', 'warning');
                activateFlowTab('file', { reveal: true });
            }
            return;
        }
        setProgress(92, '추천 생성 중');
        buildAutoCutTimeline();
        createRecommendations({ autoSelect: false });
        setProgress(100, '추천 생성 완료');
        const recommendationCount = (state.recommendations || []).length;
        if (recommendationCount) {
            activateFlowTab('candidates', { reveal: true });
            toast(`${recommendationCount}개 후보를 만들었습니다. 후보 메뉴에서 카드를 선택하세요.`, 'success');
        } else {
            activateFlowTab('recommend', { reveal: true });
            toast('생성된 후보가 없습니다. 길이나 스타일을 바꿔 다시 생성하세요.', 'warning');
        }
        if (global.AIShortsFlowPolish && global.AIShortsFlowPolish.scheduleSync) global.AIShortsFlowPolish.scheduleSync();
        document.dispatchEvent(new CustomEvent('ai-shorts-flow-sync'));
    }

    function createFallbackAudioAnalysis(duration) {
        const total = Number(duration) || 30;
        const frames = [];
        for (let time = 0; time < total; time += 0.5) {
            const value = 0.35 + Math.sin(time * 0.7) * 0.18 + Math.sin(time * 0.17) * 0.12;
            frames.push({
                time,
                rmsNorm: Math.max(0, Math.min(1, value)),
                peakNorm: Math.max(0, Math.min(1, value + 0.12)),
                transientNorm: Math.max(0, Math.min(1, Math.abs(Math.sin(time * 1.4)) * 0.5)),
                silent: false
            });
        }
        return { duration: total, frames, summary: { fallback: true } };
    }

    function createRecommendations(optionsOverride) {
        const createOptions = Object.assign({ autoSelect: false }, optionsOverride || {});
        let recommendations = [];
        const options = {
            duration: state.settings.duration,
            style: state.settings.style,
            count: state.engineMeta && state.engineMeta.budget && state.engineMeta.budget.recommendationCount || config.DEFAULT_CANDIDATE_COUNT || 6,
            autoCuts: state.autoCuts,
            autoCutOptions: getAutoCutOptions()
        };
        if (engineKernel.createRecommendations) {
            recommendations = engineKernel.createRecommendations({
                audioAnalysis: state.audioAnalysis,
                motionAnalysis: state.motionAnalysis,
                autoCuts: state.autoCuts,
                fileMeta: state.fileMeta,
                config,
                options
            });
        } else if (recEngine.createRecommendations) {
            recommendations = recEngine.createRecommendations(state.audioAnalysis, state.motionAnalysis, options);
            if (autoCutDetector.enhanceRecommendations) recommendations = autoCutDetector.enhanceRecommendations(recommendations, state.autoCuts, getAutoCutOptions());
        }
        state.recommendations = recommendations;
        state.selectedRecommendationId = '';
        state.selectedRange = null;
        if (engineKernel.auditRuntime) state.engineMeta = Object.assign({}, state.engineMeta || {}, { stability: engineKernel.auditRuntime(state) });
        if (store.addDiagnostic) store.addDiagnostic({ type: 'engine-recommendations', count: recommendations.length, modular: Boolean(engineKernel.createRecommendations) });
        if (recommendations.length && createOptions.autoSelect) selectRecommendation(recommendations[0].id);
        else renderAll();
    }

    function stopPreview(options) {
        const opts = options || {};
        const media = getActiveMediaElement();
        if (media) {
            media.pause();
            media.volume = 1;
        }
        if (previewRaf) cancelAnimationFrame(previewRaf);
        if (previewTimer) clearInterval(previewTimer);
        previewRaf = 0;
        previewTimer = 0;
        state.isPreviewing = false;
        if (previewOperationToken) {
            if (opts.cancel && operationCoordinator.cancel) operationCoordinator.cancel('preview', opts.reason || '미리보기 중단');
            else finishOperation(previewOperationToken, opts.result || 'preview-stopped');
            previewOperationToken = null;
        }
        if (els.previewStatus) els.previewStatus.textContent = '정지';
        renderPreviewStill();
        updateButtons();
    }


    async function previewSelectedRange() {
        const selected = getSelectedRecommendation();
        const media = getActiveMediaElement();
        if (!selected || !media) return;
        activateFlowTab('preview', { reveal: true });
        stopPreview({ cancel: true, reason: '새 미리보기 시작' });
        const token = beginOperation('preview', { candidateId: selected.id, start: selected.start, end: selected.end });
        previewOperationToken = token;
        state.isPreviewing = true;
        updateButtons();
        if (els.previewStatus) els.previewStatus.textContent = '미리보기 재생 중';
        try {
            media.currentTime = selected.start;
            media.muted = false;
            await media.play();
            assertOperation(token);
        } catch (error) {
            stopPreview({ cancel: true, reason: '미리보기 재생 실패' });
            if (!isAbortError(error)) {
                if (store.addDiagnostic) store.addDiagnostic({ type: 'preview-playback-error', message: error.message });
                toast('브라우저가 재생을 막았습니다. 미리보기 버튼을 다시 눌러주세요.', 'warning');
            }
            return;
        }
        function draw() {
            if (!state.isPreviewing) return;
            if (token && operationCoordinator.isCurrent && !operationCoordinator.isCurrent(token)) {
                stopPreview({ cancel: true, reason: '원본 또는 미리보기 변경' });
                return;
            }
            const isVideo = state.fileKind === 'video' && media.videoWidth;
            renderer.renderStill(els.previewCanvas, isVideo ? media : null, {
                cropMode: state.settings.cropMode,
                title: els.titleInput ? els.titleInput.value : 'AI Shorts Studio',
                rangeText: selected.rangeText,
                waveformBins: state.waveformBins,
                time: media.currentTime,
                captionText: getActiveCaptionText(media.currentTime),
                captionStyle: state.settings.captionStyle,
                captionOptions: getCaptionOptions(),
                thumbnailTemplate: state.settings.thumbnailTemplate,
                qualityOptions: Object.assign({}, getQualityOptions(), { safeGuide: getQualityOptions().safeGuide }),
                relativeTime: Math.max(0, media.currentTime - selected.start),
                segmentDuration: selected.duration
            });
            if (qualityEffects.calculateFadeVolume) {
                const relativeTime = Math.max(0, media.currentTime - selected.start);
                media.volume = qualityEffects.calculateFadeVolume(relativeTime, selected.duration, getQualityOptions());
            }
            previewRaf = requestAnimationFrame(draw);
        }
        draw();
        previewTimer = setInterval(() => {
            if (!media || media.currentTime >= selected.end || media.ended) stopPreview({ result: 'preview-complete' });
        }, 80);
    }


    async function exportSelectedRange() {
        const selected = getSelectedRecommendation();
        if (!selected) return;
        try {
            await getRenderWorkflow().runJobs([getRenderWorkflow().buildExportPayload(selected, 0, 1)]);
        } catch (error) {
            setProgress(0, '내보내기 실패');
            toast(error.message || '내보내기에 실패했습니다.', 'error');
            if (store.addDiagnostic) store.addDiagnostic({ type: 'export-error', message: error.message });
        } finally {
            updateButtons();
        }
    }


    async function exportAllCandidates() {
        const recommendations = Array.isArray(state.recommendations) ? state.recommendations : [];
        if (!recommendations.length || state.isPreviewing) return;
        const limit = Math.max(1, Math.min(recommendations.length, Number(els.batchLimitSelect && els.batchLimitSelect.value) || recommendations.length));
        const queue = recommendations.slice(0, limit).map((item, index) => getRenderWorkflow().buildExportPayload(item, index, limit));
        try {
            setProgress(1, `렌더 큐 준비 · ${queue.length}개`);
            await getRenderWorkflow().runJobs(queue);
        } catch (error) {
            setProgress(0, '일괄 내보내기 실패');
            toast(error.message || '일괄 저장에 실패했습니다.', 'error');
            if (store.addDiagnostic) store.addDiagnostic({ type: 'batch-export-error', message: error.message });
        } finally {
            updateButtons();
        }
    }


    function applyManualRange() {
        const selected = getSelectedRecommendation();
        if (!selected) return;
        const start = Number(els.rangeStartInput && els.rangeStartInput.value);
        const end = Number(els.rangeEndInput && els.rangeEndInput.value);
        setRecommendationRange(selected, start, Number.isFinite(end) ? end : selected.end, '사용자가 직접 조절한 커스텀 구간');
        const media = getActiveMediaElement();
        if (media) {
            try { media.currentTime = selected.start; } catch (error) { /* ignored */ }
        }
        renderAll();
        toast('선택 구간을 적용했습니다.');
    }

    async function saveThumbnail() {
        const selected = getSelectedRecommendation();
        if (!selected || !els.previewCanvas) return;
        const media = state.fileKind === 'video' && els.sourceVideo.videoWidth ? els.sourceVideo : null;
        renderer.renderStill(els.previewCanvas, media, {
            cropMode: state.settings.cropMode,
            title: els.titleInput ? els.titleInput.value : 'AI Shorts Studio',
            rangeText: selected ? selected.rangeText : 'AI 추천 대기',
            waveformBins: state.waveformBins,
            time: media ? media.currentTime : 0,
            captionText: getActiveCaptionText(media ? media.currentTime : selected.start),
            captionStyle: state.settings.captionStyle,
            captionOptions: getCaptionOptions(),
            thumbnailTemplate: state.settings.thumbnailTemplate,
            qualityOptions: Object.assign({}, getQualityOptions(), { safeGuide: false }),
            relativeTime: 0,
            segmentDuration: selected.duration
        });
        const blob = await new Promise(resolve => {
            if (els.previewCanvas.toBlob) els.previewCanvas.toBlob(resolve, 'image/png');
            else resolve(null);
        });
        if (!blob) {
            toast('이 브라우저는 썸네일 저장을 지원하지 않습니다.');
            return;
        }
        const base = utils.safeFileBaseName ? utils.safeFileBaseName(state.file && state.file.name) : 'ai-shorts';
        const template = state.settings.thumbnailTemplate || 'neon';
        const filename = `${base}-${template}-${Math.round(selected.start)}s-thumbnail.png`;
        downloadService.saveBlob(blob, filename);
        toast('썸네일 PNG를 저장했습니다.', 'export');
    }

    function applyCaptionsFromText() {
        const raw = els.captionTextInput ? els.captionTextInput.value : '';
        const maxChars = Number(config.MAX_CAPTION_TEXT_CHARS || 1000000);
        if (raw.length > maxChars) {
            if (store.addDiagnostic) store.addDiagnostic({ type: 'caption-text-too-large', length: raw.length, maxChars });
            toast(`자막 텍스트가 너무 큽니다. ${maxChars.toLocaleString()}자 이하로 줄여주세요.`, 'warning');
            return;
        }
        try {
            let cues = captionService.parseCaptionText ? captionService.parseCaptionText(raw) : [];
            if (!cues.length && captionService.createQuickCaptions) cues = captionService.createQuickCaptions(raw, getSelectedRecommendation(), 6);
            const maxCues = Number(config.MAX_CAPTION_CUES || config.MAX_PROJECT_CAPTIONS || 5000);
            state.captions = cues.slice(0, maxCues);
            if (store.addDiagnostic) store.addDiagnostic({ type: 'captions-applied', count: state.captions.length });
            updateCaptionStatus();
            renderAutoCutSummary(getSelectedRecommendation());
            renderPreviewStill();
            toast(state.captions.length ? `${state.captions.length}개 자막을 적용했습니다.` : '적용할 자막을 찾지 못했습니다.');
        } catch (error) {
            if (store.addDiagnostic) store.addDiagnostic({ type: 'caption-parse-error', message: error.message });
            toast(error.message || '자막을 처리하지 못했습니다.', 'error');
        }
    }

    function clearCaptions() {
        state.captions = [];
        if (els.captionTextInput) els.captionTextInput.value = '';
        updateCaptionStatus();
        renderAutoCutSummary(getSelectedRecommendation());
        renderPreviewStill();
        toast('자막을 비웠습니다.');
    }

    function handleCaptionFile(event) {
        const file = event && event.target && event.target.files && event.target.files[0];
        if (!file) return;
        const maxBytes = Number(config.MAX_CAPTION_FILE_BYTES || 1024 * 1024);
        if (Number(file.size || 0) > maxBytes) {
            event.target.value = '';
            toast(`자막 파일이 너무 큽니다. ${Math.round(maxBytes / 1024 / 1024)}MB 이하 파일을 사용해주세요.`, 'warning');
            if (store.addDiagnostic) store.addDiagnostic({ type: 'caption-file-too-large', fileName: file.name, fileSize: file.size, maxBytes });
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            if (els.captionTextInput) els.captionTextInput.value = String(reader.result || '');
            applyCaptionsFromText();
        };
        reader.onerror = () => toast('자막 파일을 읽지 못했습니다.');
        reader.readAsText(file);
        event.target.value = '';
    }

    function saveProject() {
        const controller = getProjectIOController();
        return controller ? controller.saveProject() : false;
    }

    function handleProjectFile(event) {
        const controller = getProjectIOController();
        return controller ? controller.handleProjectFile(event) : Promise.resolve(null);
    }

    async function copyCaption() {
        const title = els.titleInput ? els.titleInput.value : '';
        const tags = els.hashtagInput ? els.hashtagInput.value : '';
        try {
            const copied = await utils.copyText(`${title}
${tags}`.trim());
            if (!copied) throw new Error('클립보드 복사 실패');
            toast('제목과 해시태그를 복사했습니다.', 'copy');
        } catch (error) {
            if (store.addDiagnostic) store.addDiagnostic({ type: 'caption-copy-error', message: error && error.message || 'clipboard unavailable' });
            toast('제목과 해시태그를 복사하지 못했습니다. 브라우저 권한과 창 포커스를 확인해주세요.', 'error');
        }
    }

    async function copyDiagnostics() {
        try {
            await downloadService.copyDiagnostics({ health: runtimeHealth.collect ? runtimeHealth.collect() : null });
            toast('진단 JSON을 복사했습니다.', 'copy');
        } catch (error) {
            toast('진단 복사에 실패했습니다.');
        }
    }

    function init() {
        if (!state) return;
        initElements();
        syncSettingsToUI();
        bindEvents();
        createRenderWorkflow();
        if (renderQueue.subscribe) renderQueue.subscribe(renderWorkflow.renderQueue);
        if (siteGuards.blockDropNavigation) siteGuards.blockDropNavigation();
        if (siteGuards.installExitGuard) siteGuards.installExitGuard(() => Boolean(state.file && !state.exportInfo));
        renderAll();
        setProgress(0, runtimeHealth.summaryText ? runtimeHealth.summaryText() : '준비 완료');
        if (serviceWorkerRegistration.register) serviceWorkerRegistration.register();
    }


    global.AIShortsStudioApp = Object.freeze({
        selectRecommendation,
        renderAll,
        applyManualRange,
        exportSelectedRange,
        exportAllCandidates,
        saveThumbnail,
        snapSelectedBoundaryToNearestCut
    });

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})(window);
