// AI Shorts Studio v1.5.14 - render workflow ownership, safe queue UI, and editor-state restoration
'use strict';

(function exposeRenderWorkflowController(global) {
    function create(options) {
        const opts = options || {};
        const state = opts.state || {};
        const utils = opts.utils || {};
        const store = opts.store || {};
        const renderer = opts.renderer || {};
        const downloadService = opts.downloadService || {};
        const renderQueue = opts.renderQueue || {};
        const operationCoordinator = opts.operationCoordinator || {};
        const els = opts.elements || {};
        const documentRef = opts.document || global.document;

        const activateFlowTab = opts.activateFlowTab || function () {};
        const stopPreview = opts.stopPreview || function () {};
        const getActiveMediaElement = opts.getActiveMediaElement || function emptyMedia() { return null; };
        const getQualityOptions = opts.getQualityOptions || function emptyQuality() { return {}; };
        const getCaptionOptions = opts.getCaptionOptions || function emptyCaption() { return {}; };
        const getExportFrameRate = opts.getExportFrameRate || function defaultFps() { return 30; };
        const getExportBitrate = opts.getExportBitrate || function defaultBitrate() { return undefined; };
        const updateSelectedRangeControls = opts.updateSelectedRangeControls || function () {};
        const renderAll = opts.renderAll || function () {};
        const updateButtons = opts.updateButtons || function () {};
        const setProgress = opts.setProgress || function () {};
        const toast = opts.toast || function () {};

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

        function snapshot() {
            return renderQueue && renderQueue.snapshot
                ? renderQueue.snapshot()
                : { running: false, total: 0, done: 0, failed: 0, cancelled: 0, progress: 0, items: [] };
        }

        function formatDuration(seconds) {
            const value = Math.max(0, Math.round(Number(seconds) || 0));
            if (value < 60) return `${value}초`;
            const minutes = Math.floor(value / 60);
            const remain = value % 60;
            return remain ? `${minutes}분 ${remain}초` : `${minutes}분`;
        }

        function clearNode(node) {
            if (!node) return;
            while (node.firstChild) node.removeChild(node.firstChild);
        }

        function appendText(parent, tagName, className, text) {
            const node = documentRef.createElement(tagName);
            if (className) node.className = className;
            node.textContent = String(text == null ? '' : text);
            parent.appendChild(node);
            return node;
        }

        function createQueueItem(item) {
            const row = documentRef.createElement('div');
            row.className = `render-queue-item is-${item.status || 'queued'}`;

            const title = documentRef.createElement('div');
            title.className = 'render-queue-title';
            const icon = documentRef.createElement('span');
            icon.className = 'studio-icon';
            icon.dataset.icon = item.status === 'done' ? 'check'
                : item.status === 'failed' ? 'close'
                    : item.status === 'cancelled' ? 'stop'
                        : item.status === 'running' ? 'render' : 'retry';
            icon.setAttribute('aria-hidden', 'true');
            title.appendChild(icon);
            appendText(title, 'b', '', item.label || '렌더 작업');
            appendText(title, 'span', 'render-queue-badge', item.status === 'done' ? '완료'
                : item.status === 'failed' ? '실패'
                    : item.status === 'cancelled' ? '취소'
                        : item.status === 'running' ? '렌더링' : '대기');
            row.appendChild(title);

            const liveStatus = String(item.statusText || '');
            const eta = item.status === 'running' && Number.isFinite(item.etaSeconds) && item.etaSeconds > 0
                ? `남은 약 ${formatDuration(item.etaSeconds)}` : '';
            const elapsed = Number(item.elapsedMs || 0) > 0 ? `경과 ${formatDuration(item.elapsedMs / 1000)}` : '';
            const filename = String(item.filenameHint || '');
            const metaParts = [liveStatus, eta, elapsed, item.status === 'queued' ? filename : ''].filter(Boolean);
            appendText(row, 'div', 'render-queue-meta', metaParts.join(' · ') || filename || '대기');

            const progress = Math.max(0, Math.min(100, Number(item.progress || 0)));
            const progressTrack = documentRef.createElement('div');
            progressTrack.className = 'render-queue-progress';
            progressTrack.setAttribute('role', 'progressbar');
            progressTrack.setAttribute('aria-valuemin', '0');
            progressTrack.setAttribute('aria-valuemax', '100');
            progressTrack.setAttribute('aria-valuenow', String(Math.round(progress)));
            const progressFill = documentRef.createElement('span');
            progressFill.style.width = `${progress}%`;
            progressTrack.appendChild(progressFill);
            row.appendChild(progressTrack);

            if (item.error) appendText(row, 'div', 'render-queue-error', item.error);
            return row;
        }

        function renderQueueState(queueSnapshot) {
            const snap = queueSnapshot || snapshot();
            if (documentRef && documentRef.body) documentRef.body.dataset.renderQueue = snap.running ? 'running' : 'idle';
            if (els.renderQueueStatus) {
                let queueState = 'done';
                let queueText = `완료 ${snap.done}/${snap.total}`;
                if (!snap.total) {
                    queueState = 'idle';
                    queueText = '대기 중';
                } else if (snap.running && snap.current) {
                    queueState = 'running';
                    const eta = Number.isFinite(snap.current.etaSeconds) && snap.current.etaSeconds > 0
                        ? ` · 남은 약 ${formatDuration(snap.current.etaSeconds)}` : '';
                    queueText = `${snap.current.label} · ${Math.round(snap.current.progress || 0)}%${eta}`;
                } else if (snap.failed) {
                    queueState = 'failed';
                    queueText = `완료 ${snap.done}/${snap.total} · 실패 ${snap.failed}`;
                } else if (snap.cancelled) {
                    queueState = 'cancelled';
                    queueText = `완료 ${snap.done}/${snap.total} · 취소 ${snap.cancelled}`;
                }
                els.renderQueueStatus.dataset.state = queueState;
                els.renderQueueStatus.textContent = queueText;
            }
            if (els.renderQueueList && documentRef) {
                clearNode(els.renderQueueList);
                const items = Array.isArray(snap.items) ? snap.items : [];
                if (!items.length) appendText(els.renderQueueList, 'div', 'render-queue-empty', '저장 작업을 시작하면 진행 상태가 여기에 표시됩니다.');
                else items.forEach(item => els.renderQueueList.appendChild(createQueueItem(item)));
            }
            if (els.renderQueueCancelBtn) els.renderQueueCancelBtn.disabled = !snap.running;
            if (els.renderQueueRetryBtn) els.renderQueueRetryBtn.disabled = snap.running || !snap.failed;
            if (els.renderQueueClearBtn) els.renderQueueClearBtn.disabled = snap.running;
            updateButtons();
        }

        function captureEditorSelection() {
            return {
                selectedRecommendationId: state.selectedRecommendationId || '',
                selectedRange: state.selectedRange ? Object.assign({}, state.selectedRange) : null
            };
        }

        function restoreEditorSelection(editorSnapshot, sourceFile) {
            if (!editorSnapshot || state.file !== sourceFile || !editorSnapshot.selectedRecommendationId) return false;
            const selected = (state.recommendations || []).find(item => item.id === editorSnapshot.selectedRecommendationId);
            if (!selected) return false;
            state.selectedRecommendationId = selected.id;
            state.selectedRange = editorSnapshot.selectedRange
                ? Object.assign({}, editorSnapshot.selectedRange)
                : { start: selected.start, end: selected.end, duration: selected.duration, score: selected.score };
            updateSelectedRangeControls(selected);
            renderAll();
            return true;
        }

        function buildExportPayload(candidate, index, total) {
            const base = utils.safeFileBaseName ? utils.safeFileBaseName(state.file && state.file.name) : 'ai-shorts';
            const labelPrefix = total > 1 ? `후보 ${index + 1}/${total}` : '선택 구간';
            return {
                id: `export-${candidate.id || index}-${Math.round(candidate.start || 0)}`,
                label: `${labelPrefix} · ${candidate.rangeText || Math.round(candidate.start || 0) + 's'}`,
                candidateId: candidate.id || null,
                filenameHint: `${base}-${Math.round(candidate.start || 0)}s.webm`,
                payload: { candidate, index, total, base }
            };
        }

        async function runJobs(jobs) {
            if (!renderQueue || !renderQueue.runJobs) throw new Error('렌더 큐 모듈을 불러오지 못했습니다.');
            activateFlowTab('export', { reveal: true });
            stopPreview({ cancel: true, reason: '렌더 시작' });
            const media = getActiveMediaElement();
            if (!media) throw new Error('저장할 원본 미디어가 없습니다.');
            const capability = renderer.inspectRenderCapability
                ? renderer.inspectRenderCapability(els.previewCanvas, media)
                : { ok: true, reasons: [], warnings: [] };
            if (!capability.ok) throw new Error(capability.reasons.join(' ') || '이 브라우저에서는 렌더를 시작할 수 없습니다.');
            if (capability.warnings && capability.warnings.length) {
                const warningText = capability.warnings.join(' ');
                toast(warningText, 'warning');
                if (store.addDiagnostic) store.addDiagnostic({ type: 'render-capability-warning', message: warningText });
            }

            const sourceFile = state.file;
            const editorSelection = captureEditorSelection();
            const token = beginOperation('render', {
                jobs: Array.isArray(jobs) ? jobs.length : 1,
                fileName: state.file && state.file.name || '',
                mimeType: capability.mimeType || ''
            });
            let completionResult = 'render-failed';
            try {
                const result = await renderQueue.runJobs(jobs, async (job, update, signal) => {
                    assertOperation(token);
                    const payload = job.payload || {};
                    const item = payload.candidate;
                    if (!item) throw new Error('렌더할 추천 구간이 없습니다.');
                    state.selectedRecommendationId = item.id;
                    state.selectedRange = { start: item.start, end: item.end, duration: item.duration, score: item.score };
                    updateSelectedRangeControls(item);
                    renderAll();
                    setProgress(2, `${job.label} 준비`);
                    if (els.previewStatus) els.previewStatus.textContent = '렌더 큐 실행 중';
                    const exportResult = await renderer.recordVerticalSegment(els.previewCanvas, media, {
                        start: item.start,
                        end: item.end,
                        cropMode: state.settings.cropMode,
                        title: els.titleInput ? els.titleInput.value : 'AI Shorts Studio',
                        rangeText: item.rangeText,
                        waveformBins: state.waveformBins,
                        thumbnailTemplate: state.settings.thumbnailTemplate,
                        qualityOptions: Object.assign({}, getQualityOptions(), { safeGuide: false }),
                        captions: state.captions,
                        captionOffset: state.settings.captionOffset,
                        captionStyle: state.settings.captionStyle,
                        captionOptions: getCaptionOptions(),
                        fps: getExportFrameRate(),
                        videoBitsPerSecond: getExportBitrate(),
                        signal: signal || token && token.signal || null
                    }, (percent, status) => {
                        if (signal && signal.aborted) return;
                        update(percent, status || '렌더링');
                        setProgress(percent, status || job.label);
                    });
                    assertOperation(token, '원본이 변경되어 이전 렌더 결과를 저장하지 않습니다.');
                    const ext = utils.extensionFromMime ? utils.extensionFromMime(exportResult.mimeType) : 'webm';
                    const filename = `${payload.base || 'ai-shorts'}-${payload.total > 1 ? 'candidate-' + String(payload.index + 1).padStart(2, '0') + '-' : ''}${Math.round(item.start)}s-${Math.round(item.duration)}s-shorts.${ext}`;
                    update(96, filename);
                    state.exportInfo = { filename, size: exportResult.blob.size, mimeType: exportResult.mimeType, range: item.rangeText };
                    if (!downloadService.saveBlob) throw new Error('다운로드 서비스를 불러오지 못했습니다.');
                    downloadService.saveBlob(exportResult.blob, filename);
                    update(100, filename);
                }, { signal: token && token.signal || null });

                if (result.cancelled) {
                    completionResult = 'render-cancelled';
                    setProgress(0, `렌더 취소 · ${result.cancelled}개`);
                    if (els.previewStatus) els.previewStatus.textContent = '렌더 취소';
                    toast('진행 중인 렌더를 안전하게 취소했습니다.', 'warning');
                } else {
                    completionResult = result.failed ? 'render-partial' : 'render-complete';
                    setProgress(100, result.failed ? `렌더 큐 완료 · 실패 ${result.failed}` : '렌더 큐 완료');
                    if (els.previewStatus) els.previewStatus.textContent = result.failed ? '일부 저장 실패' : '저장 완료';
                    toast(result.failed ? `렌더 큐 완료 · 실패 ${result.failed}개` : `렌더 큐 저장 완료 · ${result.done}/${result.total}개`, result.failed ? 'warning' : 'export');
                }
                updateButtons();
                return result;
            } finally {
                finishOperation(token, completionResult);
                restoreEditorSelection(editorSelection, sourceFile);
            }
        }

        async function retryFailedJobs() {
            if (!renderQueue || !renderQueue.retryableJobs) throw new Error('재시도 가능한 렌더 큐를 불러오지 못했습니다.');
            const jobs = renderQueue.retryableJobs();
            if (!jobs.length) {
                toast('재시도할 실패 항목이 없습니다.', 'warning');
                return null;
            }
            setProgress(1, `실패 항목 재시도 · ${jobs.length}개`);
            if (store.addDiagnostic) store.addDiagnostic({ type: 'render-retry-start', total: jobs.length });
            return runJobs(jobs);
        }

        return Object.freeze({
            snapshot,
            formatDuration,
            renderQueue: renderQueueState,
            captureEditorSelection,
            restoreEditorSelection,
            buildExportPayload,
            runJobs,
            retryFailedJobs
        });
    }

    global.AIShortsRenderWorkflowController = Object.freeze({ create });
})(window);
