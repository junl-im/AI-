// AI Shorts Studio v1.6.32 - per-page speaker timing, in-page ordering, and live energy hold visualization
'use strict';

(function bootAIShortsStudio(global) {
    const config = global.AIShortsRuntimeConfig || {};
    const utils = global.AIShortsCoreUtils || {};
    const store = global.AIShortsAppState || {};
    const state = store.state;
    const audioExtractor = global.AIShortsAudioFeatureExtractor || {};
    const motionAnalyzer = global.AIShortsVideoMotionAnalyzer || {};
    function getSmartReframeEngine() { return global.AIShortsSmartReframe || {}; }
    function getSpeakerFaceLinker() { return global.AIShortsSpeakerFaceLinker || {}; }
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
    const previewControllerFactory = global.AIShortsPreviewController || {};
    const analysisControllerFactory = global.AIShortsAnalysisController || {};

    const els = {};
    let previewController = null;
    let analysisController = null;
    let renderWorkflow = null;
    let settingsController = null;
    let projectIOController = null;
    let mediaImportController = null;
    let smartReframeEditorDraft = null;
    let lastSpeakerFaceLinkResult = null;
    let speakerLinkPromise = null;
    let directCropController = null;
    let cropKeyframeTimelineController = null;
    let speakerTuneIndex = -1;
    const speakerCueSelection = new Set();
    const speakerTimelineUndoStack = [];
    const speakerTimelineRedoStack = [];
    const MAX_SPEAKER_TIMELINE_HISTORY = 30;
    let speakerSelectionAnchorIndex = -1;
    let speakerSelectionDragActive = false;
    let speakerSelectionDragValue = true;
    let speakerSelectionPointerId = null;
    let speakerDividerDragActive = false;
    let speakerDividerPointerId = null;
    let speakerDividerDragControl = null;
    let speakerDividerDragSurface = null;
    let speakerManualPageDragIndex = -1;
    let supportDiagnosticsInspection = null;
    let supportDiagnosticsComparison = null;


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

    function getPreviewController() {
        if (previewController) return previewController;
        if (!previewControllerFactory.createPreviewController) return null;
        previewController = previewControllerFactory.createPreviewController({
            state, store, elements: els, renderer, qualityEffects, operationCoordinator,
            getSelectedRecommendation, getActiveMediaElement, getSmartReframeOptions, getCaptionOptions,
            getQualityOptions, getActiveCaptionText, activateFlowTab, updateButtons, toast,
            beginOperation, assertOperation, finishOperation, isAbortError, onRendered: syncSpeakerPreviewOverlay
        });
        return previewController;
    }


    function getAnalysisController() {
        if (analysisController) return analysisController;
        if (!analysisControllerFactory.createAnalysisController) return null;
        analysisController = analysisControllerFactory.createAnalysisController({
            state, config, store, elements: els, audioExtractor, motionAnalyzer, engineKernel, operationCoordinator, downloadService,
            getActiveMediaElement, activateFlowTab, updateButtons, setProgress, toast, ensureMotionSmartReframe,
            getAutoCutOptions, buildAutoCutTimeline, createRecommendations, createFallbackAudioAnalysis,
            beginOperation, assertOperation, finishOperation, isAbortError
        });
        return analysisController;
    }

    function supportDiagnosticsOptions() {
        return {
            config,
            appState: store,
            analysisController: getAnalysisController(),
            visionManager: global.AIShortsVisionModelPacks || {},
            runtimeHealth,
            operationCoordinator,
            serviceWorkerRegistration,
            downloadService
        };
    }

    async function exportSupportDiagnosticsBundle() {
        try {
            const loader = global.AIShortsStagedUiLoader || {};
            if (!global.AIShortsSupportDiagnostics && typeof loader.ensure === 'function') await loader.ensure('shell');
            const service = global.AIShortsSupportDiagnostics || {};
            if (typeof service.exportBundle !== 'function') throw new Error('통합 진단 모듈을 불러오지 못했습니다.');
            const result = service.exportBundle(supportDiagnosticsOptions());
            toast(result && result.saved ? '분석·성능·런타임 통합 진단을 저장했습니다.' : '통합 진단을 저장하지 못했습니다.', result && result.saved ? 'success' : 'warning');
            return result;
        } catch (error) {
            toast(error && error.message || '통합 진단을 만들지 못했습니다.', 'error');
            return null;
        }
    }

    async function ensureSupportDiagnosticsService() {
        const loader = global.AIShortsStagedUiLoader || {};
        if (!global.AIShortsSupportDiagnostics && typeof loader.ensure === 'function') await loader.ensure('shell');
        const service = global.AIShortsSupportDiagnostics || {};
        if (typeof service.inspectFile !== 'function') throw new Error('진단 호환성 검사 모듈을 불러오지 못했습니다.');
        return service;
    }

    function closeSupportDiagnosticsPreview() {
        if (els.supportDiagnosticsDialog) els.supportDiagnosticsDialog.hidden = true;
    }

    function renderSupportDiagnosticsInspection(inspection, comparison) {
        supportDiagnosticsInspection = inspection || null;
        supportDiagnosticsComparison = comparison || null;
        const compatible = Boolean(inspection && inspection.compatible);
        if (els.supportDiagnosticsDialog) els.supportDiagnosticsDialog.hidden = false;
        if (els.supportDiagnosticsState) {
            els.supportDiagnosticsState.dataset.status = compatible ? 'compatible' : 'invalid';
            els.supportDiagnosticsState.textContent = compatible
                ? inspection.migrated ? '호환됨 · 구버전 정규화 필요' : '호환됨 · 읽기 전용 미리보기'
                : '열 수 없음 · 아래 조치 확인';
        }
        if (els.supportDiagnosticsMeta) {
            const file = inspection && inspection.file || {};
            const schema = inspection && inspection.schema || '알 수 없는 형식';
            const version = inspection && inspection.schemaVersion ? `v${inspection.schemaVersion}` : '버전 미상';
            const size = Number(file.size || 0);
            els.supportDiagnosticsMeta.textContent = `${file.name || '진단 JSON'} · ${schema} ${version} · ${size ? `${Math.max(1, Math.round(size / 1024))}KiB` : '크기 미상'}`;
        }
        if (els.supportDiagnosticsSummary) {
            els.supportDiagnosticsSummary.textContent = '';
            const summary = inspection && inspection.summary || {};
            const values = compatible ? [
                ['앱 버전', summary.appVersion || '미상'],
                ['분석 이력', `${Number(summary.analysisHistoryCount || 0)}건`],
                ['벤치마크', `${Number(summary.benchmarkCount || 0)}팩`],
                ['런타임 오류', `${Number(summary.runtimeErrorCount || 0)}건`],
                ['진단 기록', `${Number(summary.diagnosticCount || 0)}건`],
                ['활성 작업', `${Number(summary.activeOperationCount || 0)}건`]
            ] : [['검사 결과', '호환 불가']];
            values.forEach(([labelText, valueText]) => {
                const row = document.createElement('div');
                const label = document.createElement('span');
                const value = document.createElement('strong');
                label.textContent = labelText;
                value.textContent = valueText;
                row.append(label, value);
                els.supportDiagnosticsSummary.appendChild(row);
            });
        }
        if (els.supportDiagnosticsIssueList) {
            els.supportDiagnosticsIssueList.textContent = '';
            const notices = [].concat(inspection && inspection.issues || [], inspection && inspection.warnings || []);
            if (!notices.length) notices.push({ severity: 'success', message: '현재 앱에서 안전하게 미리볼 수 있는 진단 파일입니다.', action: '가져온 데이터는 프로젝트에 자동 적용되지 않습니다.' });
            notices.forEach(item => {
                const row = document.createElement('li');
                row.dataset.severity = item.severity || 'info';
                const message = document.createElement('strong');
                const action = document.createElement('span');
                message.textContent = item.message || '진단 안내';
                action.textContent = item.action || '';
                row.append(message, action);
                els.supportDiagnosticsIssueList.appendChild(row);
            });
        }
        if (els.supportDiagnosticsComparison) {
            els.supportDiagnosticsComparison.hidden = !compatible || !supportDiagnosticsComparison;
        }
        if (els.supportDiagnosticsComparisonSummary) {
            const summary = supportDiagnosticsComparison && supportDiagnosticsComparison.summary || {};
            els.supportDiagnosticsComparisonSummary.textContent = compatible && supportDiagnosticsComparison
                ? `현재 환경과 ${Number(summary.matches || 0)}개 일치 · ${Number(summary.differences || 0)}개 차이 · ${Number(summary.warnings || 0)}개 주의`
                : '호환 가능한 진단을 불러오면 현재 환경과 비교합니다.';
        }
        if (els.supportDiagnosticsComparisonList) {
            els.supportDiagnosticsComparisonList.textContent = '';
            const items = supportDiagnosticsComparison && supportDiagnosticsComparison.items || [];
            items.forEach(item => {
                const row = document.createElement('li');
                row.dataset.status = item.status || 'info';
                const label = document.createElement('strong');
                const values = document.createElement('span');
                const detail = document.createElement('small');
                label.textContent = item.label || item.key || '비교 항목';
                values.textContent = `가져온 값 ${item.imported || '미상'} · 현재 ${item.current || '미상'}`;
                detail.textContent = item.detail || '';
                row.append(label, values, detail);
                els.supportDiagnosticsComparisonList.appendChild(row);
            });
        }
        if (els.supportDiagnosticsNormalizedBtn) els.supportDiagnosticsNormalizedBtn.disabled = !compatible;
        if (els.supportDiagnosticsReportBtn) els.supportDiagnosticsReportBtn.disabled = !compatible;
    }

    async function handleSupportDiagnosticsFile(event) {
        const input = event && event.target;
        const file = input && input.files && input.files[0];
        if (!file) return null;
        try {
            const service = await ensureSupportDiagnosticsService();
            const inspection = await service.inspectFile(file, { maxBytes: Number(config.MAX_SUPPORT_DIAGNOSTIC_FILE_BYTES || 2 * 1024 * 1024) });
            const comparison = typeof service.compareInspectionToCurrent === 'function' ? service.compareInspectionToCurrent(inspection, supportDiagnosticsOptions()) : null;
            renderSupportDiagnosticsInspection(inspection, comparison);
            if (store.addDiagnostic) store.addDiagnostic({ type: 'support-diagnostics-import-preview', status: inspection.compatible ? 'compatible' : inspection.code, schema: inspection.schema || '', schemaVersion: inspection.schemaVersion || 0 });
            toast(inspection.compatible ? '진단 파일을 읽기 전용으로 검사했습니다.' : '진단 파일을 열 수 없습니다. 안내 내용을 확인하세요.', inspection.compatible ? 'success' : 'warning');
            return inspection;
        } catch (error) {
            const fallback = { compatible: false, code: 'import-failed', issues: [{ severity: 'error', message: error && error.message || '진단 파일 검사에 실패했습니다.', action: '파일을 다시 선택하거나 앱에서 진단을 새로 내보내세요.' }], warnings: [], summary: {}, file: { name: file.name || 'diagnostics.json', size: file.size || 0 } };
            renderSupportDiagnosticsInspection(fallback, null);
            toast('진단 파일 검사에 실패했습니다.', 'error');
            return fallback;
        } finally {
            if (input) input.value = '';
        }
    }

    async function exportNormalizedSupportDiagnostics() {
        try {
            const service = await ensureSupportDiagnosticsService();
            const result = service.exportNormalizedInspection(supportDiagnosticsInspection, supportDiagnosticsOptions());
            toast(result && result.saved ? '현재 앱 형식의 정규화 진단을 저장했습니다.' : '저장할 호환 진단이 없습니다.', result && result.saved ? 'success' : 'warning');
            return result;
        } catch (error) {
            toast(error && error.message || '정규화 진단을 저장하지 못했습니다.', 'error');
            return null;
        }
    }

    async function exportSupportDiagnosticsSummary() {
        try {
            const service = await ensureSupportDiagnosticsService();
            if (typeof service.exportSupportSummaryReport !== 'function') throw new Error('지원 요약 보고서 기능을 불러오지 못했습니다.');
            const result = service.exportSupportSummaryReport(supportDiagnosticsInspection, supportDiagnosticsOptions());
            toast(result && result.saved ? '현재 환경 비교가 포함된 지원 요약 보고서를 저장했습니다.' : '요약할 호환 진단이 없습니다.', result && result.saved ? 'success' : 'warning');
            return result;
        } catch (error) {
            toast(error && error.message || '지원 요약 보고서를 저장하지 못했습니다.', 'error');
            return null;
        }
    }

    function $(id) { return document.getElementById(id); }

    function initElements() {
        [
            'programInfoBtn', 'selectedBadge', 'dropZone', 'fileDrop', 'fileInput', 'importStatus',
            'durationSelect', 'styleSelect', 'cropModeSelect', 'platformSelect', 'analyzeBtn', 'analysisCancelBtn',
            'smartReframePanel', 'smartReframeStatus', 'smartReframeDetail', 'smartReframeAnalyzeBtn', 'smartReframeCaptionAvoidanceToggle',
            'smartReframeSpeakerPriorityToggle', 'smartReframeSpeakerLinkBtn', 'smartReframeSpeakerStatus',
            'speakerFaceTuningPanel', 'speakerFaceTuningCount', 'speakerFacePrevBtn', 'speakerFaceNextBtn', 'speakerFaceCueRange',
            'speakerFaceCueMeta', 'speakerCueTimeline', 'speakerCueStartInput', 'speakerCueEndInput', 'speakerCueLabelInput', 'speakerCuePrioritySelect',
            'speakerCueSelectedCount', 'speakerCueSelectAllBtn', 'speakerCueSelectionClearBtn', 'speakerCueUndoBtn', 'speakerCueRedoBtn',
            'speakerPaneOrientationSelect', 'speakerPaneSplitInput', 'speakerPaneSplitValue', 'speakerPanePositionSelect', 'speakerPaneLayoutPreview', 'speakerPaneDividerControl',
            'speakerGridPrimarySizeInput', 'speakerGridPrimarySizeValue', 'speakerGridPrimaryPositionSelect', 'speakerGridPagingSelect', 'speakerGridPageSecondsInput',
            'speakerGridEnergyThresholdInput', 'speakerGridEnergyHysteresisInput', 'speakerGridEnergyHoldInput',
            'speakerGridTransitionSelect', 'speakerGridTransitionMsInput', 'speakerGridTransitionEasingSelect', 'speakerGridSlideDirectionSelect', 'speakerGridManualPagesInput', 'speakerGridManualPageEditor', 'speakerEnergyStatus', 'speakerEnergyBars', 'speakerEnergyHoldStatus',
            'speakerGridCropXInput', 'speakerGridCropXValue', 'speakerGridCropYInput', 'speakerGridCropYValue', 'speakerGridCropZoomInput', 'speakerGridCropZoomValue',
            'speakerCueBulkShiftToggle', 'speakerCueBulkShiftInput', 'speakerCueBulkLabelToggle', 'speakerCueBulkLabelInput',
            'speakerCueBulkFaceToggle', 'speakerCueBulkPriorityToggle', 'speakerCueBulkGridCropToggle', 'speakerCueBulkPreview', 'speakerCueBulkPreviewText', 'speakerCueBulkApplyBtn',
            'speakerFaceSubjectSelect', 'speakerFaceConfidenceValue', 'speakerFaceConfidenceMeter', 'speakerFaceConfidenceHistory',
            'speakerFaceLockToggle', 'speakerFaceApplyBtn', 'speakerFaceApplySpeakerBtn', 'speakerCueSplitBtn', 'speakerCueOverlapBtn', 'speakerCueDeleteBtn', 'speakerFaceAutoBtn',
            'smartReframeEditor', 'smartReframeSubjectSelect', 'smartReframeXInput', 'smartReframeYInput', 'smartReframeZoomInput',
            'smartReframeXValue', 'smartReframeYValue', 'smartReframeZoomValue', 'smartReframeKeyframeDetail',
            'smartReframeKeyframeSetBtn', 'smartReframeKeyframeDeleteBtn', 'smartReframeKeyframeResetBtn',
            'analysisStatus', 'progressBar', 'analysisTimingPanel', 'analysisTimingSummary', 'analysisTimingDetail', 'analysisTimingComparison', 'analysisTimingExportBtn', 'analysisTimingList',
            'analysisTimingHistoryPanel', 'analysisTimingHistoryCount', 'analysisTimingHistorySearch', 'analysisTimingHistoryStatus', 'analysisTimingHistorySelectedExportBtn', 'analysisTimingHistoryClearBtn', 'analysisTimingHistoryEmpty', 'analysisTimingHistoryList', 'analysisTimingHistoryRetentionDays', 'analysisTimingHistoryMaxItems', 'analysisTimingHistoryPolicySaveBtn', 'analysisTimingHistoryPolicyStatus', 'supportDiagnosticsBundleBtn', 'supportDiagnosticsImportBtn', 'supportDiagnosticsFileInput',
            'supportDiagnosticsDialog', 'supportDiagnosticsCloseBtn', 'supportDiagnosticsDismissBtn', 'supportDiagnosticsState', 'supportDiagnosticsMeta', 'supportDiagnosticsSummary', 'supportDiagnosticsIssueList', 'supportDiagnosticsComparison', 'supportDiagnosticsComparisonSummary', 'supportDiagnosticsComparisonList', 'supportDiagnosticsNormalizedBtn', 'supportDiagnosticsReportBtn',
            'recommendationList', 'recommendationCount', 'previewStatus',
            'previewCanvas', 'speakerPreviewOverlay', 'speakerPreviewGuideLayer', 'speakerPreviewGuide1', 'speakerPreviewGuide2', 'speakerPreviewGuide3', 'speakerPreviewGuide4', 'speakerPreviewDividerControl', 'speakerPreviewOverlayStatus', 'sourceVideo', 'sourceAudio', 'previewBtn', 'stopPreviewBtn', 'exportBtn',
            'directCropPanel', 'directCropOverlay', 'directCropPathOverlay', 'directCropPathLine', 'directCropPathDots', 'directCropCurrentDot',
            'directCropGestureHint', 'directCropStatus', 'directCropDetail', 'directCropToggleBtn', 'directCropSaveBtn', 'directCropUndoBtn',
            'cropKeyframeTimelinePanel', 'cropKeyframeTimeline', 'cropKeyframeSceneLayer', 'cropKeyframeMarkerLayer', 'cropKeyframePlayhead',
            'cropKeyframeTimelineStatus', 'cropKeyframeCount', 'cropKeyframeCopyBtn', 'cropKeyframePasteBtn', 'cropKeyframeRangeBtn', 'cropKeyframeDeleteBtn',
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
        if (els.smartReframeCaptionAvoidanceToggle) els.smartReframeCaptionAvoidanceToggle.checked = !(state.settings.smartReframeOptions && state.settings.smartReframeOptions.captionAvoidance === false);
        if (els.smartReframeSpeakerPriorityToggle) els.smartReframeSpeakerPriorityToggle.checked = !(state.settings.smartReframeOptions && state.settings.smartReframeOptions.speakerPriority === false);
        updateSmartReframeUI();
        if (els.platformSelect) els.platformSelect.value = state.settings.platform || 'youtube';
        if (els.captionStyleSelect) els.captionStyleSelect.value = state.settings.captionStyle || 'bold';
        if (els.captionOffsetInput) els.captionOffsetInput.value = Number(state.settings.captionOffset || 0);
        if (els.thumbnailTemplateSelect) els.thumbnailTemplateSelect.value = state.settings.thumbnailTemplate || 'neon';
        syncCaptionOptionsToUI();
        syncQualityOptionsToUI();
        syncAutoCutOptionsToUI();
    }

    function getSmartReframeOptions() {
        return Object.assign({ captionAvoidance: true, smoothing: 0.30, zoom: 1.08, sceneCutProtection: true, speakerPriority: true }, state.settings && state.settings.smartReframeOptions || {});
    }

    function getSmartReframeEdits() {
        const edits = state.smartReframeEdits && typeof state.smartReframeEdits === 'object' ? state.smartReframeEdits : {};
        return {
            subjectId: String(edits.subjectId || 'auto'),
            keyframes: Array.isArray(edits.keyframes) ? edits.keyframes.map(item => Object.assign({}, item)) : [],
            speakerPriority: typeof edits.speakerPriority === 'boolean' ? edits.speakerPriority : getSmartReframeOptions().speakerPriority !== false,
            speakerLayout: Object.assign({ orientation: 'vertical', split: 0.5, primaryPosition: 'top', gridPrimarySize: 0.54, gridPrimaryPosition: 'top', gridPaging: 'rotate', gridPageSeconds: 3, gridEnergyThreshold: 0.35, gridEnergyHysteresis: 0.08, gridEnergyHoldSeconds: 1.2, gridTransition: 'fade', gridTransitionMs: 320, gridTransitionEasing: 'ease-in-out', gridSlideDirection: 'auto', gridManualPages: [], gridManualPageSeconds: [] }, edits.speakerLayout || {}, { gridManualPages: Array.isArray(edits.speakerLayout && edits.speakerLayout.gridManualPages) ? edits.speakerLayout.gridManualPages.map(page => page.slice()) : [], gridManualPageSeconds: Array.isArray(edits.speakerLayout && edits.speakerLayout.gridManualPageSeconds) ? edits.speakerLayout.gridManualPageSeconds.slice() : [] }),
            speakerCues: Array.isArray(edits.speakerCues) ? edits.speakerCues.map(item => Object.assign({}, item, { gridCrop: Object.assign({ x: 0, y: 0, zoom: 1 }, item.gridCrop || {}) })) : []
        };
    }

    function persistSmartReframeEdits(track) {
        const engine = getSmartReframeEngine();
        if (engine.extractEdits) state.smartReframeEdits = engine.extractEdits(track);
        else state.smartReframeEdits = { subjectId: track && track.activeSubjectId || 'auto', keyframes: Array.isArray(track && track.keyframes) ? track.keyframes.slice() : [], speakerPriority: track && track.speakerPriority !== false, speakerLayout: Object.assign({ orientation: 'vertical', split: 0.5, primaryPosition: 'top', gridPrimarySize: 0.54, gridPrimaryPosition: 'top', gridPaging: 'rotate', gridPageSeconds: 3, gridEnergyThreshold: 0.35, gridEnergyHysteresis: 0.08, gridEnergyHoldSeconds: 1.2, gridTransition: 'fade', gridTransitionMs: 320, gridTransitionEasing: 'ease-in-out', gridSlideDirection: 'auto', gridManualPages: [], gridManualPageSeconds: [] }, track && track.speakerLayout || {}), speakerCues: Array.isArray(track && track.speakerCues) ? track.speakerCues.slice() : [] };
        return state.smartReframeEdits;
    }

    function applyPendingSmartReframeEdits(track) {
        const engine = getSmartReframeEngine();
        if (!track || !engine.applyEdits) return track;
        return engine.applyEdits(track, getSmartReframeEdits()) || track;
    }

    function setSmartReframeTrack(track) {
        state.smartReframe = applyPendingSmartReframeEdits(track);
        speakerCueSelection.clear();
        speakerSelectionAnchorIndex = -1;
        speakerSelectionDragActive = false;
        speakerSelectionPointerId = null;
        speakerDividerDragActive = false;
        speakerDividerPointerId = null;
        speakerTimelineUndoStack.length = 0;
        speakerTimelineRedoStack.length = 0;
        persistSmartReframeEdits(state.smartReframe);
        return state.smartReframe;
    }

    function reconcileSmartReframeEdits() {
        const engine = getSmartReframeEngine();
        if (!state.smartReframe || !engine.applyEdits || !engine.extractEdits) return state.smartReframe;
        const current = engine.extractEdits(state.smartReframe);
        const desired = getSmartReframeEdits();
        if (current.subjectId !== desired.subjectId
            || current.speakerPriority !== desired.speakerPriority
            || JSON.stringify(current.speakerLayout || {}) !== JSON.stringify(desired.speakerLayout || {})
            || JSON.stringify(current.keyframes || []) !== JSON.stringify(desired.keyframes || [])
            || JSON.stringify(current.speakerCues || []) !== JSON.stringify(desired.speakerCues || [])) {
            state.smartReframe = engine.applyEdits(state.smartReframe, desired) || state.smartReframe;
        }
        return state.smartReframe;
    }

    function getSmartReframeTime() {
        const videoTime = els.sourceVideo && Number(els.sourceVideo.currentTime);
        if (Number.isFinite(videoTime) && videoTime >= 0) return videoTime;
        const rangeStart = Number(state.selectedRange && state.selectedRange.start);
        return Number.isFinite(rangeStart) && rangeStart >= 0 ? rangeStart : 0;
    }

    function formatSmartReframeTime(value) {
        const total = Math.max(0, Number(value) || 0);
        const minutes = Math.floor(total / 60);
        const seconds = total - minutes * 60;
        return `${String(minutes).padStart(2, '0')}:${seconds.toFixed(1).padStart(4, '0')}`;
    }

    function clearSmartReframeEditorDraft() {
        smartReframeEditorDraft = null;
    }

    function readSmartReframeEditorDraft(timeOverride) {
        return {
            time: Number.isFinite(Number(timeOverride)) ? Math.max(0, Number(timeOverride)) : getSmartReframeTime(),
            x: (Number(els.smartReframeXInput && els.smartReframeXInput.value) || 50) / 100,
            y: (Number(els.smartReframeYInput && els.smartReframeYInput.value) || 46) / 100,
            zoom: (Number(els.smartReframeZoomInput && els.smartReframeZoomInput.value) || 108) / 100
        };
    }

    function beginSmartReframeEditorDraft() {
        if (!state.smartReframe) return null;
        if (els.sourceVideo && !els.sourceVideo.paused) els.sourceVideo.pause();
        smartReframeEditorDraft = readSmartReframeEditorDraft(getSmartReframeTime());
        return smartReframeEditorDraft;
    }

    function applySmartReframeEditorDraft(input, source) {
        if (!state.smartReframe) return null;
        const draft = {
            time: Number.isFinite(Number(input && input.time)) ? Math.max(0, Number(input.time)) : getSmartReframeTime(),
            x: Math.max(0, Math.min(1, Number(input && input.x) || 0.5)),
            y: Math.max(0, Math.min(1, Number(input && input.y) || 0.46)),
            zoom: Math.max(1, Math.min(1.35, Number(input && input.zoom) || 1.08))
        };
        smartReframeEditorDraft = draft;
        if (els.smartReframeXInput) els.smartReframeXInput.value = String(Math.round(draft.x * 100));
        if (els.smartReframeYInput) els.smartReframeYInput.value = String(Math.round(draft.y * 100));
        if (els.smartReframeZoomInput) els.smartReframeZoomInput.value = String(Math.round(draft.zoom * 100));
        if (els.smartReframeXValue) els.smartReframeXValue.textContent = `${Math.round(draft.x * 100)}%`;
        if (els.smartReframeYValue) els.smartReframeYValue.textContent = `${Math.round(draft.y * 100)}%`;
        if (els.smartReframeZoomValue) els.smartReframeZoomValue.textContent = `${Math.round(draft.zoom * 100)}%`;
        if (els.smartReframeKeyframeDetail) els.smartReframeKeyframeDetail.textContent = `${formatSmartReframeTime(draft.time)} · 저장되지 않은 크롭 조정${source === 'pointer' ? ' · 화면 드래그' : source === 'wheel' ? ' · 화면 확대' : ''}`;
        renderPreviewStill();
        return draft;
    }

    function getDirectCropController() {
        if (directCropController) return directCropController;
        const factory = global.AIShortsDirectCropEditor;
        if (!factory || !factory.createController || !els.previewCanvas) return null;
        directCropController = factory.createController({
            elements: {
                canvas: els.previewCanvas,
                frame: els.previewCanvas.closest('.phone-frame'),
                overlay: els.directCropOverlay,
                panel: els.directCropPanel,
                toggleButton: els.directCropToggleBtn,
                saveButton: els.directCropSaveBtn,
                undoButton: els.directCropUndoBtn,
                status: els.directCropStatus,
                detail: els.directCropDetail,
                pathSvg: els.directCropPathOverlay,
                pathLine: els.directCropPathLine,
                pathDots: els.directCropPathDots,
                currentDot: els.directCropCurrentDot,
                hint: els.directCropGestureHint
            },
            isReady: () => Boolean(state.fileKind === 'video' && state.settings.cropMode === 'smart' && state.smartReframe && getSmartReframeEngine().getFocusAt),
            getTrack: () => state.smartReframe,
            getTime: getSmartReframeTime,
            getDraft: () => smartReframeEditorDraft || readSmartReframeEditorDraft(getSmartReframeTime()),
            setDraft: applySmartReframeEditorDraft,
            commit: (source, quiet) => setSmartReframeKeyframe({ source, quiet }),
            render: renderPreviewStill,
            pause: () => { if (els.sourceVideo && !els.sourceVideo.paused) els.sourceVideo.pause(); },
            getMedia: () => els.sourceVideo,
            getReframeOptions: () => Object.assign({}, getSmartReframeOptions(), { captionOptions: getCaptionOptions() }),
            notify: toast
        });
        return directCropController;
    }

    function getSmartReframeDuration() {
        const mediaDuration = Number(els.sourceVideo && els.sourceVideo.duration);
        const metaDuration = Number(state.fileMeta && state.fileMeta.duration);
        const rangeEnd = Number(state.selectedRange && state.selectedRange.end);
        const track = state.smartReframe;
        const lastPoint = track && track.points && track.points.length ? Number(track.points[track.points.length - 1].time) : 0;
        return Math.max(0.1, Number.isFinite(mediaDuration) ? mediaDuration : 0, Number.isFinite(metaDuration) ? metaDuration : 0, Number.isFinite(rangeEnd) ? rangeEnd : 0, Number(lastPoint) || 0);
    }

    function getSmartReframeSelectedRange() {
        const range = state.selectedRange;
        if (!range) return null;
        const start = Math.max(0, Number(range.start) || 0);
        const end = Math.max(start, Number(range.end) || start);
        return end > start ? { start, end } : null;
    }

    function commitSmartReframeTimelineTrack(nextTrack) {
        if (!nextTrack) return state.smartReframe;
        clearSmartReframeEditorDraft();
        state.smartReframe = nextTrack;
        persistSmartReframeEdits(state.smartReframe);
        updateSmartReframeUI();
        renderPreviewStill();
        return state.smartReframe;
    }

    function getCropKeyframeTimelineController() {
        if (cropKeyframeTimelineController) return cropKeyframeTimelineController;
        const factory = global.AIShortsCropKeyframeTimeline;
        if (!factory || !factory.createController || !els.cropKeyframeTimeline) return null;
        cropKeyframeTimelineController = factory.createController({
            elements: {
                panel: els.cropKeyframeTimelinePanel,
                track: els.cropKeyframeTimeline,
                markerLayer: els.cropKeyframeMarkerLayer,
                sceneLayer: els.cropKeyframeSceneLayer,
                playhead: els.cropKeyframePlayhead,
                status: els.cropKeyframeTimelineStatus,
                count: els.cropKeyframeCount,
                copyButton: els.cropKeyframeCopyBtn,
                pasteButton: els.cropKeyframePasteBtn,
                rangeButton: els.cropKeyframeRangeBtn,
                deleteButton: els.cropKeyframeDeleteBtn
            },
            getTrack: () => state.smartReframe,
            getTime: getSmartReframeTime,
            getDuration: getSmartReframeDuration,
            getRange: getSmartReframeSelectedRange,
            seek: time => {
                clearSmartReframeEditorDraft();
                if (els.sourceVideo && Number.isFinite(Number(els.sourceVideo.duration))) els.sourceVideo.currentTime = Math.max(0, Math.min(Number(els.sourceVideo.duration) || time, Number(time) || 0));
                renderPreviewStill();
                syncSmartReframeEditor();
            },
            move: (fromTime, toTime) => {
                const engine = getSmartReframeEngine();
                if (!state.smartReframe || !engine.moveKeyframe) return;
                const before = (state.smartReframe.keyframes || []).length;
                const next = engine.moveKeyframe(state.smartReframe, fromTime, Math.max(0, Math.min(getSmartReframeDuration(), Number(toTime) || 0)), 0.12);
                commitSmartReframeTimelineTrack(next);
                const after = (state.smartReframe.keyframes || []).length;
                toast(after < before ? '겹치는 키프레임을 정리하고 새 위치로 이동했습니다.' : `${formatSmartReframeTime(toTime)}로 키프레임을 이동했습니다.`, 'action');
            },
            paste: (keyframe, time) => {
                const engine = getSmartReframeEngine();
                if (!state.smartReframe || !engine.pasteKeyframe) return;
                commitSmartReframeTimelineTrack(engine.pasteKeyframe(state.smartReframe, keyframe, time));
            },
            applyRange: (keyframe, start, end) => {
                const engine = getSmartReframeEngine();
                if (!state.smartReframe || !engine.applyKeyframeToRange) return;
                commitSmartReframeTimelineTrack(engine.applyKeyframeToRange(state.smartReframe, keyframe, start, end));
            },
            remove: time => {
                const engine = getSmartReframeEngine();
                if (!state.smartReframe || !engine.removeKeyframe) return;
                commitSmartReframeTimelineTrack(engine.removeKeyframe(state.smartReframe, time, 0.12));
            },
            notify: toast
        });
        return cropKeyframeTimelineController;
    }

    function syncDirectCropEditor() {
        const controller = getDirectCropController();
        if (controller && controller.sync) controller.sync();
        const timeline = getCropKeyframeTimelineController();
        if (timeline && timeline.sync) timeline.sync();
    }

    function setRangeControl(input, output, value, suffix) {
        if (!input) return;
        const next = Math.round(Number(value) || 0);
        if (document.activeElement !== input) input.value = String(next);
        if (output) output.textContent = `${next}${suffix || '%'}`;
    }

    function syncSmartReframeEditor() {
        const track = state.smartReframe;
        const engine = getSmartReframeEngine();
        const ready = Boolean(track && engine.getFocusAt);
        const subjects = ready && Array.isArray(track.subjects) ? track.subjects : [];
        if (els.smartReframeSubjectSelect) {
            const signature = subjects.map(item => `${item.id}:${item.label}`).join('|');
            if (els.smartReframeSubjectSelect.dataset.signature !== signature) {
                els.smartReframeSubjectSelect.textContent = '';
                const automatic = document.createElement('option');
                automatic.value = 'auto';
                automatic.textContent = '자동 선택';
                els.smartReframeSubjectSelect.appendChild(automatic);
                subjects.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item.id;
                    option.textContent = `${item.label} · ${Math.round((Number(item.coverage) || 0) * 100)}%`;
                    els.smartReframeSubjectSelect.appendChild(option);
                });
                els.smartReframeSubjectSelect.dataset.signature = signature;
            }
            els.smartReframeSubjectSelect.disabled = !ready || !subjects.length;
            els.smartReframeSubjectSelect.value = ready && subjects.some(item => item.id === track.activeSubjectId) ? track.activeSubjectId : 'auto';
        }
        const time = getSmartReframeTime();
        if (smartReframeEditorDraft && Math.abs(smartReframeEditorDraft.time - time) > 0.35) clearSmartReframeEditorDraft();
        const draft = smartReframeEditorDraft;
        const focus = ready ? engine.getFocusAt(track, time) : null;
        const nearest = ready && engine.getNearestKeyframe ? engine.getNearestKeyframe(track, time, 0.35) : null;
        const x = (draft ? draft.x : nearest ? nearest.x : focus && focus.x != null ? focus.x : 0.5) * 100;
        const y = (draft ? draft.y : nearest ? nearest.y : focus && focus.y != null ? focus.y : 0.46) * 100;
        const zoom = (draft ? draft.zoom : nearest ? nearest.zoom : focus && focus.zoom > 1 ? focus.zoom : getSmartReframeOptions().zoom) * 100;
        setRangeControl(els.smartReframeXInput, els.smartReframeXValue, x, '%');
        setRangeControl(els.smartReframeYInput, els.smartReframeYValue, y, '%');
        setRangeControl(els.smartReframeZoomInput, els.smartReframeZoomValue, zoom, '%');
        [els.smartReframeXInput, els.smartReframeYInput, els.smartReframeZoomInput, els.smartReframeKeyframeSetBtn].forEach(control => { if (control) control.disabled = !ready; });
        if (els.smartReframeKeyframeDeleteBtn) els.smartReframeKeyframeDeleteBtn.disabled = !nearest;
        if (els.smartReframeKeyframeResetBtn) els.smartReframeKeyframeResetBtn.disabled = !ready || !(track.keyframes && track.keyframes.length);
        if (els.smartReframeKeyframeDetail) {
            const count = ready && track.keyframes ? track.keyframes.length : 0;
            els.smartReframeKeyframeDetail.textContent = !ready
                ? '피사체 추적 후 크롭 위치를 조정할 수 있습니다.'
                : draft
                    ? `${formatSmartReframeTime(draft.time)} · 저장되지 않은 크롭 조정 · 전체 ${count}개`
                    : nearest
                        ? `${formatSmartReframeTime(time)} · 이 위치에 키프레임 있음 · 전체 ${count}개`
                        : `${formatSmartReframeTime(time)} · 현재 위치를 조정해 고정 · 전체 ${count}개`;
        }
        if (els.smartReframePanel) els.smartReframePanel.dataset.manual = ready && (track.activeSubjectId !== 'auto' || Boolean(track.keyframes && track.keyframes.length)) ? 'true' : 'false';
        syncDirectCropEditor();
    }

    function ensureMotionSmartReframe() {
        const engine = getSmartReframeEngine();
        if (!engine.createTrackFromMotion) {
            const loader = global.AIShortsStagedUiLoader;
            if (state.motionAnalysis && loader && loader.ensure) {
                loader.ensure('editing').then(() => {
                    if (!state.motionAnalysis || !getSmartReframeEngine().createTrackFromMotion) return;
                    if (!state.smartReframe || state.smartReframe.source === 'motion') {
                        setSmartReframeTrack(getSmartReframeEngine().createTrackFromMotion(state.motionAnalysis, Object.assign({}, getSmartReframeOptions(), getSmartReframeEdits())));
                        updateSmartReframeUI();
                        renderPreviewStill();
                    }
                }).catch(() => {});
            }
            return state.smartReframe;
        }
        if (!state.motionAnalysis) return state.smartReframe;
        if (!state.smartReframe || state.smartReframe.source === 'motion') {
            setSmartReframeTrack(engine.createTrackFromMotion(state.motionAnalysis, Object.assign({}, getSmartReframeOptions(), getSmartReframeEdits())));
        }
        return state.smartReframe;
    }

    function updateSmartReframeUI(statusOverride, detailOverride, statusKind) {
        reconcileSmartReframeEdits();
        const isVideo = state.fileKind === 'video';
        const selected = state.settings && state.settings.cropMode === 'smart';
        if (els.smartReframePanel) {
            els.smartReframePanel.hidden = !(isVideo && selected);
            els.smartReframePanel.dataset.status = statusKind || (state.isReframing ? 'tracking' : state.smartReframe ? 'ready' : 'idle');
        }
        const status = getSmartReframeEngine().getStatus ? getSmartReframeEngine().getStatus(state.smartReframe) : null;
        if (els.smartReframeStatus) els.smartReframeStatus.textContent = statusOverride || status && status.label || '피사체 추적 대기';
        if (els.smartReframeDetail) els.smartReframeDetail.textContent = detailOverride || status && status.detail || '영상 분석 후 세로 화면이 피사체를 따라갑니다.';
        if (els.smartReframeAnalyzeBtn) {
            els.smartReframeAnalyzeBtn.disabled = !isVideo || !state.fileUrl || state.isAnalyzing || state.isReframing;
            els.smartReframeAnalyzeBtn.textContent = state.isReframing ? '추적 중' : state.smartReframe && state.smartReframe.summary && state.smartReframe.summary.faceCoverage > 0 ? '피사체 다시 추적' : '얼굴 추적 시도';
        }
        syncSmartReframeEditor();
        updateSpeakerFaceUI();
    }

    function speakerSegmentEnergy(start, end) {
        const frames = Array.isArray(state.audioAnalysis && state.audioAnalysis.frames) ? state.audioAnalysis.frames : [];
        if (!frames.length) return 0;
        const from = Math.max(0, Number(start) || 0);
        const to = Math.max(from, Number(end) || from);
        const selected = frames.filter(frame => Number(frame.time) >= from && Number(frame.time) <= to);
        const list = selected.length ? selected : frames.slice().sort((left, right) => Math.abs(Number(left.time) - (from + to) / 2) - Math.abs(Number(right.time) - (from + to) / 2)).slice(0, 2);
        return list.length ? Math.max(0, Math.min(1, list.reduce((sum, frame) => sum + (Number(frame.rmsNorm) || 0), 0) / list.length)) : 0;
    }

    function getSpeakerSegments() {
        const input = Array.isArray(state.transcriptSegments) && state.transcriptSegments.length ? state.transcriptSegments : Array.isArray(state.captions) ? state.captions : [];
        return input.map(item => Object.assign({}, item, {
            energy: Number.isFinite(Number(item && item.energy)) ? Math.max(0, Math.min(1, Number(item.energy))) : speakerSegmentEnergy(item && item.start, item && item.end)
        }));
    }

    function formatSpeakerCueTime(value) {
        const total = Math.max(0, Number(value) || 0);
        const minutes = Math.floor(total / 60);
        const seconds = total - minutes * 60;
        return `${String(minutes).padStart(2, '0')}:${seconds.toFixed(1).padStart(4, '0')}`;
    }

    function speakerTimelineSnapshot(track) {
        const source = track || state.smartReframe || {};
        return {
            speakerCues: Array.isArray(source.speakerCues) ? source.speakerCues.map(item => Object.assign({}, item, {
                gridCrop: Object.assign({ x: 0, y: 0, zoom: 1 }, item.gridCrop || {}),
                confidenceHistory: Array.isArray(item.confidenceHistory) ? item.confidenceHistory.map(entry => Object.assign({}, entry)) : []
            })) : [],
            speakerLayout: Object.assign({ orientation: 'vertical', split: 0.5, primaryPosition: 'top', gridPrimarySize: 0.54, gridPrimaryPosition: 'top', gridPaging: 'rotate', gridPageSeconds: 3, gridEnergyThreshold: 0.35, gridEnergyHysteresis: 0.08, gridEnergyHoldSeconds: 1.2, gridTransition: 'fade', gridTransitionMs: 320, gridTransitionEasing: 'ease-in-out', gridSlideDirection: 'auto', gridManualPages: [], gridManualPageSeconds: [] }, source.speakerLayout || {}, { gridManualPages: Array.isArray(source.speakerLayout && source.speakerLayout.gridManualPages) ? source.speakerLayout.gridManualPages.map(page => page.slice()) : [], gridManualPageSeconds: Array.isArray(source.speakerLayout && source.speakerLayout.gridManualPageSeconds) ? source.speakerLayout.gridManualPageSeconds.slice() : [] })
        };
    }

    function speakerTimelineSnapshotKey(snapshot) {
        return JSON.stringify(snapshot || {});
    }

    function recordSpeakerTimelineHistory() {
        if (!state.smartReframe) return;
        const snapshot = speakerTimelineSnapshot(state.smartReframe);
        const last = speakerTimelineUndoStack[speakerTimelineUndoStack.length - 1];
        if (!last || speakerTimelineSnapshotKey(last) !== speakerTimelineSnapshotKey(snapshot)) {
            speakerTimelineUndoStack.push(snapshot);
            if (speakerTimelineUndoStack.length > MAX_SPEAKER_TIMELINE_HISTORY) speakerTimelineUndoStack.shift();
        }
        speakerTimelineRedoStack.length = 0;
    }

    function restoreSpeakerTimelineSnapshot(snapshot) {
        const engine = getSmartReframeEngine();
        if (!state.smartReframe || !snapshot || !engine.replaceSpeakerCues) return false;
        let next = engine.replaceSpeakerCues(state.smartReframe, snapshot.speakerCues || []) || state.smartReframe;
        if (engine.updateSpeakerLayout) next = engine.updateSpeakerLayout(next, snapshot.speakerLayout || {}) || next;
        state.smartReframe = next;
        speakerCueSelection.clear();
        speakerTuneIndex = Math.max(0, Math.min(speakerTuneIndex, (next.speakerCues || []).length - 1));
        persistSmartReframeEdits(next);
        updateSmartReframeUI();
        renderPreviewStill();
        return true;
    }

    function undoSpeakerTimelineEdit() {
        if (!speakerTimelineUndoStack.length || !state.smartReframe) return;
        speakerTimelineRedoStack.push(speakerTimelineSnapshot(state.smartReframe));
        const snapshot = speakerTimelineUndoStack.pop();
        if (restoreSpeakerTimelineSnapshot(snapshot)) toast('화자 타임라인 편집을 취소했습니다.', 'action');
    }

    function redoSpeakerTimelineEdit() {
        if (!speakerTimelineRedoStack.length || !state.smartReframe) return;
        speakerTimelineUndoStack.push(speakerTimelineSnapshot(state.smartReframe));
        const snapshot = speakerTimelineRedoStack.pop();
        if (restoreSpeakerTimelineSnapshot(snapshot)) toast('화자 타임라인 편집을 다시 적용했습니다.', 'action');
    }

    function reconcileSpeakerCueSelection(cues) {
        const engine = getSmartReframeEngine();
        if (!engine.speakerCueKey) return;
        const valid = new Set((Array.isArray(cues) ? cues : []).map(cue => engine.speakerCueKey(cue)));
        Array.from(speakerCueSelection).forEach(key => { if (!valid.has(key)) speakerCueSelection.delete(key); });
    }

    function selectAllSpeakerCues() {
        const engine = getSmartReframeEngine();
        const cues = Array.isArray(state.smartReframe && state.smartReframe.speakerCues) ? state.smartReframe.speakerCues : [];
        if (!engine.speakerCueKey) return;
        cues.forEach(cue => speakerCueSelection.add(engine.speakerCueKey(cue)));
        syncSpeakerFaceTuningUI();
    }

    function clearSpeakerCueSelection() {
        speakerCueSelection.clear();
        speakerSelectionAnchorIndex = -1;
        speakerSelectionDragActive = false;
        speakerSelectionPointerId = null;
        syncSpeakerFaceTuningUI();
    }

    function setSpeakerCueSelected(cues, cueIndex, selected) {
        const engine = getSmartReframeEngine();
        const cue = Array.isArray(cues) ? cues[cueIndex] : null;
        if (!cue || !engine.speakerCueKey) return;
        const key = engine.speakerCueKey(cue);
        if (selected) speakerCueSelection.add(key);
        else speakerCueSelection.delete(key);
    }

    function selectSpeakerCueRange(cues, fromIndex, toIndex, selected) {
        const start = Math.max(0, Math.min(Number(fromIndex) || 0, Number(toIndex) || 0));
        const end = Math.min((Array.isArray(cues) ? cues.length : 0) - 1, Math.max(Number(fromIndex) || 0, Number(toIndex) || 0));
        for (let index = start; index <= end; index += 1) setSpeakerCueSelected(cues, index, selected !== false);
    }

    function updateSpeakerCueSelection(cues, cueIndex, selected, extendRange) {
        if (extendRange && speakerSelectionAnchorIndex >= 0) selectSpeakerCueRange(cues, speakerSelectionAnchorIndex, cueIndex, selected);
        else setSpeakerCueSelected(cues, cueIndex, selected);
        speakerSelectionAnchorIndex = cueIndex;
    }

    function getBulkSpeakerCuePatch() {
        const patch = {};
        if (els.speakerCueBulkShiftToggle && els.speakerCueBulkShiftToggle.checked) {
            patch.timeShift = Number(els.speakerCueBulkShiftInput && els.speakerCueBulkShiftInput.value || 0);
        }
        if (els.speakerCueBulkLabelToggle && els.speakerCueBulkLabelToggle.checked) {
            patch.speaker = String(els.speakerCueBulkLabelInput && els.speakerCueBulkLabelInput.value || '').trim().slice(0, 40);
        }
        if (els.speakerCueBulkFaceToggle && els.speakerCueBulkFaceToggle.checked) {
            const subjectId = els.speakerFaceSubjectSelect ? els.speakerFaceSubjectSelect.value : 'auto';
            const locked = Boolean(els.speakerFaceLockToggle && els.speakerFaceLockToggle.checked && subjectId !== 'auto');
            Object.assign(patch, { subjectId, locked, source: locked ? 'manual-override' : 'face-activity' });
        }
        if (els.speakerCueBulkPriorityToggle && els.speakerCueBulkPriorityToggle.checked) {
            patch.priority = els.speakerCuePrioritySelect ? els.speakerCuePrioritySelect.value : 'auto';
        }
        if (els.speakerCueBulkGridCropToggle && els.speakerCueBulkGridCropToggle.checked) {
            patch.gridCrop = {
                x: Math.max(-0.25, Math.min(0.25, Number(els.speakerGridCropXInput && els.speakerGridCropXInput.value || 0) / 100)),
                y: Math.max(-0.25, Math.min(0.25, Number(els.speakerGridCropYInput && els.speakerGridCropYInput.value || 0) / 100)),
                zoom: Math.max(1, Math.min(1.35, Number(els.speakerGridCropZoomInput && els.speakerGridCropZoomInput.value || 100) / 100))
            };
        }
        return patch;
    }

    function bulkSpeakerFieldSelected() {
        return Object.keys(getBulkSpeakerCuePatch()).length > 0;
    }

    function describeBulkSpeakerCuePatch(patch, count) {
        const fields = [];
        if (Object.prototype.hasOwnProperty.call(patch, 'timeShift')) fields.push(`시간 ${patch.timeShift >= 0 ? '+' : ''}${Number(patch.timeShift).toFixed(2)}초`);
        if (Object.prototype.hasOwnProperty.call(patch, 'speaker')) fields.push(patch.speaker ? `라벨 “${patch.speaker}”` : '라벨 삭제');
        if (Object.prototype.hasOwnProperty.call(patch, 'subjectId')) fields.push(patch.subjectId === 'auto' ? '얼굴 자동 추적' : `${patch.subjectId} 얼굴${patch.locked ? ' 고정' : ''}`);
        if (Object.prototype.hasOwnProperty.call(patch, 'priority')) fields.push(`역할 ${patch.priority === 'primary' ? '주 화자' : patch.priority === 'secondary' ? '보조 화자' : '자동'}`);
        if (Object.prototype.hasOwnProperty.call(patch, 'gridCrop')) fields.push(`셀 crop X ${Math.round(patch.gridCrop.x * 100)}% · Y ${Math.round(patch.gridCrop.y * 100)}% · 확대 ${Math.round(patch.gridCrop.zoom * 100)}%`);
        return fields.length ? `${count}개 구간 · ${fields.join(' · ')}` : '적용할 필드를 하나 이상 선택하세요.';
    }

    function syncBulkSpeakerCuePreview() {
        const count = speakerCueSelection.size;
        const patch = getBulkSpeakerCuePatch();
        const ready = count > 0 && Object.keys(patch).length > 0;
        if (els.speakerCueBulkPreview) els.speakerCueBulkPreview.dataset.state = ready ? 'ready' : count ? 'fields' : 'empty';
        if (els.speakerCueBulkPreviewText) els.speakerCueBulkPreviewText.textContent = count ? describeBulkSpeakerCuePatch(patch, count) : '구간을 선택하고 적용할 필드를 고르세요.';
        if (els.speakerCueBulkApplyBtn) els.speakerCueBulkApplyBtn.disabled = !ready;
        return { count, patch, ready };
    }

    function syncSpeakerCueSelectionDom() {
        const cards = els.speakerCueTimeline ? els.speakerCueTimeline.querySelectorAll('.speaker-cue-card') : [];
        cards.forEach(card => {
            const key = card.dataset.cueKey || '';
            const selected = speakerCueSelection.has(key);
            card.dataset.multiSelected = selected ? 'true' : 'false';
            const checkbox = card.querySelector('input[type="checkbox"]');
            if (checkbox) checkbox.checked = selected;
        });
        if (els.speakerCueSelectedCount) els.speakerCueSelectedCount.textContent = `선택 ${speakerCueSelection.size}개`;
        if (els.speakerCueSelectionClearBtn) els.speakerCueSelectionClearBtn.disabled = !speakerCueSelection.size;
        syncBulkSpeakerCuePreview();
    }

    function syncSpeakerPaneLayoutPreview(layoutInput) {
        const layout = Object.assign({ orientation: 'vertical', split: 0.5, primaryPosition: 'top', gridPrimarySize: 0.54, gridPrimaryPosition: 'top', gridPaging: 'rotate', gridPageSeconds: 3, gridEnergyThreshold: 0.35, gridEnergyHysteresis: 0.08, gridEnergyHoldSeconds: 1.2, gridTransition: 'fade', gridTransitionMs: 320, gridTransitionEasing: 'ease-in-out', gridSlideDirection: 'auto', gridManualPages: [], gridManualPageSeconds: [] }, layoutInput || {});
        const orientation = layout.orientation === 'horizontal' ? 'horizontal' : 'vertical';
        const split = Math.max(0.35, Math.min(0.65, Number(layout.split) || 0.5));
        const primaryPosition = orientation === 'horizontal' ? (layout.primaryPosition === 'right' ? 'right' : 'left') : (layout.primaryPosition === 'bottom' ? 'bottom' : 'top');
        const physicalDivider = primaryPosition === 'right' || primaryPosition === 'bottom' ? 1 - split : split;
        if (els.speakerPaneLayoutPreview) {
            els.speakerPaneLayoutPreview.dataset.orientation = orientation;
            els.speakerPaneLayoutPreview.dataset.primaryPosition = primaryPosition;
            els.speakerPaneLayoutPreview.style.setProperty('--speaker-divider-percent', `${(physicalDivider * 100).toFixed(1)}%`);
            els.speakerPaneLayoutPreview.style.setProperty('--speaker-primary-percent', `${(split * 100).toFixed(1)}%`);
        }
        [els.speakerPaneDividerControl, els.speakerPreviewDividerControl].forEach(control => {
            if (!control) return;
            control.setAttribute('aria-orientation', orientation === 'horizontal' ? 'vertical' : 'horizontal');
            control.setAttribute('aria-valuenow', String(Math.round(split * 100)));
            control.setAttribute('aria-valuetext', `주 화자 ${Math.round(split * 100)}%`);
        });
        syncSpeakerPreviewOverlay(getSmartReframeTime());
    }

    function speakerPaneSplitFromPointer(event, surface) {
        const preview = surface || els.speakerPaneLayoutPreview;
        if (!preview) return 0.5;
        const rect = preview.getBoundingClientRect();
        const orientation = els.speakerPaneOrientationSelect && els.speakerPaneOrientationSelect.value === 'horizontal' ? 'horizontal' : 'vertical';
        const requested = String(els.speakerPanePositionSelect && els.speakerPanePositionSelect.value || '');
        const reverse = requested === 'right' || requested === 'bottom';
        const physical = orientation === 'horizontal'
            ? (Number(event.clientX) - rect.left) / Math.max(1, rect.width)
            : (Number(event.clientY) - rect.top) / Math.max(1, rect.height);
        return Math.max(0.35, Math.min(0.65, reverse ? 1 - physical : physical));
    }

    function setSpeakerPaneSplitDraft(split, options) {
        const opts = Object.assign({ recordHistory: false, persist: false }, options || {});
        const percent = Math.round(Math.max(0.35, Math.min(0.65, Number(split) || 0.5)) * 100);
        if (els.speakerPaneSplitInput) els.speakerPaneSplitInput.value = String(percent);
        if (els.speakerPaneSplitValue) els.speakerPaneSplitValue.textContent = `${percent}%`;
        applySpeakerLayoutSettings(opts);
    }

    function dividerSurfaceForControl(control) {
        return control === els.speakerPreviewDividerControl ? els.speakerPreviewOverlay : els.speakerPaneLayoutPreview;
    }

    function beginSpeakerPaneDividerDrag(event) {
        const control = event.currentTarget || els.speakerPaneDividerControl;
        const surface = dividerSurfaceForControl(control);
        if (!state.smartReframe || !control || !surface || event.button !== 0) return;
        event.preventDefault();
        speakerDividerDragActive = true;
        speakerDividerPointerId = event.pointerId;
        speakerDividerDragControl = control;
        speakerDividerDragSurface = surface;
        recordSpeakerTimelineHistory();
        if (control.setPointerCapture) control.setPointerCapture(event.pointerId);
        setSpeakerPaneSplitDraft(speakerPaneSplitFromPointer(event, surface), { recordHistory: false, persist: true });
    }

    function moveSpeakerPaneDivider(event) {
        if (!speakerDividerDragActive || speakerDividerPointerId !== event.pointerId) return;
        event.preventDefault();
        setSpeakerPaneSplitDraft(speakerPaneSplitFromPointer(event, speakerDividerDragSurface), { recordHistory: false, persist: true });
    }

    function finishSpeakerPaneDividerDrag(event) {
        if (!speakerDividerDragActive || event && speakerDividerPointerId !== null && event.pointerId !== speakerDividerPointerId) return;
        speakerDividerDragActive = false;
        const control = speakerDividerDragControl;
        if (control && speakerDividerPointerId !== null && control.hasPointerCapture && control.hasPointerCapture(speakerDividerPointerId)) {
            control.releasePointerCapture(speakerDividerPointerId);
        }
        speakerDividerPointerId = null;
        speakerDividerDragControl = null;
        speakerDividerDragSurface = null;
        persistSmartReframeEdits(state.smartReframe);
        syncSpeakerFaceTuningUI();
    }

    function handleSpeakerPaneDividerKeydown(event) {
        if (!state.smartReframe) return;
        const current = Math.round(Number(els.speakerPaneSplitInput && els.speakerPaneSplitInput.value || 50));
        const step = event.shiftKey ? 5 : 1;
        let next = current;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next -= step;
        else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next += step;
        else if (event.key === 'Home') next = 35;
        else if (event.key === 'End') next = 65;
        else return;
        event.preventDefault();
        recordSpeakerTimelineHistory();
        setSpeakerPaneSplitDraft(next / 100, { recordHistory: false, persist: true });
    }

    function speakerGuideCropSummary(subject, paneWidth, paneHeight) {
        const engine = getSmartReframeEngine();
        const video = els.sourceVideo;
        if (!subject || !engine.resolveCropRect || !video || !video.videoWidth || !video.videoHeight) return '';
        const rect = engine.resolveCropRect(video.videoWidth, video.videoHeight, Math.max(1, paneWidth), Math.max(1, paneHeight), subject, Object.assign({}, getSmartReframeOptions(), { captionOptions: null }));
        const widthPercent = Math.round((rect.sw / video.videoWidth) * 100);
        const heightPercent = Math.round((rect.sh / video.videoHeight) * 100);
        return `crop ${widthPercent}%×${heightPercent}%`;
    }

    function speakerGridPaneGeometry(subjects, width, height, layoutInput) {
        const layout = Object.assign({ gridPrimarySize: 0.54, gridPrimaryPosition: 'top' }, layoutInput || {});
        const count = Array.isArray(subjects) ? subjects.length : 0;
        if (count === 3) {
            const size = Math.max(0.45, Math.min(0.65, Number(layout.gridPrimarySize) || 0.54));
            const position = ['top', 'bottom', 'left', 'right'].includes(layout.gridPrimaryPosition) ? layout.gridPrimaryPosition : 'top';
            if (position === 'left' || position === 'right') {
                const primaryWidth = width * size;
                const secondaryWidth = width - primaryWidth;
                const primaryLeft = position === 'right' ? secondaryWidth : 0;
                const secondaryLeft = position === 'right' ? 0 : primaryWidth;
                return [
                    { subject: subjects[0], left: primaryLeft, top: 0, width: primaryWidth, height },
                    { subject: subjects[1], left: secondaryLeft, top: 0, width: secondaryWidth, height: height / 2 },
                    { subject: subjects[2], left: secondaryLeft, top: height / 2, width: secondaryWidth, height: height / 2 }
                ];
            }
            const primaryHeight = height * size;
            const secondaryHeight = height - primaryHeight;
            const primaryTop = position === 'bottom' ? secondaryHeight : 0;
            const secondaryTop = position === 'bottom' ? 0 : primaryHeight;
            return [
                { subject: subjects[0], left: 0, top: primaryTop, width, height: primaryHeight },
                { subject: subjects[1], left: 0, top: secondaryTop, width: width / 2, height: secondaryHeight },
                { subject: subjects[2], left: width / 2, top: secondaryTop, width: width / 2, height: secondaryHeight }
            ];
        }
        return (Array.isArray(subjects) ? subjects : []).map((subject, index) => ({ subject, left: (index % 2) * width / 2, top: Math.floor(index / 2) * height / 2, width: width / 2, height: height / 2 }));
    }

    function speakerPreviewPaneGeometry(focus, width, height) {
        const subjects = focus && focus.source === 'speaker-grid-face'
            ? (Array.isArray(focus.gridSubjects) ? focus.gridSubjects.slice(0, 4) : [])
            : (Array.isArray(focus && focus.dualSubjects) ? focus.dualSubjects.slice(0, 2) : []);
        if (subjects.length < 2) return [];
        if (focus.source === 'speaker-grid-face') return speakerGridPaneGeometry(subjects, width, height, focus.speakerLayout);
        const layout = Object.assign({ orientation: 'vertical', split: 0.5, primaryPosition: 'top', gridPrimarySize: 0.54, gridPrimaryPosition: 'top', gridPaging: 'rotate', gridPageSeconds: 3, gridEnergyThreshold: 0.35, gridEnergyHysteresis: 0.08, gridEnergyHoldSeconds: 1.2, gridTransition: 'fade', gridTransitionMs: 320, gridTransitionEasing: 'ease-in-out', gridSlideDirection: 'auto', gridManualPages: [], gridManualPageSeconds: [] }, focus.speakerLayout || {});
        const split = Math.max(0.35, Math.min(0.65, Number(layout.split) || 0.5));
        if (layout.orientation === 'horizontal') {
            const primaryWidth = width * split;
            const secondaryWidth = width - primaryWidth;
            return layout.primaryPosition === 'right'
                ? [{ subject: subjects[1], left: 0, top: 0, width: secondaryWidth, height }, { subject: subjects[0], left: secondaryWidth, top: 0, width: primaryWidth, height }]
                : [{ subject: subjects[0], left: 0, top: 0, width: primaryWidth, height }, { subject: subjects[1], left: primaryWidth, top: 0, width: secondaryWidth, height }];
        }
        const primaryHeight = height * split;
        const secondaryHeight = height - primaryHeight;
        return layout.primaryPosition === 'bottom'
            ? [{ subject: subjects[1], left: 0, top: 0, width, height: secondaryHeight }, { subject: subjects[0], left: 0, top: secondaryHeight, width, height: primaryHeight }]
            : [{ subject: subjects[0], left: 0, top: 0, width, height: primaryHeight }, { subject: subjects[1], left: 0, top: primaryHeight, width, height: secondaryHeight }];
    }

    function syncSpeakerPreviewOverlay(time) {
        const overlay = els.speakerPreviewOverlay;
        if (!overlay) return;
        const directCropActive = Boolean(els.directCropOverlay && els.directCropOverlay.dataset.active === 'true');
        const engine = getSmartReframeEngine();
        const focus = state.smartReframe && engine.getFocusAt ? engine.getFocusAt(state.smartReframe, Number(time) || 0) : null;
        const active = !directCropActive && state.settings && state.settings.cropMode === 'smart' && focus && (focus.source === 'speaker-dual-face' || focus.source === 'speaker-grid-face');
        overlay.hidden = !active;
        overlay.dataset.mode = active ? (focus.source === 'speaker-grid-face' ? 'grid' : 'dual') : 'none';
        if (!active) { overlay.dataset.transitionActive = 'false'; return; }
        const layout = Object.assign({ orientation: 'vertical', split: 0.5, primaryPosition: 'top', gridPrimarySize: 0.54, gridPrimaryPosition: 'top', gridPaging: 'rotate', gridPageSeconds: 3, gridEnergyThreshold: 0.35, gridEnergyHysteresis: 0.08, gridEnergyHoldSeconds: 1.2, gridTransition: 'fade', gridTransitionMs: 320, gridTransitionEasing: 'ease-in-out', gridSlideDirection: 'auto', gridManualPages: [], gridManualPageSeconds: [] }, focus.speakerLayout || state.smartReframe.speakerLayout || {});
        const orientation = layout.orientation === 'horizontal' ? 'horizontal' : 'vertical';
        const split = Math.max(0.35, Math.min(0.65, Number(layout.split) || 0.5));
        const primaryPosition = orientation === 'horizontal' ? (layout.primaryPosition === 'right' ? 'right' : 'left') : (layout.primaryPosition === 'bottom' ? 'bottom' : 'top');
        const physicalDivider = primaryPosition === 'right' || primaryPosition === 'bottom' ? 1 - split : split;
        overlay.dataset.orientation = orientation;
        overlay.dataset.primaryPosition = primaryPosition;
        const transitionProgress = Math.max(0, Math.min(1, Number(focus.gridTransitionProgress == null ? 1 : focus.gridTransitionProgress)));
        overlay.dataset.transition = layout.gridTransition === 'slide' ? 'slide' : layout.gridTransition === 'none' ? 'none' : 'fade';
        overlay.dataset.slideDirection = ['left', 'right', 'up', 'down'].includes(layout.gridSlideDirection) ? layout.gridSlideDirection : 'left';
        overlay.dataset.transitionEasing = ['linear', 'ease-in', 'ease-out'].includes(layout.gridTransitionEasing) ? layout.gridTransitionEasing : 'ease-in-out';
        overlay.dataset.transitionActive = focus.source === 'speaker-grid-face' && transitionProgress < 1 ? 'true' : 'false';
        overlay.style.setProperty('--speaker-grid-transition-progress', String(transitionProgress));
        overlay.style.setProperty('--speaker-live-divider-percent', `${(physicalDivider * 100).toFixed(1)}%`);
        const rect = overlay.getBoundingClientRect();
        const geometry = speakerPreviewPaneGeometry(focus, Math.max(1, rect.width), Math.max(1, rect.height));
        const guides = [els.speakerPreviewGuide1, els.speakerPreviewGuide2, els.speakerPreviewGuide3, els.speakerPreviewGuide4];
        guides.forEach((guide, index) => {
            if (!guide) return;
            const pane = geometry[index];
            guide.hidden = !pane;
            if (!pane) return;
            guide.style.left = `${(pane.left / Math.max(1, rect.width)) * 100}%`;
            guide.style.top = `${(pane.top / Math.max(1, rect.height)) * 100}%`;
            guide.style.width = `${(pane.width / Math.max(1, rect.width)) * 100}%`;
            guide.style.height = `${(pane.height / Math.max(1, rect.height)) * 100}%`;
            const role = index === 0 ? '주 화자' : `화자 ${index + 1}`;
            const label = pane.subject.speaker || pane.subject.subjectId || role;
            const crop = speakerGuideCropSummary(pane.subject, pane.width, pane.height);
            guide.textContent = `${role} · ${label}${crop ? ` · ${crop}` : ''}`;
        });
        if (els.speakerPreviewDividerControl) {
            const dual = focus.source === 'speaker-dual-face';
            els.speakerPreviewDividerControl.hidden = !dual;
            els.speakerPreviewDividerControl.tabIndex = dual ? 0 : -1;
            els.speakerPreviewDividerControl.setAttribute('aria-orientation', orientation === 'horizontal' ? 'vertical' : 'horizontal');
            els.speakerPreviewDividerControl.setAttribute('aria-valuenow', String(Math.round(split * 100)));
            els.speakerPreviewDividerControl.setAttribute('aria-valuetext', `주 화자 ${Math.round(split * 100)}%`);
        }
        syncSpeakerEnergyStatus(focus, getSmartReframeTime());
        if (els.speakerPreviewOverlayStatus) {            const count = geometry.length;
            const paging = focus.source === 'speaker-grid-face' && Number(focus.gridPageCount) > 1 ? ` · 페이지 ${Number(focus.gridPage) + 1}/${focus.gridPageCount}${focus.gridPageDuration ? ` · ${Number(focus.gridPageDuration).toFixed(1)}초` : ''}` : '';
            const trigger = focus.gridPageTrigger === 'energy' ? ' · 에너지 즉시 전환' : focus.gridPageTrigger === 'manual' ? ' · 수동 페이지' : ''; 
            els.speakerPreviewOverlayStatus.textContent = focus.source === 'speaker-grid-face' ? `${count}명 표시 / ${Number(focus.gridTotalSubjects) || count}명 동시 화자 grid${paging}${trigger}` : `2명 동시 화자 · 주 화자 ${Math.round(split * 100)}%`;
        }
    }

    function syncSpeakerEnergyStatus(focus, target) {
        if (!els.speakerEnergyStatus || !els.speakerEnergyBars || !els.speakerEnergyHoldStatus) return;
        const track = state.smartReframe;
        const layout = track && track.speakerLayout || {};
        const active = Boolean(track && layout.gridPaging === 'energy');
        els.speakerEnergyStatus.hidden = !active;
        if (!active) return;
        const time = Math.max(0, Number(target) || 0);
        const selectedIds = new Set(Array.isArray(focus && focus.gridSubjects) ? focus.gridSubjects.map(item => item.subjectId) : []);
        const activeCues = (Array.isArray(track.speakerCues) ? track.speakerCues : []).filter(cue => time >= Number(cue.start || 0) && time <= Number(cue.end || 0) && cue.subjectId !== 'auto');
        const rows = [];
        const seen = new Set();
        activeCues.sort((a, b) => Number(b.energy || 0) - Number(a.energy || 0)).forEach(cue => { if (!seen.has(cue.subjectId)) { seen.add(cue.subjectId); rows.push(cue); } });
        els.speakerEnergyBars.textContent = '';
        rows.slice(0, 8).forEach(cue => {
            const item = document.createElement('div'); item.className = 'speaker-energy-row'; item.dataset.selected = selectedIds.has(cue.subjectId) ? 'true' : 'false';
            const label = document.createElement('span'); label.textContent = cue.speaker || cue.subjectId;
            const meter = document.createElement('meter'); meter.min = 0; meter.max = 1; meter.value = Math.max(0, Math.min(1, Number(cue.energy == null ? cue.confidence : cue.energy) || 0));
            const value = document.createElement('output'); value.textContent = `${Math.round(meter.value * 100)}%`;
            item.append(label, meter, value); els.speakerEnergyBars.appendChild(item);
        });
        const threshold = Math.max(0, Math.min(1, Number(layout.gridEnergyThreshold == null ? 0.35 : layout.gridEnergyThreshold)));
        const hold = Math.max(0, Math.min(5, Number(layout.gridEnergyHoldSeconds == null ? 1.2 : layout.gridEnergyHoldSeconds)));
        const waiting = rows.filter(cue => !selectedIds.has(cue.subjectId) && Number(cue.energy || 0) >= threshold).map(cue => ({ cue, remaining: Math.max(0, hold - Math.max(0, time - Number(cue.start || 0))) })).sort((a, b) => b.remaining - a.remaining)[0];
        const trigger = focus && focus.gridPageTrigger === 'energy' ? '에너지 paging 활성' : '에너지 감시 중';
        els.speakerEnergyHoldStatus.textContent = waiting && waiting.remaining > 0.01 ? `${trigger} · ${waiting.cue.speaker || waiting.cue.subjectId} hold ${waiting.remaining.toFixed(1)}초 남음` : `${trigger} · 임계값 ${Math.round(threshold * 100)}% · 선택 ${selectedIds.size}명`;
    }

    function syncSpeakerPanePositionOptions(orientation, requested) {
        if (!els.speakerPanePositionSelect) return;
        const horizontal = orientation === 'horizontal';
        const choices = horizontal ? [['left', '왼쪽 화면'], ['right', '오른쪽 화면']] : [['top', '위 화면'], ['bottom', '아래 화면']];
        const fallback = choices[0][0];
        const selected = choices.some(item => item[0] === requested) ? requested : fallback;
        const signature = choices.map(item => item[0]).join('|');
        if (els.speakerPanePositionSelect.dataset.signature !== signature) {
            els.speakerPanePositionSelect.textContent = '';
            choices.forEach(item => {
                const option = document.createElement('option');
                option.value = item[0];
                option.textContent = item[1];
                els.speakerPanePositionSelect.appendChild(option);
            });
            els.speakerPanePositionSelect.dataset.signature = signature;
        }
        els.speakerPanePositionSelect.value = selected;
    }

    function parseSpeakerGridManualPages(value) {
        return String(value || '').split(/\||\n/).map(page => page.split(/[\s,]+/).map(item => item.trim()).filter(item => /^subject-[1-9][0-9]{0,2}$/.test(item)).filter((item, index, list) => list.indexOf(item) === index).slice(0, 4)).filter(page => page.length).slice(0, 12);
    }

    function formatSpeakerGridManualPages(pages) {
        return (Array.isArray(pages) ? pages : []).map(page => (Array.isArray(page) ? page : []).join(',')).filter(Boolean).join(' | ');
    }

    function speakerManualPageDurations(pages, input) {
        const fallback = Math.max(1, Math.min(10, Number(state.smartReframe && state.smartReframe.speakerLayout && state.smartReframe.speakerLayout.gridPageSeconds || 3)));
        const source = Array.isArray(input) ? input : state.smartReframe && state.smartReframe.speakerLayout && state.smartReframe.speakerLayout.gridManualPageSeconds;
        return (Array.isArray(pages) ? pages : []).map((_, index) => Math.max(1, Math.min(10, Number(Array.isArray(source) && source[index] != null ? source[index] : fallback))));
    }

    function commitSpeakerManualPages(pages, durations, message) {
        if (els.speakerGridManualPagesInput) els.speakerGridManualPagesInput.value = formatSpeakerGridManualPages(pages);
        applySpeakerLayoutSettings({ gridManualPages: pages, gridManualPageSeconds: speakerManualPageDurations(pages, durations) });
        if (message) toast(message, 'action');
    }

    function moveSpeakerManualPage(fromIndex, toIndex) {
        const pages = parseSpeakerGridManualPages(els.speakerGridManualPagesInput && els.speakerGridManualPagesInput.value);
        const durations = speakerManualPageDurations(pages);
        const from = Math.max(0, Math.min(pages.length - 1, Number(fromIndex) || 0));
        const to = Math.max(0, Math.min(pages.length - 1, Number(toIndex) || 0));
        if (from === to || !pages[from]) return;
        const moved = pages.splice(from, 1)[0];
        const movedDuration = durations.splice(from, 1)[0];
        pages.splice(to, 0, moved);
        durations.splice(to, 0, movedDuration);
        commitSpeakerManualPages(pages, durations, `수동 화자 페이지 ${from + 1}을 ${to + 1}번으로 이동했습니다.`);
    }

    function moveSpeakerManualPageSubject(pageIndex, fromIndex, toIndex) {
        const pages = parseSpeakerGridManualPages(els.speakerGridManualPagesInput && els.speakerGridManualPagesInput.value);
        const durations = speakerManualPageDurations(pages);
        const page = pages[pageIndex];
        if (!page || fromIndex === toIndex || !page[fromIndex]) return;
        const bounded = Math.max(0, Math.min(page.length - 1, Number(toIndex) || 0));
        const moved = page.splice(fromIndex, 1)[0];
        page.splice(bounded, 0, moved);
        commitSpeakerManualPages(pages, durations, `${moved} 화자를 페이지 ${pageIndex + 1}의 ${bounded + 1}번째로 이동했습니다.`);
    }

    function setSpeakerManualPageDuration(pageIndex, value) {
        const pages = parseSpeakerGridManualPages(els.speakerGridManualPagesInput && els.speakerGridManualPagesInput.value);
        const durations = speakerManualPageDurations(pages);
        if (!pages[pageIndex]) return;
        durations[pageIndex] = Math.max(1, Math.min(10, Number(value) || 3));
        commitSpeakerManualPages(pages, durations, `페이지 ${pageIndex + 1} 표시 시간을 ${durations[pageIndex]}초로 변경했습니다.`);
    }

    function renderSpeakerManualPageEditor(pagesInput, durationsInput, enabled) {
        if (!els.speakerGridManualPageEditor) return;
        const pages = Array.isArray(pagesInput) ? pagesInput : [];
        const durations = speakerManualPageDurations(pages, durationsInput);
        els.speakerGridManualPageEditor.textContent = '';
        els.speakerGridManualPageEditor.dataset.state = pages.length ? 'ready' : 'empty';
        if (!pages.length) {
            const empty = document.createElement('small');
            empty.textContent = '수동 페이지를 입력하면 페이지와 페이지 안 화자 순서·표시 시간을 편집할 수 있습니다.';
            els.speakerGridManualPageEditor.appendChild(empty);
            return;
        }
        pages.forEach((page, index) => {
            const card = document.createElement('div');
            card.className = 'speaker-grid-manual-page-card';
            card.draggable = Boolean(enabled);
            card.dataset.pageIndex = String(index);
            card.setAttribute('role', 'listitem');
            card.setAttribute('aria-label', `페이지 ${index + 1}, ${durations[index]}초, ${page.join(', ')}`);
            const grip = document.createElement('span');
            grip.className = 'speaker-grid-manual-page-grip';
            grip.textContent = '⋮⋮';
            grip.setAttribute('aria-hidden', 'true');
            const content = document.createElement('div');
            content.className = 'speaker-grid-manual-page-content';
            const heading = document.createElement('strong');
            heading.textContent = `페이지 ${index + 1}`;
            const duration = document.createElement('label');
            duration.className = 'speaker-grid-manual-page-duration';
            const durationText = document.createElement('span');
            durationText.textContent = '표시 시간';
            const durationInput = document.createElement('input');
            durationInput.type = 'number'; durationInput.min = '1'; durationInput.max = '10'; durationInput.step = '0.5';
            durationInput.value = String(durations[index]); durationInput.disabled = !enabled;
            durationInput.setAttribute('aria-label', `페이지 ${index + 1} 표시 시간 초`);
            durationInput.addEventListener('change', () => setSpeakerManualPageDuration(index, durationInput.value));
            duration.append(durationText, durationInput);
            const subjects = document.createElement('div');
            subjects.className = 'speaker-grid-manual-subject-list';
            subjects.setAttribute('role', 'list');
            page.forEach((subjectId, subjectIndex) => {
                const chip = document.createElement('div');
                chip.className = 'speaker-grid-manual-subject-chip';
                chip.draggable = Boolean(enabled);
                chip.dataset.subjectIndex = String(subjectIndex);
                chip.setAttribute('role', 'listitem');
                const name = document.createElement('span'); name.textContent = subjectId;
                const actions = document.createElement('span'); actions.className = 'speaker-grid-manual-subject-actions';
                [['←', subjectIndex - 1], ['→', subjectIndex + 1]].forEach(([text, next]) => {
                    const button = document.createElement('button'); button.type = 'button'; button.className = 'mini-action'; button.textContent = text;
                    button.disabled = !enabled || next < 0 || next >= page.length;
                    button.setAttribute('aria-label', `${subjectId} ${text === '←' ? '앞으로' : '뒤로'} 이동`);
                    button.addEventListener('click', () => moveSpeakerManualPageSubject(index, subjectIndex, next));
                    actions.appendChild(button);
                });
                chip.addEventListener('dragstart', event => { if (event.dataTransfer) { event.stopPropagation(); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('application/x-speaker-subject', `${index}:${subjectIndex}`); } });
                chip.addEventListener('dragover', event => { if (enabled && event.dataTransfer && Array.from(event.dataTransfer.types || []).includes('application/x-speaker-subject')) event.preventDefault(); });
                chip.addEventListener('drop', event => { const value = event.dataTransfer && event.dataTransfer.getData('application/x-speaker-subject'); if (!value) return; event.preventDefault(); event.stopPropagation(); const [sourcePage, sourceIndex] = value.split(':').map(Number); if (sourcePage === index) moveSpeakerManualPageSubject(index, sourceIndex, subjectIndex); });
                chip.append(name, actions); subjects.appendChild(chip);
            });
            content.append(heading, duration, subjects);
            const controls = document.createElement('span');
            controls.className = 'speaker-grid-manual-page-actions';
            [['위', index - 1], ['아래', index + 1]].forEach(([text, next]) => {
                const button = document.createElement('button'); button.type = 'button'; button.className = 'mini-action'; button.textContent = text;
                button.disabled = !enabled || next < 0 || next >= pages.length;
                button.addEventListener('click', () => moveSpeakerManualPage(index, next)); controls.appendChild(button);
            });
            card.addEventListener('dragstart', event => { if (event.target !== card && event.target.closest('.speaker-grid-manual-subject-chip')) return; speakerManualPageDragIndex = index; card.dataset.dragging = 'true'; if (event.dataTransfer) { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', String(index)); } });
            card.addEventListener('dragover', event => { if (enabled && !(event.dataTransfer && Array.from(event.dataTransfer.types || []).includes('application/x-speaker-subject'))) { event.preventDefault(); card.dataset.dropTarget = 'true'; } });
            card.addEventListener('dragleave', () => { delete card.dataset.dropTarget; });
            card.addEventListener('drop', event => { if (event.dataTransfer && Array.from(event.dataTransfer.types || []).includes('application/x-speaker-subject')) return; event.preventDefault(); delete card.dataset.dropTarget; const source = speakerManualPageDragIndex >= 0 ? speakerManualPageDragIndex : Number(event.dataTransfer && event.dataTransfer.getData('text/plain')); speakerManualPageDragIndex = -1; moveSpeakerManualPage(source, index); });
            card.addEventListener('dragend', () => { speakerManualPageDragIndex = -1; delete card.dataset.dragging; delete card.dataset.dropTarget; });
            card.append(grip, content, controls);
            els.speakerGridManualPageEditor.appendChild(card);
        });
    }

    function applySpeakerLayoutSettings(options) {
        const opts = Object.assign({ recordHistory: true, persist: true }, options || {});
        const engine = getSmartReframeEngine();
        if (!state.smartReframe || !engine.updateSpeakerLayout) return;
        if (opts.recordHistory) recordSpeakerTimelineHistory();
        const orientation = els.speakerPaneOrientationSelect && els.speakerPaneOrientationSelect.value === 'horizontal' ? 'horizontal' : 'vertical';
        const split = Math.max(0.35, Math.min(0.65, Number(els.speakerPaneSplitInput && els.speakerPaneSplitInput.value || 50) / 100));
        const requested = String(els.speakerPanePositionSelect && els.speakerPanePositionSelect.value || '');
        const primaryPosition = orientation === 'horizontal' ? (requested === 'right' ? 'right' : 'left') : (requested === 'bottom' ? 'bottom' : 'top');
        const gridPrimarySize = Math.max(0.45, Math.min(0.65, Number(els.speakerGridPrimarySizeInput && els.speakerGridPrimarySizeInput.value || 54) / 100));
        const gridPrimaryPosition = ['top', 'bottom', 'left', 'right'].includes(String(els.speakerGridPrimaryPositionSelect && els.speakerGridPrimaryPositionSelect.value || 'top')) ? els.speakerGridPrimaryPositionSelect.value : 'top';
        const requestedPaging = String(els.speakerGridPagingSelect && els.speakerGridPagingSelect.value || 'rotate');
        const gridPaging = ['priority', 'energy', 'manual'].includes(requestedPaging) ? requestedPaging : 'rotate';
        const gridPageSeconds = Math.max(1, Math.min(10, Number(els.speakerGridPageSecondsInput && els.speakerGridPageSecondsInput.value || 3)));
        const gridEnergyThreshold = Math.max(0, Math.min(1, Number(els.speakerGridEnergyThresholdInput && els.speakerGridEnergyThresholdInput.value || 0.35)));
        const gridEnergyHysteresis = Math.max(0, Math.min(0.3, Number(els.speakerGridEnergyHysteresisInput && els.speakerGridEnergyHysteresisInput.value || 0.08)));
        const gridEnergyHoldSeconds = Math.max(0, Math.min(5, Number(els.speakerGridEnergyHoldInput && els.speakerGridEnergyHoldInput.value || 1.2)));
        const requestedTransition = String(els.speakerGridTransitionSelect && els.speakerGridTransitionSelect.value || 'fade');
        const gridTransition = ['none', 'slide'].includes(requestedTransition) ? requestedTransition : 'fade';
        const gridTransitionMs = Math.max(120, Math.min(1200, Math.round(Number(els.speakerGridTransitionMsInput && els.speakerGridTransitionMsInput.value || 320))));
        const requestedEasing = String(els.speakerGridTransitionEasingSelect && els.speakerGridTransitionEasingSelect.value || 'ease-in-out');
        const gridTransitionEasing = ['linear', 'ease-in', 'ease-out'].includes(requestedEasing) ? requestedEasing : 'ease-in-out';
        const requestedDirection = String(els.speakerGridSlideDirectionSelect && els.speakerGridSlideDirectionSelect.value || 'auto');
        const gridSlideDirection = ['left', 'right', 'up', 'down'].includes(requestedDirection) ? requestedDirection : 'auto';
        const gridManualPages = Array.isArray(opts.gridManualPages) ? opts.gridManualPages : parseSpeakerGridManualPages(els.speakerGridManualPagesInput && els.speakerGridManualPagesInput.value);
        const gridManualPageSeconds = speakerManualPageDurations(gridManualPages, opts.gridManualPageSeconds);
        state.smartReframe = engine.updateSpeakerLayout(state.smartReframe, { orientation, split, primaryPosition, gridPrimarySize, gridPrimaryPosition, gridPaging, gridPageSeconds, gridEnergyThreshold, gridEnergyHysteresis, gridEnergyHoldSeconds, gridTransition, gridTransitionMs, gridTransitionEasing, gridSlideDirection, gridManualPages, gridManualPageSeconds }) || state.smartReframe;
        if (opts.persist) persistSmartReframeEdits(state.smartReframe);
        updateSmartReframeUI();
        renderPreviewStill();
    }

    function applyBulkSpeakerCueEdit() {
        const engine = getSmartReframeEngine();
        if (!state.smartReframe || !engine.updateSpeakerCuesBulk || !speakerCueSelection.size) return;
        if (!bulkSpeakerFieldSelected()) {
            toast('일괄 적용할 필드를 하나 이상 선택해주세요.', 'warning');
            return;
        }
        const patch = getBulkSpeakerCuePatch();
        recordSpeakerTimelineHistory();
        const count = speakerCueSelection.size;
        state.smartReframe = engine.updateSpeakerCuesBulk(state.smartReframe, Array.from(speakerCueSelection), patch) || state.smartReframe;
        speakerCueSelection.clear();
        speakerSelectionAnchorIndex = -1;
        if (els.speakerCueBulkShiftInput) els.speakerCueBulkShiftInput.value = '0';
        if (els.speakerCueBulkLabelInput) els.speakerCueBulkLabelInput.value = '';
        persistSmartReframeEdits(state.smartReframe);
        updateSmartReframeUI();
        renderPreviewStill();
        toast(`선택한 ${count}개 화자 구간에 선택 필드만 적용했습니다.`, 'success');
    }

    function getSpeakerTuneIndex(cues) {
        const list = Array.isArray(cues) ? cues : [];
        if (!list.length) return -1;
        if (speakerTuneIndex >= 0 && speakerTuneIndex < list.length) return speakerTuneIndex;
        const time = getSmartReframeTime();
        const inside = list.findIndex(cue => time >= cue.start && time <= cue.end);
        if (inside >= 0) return inside;
        let nearest = 0;
        let distance = Infinity;
        list.forEach((cue, index) => {
            const next = Math.abs(((cue.start + cue.end) / 2) - time);
            if (next < distance) { nearest = index; distance = next; }
        });
        return nearest;
    }

    function syncSpeakerFaceTuningUI() {
        const track = state.smartReframe;
        const cues = Array.isArray(track && track.speakerCues) ? track.speakerCues : [];
        const subjects = Array.isArray(track && track.subjects) ? track.subjects : [];
        reconcileSpeakerCueSelection(cues);
        const index = getSpeakerTuneIndex(cues);
        speakerTuneIndex = index;
        const cue = index >= 0 ? cues[index] : null;
        const speakerLayout = Object.assign({ orientation: 'vertical', split: 0.5, primaryPosition: 'top', gridPrimarySize: 0.54, gridPrimaryPosition: 'top', gridPaging: 'rotate', gridPageSeconds: 3, gridEnergyThreshold: 0.35, gridEnergyHysteresis: 0.08, gridEnergyHoldSeconds: 1.2, gridTransition: 'fade', gridTransitionMs: 320, gridTransitionEasing: 'ease-in-out', gridSlideDirection: 'auto', gridManualPages: [], gridManualPageSeconds: [] }, track && track.speakerLayout || {});
        const speakerLayoutOrientation = speakerLayout.orientation === 'horizontal' ? 'horizontal' : 'vertical';
        const speakerEnergyFocus = track && getSmartReframeEngine().getFocusAt ? getSmartReframeEngine().getFocusAt(track, getSmartReframeTime()) : null;
        syncSpeakerEnergyStatus(speakerEnergyFocus, getSmartReframeTime());
        if (els.speakerFaceTuningCount) els.speakerFaceTuningCount.textContent = `${cues.length}구간`;
        if (els.speakerFaceTuningPanel) els.speakerFaceTuningPanel.dataset.state = cue ? (cue.locked ? 'manual' : 'auto') : 'empty';
        if (els.speakerCueSelectedCount) els.speakerCueSelectedCount.textContent = `선택 ${speakerCueSelection.size}개`;
        if (els.speakerCueSelectAllBtn) els.speakerCueSelectAllBtn.disabled = !cues.length || speakerCueSelection.size === cues.length;
        if (els.speakerCueSelectionClearBtn) els.speakerCueSelectionClearBtn.disabled = !speakerCueSelection.size;
        if (els.speakerCueUndoBtn) els.speakerCueUndoBtn.disabled = !speakerTimelineUndoStack.length;
        if (els.speakerCueRedoBtn) els.speakerCueRedoBtn.disabled = !speakerTimelineRedoStack.length;
        [els.speakerCueBulkShiftToggle, els.speakerCueBulkLabelToggle, els.speakerCueBulkFaceToggle, els.speakerCueBulkPriorityToggle, els.speakerCueBulkGridCropToggle].forEach(input => { if (input) input.disabled = !speakerCueSelection.size; });
        if (els.speakerCueBulkShiftInput) els.speakerCueBulkShiftInput.disabled = !speakerCueSelection.size || !(els.speakerCueBulkShiftToggle && els.speakerCueBulkShiftToggle.checked);
        if (els.speakerCueBulkLabelInput) els.speakerCueBulkLabelInput.disabled = !speakerCueSelection.size || !(els.speakerCueBulkLabelToggle && els.speakerCueBulkLabelToggle.checked);
        syncBulkSpeakerCuePreview();
        if (els.speakerPaneOrientationSelect) {
            els.speakerPaneOrientationSelect.disabled = !track;
            els.speakerPaneOrientationSelect.value = speakerLayoutOrientation;
        }
        if (els.speakerPaneSplitInput) {
            els.speakerPaneSplitInput.disabled = !track;
            els.speakerPaneSplitInput.value = String(Math.round(Number(speakerLayout.split || 0.5) * 100));
        }
        if (els.speakerPaneSplitValue) els.speakerPaneSplitValue.textContent = `${Math.round(Number(speakerLayout.split || 0.5) * 100)}%`;
        if (els.speakerPanePositionSelect) {
            els.speakerPanePositionSelect.disabled = !track;
            syncSpeakerPanePositionOptions(speakerLayoutOrientation, speakerLayout.primaryPosition);
        }
        if (els.speakerPaneDividerControl) els.speakerPaneDividerControl.tabIndex = track ? 0 : -1;
        if (els.speakerGridPrimarySizeInput) { els.speakerGridPrimarySizeInput.disabled = !track; els.speakerGridPrimarySizeInput.value = String(Math.round(Number(speakerLayout.gridPrimarySize || 0.54) * 100)); }
        if (els.speakerGridPrimarySizeValue) els.speakerGridPrimarySizeValue.textContent = `${Math.round(Number(speakerLayout.gridPrimarySize || 0.54) * 100)}%`;
        if (els.speakerGridPrimaryPositionSelect) { els.speakerGridPrimaryPositionSelect.disabled = !track; els.speakerGridPrimaryPositionSelect.value = ['top', 'bottom', 'left', 'right'].includes(speakerLayout.gridPrimaryPosition) ? speakerLayout.gridPrimaryPosition : 'top'; }
        if (els.speakerGridPagingSelect) { els.speakerGridPagingSelect.disabled = !track; els.speakerGridPagingSelect.value = ['priority', 'energy', 'manual'].includes(speakerLayout.gridPaging) ? speakerLayout.gridPaging : 'rotate'; }
        if (els.speakerGridPageSecondsInput) { els.speakerGridPageSecondsInput.disabled = !track || speakerLayout.gridPaging === 'priority' || speakerLayout.gridPaging === 'energy'; els.speakerGridPageSecondsInput.value = String(Number(speakerLayout.gridPageSeconds || 3)); }
        if (els.speakerGridEnergyThresholdInput) { els.speakerGridEnergyThresholdInput.disabled = !track || speakerLayout.gridPaging !== 'energy'; els.speakerGridEnergyThresholdInput.value = String(Number(speakerLayout.gridEnergyThreshold == null ? 0.35 : speakerLayout.gridEnergyThreshold)); }
        if (els.speakerGridEnergyHysteresisInput) { els.speakerGridEnergyHysteresisInput.disabled = !track || speakerLayout.gridPaging !== 'energy'; els.speakerGridEnergyHysteresisInput.value = String(Number(speakerLayout.gridEnergyHysteresis == null ? 0.08 : speakerLayout.gridEnergyHysteresis)); }
        if (els.speakerGridEnergyHoldInput) { els.speakerGridEnergyHoldInput.disabled = !track || speakerLayout.gridPaging !== 'energy'; els.speakerGridEnergyHoldInput.value = String(Number(speakerLayout.gridEnergyHoldSeconds == null ? 1.2 : speakerLayout.gridEnergyHoldSeconds)); }
        if (els.speakerGridTransitionSelect) { els.speakerGridTransitionSelect.disabled = !track || speakerLayout.gridPaging === 'priority' || speakerLayout.gridPaging === 'energy'; els.speakerGridTransitionSelect.value = ['none', 'slide'].includes(speakerLayout.gridTransition) ? speakerLayout.gridTransition : 'fade'; }
        if (els.speakerGridTransitionMsInput) { els.speakerGridTransitionMsInput.disabled = !track || speakerLayout.gridPaging === 'priority' || speakerLayout.gridPaging === 'energy' || speakerLayout.gridTransition === 'none'; els.speakerGridTransitionMsInput.value = String(Math.round(Number(speakerLayout.gridTransitionMs || 320))); }
        if (els.speakerGridTransitionEasingSelect) { els.speakerGridTransitionEasingSelect.disabled = !track || speakerLayout.gridPaging === 'priority' || speakerLayout.gridPaging === 'energy' || speakerLayout.gridTransition === 'none'; els.speakerGridTransitionEasingSelect.value = ['linear', 'ease-in', 'ease-out'].includes(speakerLayout.gridTransitionEasing) ? speakerLayout.gridTransitionEasing : 'ease-in-out'; }
        if (els.speakerGridSlideDirectionSelect) { els.speakerGridSlideDirectionSelect.disabled = !track || speakerLayout.gridPaging === 'priority' || speakerLayout.gridPaging === 'energy' || speakerLayout.gridTransition !== 'slide'; els.speakerGridSlideDirectionSelect.value = ['left', 'right', 'up', 'down'].includes(speakerLayout.gridSlideDirection) ? speakerLayout.gridSlideDirection : 'auto'; }
        if (els.speakerGridManualPagesInput) { els.speakerGridManualPagesInput.disabled = !track || speakerLayout.gridPaging !== 'manual'; els.speakerGridManualPagesInput.value = formatSpeakerGridManualPages(speakerLayout.gridManualPages); }
        renderSpeakerManualPageEditor(speakerLayout.gridManualPages, speakerLayout.gridManualPageSeconds, Boolean(track && speakerLayout.gridPaging === 'manual'));
        syncSpeakerPaneLayoutPreview(speakerLayout);
        if (els.speakerFaceSubjectSelect) {
            const signature = subjects.map(subject => `${subject.id}:${subject.label}`).join('|');
            if (els.speakerFaceSubjectSelect.dataset.signature !== signature) {
                els.speakerFaceSubjectSelect.textContent = '';
                const automatic = document.createElement('option');
                automatic.value = 'auto';
                automatic.textContent = '자동 추적 유지';
                els.speakerFaceSubjectSelect.appendChild(automatic);
                subjects.forEach(subject => {
                    const option = document.createElement('option');
                    option.value = subject.id;
                    option.textContent = `${subject.label} · 화면 ${Math.round((Number(subject.coverage) || 0) * 100)}%`;
                    els.speakerFaceSubjectSelect.appendChild(option);
                });
                els.speakerFaceSubjectSelect.dataset.signature = signature;
            }
            els.speakerFaceSubjectSelect.disabled = !cue || !subjects.length;
            els.speakerFaceSubjectSelect.value = cue && subjects.some(subject => subject.id === cue.subjectId) ? cue.subjectId : 'auto';
        }
        if (els.speakerFacePrevBtn) els.speakerFacePrevBtn.disabled = index <= 0;
        if (els.speakerFaceNextBtn) els.speakerFaceNextBtn.disabled = index < 0 || index >= cues.length - 1;
        if (els.speakerFaceApplyBtn) els.speakerFaceApplyBtn.disabled = !cue || !subjects.length;
        if (els.speakerFaceApplySpeakerBtn) els.speakerFaceApplySpeakerBtn.disabled = !cue || !cue.speaker || !subjects.length;
        if (els.speakerCueSplitBtn) els.speakerCueSplitBtn.disabled = !cue;
        if (els.speakerCueOverlapBtn) els.speakerCueOverlapBtn.disabled = !cue;
        if (els.speakerCueDeleteBtn) els.speakerCueDeleteBtn.disabled = !cue;
        [els.speakerCueStartInput, els.speakerCueEndInput, els.speakerCueLabelInput, els.speakerCuePrioritySelect].forEach(input => { if (input) input.disabled = !cue; });
        if (els.speakerCueStartInput) els.speakerCueStartInput.value = cue ? Number(cue.start).toFixed(2) : '';
        if (els.speakerCueEndInput) els.speakerCueEndInput.value = cue ? Number(cue.end).toFixed(2) : '';
        if (els.speakerCueLabelInput) els.speakerCueLabelInput.value = cue ? (cue.speaker || '') : '';
        if (els.speakerCuePrioritySelect) els.speakerCuePrioritySelect.value = cue ? (cue.priority || 'auto') : 'auto';
        if (els.speakerFaceAutoBtn) els.speakerFaceAutoBtn.disabled = !cue;
        if (els.speakerFaceLockToggle) {
            els.speakerFaceLockToggle.disabled = !cue;
            els.speakerFaceLockToggle.checked = Boolean(cue && cue.locked);
        }
        const gridCrop = Object.assign({ x: 0, y: 0, zoom: 1 }, cue && cue.gridCrop || {});
        const gridCropControls = [els.speakerGridCropXInput, els.speakerGridCropYInput, els.speakerGridCropZoomInput];
        gridCropControls.forEach(input => { if (input) input.disabled = !cue; });
        if (els.speakerGridCropXInput) els.speakerGridCropXInput.value = String(Math.round(Number(gridCrop.x || 0) * 100));
        if (els.speakerGridCropYInput) els.speakerGridCropYInput.value = String(Math.round(Number(gridCrop.y || 0) * 100));
        if (els.speakerGridCropZoomInput) els.speakerGridCropZoomInput.value = String(Math.round(Number(gridCrop.zoom || 1) * 100));
        if (els.speakerGridCropXValue) els.speakerGridCropXValue.textContent = `${Number(gridCrop.x) >= 0 ? '+' : ''}${Math.round(Number(gridCrop.x || 0) * 100)}%`;
        if (els.speakerGridCropYValue) els.speakerGridCropYValue.textContent = `${Number(gridCrop.y) >= 0 ? '+' : ''}${Math.round(Number(gridCrop.y || 0) * 100)}%`;
        if (els.speakerGridCropZoomValue) els.speakerGridCropZoomValue.textContent = `${Math.round(Number(gridCrop.zoom || 1) * 100)}%`;
        const confidence = cue ? Math.max(0, Math.min(1, Number(cue.confidence) || 0)) : 0;
        if (els.speakerFaceConfidenceValue) els.speakerFaceConfidenceValue.textContent = `${Math.round(confidence * 100)}%`;
        if (els.speakerFaceConfidenceMeter) els.speakerFaceConfidenceMeter.value = confidence;
        if (els.speakerFaceConfidenceHistory) {
            els.speakerFaceConfidenceHistory.textContent = '';
            const history = Array.isArray(cue && cue.confidenceHistory) ? cue.confidenceHistory.slice(-6) : [];
            history.forEach((entry, historyIndex) => {
                const chip = document.createElement('span');
                chip.dataset.current = historyIndex === history.length - 1 ? 'true' : 'false';
                chip.textContent = `${Math.round((Number(entry.confidence) || 0) * 100)}%`;
                chip.title = `${entry.subjectId === 'auto' ? '자동 추적' : entry.subjectId} · ${entry.source || 'face-activity'}`;
                els.speakerFaceConfidenceHistory.appendChild(chip);
            });
        }
        if (els.speakerFaceCueRange) els.speakerFaceCueRange.textContent = cue ? `${formatSpeakerCueTime(cue.start)}–${formatSpeakerCueTime(cue.end)} · ${cue.speaker || `발화 ${index + 1}`}` : '발화 구간 없음';
        if (els.speakerFaceCueMeta) {
            const subject = cue && subjects.find(item => item.id === cue.subjectId);
            els.speakerFaceCueMeta.textContent = !cue
                ? '전사 또는 자막을 연결하면 구간별 얼굴을 조정할 수 있습니다.'
                : `${subject ? subject.label : '자동 추적'} · ${cue.locked ? '수동 고정' : '자동 연결'} · 에너지 ${Math.round((Number(cue.energy) || 0) * 100)}% · ${cue.source === 'diarization-face' ? '화자 라벨 기반' : cue.source === 'face-activity' ? '얼굴 활동 기반' : cue.source === 'manual-override' ? '사용자 지정' : '자동 대체'}`;
        }
        if (els.speakerCueTimeline) {
            els.speakerCueTimeline.textContent = '';
            const engine = getSmartReframeEngine();
            cues.forEach((item, cueIndex) => {
                const key = engine.speakerCueKey ? engine.speakerCueKey(item) : `${item.start}:${item.end}:${item.speaker}`;
                const card = document.createElement('div');
                card.className = 'speaker-cue-card';
                card.dataset.cueIndex = String(cueIndex);
                card.dataset.cueKey = key;
                card.dataset.multiSelected = speakerCueSelection.has(key) ? 'true' : 'false';
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = speakerCueSelection.has(key);
                checkbox.setAttribute('aria-label', `${item.speaker || `발화 ${cueIndex + 1}`} 구간 선택`);
                checkbox.addEventListener('pointerdown', event => {
                    if (event.button !== 0) return;
                    event.preventDefault();
                    event.stopPropagation();
                    speakerSelectionDragActive = true;
                    speakerSelectionPointerId = event.pointerId;
                    speakerSelectionDragValue = !speakerCueSelection.has(key);
                    if (els.speakerCueTimeline && els.speakerCueTimeline.setPointerCapture) els.speakerCueTimeline.setPointerCapture(event.pointerId);
                    updateSpeakerCueSelection(cues, cueIndex, speakerSelectionDragValue, event.shiftKey);
                    syncSpeakerCueSelectionDom();
                });
                checkbox.addEventListener('change', event => {
                    updateSpeakerCueSelection(cues, cueIndex, checkbox.checked, event.shiftKey);
                    syncSpeakerFaceTuningUI();
                });
                card.addEventListener('pointerenter', event => {
                    if (!speakerSelectionDragActive || event.buttons !== 1) return;
                    setSpeakerCueSelected(cues, cueIndex, speakerSelectionDragValue);
                    syncSpeakerCueSelectionDom();
                });
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'speaker-cue-item';
                button.dataset.selected = cueIndex === index ? 'true' : 'false';
                button.setAttribute('role', 'option');
                button.setAttribute('aria-selected', cueIndex === index ? 'true' : 'false');
                const timeLabel = document.createElement('strong');
                timeLabel.textContent = `${formatSpeakerCueTime(item.start)}–${formatSpeakerCueTime(item.end)}`;
                const speakerLabel = document.createElement('span');
                speakerLabel.textContent = item.speaker || `발화 ${cueIndex + 1}`;
                const modeLabel = document.createElement('small');
                const overlaps = cues.filter((candidate, candidateIndex) => candidateIndex !== cueIndex && Math.min(item.end, candidate.end) - Math.max(item.start, candidate.start) > 0.049).length;
                const role = item.priority === 'primary' ? '주 화자' : item.priority === 'secondary' ? '보조 화자' : '';
                modeLabel.textContent = [item.locked ? '수동 고정' : item.subjectId === 'auto' ? '자동 추적' : '얼굴 연결', role, overlaps ? `겹침 ${overlaps}` : ''].filter(Boolean).join(' · ');
                button.append(timeLabel, speakerLabel, modeLabel);
                button.addEventListener('click', event => {
                    if (event.shiftKey) {
                        updateSpeakerCueSelection(cues, cueIndex, true, true);
                        syncSpeakerFaceTuningUI();
                    } else {
                        speakerSelectionAnchorIndex = cueIndex;
                    }
                    speakerTuneIndex = cueIndex;
                    selectSpeakerTuneCue(0);
                });
                card.append(checkbox, button);
                els.speakerCueTimeline.appendChild(card);
            });
        }
    }

    function selectSpeakerTuneCue(direction) {
        const cues = Array.isArray(state.smartReframe && state.smartReframe.speakerCues) ? state.smartReframe.speakerCues : [];
        if (!cues.length) return;
        speakerTuneIndex = Math.max(0, Math.min(cues.length - 1, getSpeakerTuneIndex(cues) + Number(direction || 0)));
        const cue = cues[speakerTuneIndex];
        if (els.sourceVideo && Number.isFinite(Number(els.sourceVideo.duration))) els.sourceVideo.currentTime = Math.max(0, Math.min(Number(els.sourceVideo.duration) || cue.start, cue.start + 0.02));
        syncSpeakerFaceTuningUI();
        renderPreviewStill();
    }

    function applySpeakerTuneCue() {
        const engine = getSmartReframeEngine();
        const cues = Array.isArray(state.smartReframe && state.smartReframe.speakerCues) ? state.smartReframe.speakerCues : [];
        const index = getSpeakerTuneIndex(cues);
        const cue = index >= 0 ? cues[index] : null;
        if (!cue || !engine.updateSpeakerCue || !engine.speakerCueKey) return;
        const subjectId = els.speakerFaceSubjectSelect ? els.speakerFaceSubjectSelect.value : 'auto';
        const locked = Boolean(els.speakerFaceLockToggle && els.speakerFaceLockToggle.checked && subjectId !== 'auto');
        const start = Math.max(0, Number(els.speakerCueStartInput && els.speakerCueStartInput.value));
        const end = Math.max(start + 0.05, Number(els.speakerCueEndInput && els.speakerCueEndInput.value));
        const speaker = String(els.speakerCueLabelInput && els.speakerCueLabelInput.value || '').trim().slice(0, 40);
        const priority = els.speakerCuePrioritySelect ? els.speakerCuePrioritySelect.value : 'auto';
        const gridCrop = {
            x: Math.max(-0.25, Math.min(0.25, Number(els.speakerGridCropXInput && els.speakerGridCropXInput.value || 0) / 100)),
            y: Math.max(-0.25, Math.min(0.25, Number(els.speakerGridCropYInput && els.speakerGridCropYInput.value || 0) / 100)),
            zoom: Math.max(1, Math.min(1.35, Number(els.speakerGridCropZoomInput && els.speakerGridCropZoomInput.value || 100) / 100))
        };
        const boundedStart = start;
        const boundedEnd = end;
        if (!(boundedEnd > boundedStart + 0.049)) { toast('발화 구간은 최소 0.05초 이상이어야 합니다.', 'warning'); return; }
        recordSpeakerTimelineHistory();
        state.smartReframe = engine.updateSpeakerCue(state.smartReframe, engine.speakerCueKey(cue), {
            start: boundedStart, end: boundedEnd, speaker, subjectId, locked, priority, gridCrop,
            source: locked ? 'manual-override' : cue.source
        }) || state.smartReframe;
        persistSmartReframeEdits(state.smartReframe);
        updateSmartReframeUI();
        renderPreviewStill();
        toast(locked ? '이 발화 구간의 얼굴 연결을 고정했습니다.' : subjectId === 'auto' ? '이 발화 구간을 자동 추적으로 전환했습니다.' : '이 발화 구간의 얼굴 연결을 변경했습니다.', 'success');
    }


    function applySpeakerTuneToMatchingSpeaker() {
        const engine = getSmartReframeEngine();
        const cues = Array.isArray(state.smartReframe && state.smartReframe.speakerCues) ? state.smartReframe.speakerCues : [];
        const index = getSpeakerTuneIndex(cues);
        const cue = index >= 0 ? cues[index] : null;
        if (!cue || !cue.speaker || !engine.updateSpeakerCuesBySpeaker) return;
        const subjectId = els.speakerFaceSubjectSelect ? els.speakerFaceSubjectSelect.value : 'auto';
        const locked = Boolean(els.speakerFaceLockToggle && els.speakerFaceLockToggle.checked && subjectId !== 'auto');
        const priority = els.speakerCuePrioritySelect ? els.speakerCuePrioritySelect.value : cue.priority || 'auto';
        const gridCrop = {
            x: Math.max(-0.25, Math.min(0.25, Number(els.speakerGridCropXInput && els.speakerGridCropXInput.value || 0) / 100)),
            y: Math.max(-0.25, Math.min(0.25, Number(els.speakerGridCropYInput && els.speakerGridCropYInput.value || 0) / 100)),
            zoom: Math.max(1, Math.min(1.35, Number(els.speakerGridCropZoomInput && els.speakerGridCropZoomInput.value || 100) / 100))
        };
        recordSpeakerTimelineHistory();
        state.smartReframe = engine.updateSpeakerCuesBySpeaker(state.smartReframe, cue.speaker, {
            subjectId, locked, priority, gridCrop, source: locked ? 'manual-override' : cue.source
        }) || state.smartReframe;
        persistSmartReframeEdits(state.smartReframe);
        updateSmartReframeUI();
        renderPreviewStill();
        const count = (state.smartReframe.speakerCues || []).filter(item => item.speaker === cue.speaker).length;
        toast(`${cue.speaker} 화자의 ${count}개 구간에 얼굴 연결과 역할을 적용했습니다.`, 'success');
    }

    function splitSpeakerTuneCue() {
        const engine = getSmartReframeEngine();
        const cues = Array.isArray(state.smartReframe && state.smartReframe.speakerCues) ? state.smartReframe.speakerCues : [];
        const index = getSpeakerTuneIndex(cues);
        const cue = index >= 0 ? cues[index] : null;
        if (!cue || !engine.splitSpeakerCue || !engine.speakerCueKey) return;
        const current = Math.max(cue.start + 0.05, Math.min(cue.end - 0.05, getSmartReframeTime()));
        if (current <= cue.start + 0.049 || current >= cue.end - 0.049) { toast('재생 위치를 구간 안쪽으로 옮긴 뒤 분할하세요.', 'warning'); return; }
        const nextLabel = String(els.speakerCueLabelInput && els.speakerCueLabelInput.value || cue.speaker || '').trim().slice(0, 40);
        recordSpeakerTimelineHistory();
        state.smartReframe = engine.splitSpeakerCue(state.smartReframe, engine.speakerCueKey(cue), current, { speaker: nextLabel, locked: false, mode: 'auto' }) || state.smartReframe;
        speakerTuneIndex = Math.min(index + 1, (state.smartReframe.speakerCues || []).length - 1);
        persistSmartReframeEdits(state.smartReframe);
        updateSmartReframeUI();
        renderPreviewStill();
        toast('동시 발화 또는 화자 전환 지점으로 구간을 분할했습니다.', 'success');
    }

    function addOverlappingSpeakerTuneCue() {
        const engine = getSmartReframeEngine();
        const cues = Array.isArray(state.smartReframe && state.smartReframe.speakerCues) ? state.smartReframe.speakerCues : [];
        const index = getSpeakerTuneIndex(cues);
        const cue = index >= 0 ? cues[index] : null;
        if (!cue || !engine.duplicateSpeakerCue || !engine.speakerCueKey) return;
        const baseLabel = String(cue.speaker || `화자 ${index + 1}`).trim().slice(0, 32);
        const used = new Set(cues.map(item => item.speaker));
        let suffix = 2;
        let label = `${baseLabel} 보조`.slice(0, 40);
        while (used.has(label) && suffix < 100) { label = `${baseLabel} 보조 ${suffix}`.slice(0, 40); suffix += 1; }
        recordSpeakerTimelineHistory();
        state.smartReframe = engine.duplicateSpeakerCue(state.smartReframe, engine.speakerCueKey(cue), { speaker: label, priority: 'secondary' }) || state.smartReframe;
        const nextCues = state.smartReframe.speakerCues || [];
        speakerTuneIndex = nextCues.findIndex(item => item.start === cue.start && item.end === cue.end && item.speaker === label);
        persistSmartReframeEdits(state.smartReframe);
        updateSmartReframeUI();
        renderPreviewStill();
        toast('같은 시간 범위에 보조 화자를 추가했습니다. 얼굴을 선택하면 2분할 화면으로 유지됩니다.', 'success');
    }

    function deleteSpeakerTuneCue() {
        const engine = getSmartReframeEngine();
        const cues = Array.isArray(state.smartReframe && state.smartReframe.speakerCues) ? state.smartReframe.speakerCues : [];
        const index = getSpeakerTuneIndex(cues);
        const cue = index >= 0 ? cues[index] : null;
        if (!cue || !engine.removeSpeakerCue || !engine.speakerCueKey) return;
        recordSpeakerTimelineHistory();
        state.smartReframe = engine.removeSpeakerCue(state.smartReframe, engine.speakerCueKey(cue)) || state.smartReframe;
        speakerTuneIndex = Math.max(0, Math.min(index, (state.smartReframe.speakerCues || []).length - 1));
        persistSmartReframeEdits(state.smartReframe);
        updateSmartReframeUI();
        renderPreviewStill();
        toast('선택한 발화 구간을 삭제했습니다.', 'action');
    }

    async function resetSpeakerTuneCue() {
        const engine = getSmartReframeEngine();
        const cues = Array.isArray(state.smartReframe && state.smartReframe.speakerCues) ? state.smartReframe.speakerCues : [];
        const index = getSpeakerTuneIndex(cues);
        const cue = index >= 0 ? cues[index] : null;
        if (!cue || !engine.updateSpeakerCue || !engine.speakerCueKey) return;
        recordSpeakerTimelineHistory();
        state.smartReframe = engine.updateSpeakerCue(state.smartReframe, engine.speakerCueKey(cue), { subjectId: 'auto', locked: false, mode: 'auto', source: 'face-activity' }) || state.smartReframe;
        persistSmartReframeEdits(state.smartReframe);
        await linkSpeakerFaces(null, 'speaker-tuning-auto');
        toast('선택 구간을 자동 화자 연결로 되돌렸습니다.', 'action');
    }

    function updateSpeakerFaceUI() {
        const enabled = getSmartReframeOptions().speakerPriority !== false;
        const track = state.smartReframe;
        const cues = Array.isArray(track && track.speakerCues) ? track.speakerCues : [];
        const subjects = Array.isArray(track && track.subjects) ? track.subjects : [];
        const segments = getSpeakerSegments();
        if (els.smartReframeSpeakerPriorityToggle) {
            els.smartReframeSpeakerPriorityToggle.checked = enabled;
            els.smartReframeSpeakerPriorityToggle.disabled = !track;
        }
        if (els.smartReframeSpeakerLinkBtn) {
            els.smartReframeSpeakerLinkBtn.disabled = !track || !subjects.length || !segments.length || Boolean(speakerLinkPromise);
            els.smartReframeSpeakerLinkBtn.textContent = speakerLinkPromise ? '화자 연결 중' : cues.length ? '화자 다시 연결' : '화자 연결';
        }
        syncSpeakerFaceTuningUI();
        if (!els.smartReframeSpeakerStatus) return;
        if (!enabled) els.smartReframeSpeakerStatus.textContent = '말하는 사람 우선 추적이 꺼져 있습니다.';
        else if (track && track.activeSubjectId !== 'auto') els.smartReframeSpeakerStatus.textContent = '수동 주 피사체 고정이 화자 자동 전환보다 우선합니다.';
        else if (cues.length) {
            const linked = cues.filter(cue => cue.subjectId !== 'auto').length;
            const switches = cues.reduce((count, cue, index) => index && cues[index - 1].subjectId !== cue.subjectId ? count + 1 : count, 0);
            const overlaps = cues.reduce((count, cue, index) => count + cues.slice(index + 1).filter(other => cue.subjectId !== 'auto' && other.subjectId !== 'auto' && cue.subjectId !== other.subjectId && Math.min(cue.end, other.end) - Math.max(cue.start, other.start) > 0.049).length, 0);
            els.smartReframeSpeakerStatus.textContent = `발화 ${cues.length}구간 · 얼굴 연결 ${linked}구간 · 전환 ${switches}회${overlaps ? ` · 동시 발화 ${overlaps}쌍` : ''}`;
        } else if (!segments.length) els.smartReframeSpeakerStatus.textContent = '로컬 전사 또는 자막을 적용하면 말하는 사람을 우선 추적합니다.';
        else if (!subjects.length) els.smartReframeSpeakerStatus.textContent = '얼굴 감지 후 발화 구간과 인물을 연결할 수 있습니다.';
        else els.smartReframeSpeakerStatus.textContent = '발화 구간과 얼굴 움직임을 연결할 준비가 됐습니다.';
    }

    async function linkSpeakerFaces(inputSegments, source) {
        const segments = Array.isArray(inputSegments) && inputSegments.length ? inputSegments.map(item => Object.assign({}, item)) : getSpeakerSegments();
        if (!segments.length || !state.smartReframe) { updateSpeakerFaceUI(); return null; }
        if (speakerLinkPromise) return speakerLinkPromise;
        speakerLinkPromise = (async () => {
            if ((!getSpeakerFaceLinker().linkSegmentsToFaces || !getSmartReframeEngine().applySpeakerCues) && global.AIShortsStagedUiLoader && global.AIShortsStagedUiLoader.ensure) {
                await global.AIShortsStagedUiLoader.ensure('editing');
            }
            const linker = getSpeakerFaceLinker();
            const engine = getSmartReframeEngine();
            if (!linker.linkSegmentsToFaces || !engine.applySpeakerCues) return null;
            const result = linker.linkSegmentsToFaces(segments, state.smartReframe, { source: source || 'captions', existingCues: state.smartReframe.speakerCues || [] });
            lastSpeakerFaceLinkResult = result;
            state.smartReframe = engine.applySpeakerCues(state.smartReframe, result.cues, getSmartReframeOptions().speakerPriority !== false) || state.smartReframe;
            persistSmartReframeEdits(state.smartReframe);
            if (store.addDiagnostic) store.addDiagnostic({
                type: 'speaker-face-link',
                source: source || 'captions',
                segments: result.summary && result.summary.segments || 0,
                subjects: result.summary && result.summary.subjects || 0,
                linked: result.summary && result.summary.linked || 0,
                switches: result.summary && result.summary.switches || 0
            });
            renderPreviewStill();
            const status = linker.status ? linker.status(result) : null;
            if (status && status.ready) toast(status.label, 'success');
            return result;
        })().catch(error => {
            if (store.addDiagnostic) store.addDiagnostic({ type: 'speaker-face-link-error', message: error && error.message || 'speaker link failed' });
            toast(error && error.message || '화자와 얼굴을 연결하지 못했습니다.', 'warning');
            return null;
        }).finally(() => {
            speakerLinkPromise = null;
            updateSmartReframeUI();
        });
        updateSpeakerFaceUI();
        return speakerLinkPromise;
    }

    function toggleSpeakerPriority() {
        const enabled = Boolean(els.smartReframeSpeakerPriorityToggle && els.smartReframeSpeakerPriorityToggle.checked);
        const next = Object.assign({}, getSmartReframeOptions(), { speakerPriority: enabled });
        store.setSetting('smartReframeOptions', next);
        const engine = getSmartReframeEngine();
        if (state.smartReframe && engine.setSpeakerPriority) {
            state.smartReframe = engine.setSpeakerPriority(state.smartReframe, enabled) || state.smartReframe;
            persistSmartReframeEdits(state.smartReframe);
        }
        if (enabled && state.smartReframe && !(state.smartReframe.speakerCues && state.smartReframe.speakerCues.length)) linkSpeakerFaces(null, 'toggle');
        updateSmartReframeUI();
        renderPreviewStill();
        toast(enabled ? '말하는 사람 우선 추적을 켰습니다.' : '말하는 사람 자동 전환을 껐습니다.', 'action');
    }

    function applySmartReframeSubjectSelection() {
        clearSmartReframeEditorDraft();
        const engine = getSmartReframeEngine();
        if (!state.smartReframe || !engine.selectSubject || !els.smartReframeSubjectSelect) return;
        state.smartReframe = engine.selectSubject(state.smartReframe, els.smartReframeSubjectSelect.value) || state.smartReframe;
        persistSmartReframeEdits(state.smartReframe);
        updateSmartReframeUI();
        renderPreviewStill();
        const selected = (state.smartReframe.subjects || []).find(item => item.id === state.smartReframe.activeSubjectId);
        toast(selected ? `${selected.label}을 주 피사체로 고정했습니다.` : '주 피사체 자동 선택으로 돌아왔습니다.', 'action');
    }

    function setSmartReframeKeyframe(command) {
        const engine = getSmartReframeEngine();
        if (!state.smartReframe || !engine.upsertKeyframe) return;
        const draft = smartReframeEditorDraft || readSmartReframeEditorDraft();
        const time = draft.time;
        state.smartReframe = engine.upsertKeyframe(state.smartReframe, draft) || state.smartReframe;
        clearSmartReframeEditorDraft();
        persistSmartReframeEdits(state.smartReframe);
        updateSmartReframeUI();
        renderPreviewStill();
        const options = command && typeof command === 'object' ? command : {};
        if (!options.quiet) toast(`${formatSmartReframeTime(time)} 위치에 크롭 키프레임을 저장했습니다.`, 'success');
        syncDirectCropEditor();
    }

    function deleteSmartReframeKeyframe() {
        clearSmartReframeEditorDraft();
        const engine = getSmartReframeEngine();
        if (!state.smartReframe || !engine.removeKeyframe) return;
        const time = getSmartReframeTime();
        const before = state.smartReframe.keyframes ? state.smartReframe.keyframes.length : 0;
        state.smartReframe = engine.removeKeyframe(state.smartReframe, time, 0.35) || state.smartReframe;
        persistSmartReframeEdits(state.smartReframe);
        updateSmartReframeUI();
        renderPreviewStill();
        toast((state.smartReframe.keyframes || []).length < before ? '현재 위치의 크롭 키프레임을 삭제했습니다.' : '현재 위치에는 삭제할 키프레임이 없습니다.', 'action');
    }

    function resetSmartReframeKeyframes() {
        clearSmartReframeEditorDraft();
        const engine = getSmartReframeEngine();
        if (!state.smartReframe || !engine.clearKeyframes) return;
        state.smartReframe = engine.clearKeyframes(state.smartReframe) || state.smartReframe;
        persistSmartReframeEdits(state.smartReframe);
        updateSmartReframeUI();
        renderPreviewStill();
        toast('수동 크롭 키프레임을 모두 초기화했습니다.', 'action');
    }

    async function analyzeSmartReframe() {
        if (state.fileKind !== 'video' || !state.fileUrl || state.isReframing) return;
        if (!getSmartReframeEngine().analyzeVideoSubjects && global.AIShortsStagedUiLoader && global.AIShortsStagedUiLoader.ensure) {
            try { await global.AIShortsStagedUiLoader.ensure('editing'); } catch (error) { /* fallback UI handles unavailable module */ }
        }
        if (!getSmartReframeEngine().analyzeVideoSubjects) {
            updateSmartReframeUI('추적 모듈을 열 수 없음', '기본 중앙 크롭을 계속 사용할 수 있습니다.', 'error');
            return;
        }
        const inputFile = state.file;
        const token = beginOperation('smart-reframe', { source: 'manual', fileName: inputFile && inputFile.name || '' });
        state.isReframing = true;
        updateSmartReframeUI('피사체 추적 중', '영상 프레임에서 여러 인물과 움직임 중심을 확인합니다.', 'tracking');
        try {
            const track = await getSmartReframeEngine().analyzeVideoSubjects(state.fileUrl, (percent, message) => {
                if (token && operationCoordinator.isCurrent && !operationCoordinator.isCurrent(token)) return;
                updateSmartReframeUI('피사체 추적 중', message, 'tracking');
                setProgress(Math.max(0, Math.min(100, percent)), message);
            }, token && token.signal || null, Object.assign({}, getSmartReframeOptions(), getSmartReframeEdits(), { motionAnalysis: state.motionAnalysis }));
            assertOperation(token, '원본이 변경되어 이전 피사체 추적 결과를 폐기했습니다.');
            if (state.file !== inputFile) return;
            setSmartReframeTrack(track);
            if (getSmartReframeOptions().speakerPriority !== false && getSpeakerSegments().length) await linkSpeakerFaces(null, 'smart-reframe-analysis');
            const status = getSmartReframeEngine().getStatus ? getSmartReframeEngine().getStatus(state.smartReframe) : null;
            updateSmartReframeUI(status && status.label, status && status.detail, 'ready');
            setProgress(100, '스마트 리프레임 준비 완료');
            renderPreviewStill();
            const subjectCount = state.smartReframe && state.smartReframe.summary && state.smartReframe.summary.subjectCount || 0;
            toast(subjectCount > 1 ? `${subjectCount}명의 피사체를 구분했습니다. 주 피사체를 선택할 수 있습니다.` : state.smartReframe && state.smartReframe.summary && state.smartReframe.summary.faceCoverage > 0 ? '얼굴 중심 스마트 리프레임을 준비했습니다.' : '얼굴 감지를 지원하지 않아 모션 중심 추적을 적용했습니다.', 'success');
            if (store.addDiagnostic) store.addDiagnostic({ type: 'smart-reframe-analysis', source: state.smartReframe && state.smartReframe.source || 'motion', samples: state.smartReframe && state.smartReframe.summary && state.smartReframe.summary.samples || 0, faceCoverage: state.smartReframe && state.smartReframe.summary && state.smartReframe.summary.faceCoverage || 0, subjects: subjectCount, sceneCuts: state.smartReframe && state.smartReframe.summary && state.smartReframe.summary.sceneCuts || 0 });
            finishOperation(token, 'smart-reframe-complete');
        } catch (error) {
            if (!isAbortError(error)) {
                ensureMotionSmartReframe();
                updateSmartReframeUI('모션 추적으로 전환', error.message || '얼굴 추적을 사용할 수 없습니다.', 'error');
                toast('얼굴 추적을 사용할 수 없어 모션 중심으로 전환했습니다.', 'warning');
                if (store.addDiagnostic) store.addDiagnostic({ type: 'smart-reframe-fallback', message: error.message });
            }
        } finally {
            const current = !token || !operationCoordinator.isCurrent || operationCoordinator.isCurrent(token);
            if (current) finishOperation(token, 'smart-reframe-finalized');
            if (state.file === inputFile) state.isReframing = false;
            updateSmartReframeUI();
            updateButtons();
        }
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
        updateSmartReframeUI();
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
        updateSmartReframeUI();
        if (global.AIShortsFlowPolish && global.AIShortsFlowPolish.scheduleSync) global.AIShortsFlowPolish.scheduleSync();
    }

    function renderPreviewStillNow() {
        const controller = getPreviewController();
        return controller ? controller.renderStillNow() : false;
    }

    function renderPreviewStill() {
        const controller = getPreviewController();
        return controller ? controller.renderStill() : false;
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
        if (els.analysisTimingExportBtn) els.analysisTimingExportBtn.addEventListener('click', () => {
            const controller = getAnalysisController();
            if (!controller || !controller.exportTimingDiagnostics) return;
            const result = controller.exportTimingDiagnostics();
            toast(result && result.saved ? '분석 타이밍 진단 JSON을 저장했습니다.' : '저장할 분석 타이밍 기록이 없습니다.', result && result.saved ? 'success' : 'warning');
        });
        if (els.analysisTimingHistorySearch) els.analysisTimingHistorySearch.addEventListener('input', () => {
            const controller = getAnalysisController();
            if (controller && controller.setTimingHistoryFilter) controller.setTimingHistoryFilter(els.analysisTimingHistorySearch.value, els.analysisTimingHistoryStatus && els.analysisTimingHistoryStatus.value || 'all');
        });
        if (els.analysisTimingHistoryStatus) els.analysisTimingHistoryStatus.addEventListener('change', () => {
            const controller = getAnalysisController();
            if (controller && controller.setTimingHistoryFilter) controller.setTimingHistoryFilter(els.analysisTimingHistorySearch && els.analysisTimingHistorySearch.value || '', els.analysisTimingHistoryStatus.value);
        });
        if (els.analysisTimingHistoryList) els.analysisTimingHistoryList.addEventListener('change', event => {
            const checkbox = event.target && event.target.closest ? event.target.closest('[data-history-select]') : null;
            if (!checkbox) return;
            const controller = getAnalysisController();
            if (controller && controller.setTimingHistorySelection) controller.setTimingHistorySelection(checkbox.dataset.historySelect, checkbox.checked);
        });
        if (els.analysisTimingHistoryList) els.analysisTimingHistoryList.addEventListener('click', event => {
            const button = event.target && event.target.closest ? event.target.closest('[data-history-delete]') : null;
            if (!button) return;
            const controller = getAnalysisController();
            const removed = controller && controller.deleteTimingHistoryEntry && controller.deleteTimingHistoryEntry(button.dataset.historyDelete);
            toast(removed ? '선택한 분석 이력을 삭제했습니다.' : '삭제할 분석 이력을 찾지 못했습니다.', removed ? 'success' : 'warning');
        });
        if (els.analysisTimingHistorySelectedExportBtn) els.analysisTimingHistorySelectedExportBtn.addEventListener('click', () => {
            const controller = getAnalysisController();
            const result = controller && controller.exportSelectedTimingHistory ? controller.exportSelectedTimingHistory() : null;
            toast(result && result.saved ? `선택한 분석 이력 ${result.historyCount}건을 저장했습니다.` : '내보낼 분석 이력을 선택해 주세요.', result && result.saved ? 'success' : 'warning');
        });
        if (els.analysisTimingHistoryClearBtn) els.analysisTimingHistoryClearBtn.addEventListener('click', () => {
            const confirmed = typeof global.confirm !== 'function' || global.confirm('저장된 분석 이력을 모두 삭제할까요? 현재 분석 결과와 원본 파일은 유지됩니다.');
            if (!confirmed) return;
            const controller = getAnalysisController();
            const removed = controller && controller.clearTimingHistory ? controller.clearTimingHistory() : 0;
            toast(removed ? `분석 이력 ${removed}건을 삭제했습니다.` : '삭제할 분석 이력이 없습니다.', removed ? 'success' : 'warning');
        });
        if (els.analysisTimingHistoryPolicySaveBtn) els.analysisTimingHistoryPolicySaveBtn.addEventListener('click', () => {
            const controller = getAnalysisController();
            if (!controller || !controller.updateTimingHistoryPolicy) return;
            const result = controller.updateTimingHistoryPolicy({
                retentionDays: Number(els.analysisTimingHistoryRetentionDays && els.analysisTimingHistoryRetentionDays.value || 90),
                maxItems: Number(els.analysisTimingHistoryMaxItems && els.analysisTimingHistoryMaxItems.value || 12)
            });
            toast(result.removed ? `보존 설정을 저장하고 오래된 이력 ${result.removed}건을 정리했습니다.` : '분석 이력 보존 설정을 저장했습니다.', 'success');
        });
        if (els.supportDiagnosticsBundleBtn) els.supportDiagnosticsBundleBtn.addEventListener('click', exportSupportDiagnosticsBundle);
        if (els.supportDiagnosticsImportBtn) els.supportDiagnosticsImportBtn.addEventListener('click', () => { if (els.supportDiagnosticsFileInput) els.supportDiagnosticsFileInput.click(); });
        if (els.supportDiagnosticsFileInput) els.supportDiagnosticsFileInput.addEventListener('change', handleSupportDiagnosticsFile);
        if (els.supportDiagnosticsNormalizedBtn) els.supportDiagnosticsNormalizedBtn.addEventListener('click', exportNormalizedSupportDiagnostics);
        if (els.supportDiagnosticsReportBtn) els.supportDiagnosticsReportBtn.addEventListener('click', exportSupportDiagnosticsSummary);
        if (els.supportDiagnosticsCloseBtn) els.supportDiagnosticsCloseBtn.addEventListener('click', closeSupportDiagnosticsPreview);
        if (els.supportDiagnosticsDismissBtn) els.supportDiagnosticsDismissBtn.addEventListener('click', closeSupportDiagnosticsPreview);
        if (els.supportDiagnosticsDialog) els.supportDiagnosticsDialog.addEventListener('click', event => { if (event.target === els.supportDiagnosticsDialog) closeSupportDiagnosticsPreview(); });
        document.addEventListener('keydown', event => { if (event.key === 'Escape' && els.supportDiagnosticsDialog && !els.supportDiagnosticsDialog.hidden) closeSupportDiagnosticsPreview(); });
        if (els.analysisCancelBtn) els.analysisCancelBtn.addEventListener('click', () => {
            if (els.analysisCancelBtn.disabled || !state.isAnalyzing) return;
            const controller = getAnalysisController();
            if (controller) controller.cancel('사용자가 자동 분석을 취소했습니다.');
        });
        document.addEventListener('ai-shorts-analysis-request', event => {
            if (!state.file || state.isAnalyzing) return;
            analyzeCurrentFile({ autoGenerate: false, source: event && event.detail && event.detail.source || 'external-request' });
        });
        document.addEventListener('ai-shorts-transcript-ready', event => {
            const segments = event && event.detail && Array.isArray(event.detail.segments) ? event.detail.segments : [];
            state.transcriptSegments = segments.slice(0, Number(config.SPEAKER_FACE_MAX_CUES || 2000)).map(item => ({
                start: Number(item.start) || 0,
                end: Number(item.end) || 0,
                text: String(item.text || '').slice(0, 1000),
                speaker: String(item.speaker || '').slice(0, 40)
            }));
            if (getSmartReframeOptions().speakerPriority !== false && state.smartReframe) linkSpeakerFaces(state.transcriptSegments, 'local-transcript');
            else updateSpeakerFaceUI();
        });
        document.addEventListener('ai-shorts-transcript-applied', event => {
            const segments = event && event.detail && Array.isArray(event.detail.segments) ? event.detail.segments : state.transcriptSegments;
            if (getSmartReframeOptions().speakerPriority !== false && state.smartReframe) linkSpeakerFaces(segments, 'applied-transcript');
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
                if (id === 'cropModeSelect' && els[id].value === 'smart') ensureMotionSmartReframe();
                updateSmartReframeUI();
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
        if (els.smartReframeAnalyzeBtn) els.smartReframeAnalyzeBtn.addEventListener('click', analyzeSmartReframe);
        if (els.smartReframeSpeakerPriorityToggle) els.smartReframeSpeakerPriorityToggle.addEventListener('change', toggleSpeakerPriority);
        if (els.smartReframeSpeakerLinkBtn) els.smartReframeSpeakerLinkBtn.addEventListener('click', () => linkSpeakerFaces(null, 'manual'));
        if (els.speakerFacePrevBtn) els.speakerFacePrevBtn.addEventListener('click', () => selectSpeakerTuneCue(-1));
        if (els.speakerFaceNextBtn) els.speakerFaceNextBtn.addEventListener('click', () => selectSpeakerTuneCue(1));
        if (els.speakerFaceApplyBtn) els.speakerFaceApplyBtn.addEventListener('click', applySpeakerTuneCue);
        if (els.speakerFaceApplySpeakerBtn) els.speakerFaceApplySpeakerBtn.addEventListener('click', applySpeakerTuneToMatchingSpeaker);
        if (els.speakerCueSelectAllBtn) els.speakerCueSelectAllBtn.addEventListener('click', selectAllSpeakerCues);
        if (els.speakerCueSelectionClearBtn) els.speakerCueSelectionClearBtn.addEventListener('click', clearSpeakerCueSelection);
        if (els.speakerCueUndoBtn) els.speakerCueUndoBtn.addEventListener('click', undoSpeakerTimelineEdit);
        if (els.speakerCueRedoBtn) els.speakerCueRedoBtn.addEventListener('click', redoSpeakerTimelineEdit);
        if (els.speakerCueBulkApplyBtn) els.speakerCueBulkApplyBtn.addEventListener('click', applyBulkSpeakerCueEdit);
        [els.speakerCueBulkShiftToggle, els.speakerCueBulkLabelToggle, els.speakerCueBulkFaceToggle, els.speakerCueBulkPriorityToggle, els.speakerCueBulkGridCropToggle].forEach(input => {
            if (input) input.addEventListener('change', syncSpeakerFaceTuningUI);
        });
        [els.speakerCueBulkShiftInput, els.speakerCueBulkLabelInput, els.speakerFaceSubjectSelect, els.speakerFaceLockToggle, els.speakerCuePrioritySelect, els.speakerGridCropXInput, els.speakerGridCropYInput, els.speakerGridCropZoomInput].forEach(input => {
            if (input) input.addEventListener('input', syncBulkSpeakerCuePreview);
            if (input) input.addEventListener('change', syncBulkSpeakerCuePreview);
        });
        if (els.speakerCueTimeline) els.speakerCueTimeline.addEventListener('pointermove', event => {
            if (!speakerSelectionDragActive || speakerSelectionPointerId !== event.pointerId) return;
            const target = document.elementFromPoint(event.clientX, event.clientY);
            const card = target && target.closest ? target.closest('.speaker-cue-card') : null;
            if (!card || !els.speakerCueTimeline.contains(card)) return;
            const cues = Array.isArray(state.smartReframe && state.smartReframe.speakerCues) ? state.smartReframe.speakerCues : [];
            const cueIndex = Number(card.dataset.cueIndex);
            if (!Number.isInteger(cueIndex)) return;
            setSpeakerCueSelected(cues, cueIndex, speakerSelectionDragValue);
            syncSpeakerCueSelectionDom();
        });
        const finishSpeakerSelectionDrag = event => {
            if (!speakerSelectionDragActive || event && speakerSelectionPointerId !== null && event.pointerId !== speakerSelectionPointerId) return;
            if (els.speakerCueTimeline && speakerSelectionPointerId !== null && els.speakerCueTimeline.hasPointerCapture && els.speakerCueTimeline.hasPointerCapture(speakerSelectionPointerId)) els.speakerCueTimeline.releasePointerCapture(speakerSelectionPointerId);
            speakerSelectionDragActive = false;
            speakerSelectionPointerId = null;
            syncSpeakerFaceTuningUI();
        };
        document.addEventListener('pointerup', finishSpeakerSelectionDrag);
        document.addEventListener('pointercancel', finishSpeakerSelectionDrag);
        if (els.speakerPaneOrientationSelect) els.speakerPaneOrientationSelect.addEventListener('change', () => {
            syncSpeakerPanePositionOptions(els.speakerPaneOrientationSelect.value, '');
            applySpeakerLayoutSettings();
        });
        if (els.speakerPaneSplitInput) els.speakerPaneSplitInput.addEventListener('input', () => {
            if (els.speakerPaneSplitValue) els.speakerPaneSplitValue.textContent = `${els.speakerPaneSplitInput.value}%`;
        });
        if (els.speakerPaneSplitInput) els.speakerPaneSplitInput.addEventListener('change', applySpeakerLayoutSettings);
        if (els.speakerPanePositionSelect) els.speakerPanePositionSelect.addEventListener('change', applySpeakerLayoutSettings);
        if (els.speakerGridPrimarySizeInput) els.speakerGridPrimarySizeInput.addEventListener('input', () => { if (els.speakerGridPrimarySizeValue) els.speakerGridPrimarySizeValue.textContent = `${els.speakerGridPrimarySizeInput.value}%`; });
        if (els.speakerGridPrimarySizeInput) els.speakerGridPrimarySizeInput.addEventListener('change', applySpeakerLayoutSettings);
        if (els.speakerGridPrimaryPositionSelect) els.speakerGridPrimaryPositionSelect.addEventListener('change', applySpeakerLayoutSettings);
        if (els.speakerGridPagingSelect) els.speakerGridPagingSelect.addEventListener('change', applySpeakerLayoutSettings);
        if (els.speakerGridPageSecondsInput) els.speakerGridPageSecondsInput.addEventListener('change', applySpeakerLayoutSettings);
        [els.speakerGridEnergyThresholdInput, els.speakerGridEnergyHysteresisInput, els.speakerGridEnergyHoldInput].forEach(input => { if (input) input.addEventListener('change', applySpeakerLayoutSettings); });
        if (els.speakerGridTransitionSelect) els.speakerGridTransitionSelect.addEventListener('change', applySpeakerLayoutSettings);
        if (els.speakerGridTransitionMsInput) els.speakerGridTransitionMsInput.addEventListener('change', applySpeakerLayoutSettings);
        if (els.speakerGridTransitionEasingSelect) els.speakerGridTransitionEasingSelect.addEventListener('change', applySpeakerLayoutSettings);
        if (els.speakerGridSlideDirectionSelect) els.speakerGridSlideDirectionSelect.addEventListener('change', applySpeakerLayoutSettings);
        if (els.speakerGridManualPagesInput) els.speakerGridManualPagesInput.addEventListener('change', applySpeakerLayoutSettings);
        [['speakerGridCropXInput','speakerGridCropXValue'], ['speakerGridCropYInput','speakerGridCropYValue'], ['speakerGridCropZoomInput','speakerGridCropZoomValue']].forEach(([inputId, outputId]) => {
            if (!els[inputId]) return;
            els[inputId].addEventListener('input', () => {
                const value = Number(els[inputId].value || 0);
                if (els[outputId]) els[outputId].textContent = inputId === 'speakerGridCropZoomInput' ? `${value}%` : `${value >= 0 ? '+' : ''}${value}%`;
            });
        });
        [els.speakerPaneDividerControl, els.speakerPreviewDividerControl].forEach(control => {
            if (!control) return;
            control.addEventListener('pointerdown', beginSpeakerPaneDividerDrag);
            control.addEventListener('pointermove', moveSpeakerPaneDivider);
            control.addEventListener('pointerup', finishSpeakerPaneDividerDrag);
            control.addEventListener('pointercancel', finishSpeakerPaneDividerDrag);
            control.addEventListener('keydown', handleSpeakerPaneDividerKeydown);
        });
        if (els.speakerCueSplitBtn) els.speakerCueSplitBtn.addEventListener('click', splitSpeakerTuneCue);
        if (els.speakerCueOverlapBtn) els.speakerCueOverlapBtn.addEventListener('click', addOverlappingSpeakerTuneCue);
        if (els.speakerCueDeleteBtn) els.speakerCueDeleteBtn.addEventListener('click', deleteSpeakerTuneCue);
        if (els.speakerFaceAutoBtn) els.speakerFaceAutoBtn.addEventListener('click', resetSpeakerTuneCue);
        if (els.smartReframeSubjectSelect) els.smartReframeSubjectSelect.addEventListener('change', applySmartReframeSubjectSelection);
        if (els.smartReframeKeyframeSetBtn) els.smartReframeKeyframeSetBtn.addEventListener('click', setSmartReframeKeyframe);
        if (els.smartReframeKeyframeDeleteBtn) els.smartReframeKeyframeDeleteBtn.addEventListener('click', deleteSmartReframeKeyframe);
        if (els.smartReframeKeyframeResetBtn) els.smartReframeKeyframeResetBtn.addEventListener('click', resetSmartReframeKeyframes);
        ['smartReframeXInput', 'smartReframeYInput', 'smartReframeZoomInput'].forEach(id => {
            if (!els[id]) return;
            els[id].addEventListener('input', () => {
                beginSmartReframeEditorDraft();
                if (id === 'smartReframeXInput' && els.smartReframeXValue) els.smartReframeXValue.textContent = `${els[id].value}%`;
                if (id === 'smartReframeYInput' && els.smartReframeYValue) els.smartReframeYValue.textContent = `${els[id].value}%`;
                if (id === 'smartReframeZoomInput' && els.smartReframeZoomValue) els.smartReframeZoomValue.textContent = `${els[id].value}%`;
                if (els.smartReframeKeyframeDetail && smartReframeEditorDraft) els.smartReframeKeyframeDetail.textContent = `${formatSmartReframeTime(smartReframeEditorDraft.time)} · 저장되지 않은 크롭 조정`;
                renderPreviewStill();
                syncDirectCropEditor();
            });
        });
        document.addEventListener('ai-shorts-direct-crop-module-ready', () => {
            directCropController = null;
            syncDirectCropEditor();
        });
        document.addEventListener('ai-shorts-crop-keyframe-timeline-ready', () => {
            cropKeyframeTimelineController = null;
            syncDirectCropEditor();
        });
        if (els.sourceVideo) {
            let smartReframeTimeSyncPending = false;
            els.sourceVideo.addEventListener('timeupdate', () => {
                if (smartReframeTimeSyncPending || !state.smartReframe) return;
                smartReframeTimeSyncPending = true;
                requestAnimationFrame(() => { smartReframeTimeSyncPending = false; syncSmartReframeEditor(); });
            });
            els.sourceVideo.addEventListener('seeked', () => {
                if (smartReframeEditorDraft && Math.abs(smartReframeEditorDraft.time - getSmartReframeTime()) > 0.35) clearSmartReframeEditorDraft();
                syncSmartReframeEditor();
            });
        }
        if (els.smartReframeCaptionAvoidanceToggle) els.smartReframeCaptionAvoidanceToggle.addEventListener('change', () => {
            const next = Object.assign({}, getSmartReframeOptions(), { captionAvoidance: els.smartReframeCaptionAvoidanceToggle.checked });
            store.setSetting('smartReframeOptions', next);
            const engine = getSmartReframeEngine();
            if (state.motionAnalysis && engine.createTrackFromMotion && (!state.smartReframe || state.smartReframe.source === 'motion')) setSmartReframeTrack(engine.createTrackFromMotion(state.motionAnalysis, Object.assign({}, next, getSmartReframeEdits())));
            else if (state.motionAnalysis && !engine.createTrackFromMotion) ensureMotionSmartReframe();
            renderPreviewStill();
            updateSmartReframeUI();
        });
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
        global.addEventListener('beforeunload', () => {
            const importController = getMediaImportController();
            if (importController) importController.dispose();
            const playbackController = getPreviewController();
            if (playbackController) playbackController.dispose();
            const analyzerController = getAnalysisController();
            if (analyzerController) analyzerController.dispose();
        }, { once: true });
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

    function analyzeCurrentFile(options) {
        const controller = getAnalysisController();
        return controller ? controller.analyzeCurrentFile(options) : Promise.resolve(false);
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
        const controller = getPreviewController();
        return controller ? controller.stop(options) : false;
    }

    async function previewSelectedRange() {
        const controller = getPreviewController();
        return controller ? controller.playSelectedRange() : false;
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
            smartReframe: state.smartReframe,
            smartReframeOptions: getSmartReframeOptions(),
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
            if (state.captions.length && state.smartReframe && getSmartReframeOptions().speakerPriority !== false && !(state.transcriptSegments && state.transcriptSegments.length)) linkSpeakerFaces(state.captions, 'captions');
            else updateSpeakerFaceUI();
            toast(state.captions.length ? `${state.captions.length}개 자막을 적용했습니다.` : '적용할 자막을 찾지 못했습니다.');
        } catch (error) {
            if (store.addDiagnostic) store.addDiagnostic({ type: 'caption-parse-error', message: error.message });
            toast(error.message || '자막을 처리하지 못했습니다.', 'error');
        }
    }

    function clearCaptions() {
        state.captions = [];
        state.transcriptSegments = [];
        const engine = getSmartReframeEngine();
        if (state.smartReframe && engine.clearSpeakerCues) {
            state.smartReframe = engine.clearSpeakerCues(state.smartReframe) || state.smartReframe;
            persistSmartReframeEdits(state.smartReframe);
        }
        lastSpeakerFaceLinkResult = null;
        if (els.captionTextInput) els.captionTextInput.value = '';
        updateCaptionStatus();
        renderAutoCutSummary(getSelectedRecommendation());
        updateSpeakerFaceUI();
        renderPreviewStill();
        toast('자막과 화자 연결을 비웠습니다.');
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
        getAnalysisController();
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
        snapSelectedBoundaryToNearestCut,
        linkSpeakerFaces,
        applySpeakerTuneCue,
        resetSpeakerTuneCue
    });

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})(window);
