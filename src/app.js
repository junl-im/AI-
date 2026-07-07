// AI Shorts Studio v0.4.0 - main app
'use strict';

(function bootAIShortsStudio(global) {
    const config = global.AIShortsRuntimeConfig || {};
    const utils = global.AIShortsCoreUtils || {};
    const store = global.AIShortsAppState || {};
    const state = store.state;
    const audioExtractor = global.AIShortsAudioFeatureExtractor || {};
    const motionAnalyzer = global.AIShortsVideoMotionAnalyzer || {};
    const recEngine = global.AIShortsRecommendationEngine || {};
    const captionService = global.AIShortsCaptionService || {};
    const projectService = global.AIShortsProjectService || {};
    const renderer = global.AIShortsVerticalRenderer || {};
    const downloadService = global.AIShortsDownloadService || {};
    const waveformView = global.AIShortsWaveformView || {};
    const timelineView = global.AIShortsTimelineView || {};
    const siteGuards = global.AIShortsSiteGuards || {};
    const runtimeHealth = global.AIShortsRuntimeHealth || {};

    const els = {};
    let previewRaf = 0;
    let previewTimer = 0;

    function $(id) { return document.getElementById(id); }

    function initElements() {
        [
            'programInfoBtn', 'selectedBadge', 'dropZone', 'fileDrop', 'fileInput', 'importStatus',
            'durationSelect', 'styleSelect', 'cropModeSelect', 'platformSelect', 'analyzeBtn',
            'analysisStatus', 'progressBar', 'recommendationList', 'recommendationCount', 'previewStatus',
            'previewCanvas', 'sourceVideo', 'sourceAudio', 'previewBtn', 'stopPreviewBtn', 'exportBtn',
            'waveformCanvas', 'timelineView', 'selectedRangeText', 'titleInput', 'hashtagInput',
            'copyCaptionBtn', 'diagnosticsBtn', 'infoDialog', 'infoCloseBtn', 'toast',
            'rangeStartInput', 'rangeEndInput', 'applyRangeBtn', 'thumbnailBtn',
            'captionStatus', 'captionStyleSelect', 'captionOffsetInput', 'captionTextInput',
            'captionFileInput', 'applyCaptionBtn', 'clearCaptionBtn', 'saveProjectBtn', 'projectFileInput',
            'exportAllBtn', 'thumbnailTemplateSelect', 'batchLimitSelect'
        ].forEach(id => { els[id] = $(id); });
    }

    function toast(message) {
        if (!els.toast) return;
        els.toast.textContent = message;
        els.toast.classList.add('toast-visible');
        clearTimeout(els.toast._timer);
        els.toast._timer = setTimeout(() => els.toast.classList.remove('toast-visible'), 2600);
    }

    function setProgress(percent, status) {
        if (els.progressBar) els.progressBar.style.width = `${Math.max(0, Math.min(100, Number(percent) || 0))}%`;
        if (els.analysisStatus && status) els.analysisStatus.textContent = status;
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
    }

    function updateButtons() {
        const hasFile = Boolean(state.file);
        const hasRecs = Boolean(state.recommendations && state.recommendations.length);
        if (els.analyzeBtn) els.analyzeBtn.disabled = !hasFile || state.isAnalyzing;
        if (els.previewBtn) els.previewBtn.disabled = !hasRecs || state.isPreviewing;
        if (els.stopPreviewBtn) els.stopPreviewBtn.disabled = !state.isPreviewing;
        if (els.exportBtn) els.exportBtn.disabled = !hasRecs || state.isPreviewing;
        if (els.applyRangeBtn) els.applyRangeBtn.disabled = !hasRecs;
        if (els.thumbnailBtn) els.thumbnailBtn.disabled = !hasRecs;
        if (els.exportAllBtn) els.exportAllBtn.disabled = !hasRecs || state.isPreviewing;
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
        if (waveformView.renderRecommendations) waveformView.renderRecommendations(els.recommendationList, state.recommendations, state.selectedRecommendationId, selectRecommendation);
        if (timelineView.renderTimeline) timelineView.renderTimeline(els.timelineView, state.recommendations, state.selectedRecommendationId);
        if (els.recommendationCount) els.recommendationCount.textContent = `${(state.recommendations || []).length}개`;
        if (els.selectedRangeText) els.selectedRangeText.textContent = selected ? selected.rangeText : '구간 없음';
        if (selected) updateSelectedRangeControls(selected);
        updateCaptionStatus();
        renderPreviewStill();
        updateButtons();
    }

    function renderPreviewStill() {
        if (!els.previewCanvas || !renderer.renderStill) return;
        const selected = getSelectedRecommendation();
        const media = state.fileKind === 'video' && els.sourceVideo.videoWidth ? els.sourceVideo : null;
        renderer.renderStill(els.previewCanvas, media, {
            cropMode: state.settings.cropMode,
            title: els.titleInput ? els.titleInput.value : 'AI Shorts Studio',
            rangeText: selected ? selected.rangeText : 'AI 추천 대기',
            waveformBins: state.waveformBins,
            time: media ? media.currentTime : 0,
            captionText: getActiveCaptionText(media ? media.currentTime : (selected ? selected.start : 0)),
            captionStyle: state.settings.captionStyle,
            thumbnailTemplate: state.settings.thumbnailTemplate
        });
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
        if (els.analyzeBtn) els.analyzeBtn.addEventListener('click', analyzeCurrentFile);
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
        if (els.sourceVideo) els.sourceVideo.addEventListener('loadeddata', renderPreviewStill);
        if (els.sourceAudio) els.sourceAudio.addEventListener('timeupdate', renderPreviewStill);
        if (els.sourceVideo) els.sourceVideo.addEventListener('timeupdate', renderPreviewStill);
        if (els.titleInput) els.titleInput.addEventListener('input', renderPreviewStill);
    }

    async function handleFiles(fileList) {
        const file = fileList && fileList[0];
        if (!file) return;
        const kind = utils.isVideoFile && utils.isVideoFile(file) ? 'video' : 'audio';
        if (store.resetMedia) store.resetMedia();
        state.file = file;
        state.fileKind = kind;
        state.fileUrl = utils.createObjectUrl ? utils.createObjectUrl(file) : URL.createObjectURL(file);
        state.fileMeta = { name: file.name, size: file.size, type: file.type, duration: 0 };
        if (els.selectedBadge) els.selectedBadge.textContent = kind === 'video' ? '영상 선택됨' : '오디오 선택됨';
        if (els.importStatus) els.importStatus.textContent = `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB`;
        setupMediaPreview();
        setProgress(0, '분석 준비');
        if (els.recommendationList) els.recommendationList.classList.add('empty-state');
        if (store.addDiagnostic) store.addDiagnostic({ type: 'import', fileName: file.name, fileType: file.type, fileSize: file.size, kind });
        renderAll();
        updateButtons();
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
        media.src = state.fileUrl;
        media.preload = 'metadata';
        media.onloadedmetadata = () => {
            state.fileMeta.duration = Number(media.duration) || 0;
            if (els.importStatus) els.importStatus.textContent += state.fileMeta.duration ? ` · ${utils.formatTime(state.fileMeta.duration)}` : '';
            renderPreviewStill();
        };
    }

    async function analyzeCurrentFile() {
        if (!state.file || state.isAnalyzing) return;
        state.isAnalyzing = true;
        state.recommendations = [];
        state.selectedRecommendationId = '';
        updateButtons();
        setProgress(3, '분석 시작');
        try {
            let audioResult = null;
            try {
                audioResult = await audioExtractor.analyzeFileAudio(state.file, setProgress);
            } catch (audioError) {
                if (state.fileKind !== 'video') throw audioError;
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
            if (state.fileKind === 'video' && motionAnalyzer.analyzeVideoMotion) {
                state.motionAnalysis = await motionAnalyzer.analyzeVideoMotion(state.fileUrl, setProgress);
                state.fileMeta.duration = state.fileMeta.duration || state.motionAnalysis.duration;
            }
            setProgress(92, '추천 계산 중');
            createRecommendations();
            setProgress(100, '추천 완료');
            toast('쇼츠 추천 구간을 만들었습니다.');
        } catch (error) {
            setProgress(0, '분석 실패');
            toast(error.message || '분석에 실패했습니다.');
            if (store.addDiagnostic) store.addDiagnostic({ type: 'analysis-error', message: error.message });
        } finally {
            state.isAnalyzing = false;
            updateButtons();
        }
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

    function createRecommendations() {
        if (!recEngine.createRecommendations) return;
        const recommendations = recEngine.createRecommendations(state.audioAnalysis, state.motionAnalysis, {
            duration: state.settings.duration,
            style: state.settings.style,
            count: config.DEFAULT_CANDIDATE_COUNT || 6
        });
        state.recommendations = recommendations;
        if (recommendations.length) selectRecommendation(recommendations[0].id);
        else renderAll();
    }

    function stopPreview() {
        const media = getActiveMediaElement();
        if (media) media.pause();
        if (previewRaf) cancelAnimationFrame(previewRaf);
        if (previewTimer) clearInterval(previewTimer);
        previewRaf = 0;
        previewTimer = 0;
        state.isPreviewing = false;
        if (els.previewStatus) els.previewStatus.textContent = '정지';
        renderPreviewStill();
        updateButtons();
    }

    async function previewSelectedRange() {
        const selected = getSelectedRecommendation();
        const media = getActiveMediaElement();
        if (!selected || !media) return;
        stopPreview();
        state.isPreviewing = true;
        updateButtons();
        if (els.previewStatus) els.previewStatus.textContent = '미리보기 재생 중';
        try {
            media.currentTime = selected.start;
            media.muted = false;
            await media.play();
        } catch (error) {
            toast('브라우저 정책상 재생 버튼을 한 번 더 눌러야 할 수 있습니다.');
        }
        function draw() {
            if (!state.isPreviewing) return;
            const isVideo = state.fileKind === 'video' && media.videoWidth;
            renderer.renderStill(els.previewCanvas, isVideo ? media : null, {
                cropMode: state.settings.cropMode,
                title: els.titleInput ? els.titleInput.value : 'AI Shorts Studio',
                rangeText: selected.rangeText,
                waveformBins: state.waveformBins,
                time: media.currentTime,
                captionText: getActiveCaptionText(media.currentTime),
                captionStyle: state.settings.captionStyle,
                thumbnailTemplate: state.settings.thumbnailTemplate
            });
            previewRaf = requestAnimationFrame(draw);
        }
        draw();
        previewTimer = setInterval(() => {
            if (!media || media.currentTime >= selected.end || media.ended) stopPreview();
        }, 80);
    }

    async function exportSelectedRange() {
        const selected = getSelectedRecommendation();
        const media = getActiveMediaElement();
        if (!selected || !media) return;
        stopPreview();
        setProgress(2, '내보내기 준비');
        if (els.previewStatus) els.previewStatus.textContent = '내보내기 중';
        try {
            const exportResult = await renderer.recordVerticalSegment(els.previewCanvas, media, {
                start: selected.start,
                end: selected.end,
                cropMode: state.settings.cropMode,
                title: els.titleInput ? els.titleInput.value : 'AI Shorts Studio',
                rangeText: selected.rangeText,
                waveformBins: state.waveformBins,
                thumbnailTemplate: state.settings.thumbnailTemplate,
                captions: state.captions,
                captionOffset: state.settings.captionOffset,
                captionStyle: state.settings.captionStyle,
                fps: config.PREVIEW_FPS || 30
            }, setProgress);
            const ext = utils.extensionFromMime ? utils.extensionFromMime(exportResult.mimeType) : 'webm';
            const base = utils.safeFileBaseName ? utils.safeFileBaseName(state.file && state.file.name) : 'ai-shorts';
            const filename = `${base}-${Math.round(selected.start)}s-${selected.duration}s-shorts.${ext}`;
            state.exportInfo = { filename, size: exportResult.blob.size, mimeType: exportResult.mimeType, range: selected.rangeText };
            downloadService.saveBlob(exportResult.blob, filename);
            setProgress(100, '내보내기 완료');
            if (els.previewStatus) els.previewStatus.textContent = '내보내기 완료';
            toast(`${ext.toUpperCase()} 파일을 저장했습니다.`);
        } catch (error) {
            setProgress(0, '내보내기 실패');
            toast(error.message || '내보내기에 실패했습니다.');
            if (store.addDiagnostic) store.addDiagnostic({ type: 'export-error', message: error.message });
        } finally {
            updateButtons();
        }
    }


    async function exportAllCandidates() {
        const recommendations = Array.isArray(state.recommendations) ? state.recommendations : [];
        const media = getActiveMediaElement();
        if (!recommendations.length || !media || state.isPreviewing) return;
        const limit = Math.max(1, Math.min(recommendations.length, Number(els.batchLimitSelect && els.batchLimitSelect.value) || recommendations.length));
        const queue = recommendations.slice(0, limit);
        stopPreview();
        if (els.exportAllBtn) els.exportAllBtn.disabled = true;
        setProgress(1, `일괄 내보내기 준비 · ${queue.length}개`);
        const base = utils.safeFileBaseName ? utils.safeFileBaseName(state.file && state.file.name) : 'ai-shorts';
        let success = 0;
        for (let index = 0; index < queue.length; index += 1) {
            const item = queue[index];
            state.selectedRecommendationId = item.id;
            state.selectedRange = { start: item.start, end: item.end, duration: item.duration, score: item.score };
            updateSelectedRangeControls(item);
            renderAll();
            setProgress(Math.round((index / queue.length) * 100), `일괄 내보내기 ${index + 1}/${queue.length}`);
            try {
                const exportResult = await renderer.recordVerticalSegment(els.previewCanvas, media, {
                    start: item.start,
                    end: item.end,
                    cropMode: state.settings.cropMode,
                    title: els.titleInput ? els.titleInput.value : 'AI Shorts Studio',
                    rangeText: item.rangeText,
                    waveformBins: state.waveformBins,
                    thumbnailTemplate: state.settings.thumbnailTemplate,
                    captions: state.captions,
                    captionOffset: state.settings.captionOffset,
                    captionStyle: state.settings.captionStyle,
                    fps: config.PREVIEW_FPS || 30
                }, (percent, status) => {
                    const local = Math.max(0, Math.min(1, Number(percent || 0) / 100));
                    const total = ((index + local) / queue.length) * 100;
                    setProgress(total, status || `일괄 내보내기 ${index + 1}/${queue.length}`);
                });
                const ext = utils.extensionFromMime ? utils.extensionFromMime(exportResult.mimeType) : 'webm';
                const filename = `${base}-candidate-${String(index + 1).padStart(2, '0')}-${Math.round(item.start)}s-${Math.round(item.duration)}s.${ext}`;
                downloadService.saveBlob(exportResult.blob, filename);
                success += 1;
            } catch (error) {
                if (store.addDiagnostic) store.addDiagnostic({ type: 'batch-export-error', candidate: item.id, message: error.message });
                toast(`${index + 1}번 후보 저장 실패: ${error.message || '오류'}`);
            }
        }
        setProgress(100, `일괄 내보내기 완료 · ${success}/${queue.length}개`);
        toast(`추천 후보 ${success}개를 저장했습니다.`);
        updateButtons();
    }


    function applyManualRange() {
        const selected = getSelectedRecommendation();
        if (!selected) return;
        const maxDuration = Number(state.fileMeta && state.fileMeta.duration) || Number(selected.end) || 0;
        const start = Math.max(0, Number(els.rangeStartInput && els.rangeStartInput.value) || 0);
        let end = Math.max(start + 1, Number(els.rangeEndInput && els.rangeEndInput.value) || selected.end || start + 15);
        if (maxDuration) end = Math.min(maxDuration, end);
        selected.start = start;
        selected.end = end;
        selected.duration = Math.max(1, end - start);
        selected.rangeText = utils.formatRange ? utils.formatRange(start, end) : `${start.toFixed(1)} ~ ${end.toFixed(1)}`;
        selected.custom = true;
        selected.reasons = Array.from(new Set([...(selected.reasons || []), '사용자가 직접 조절한 커스텀 구간']));
        state.selectedRange = { start, end, duration: selected.duration, score: selected.score };
        const media = getActiveMediaElement();
        if (media) {
            try { media.currentTime = start; } catch (error) { /* ignored */ }
        }
        renderAll();
        toast('선택 구간을 적용했습니다.');
    }

    async function saveThumbnail() {
        const selected = getSelectedRecommendation();
        if (!selected || !els.previewCanvas) return;
        renderPreviewStill();
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
        toast('썸네일 PNG를 저장했습니다.');
    }

    function applyCaptionsFromText() {
        const raw = els.captionTextInput ? els.captionTextInput.value : '';
        let cues = captionService.parseCaptionText ? captionService.parseCaptionText(raw) : [];
        if (!cues.length && captionService.createQuickCaptions) cues = captionService.createQuickCaptions(raw, getSelectedRecommendation(), 6);
        state.captions = cues;
        if (store.addDiagnostic) store.addDiagnostic({ type: 'captions-applied', count: cues.length });
        updateCaptionStatus();
        renderPreviewStill();
        toast(cues.length ? `${cues.length}개 자막을 적용했습니다.` : '적용할 자막을 찾지 못했습니다.');
    }

    function clearCaptions() {
        state.captions = [];
        if (els.captionTextInput) els.captionTextInput.value = '';
        updateCaptionStatus();
        renderPreviewStill();
        toast('자막을 비웠습니다.');
    }

    function handleCaptionFile(event) {
        const file = event && event.target && event.target.files && event.target.files[0];
        if (!file) return;
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
        if (!projectService.createProjectSnapshot) return;
        const snapshot = projectService.createProjectSnapshot(
            state,
            els.titleInput ? els.titleInput.value : '',
            els.hashtagInput ? els.hashtagInput.value : ''
        );
        const base = utils.safeFileBaseName ? utils.safeFileBaseName(state.file && state.file.name || 'ai-shorts-project') : 'ai-shorts-project';
        const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
        downloadService.saveBlob(blob, `${base}-project.json`);
        toast('프로젝트 JSON을 저장했습니다.');
    }

    function handleProjectFile(event) {
        const file = event && event.target && event.target.files && event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const project = projectService.parseProjectText(String(reader.result || ''));
                projectService.applyProjectSnapshot(state, project);
                if (project.settings && project.settings.thumbnailTemplate && els.thumbnailTemplateSelect) els.thumbnailTemplateSelect.value = project.settings.thumbnailTemplate;
                if (project.copy) {
                    if (els.titleInput) els.titleInput.value = project.copy.title || els.titleInput.value;
                    if (els.hashtagInput) els.hashtagInput.value = project.copy.hashtags || els.hashtagInput.value;
                }
                if (els.captionTextInput && captionService.serializeCaptions) els.captionTextInput.value = captionService.serializeCaptions(state.captions || []);
                syncSettingsToUI();
                renderAll();
                toast('프로젝트를 불러왔습니다. 원본 미디어가 다르면 다시 파일을 열어주세요.');
            } catch (error) {
                toast(error.message || '프로젝트 파일을 읽지 못했습니다.');
            }
        };
        reader.onerror = () => toast('프로젝트 파일을 읽지 못했습니다.');
        reader.readAsText(file);
        event.target.value = '';
    }

    async function copyCaption() {
        const title = els.titleInput ? els.titleInput.value : '';
        const tags = els.hashtagInput ? els.hashtagInput.value : '';
        await utils.copyText(`${title}\n${tags}`.trim());
        toast('제목과 해시태그를 복사했습니다.');
    }

    async function copyDiagnostics() {
        try {
            await downloadService.copyDiagnostics({ health: runtimeHealth.collect ? runtimeHealth.collect() : null });
            toast('진단 JSON을 복사했습니다.');
        } catch (error) {
            toast('진단 복사에 실패했습니다.');
        }
    }

    function registerServiceWorker() {
        if (!navigator.serviceWorker || location.protocol === 'file:') return;
        navigator.serviceWorker.register('sw.js').catch(error => {
            if (store.addDiagnostic) store.addDiagnostic({ type: 'service-worker-error', message: error.message });
        });
    }

    function init() {
        if (!state) return;
        initElements();
        syncSettingsToUI();
        bindEvents();
        if (siteGuards.blockDropNavigation) siteGuards.blockDropNavigation();
        if (siteGuards.installExitGuard) siteGuards.installExitGuard(() => Boolean(state.file && !state.exportInfo));
        renderAll();
        setProgress(0, runtimeHealth.summaryText ? runtimeHealth.summaryText() : '준비 완료');
        registerServiceWorker();
    }


    global.AIShortsStudioApp = Object.freeze({
        selectRecommendation,
        renderAll,
        applyManualRange,
        exportSelectedRange,
        exportAllCandidates,
        saveThumbnail
    });

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})(window);
