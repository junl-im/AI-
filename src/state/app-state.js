// AI Shorts Studio v0.2.0 - state container
'use strict';

(function exposeState(global) {
    const config = global.AIShortsRuntimeConfig || {};
    const state = {
        file: null,
        fileUrl: '',
        fileKind: '',
        fileMeta: null,
        audioBuffer: null,
        channelData: null,
        audioAnalysis: null,
        motionAnalysis: null,
        waveformBins: [],
        recommendations: [],
        selectedRecommendationId: '',
        selectedRange: null,
        captions: [],
        settings: loadSettings(),
        isAnalyzing: false,
        isPreviewing: false,
        exportInfo: null,
        diagnostics: []
    };

    function loadSettings() {
        const defaults = {
            duration: 'auto',
            style: 'balanced',
            cropMode: 'center',
            platform: 'youtube',
            captionStyle: 'bold',
            captionOffset: 0
        };
        try {
            const raw = global.localStorage && global.localStorage.getItem(config.LOCAL_STORAGE_KEY || 'ai-shorts-settings');
            const parsed = raw ? JSON.parse(raw) : null;
            return Object.assign({}, defaults, parsed || {});
        } catch (error) {
            return defaults;
        }
    }

    function saveSettings() {
        try {
            if (global.localStorage) global.localStorage.setItem(config.LOCAL_STORAGE_KEY || 'ai-shorts-settings', JSON.stringify(state.settings));
        } catch (error) {
            // localStorage can be blocked in some in-app browsers.
        }
    }

    function setSetting(key, value) {
        state.settings[key] = value;
        saveSettings();
    }

    function addDiagnostic(event) {
        const limit = Number(config.DIAGNOSTIC_HISTORY_LIMIT || 20);
        state.diagnostics.unshift(Object.assign({ at: new Date().toISOString() }, event || {}));
        state.diagnostics = state.diagnostics.slice(0, limit);
    }

    function resetMedia() {
        const utils = global.AIShortsCoreUtils || {};
        if (state.fileUrl && utils.revokeObjectUrl) utils.revokeObjectUrl(state.fileUrl);
        state.file = null;
        state.fileUrl = '';
        state.fileKind = '';
        state.fileMeta = null;
        state.audioBuffer = null;
        state.channelData = null;
        state.audioAnalysis = null;
        state.motionAnalysis = null;
        state.waveformBins = [];
        state.recommendations = [];
        state.selectedRecommendationId = '';
        state.selectedRange = null;
        state.captions = [];
        state.exportInfo = null;
        state.isAnalyzing = false;
        state.isPreviewing = false;
    }

    global.AIShortsAppState = { state, setSetting, saveSettings, addDiagnostic, resetMedia };
})(window);
