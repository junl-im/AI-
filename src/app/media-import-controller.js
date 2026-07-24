// AI Shorts Studio v1.6.5 - media import and Object URL lifecycle owner
'use strict';

(function exposeMediaImportController(global) {
    function createMediaImportController(deps) {
        const options = deps || {};
        const state = options.state || {};
        const utils = options.utils || {};
        const store = options.store || {};
        const elements = options.elements || {};
        const operationCoordinator = options.operationCoordinator || {};
        const renderQueue = options.renderQueue || {};
        const toast = typeof options.toast === 'function' ? options.toast : function () {};
        const stopPreview = typeof options.stopPreview === 'function' ? options.stopPreview : function () {};
        const setupMediaPreview = typeof options.setupMediaPreview === 'function' ? options.setupMediaPreview : function () {};
        const renderAll = typeof options.renderAll === 'function' ? options.renderAll : function () {};
        const updateButtons = typeof options.updateButtons === 'function' ? options.updateButtons : function () {};
        const activateFlowTab = typeof options.activateFlowTab === 'function' ? options.activateFlowTab : function () {};
        const setProgress = typeof options.setProgress === 'function' ? options.setProgress : function () {};
        const analyzeCurrentFile = typeof options.analyzeCurrentFile === 'function' ? options.analyzeCurrentFile : function () {};
        let ownedUrl = '';
        let importSequence = 0;

        function revokeOwnedUrl() {
            if (!ownedUrl) return false;
            if (utils.revokeObjectUrl) utils.revokeObjectUrl(ownedUrl);
            else if (global.URL && global.URL.revokeObjectURL) {
                try { global.URL.revokeObjectURL(ownedUrl); } catch (error) { /* no-op */ }
            }
            if (state.fileUrl === ownedUrl) state.fileUrl = '';
            ownedUrl = '';
            return true;
        }

        function createOwnedUrl(file) {
            revokeOwnedUrl();
            ownedUrl = utils.createObjectUrl ? utils.createObjectUrl(file) : global.URL.createObjectURL(file);
            return ownedUrl;
        }

        function markUnsupported(file) {
            if (elements.fileInput) elements.fileInput.value = '';
            if (elements.selectedBadge) elements.selectedBadge.textContent = '지원 파일 필요';
            if (elements.importStatus) elements.importStatus.textContent = '오디오 또는 영상 파일만 열 수 있습니다.';
            if (store.addDiagnostic) store.addDiagnostic({ type: 'unsupported-media', fileName: file && file.name || '', fileType: file && file.type || '', fileSize: file && file.size || 0 });
            toast('지원하지 않는 파일 형식입니다. 오디오 또는 영상 파일을 선택해주세요.', 'warning');
            return false;
        }

        async function importFiles(fileList) {
            const file = fileList && fileList[0];
            if (!file) return false;
            const sequence = ++importSequence;
            const kind = utils.detectMediaKind ? utils.detectMediaKind(file) : '';
            if (!kind) return markUnsupported(file);
            if (renderQueue.isRunning && renderQueue.isRunning() && renderQueue.cancel) {
                renderQueue.cancel('새 원본 파일을 열어 진행 중인 렌더를 취소했습니다.');
            }
            stopPreview();
            const mediaSessionId = operationCoordinator.startMediaSession ? operationCoordinator.startMediaSession({ fileName: file.name, fileType: file.type }) : Date.now();
            revokeOwnedUrl();
            if (store.resetMedia) store.resetMedia({ skipFileUrlRevoke: true });
            state.mediaSessionId = mediaSessionId;
            state.file = file;
            state.fileKind = kind;
            state.fileUrl = createOwnedUrl(file);
            state.fileMeta = { name: file.name, size: file.size, type: file.type, duration: 0 };
            if (elements.fileInput) elements.fileInput.value = '';
            if (elements.selectedBadge) elements.selectedBadge.textContent = kind === 'video' ? '영상 선택됨' : '오디오 선택됨';
            if (elements.importStatus) elements.importStatus.textContent = `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB`;
            setupMediaPreview();
            setProgress(0, '분석 준비');
            if (elements.recommendationList) elements.recommendationList.classList.add('empty-state');
            if (store.addDiagnostic) store.addDiagnostic({ type: 'import', fileName: file.name, fileType: file.type, fileSize: file.size, kind, mediaSessionId });
            renderAll();
            updateButtons();
            activateFlowTab('file', { reveal: false, instant: true });
            global.setTimeout(() => {
                if (sequence !== importSequence || state.mediaSessionId !== mediaSessionId || state.file !== file) return;
                analyzeCurrentFile({ autoGenerate: false, source: 'file-open' });
            }, 80);
            return true;
        }

        function dispose() {
            importSequence += 1;
            revokeOwnedUrl();
        }

        return Object.freeze({ importFiles, dispose, revokeOwnedUrl, getOwnedUrl: () => ownedUrl });
    }

    global.AIShortsMediaImportController = Object.freeze({ createMediaImportController });
})(window);
