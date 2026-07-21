// AI Shorts Studio v1.5.4 - bounded state container and persisted-setting recovery
'use strict';

(function exposeState(global) {
    const config = global.AIShortsRuntimeConfig || {};
    const SETTINGS_DEFAULTS = Object.freeze({
        duration: 'auto',
        style: 'balanced',
        cropMode: 'center',
        platform: 'youtube',
        captionStyle: 'bold',
        captionOffset: 0,
        captionOptions: Object.freeze({
            preset: 'creator', position: 'lower', size: 58, color: '#ffffff', accent: '#facc15',
            maxLines: 2, boxOpacity: 0.52, shadow: 0.78, highlightWords: '', uppercase: false, autoBreak: true
        }),
        qualityOptions: Object.freeze({
            brightness: 1, contrast: 1.06, saturation: 1.12, vignette: 0.22,
            fadeIn: 0.4, fadeOut: 1.0, introText: '', outroText: '', introDuration: 1.2, outroDuration: 1.2,
            watermarkText: '', watermarkPosition: 'bottom-right', safeGuide: true
        }),
        autoCutOptions: Object.freeze({
            silenceThreshold: 0.09, beatSensitivity: 0.58, motionSensitivity: 0.60, handlePadding: 0.7, maxSnapDistance: 1.4
        }),
        thumbnailTemplate: 'neon',
        renderPreset: 'balanced',
        feedbackOptions: Object.freeze({ haptics: true, toastKinds: true }),
        engineOptions: Object.freeze({ modular: true, performanceMode: 'auto', qualityGate: true })
    });

    function isPlainObject(value) {
        if (!value || Object.prototype.toString.call(value) !== '[object Object]') return false;
        const prototype = Object.getPrototypeOf(value);
        return prototype === Object.prototype || prototype === null;
    }

    function finite(value, fallback, min, max) {
        const number = Number(value);
        if (!Number.isFinite(number)) return fallback;
        return Math.max(min, Math.min(max, number));
    }

    function safeText(value, fallback, maxLength) {
        if (typeof value !== 'string') return fallback;
        return value.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, maxLength);
    }

    function enumValue(value, allowed, fallback) {
        const text = String(value == null ? '' : value);
        return allowed.includes(text) ? text : fallback;
    }

    function safeColor(value, fallback) {
        const text = String(value || '');
        return /^#[0-9a-fA-F]{6}$/.test(text) ? text.toLowerCase() : fallback;
    }

    function sanitizeSettings(value) {
        const input = isPlainObject(value) ? value : {};
        const caption = isPlainObject(input.captionOptions) ? input.captionOptions : {};
        const quality = isPlainObject(input.qualityOptions) ? input.qualityOptions : {};
        const autoCut = isPlainObject(input.autoCutOptions) ? input.autoCutOptions : {};
        const feedback = isPlainObject(input.feedbackOptions) ? input.feedbackOptions : {};
        const engine = isPlainObject(input.engineOptions) ? input.engineOptions : {};
        return {
            duration: enumValue(input.duration, ['auto', '15', '30', '45', '60', '90', '180'], SETTINGS_DEFAULTS.duration),
            style: enumValue(input.style, ['balanced', 'impact', 'emotional', 'motion'], SETTINGS_DEFAULTS.style),
            cropMode: enumValue(input.cropMode, ['center', 'top', 'bottom', 'blur-fit'], SETTINGS_DEFAULTS.cropMode),
            platform: enumValue(input.platform, ['youtube', 'reels', 'tiktok'], SETTINGS_DEFAULTS.platform),
            captionStyle: enumValue(input.captionStyle, ['bold', 'box', 'clean'], SETTINGS_DEFAULTS.captionStyle),
            captionOffset: finite(input.captionOffset, SETTINGS_DEFAULTS.captionOffset, -3600, 3600),
            captionOptions: {
                preset: enumValue(caption.preset, ['creator', 'news', 'cinema', 'minimal'], SETTINGS_DEFAULTS.captionOptions.preset),
                position: enumValue(caption.position, ['upper', 'middle', 'lower', 'safe-bottom'], SETTINGS_DEFAULTS.captionOptions.position),
                size: finite(caption.size, SETTINGS_DEFAULTS.captionOptions.size, 36, 86),
                color: safeColor(caption.color, SETTINGS_DEFAULTS.captionOptions.color),
                accent: safeColor(caption.accent, SETTINGS_DEFAULTS.captionOptions.accent),
                maxLines: Math.round(finite(caption.maxLines, SETTINGS_DEFAULTS.captionOptions.maxLines, 1, 3)),
                boxOpacity: finite(caption.boxOpacity, SETTINGS_DEFAULTS.captionOptions.boxOpacity, 0, 0.9),
                shadow: finite(caption.shadow, SETTINGS_DEFAULTS.captionOptions.shadow, 0, 1),
                highlightWords: safeText(caption.highlightWords, SETTINGS_DEFAULTS.captionOptions.highlightWords, 500),
                uppercase: typeof caption.uppercase === 'boolean' ? caption.uppercase : SETTINGS_DEFAULTS.captionOptions.uppercase,
                autoBreak: typeof caption.autoBreak === 'boolean' ? caption.autoBreak : SETTINGS_DEFAULTS.captionOptions.autoBreak
            },
            qualityOptions: {
                brightness: finite(quality.brightness, SETTINGS_DEFAULTS.qualityOptions.brightness, 0.5, 1.5),
                contrast: finite(quality.contrast, SETTINGS_DEFAULTS.qualityOptions.contrast, 0.5, 1.8),
                saturation: finite(quality.saturation, SETTINGS_DEFAULTS.qualityOptions.saturation, 0, 2),
                vignette: finite(quality.vignette, SETTINGS_DEFAULTS.qualityOptions.vignette, 0, 1),
                fadeIn: finite(quality.fadeIn, SETTINGS_DEFAULTS.qualityOptions.fadeIn, 0, 10),
                fadeOut: finite(quality.fadeOut, SETTINGS_DEFAULTS.qualityOptions.fadeOut, 0, 10),
                introText: safeText(quality.introText, SETTINGS_DEFAULTS.qualityOptions.introText, 300),
                outroText: safeText(quality.outroText, SETTINGS_DEFAULTS.qualityOptions.outroText, 300),
                introDuration: finite(quality.introDuration, SETTINGS_DEFAULTS.qualityOptions.introDuration, 0, 10),
                outroDuration: finite(quality.outroDuration, SETTINGS_DEFAULTS.qualityOptions.outroDuration, 0, 10),
                watermarkText: safeText(quality.watermarkText, SETTINGS_DEFAULTS.qualityOptions.watermarkText, 160),
                watermarkPosition: enumValue(quality.watermarkPosition, ['top-left', 'top-right', 'bottom-left', 'bottom-right'], SETTINGS_DEFAULTS.qualityOptions.watermarkPosition),
                safeGuide: typeof quality.safeGuide === 'boolean' ? quality.safeGuide : SETTINGS_DEFAULTS.qualityOptions.safeGuide
            },
            autoCutOptions: {
                silenceThreshold: finite(autoCut.silenceThreshold, SETTINGS_DEFAULTS.autoCutOptions.silenceThreshold, 0.04, 0.2),
                beatSensitivity: finite(autoCut.beatSensitivity, SETTINGS_DEFAULTS.autoCutOptions.beatSensitivity, 0.35, 0.85),
                motionSensitivity: finite(autoCut.motionSensitivity, SETTINGS_DEFAULTS.autoCutOptions.motionSensitivity, 0.35, 0.9),
                handlePadding: finite(autoCut.handlePadding, SETTINGS_DEFAULTS.autoCutOptions.handlePadding, 0, 1.5),
                maxSnapDistance: finite(autoCut.maxSnapDistance, SETTINGS_DEFAULTS.autoCutOptions.maxSnapDistance, 0.4, 3)
            },
            thumbnailTemplate: enumValue(input.thumbnailTemplate, ['neon', 'clean', 'cinematic', 'headline'], SETTINGS_DEFAULTS.thumbnailTemplate),
            renderPreset: enumValue(input.renderPreset, ['fast', 'balanced', 'high'], SETTINGS_DEFAULTS.renderPreset),
            feedbackOptions: {
                haptics: typeof feedback.haptics === 'boolean' ? feedback.haptics : SETTINGS_DEFAULTS.feedbackOptions.haptics,
                toastKinds: typeof feedback.toastKinds === 'boolean' ? feedback.toastKinds : SETTINGS_DEFAULTS.feedbackOptions.toastKinds
            },
            engineOptions: {
                modular: typeof engine.modular === 'boolean' ? engine.modular : SETTINGS_DEFAULTS.engineOptions.modular,
                performanceMode: enumValue(engine.performanceMode, ['auto', 'quality', 'speed'], SETTINGS_DEFAULTS.engineOptions.performanceMode),
                qualityGate: typeof engine.qualityGate === 'boolean' ? engine.qualityGate : SETTINGS_DEFAULTS.engineOptions.qualityGate
            }
        };
    }

    function loadSettings() {
        try {
            const raw = global.localStorage && global.localStorage.getItem(config.LOCAL_STORAGE_KEY || 'ai-shorts-settings');
            return sanitizeSettings(raw ? JSON.parse(raw) : null);
        } catch (error) {
            return sanitizeSettings(null);
        }
    }

    const state = {
        file: null,
        fileUrl: '',
        fileKind: '',
        fileMeta: null,
        mediaSessionId: 0,
        audioBuffer: null,
        channelData: null,
        audioAnalysis: null,
        motionAnalysis: null,
        autoCuts: null,
        engineMeta: null,
        proEngine: { stabilityScore: 100, cacheEnabled: true },
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

    function saveSettings() {
        try {
            state.settings = sanitizeSettings(state.settings);
            if (global.localStorage) global.localStorage.setItem(config.LOCAL_STORAGE_KEY || 'ai-shorts-settings', JSON.stringify(state.settings));
        } catch (error) {
            // localStorage can be blocked in some in-app browsers.
        }
    }

    function setSetting(key, value) {
        if (!Object.prototype.hasOwnProperty.call(SETTINGS_DEFAULTS, key)) return false;
        const next = Object.assign({}, state.settings || {});
        next[key] = value;
        state.settings = sanitizeSettings(next);
        saveSettings();
        return true;
    }

    function addDiagnostic(event) {
        const limit = Number(config.DIAGNOSTIC_HISTORY_LIMIT || 20);
        state.diagnostics.unshift(Object.assign({ at: new Date().toISOString() }, event || {}));
        state.diagnostics = state.diagnostics.slice(0, limit);
    }

    function resetMedia(options) {
        const resetOptions = options || {};
        const utils = global.AIShortsCoreUtils || {};
        if (!resetOptions.skipFileUrlRevoke && state.fileUrl && utils.revokeObjectUrl) utils.revokeObjectUrl(state.fileUrl);
        state.file = null;
        state.fileUrl = '';
        state.fileKind = '';
        state.fileMeta = null;
        state.mediaSessionId = 0;
        state.audioBuffer = null;
        state.channelData = null;
        state.audioAnalysis = null;
        state.motionAnalysis = null;
        state.autoCuts = null;
        state.engineMeta = null;
        state.waveformBins = [];
        state.recommendations = [];
        state.selectedRecommendationId = '';
        state.selectedRange = null;
        state.captions = [];
        state.exportInfo = null;
        state.isAnalyzing = false;
        state.isPreviewing = false;
    }

    global.AIShortsAppState = { state, setSetting, saveSettings, addDiagnostic, resetMedia, sanitizeSettings };
})(window);
