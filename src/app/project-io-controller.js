// AI Shorts Studio v1.5.5 - project import/export ownership controller
'use strict';

(function exposeProjectIOController(global) {
    function createProjectIOController(deps) {
        const options = deps || {};
        const state = options.state || {};
        const projectService = options.projectService || {};
        const downloadService = options.downloadService || {};
        const utils = options.utils || {};
        const config = options.config || {};
        const store = options.store || {};
        const captionService = options.captionService || {};
        const elements = options.elements || {};
        const toast = typeof options.toast === 'function' ? options.toast : function () {};
        const syncSettingsToUI = typeof options.syncSettingsToUI === 'function' ? options.syncSettingsToUI : function () {};
        const renderAll = typeof options.renderAll === 'function' ? options.renderAll : function () {};

        function saveProject() {
            if (!projectService.createProjectSnapshot || !downloadService.saveBlob) return false;
            const snapshot = projectService.createProjectSnapshot(
                state,
                elements.titleInput ? elements.titleInput.value : '',
                elements.hashtagInput ? elements.hashtagInput.value : ''
            );
            const base = utils.safeFileBaseName ? utils.safeFileBaseName(state.file && state.file.name || 'ai-shorts-project') : 'ai-shorts-project';
            const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
            downloadService.saveBlob(blob, `${base}-project.json`);
            if (store.addDiagnostic) store.addDiagnostic({ type: 'project-export', recommendations: (state.recommendations || []).length, captions: (state.captions || []).length });
            toast('프로젝트 JSON을 저장했습니다.', 'export');
            return true;
        }

        function applyProject(project, fileName) {
            projectService.applyProjectSnapshot(state, project);
            if (project.settings && project.settings.thumbnailTemplate && elements.thumbnailTemplateSelect) elements.thumbnailTemplateSelect.value = project.settings.thumbnailTemplate;
            if (project.copy) {
                if (elements.titleInput) elements.titleInput.value = project.copy.title || elements.titleInput.value;
                if (elements.hashtagInput) elements.hashtagInput.value = project.copy.hashtags || elements.hashtagInput.value;
            }
            if (elements.captionTextInput && captionService.serializeCaptions) elements.captionTextInput.value = captionService.serializeCaptions(state.captions || []);
            if (store.saveSettings) store.saveSettings();
            syncSettingsToUI();
            renderAll();
            if (store.addDiagnostic) store.addDiagnostic({ type: 'project-import', fileName: fileName || '', recommendations: (state.recommendations || []).length, captions: (state.captions || []).length });
            toast('프로젝트를 불러왔습니다. 원본 미디어가 다르면 다시 파일을 열어주세요.', 'success');
            return project;
        }

        function importProjectFile(file) {
            if (!file) return Promise.resolve(null);
            const maxBytes = Number(config.MAX_PROJECT_FILE_BYTES || 2 * 1024 * 1024);
            if (Number(file.size || 0) > maxBytes) {
                if (store.addDiagnostic) store.addDiagnostic({ type: 'project-file-too-large', fileName: file.name, fileSize: file.size, maxBytes });
                toast(`프로젝트 파일이 너무 큽니다. ${Math.round(maxBytes / 1024 / 1024)}MB 이하 파일을 사용해주세요.`, 'warning');
                return Promise.reject(new Error('프로젝트 파일 크기 제한 초과'));
            }
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        const project = projectService.parseProjectText(String(reader.result || ''));
                        resolve(applyProject(project, file.name));
                    } catch (error) {
                        if (store.addDiagnostic) store.addDiagnostic({ type: 'project-import-error', fileName: file.name, message: error.message });
                        toast(error.message || '프로젝트 파일을 읽지 못했습니다.', 'error');
                        reject(error);
                    }
                };
                reader.onerror = () => {
                    const error = new Error('프로젝트 파일을 읽지 못했습니다.');
                    toast(error.message, 'error');
                    reject(error);
                };
                reader.readAsText(file);
            });
        }

        function handleProjectFile(event) {
            const input = event && event.target;
            const file = input && input.files && input.files[0];
            if (!file) return Promise.resolve(null);
            return importProjectFile(file).catch(() => null).finally(() => { input.value = ''; });
        }

        return Object.freeze({ saveProject, applyProject, importProjectFile, handleProjectFile });
    }

    global.AIShortsProjectIOController = Object.freeze({ createProjectIOController });
})(window);
