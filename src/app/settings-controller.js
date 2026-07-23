// AI Shorts Studio v1.5.27 - centralized caption, quality, and auto-cut settings ownership
'use strict';

(function exposeSettingsController(global) {
    function clamp(value, min, max, fallback) {
        const numeric = Number(value);
        return Math.max(min, Math.min(max, Number.isFinite(numeric) ? numeric : fallback));
    }

    function createSettingsController(deps) {
        const options = deps || {};
        const state = options.state || { settings: {} };
        const store = options.store || {};
        const els = options.elements || {};
        const captionDefaults = Object.freeze(Object.assign({}, options.captionDefaults || {}));
        const captionPresets = Object.freeze(Object.assign({}, options.captionPresets || {}));
        const qualityDefaults = Object.freeze(Object.assign({}, options.qualityDefaults || {}));
        const autoCutDefaults = Object.freeze(Object.assign({}, options.autoCutDefaults || {}));
        const qualityEffects = options.qualityEffects || {};
        const autoCutDetector = options.autoCutDetector || {};

        function save(key, value) {
            if (store.setSetting) store.setSetting(key, value);
            else {
                state.settings = state.settings || {};
                state.settings[key] = value;
            }
            return value;
        }

        function getCaptionOptions() {
            const raw = Object.assign({}, captionDefaults, state.settings && state.settings.captionOptions || {});
            raw.size = clamp(raw.size, 36, 86, Number(captionDefaults.size) || 58);
            raw.maxLines = Math.round(clamp(raw.maxLines, 1, 3, Number(captionDefaults.maxLines) || 2));
            raw.boxOpacity = clamp(raw.boxOpacity, 0, 0.9, Number(captionDefaults.boxOpacity) || 0);
            raw.shadow = clamp(raw.shadow, 0, 1, Number(captionDefaults.shadow) || 0);
            raw.uppercase = Boolean(raw.uppercase);
            raw.autoBreak = raw.autoBreak !== false;
            return raw;
        }

        function saveCaptionOptions(value) {
            return save('captionOptions', Object.assign({}, captionDefaults, value || {}));
        }

        function syncCaptionOptionsToUI() {
            const value = getCaptionOptions();
            if (els.captionPositionSelect) els.captionPositionSelect.value = value.position;
            if (els.captionMaxLinesSelect) els.captionMaxLinesSelect.value = String(value.maxLines);
            if (els.captionSizeInput) els.captionSizeInput.value = String(value.size);
            if (els.captionSizeValue) els.captionSizeValue.textContent = String(value.size);
            if (els.captionBoxOpacityInput) els.captionBoxOpacityInput.value = String(Math.round(value.boxOpacity * 100));
            if (els.captionBoxOpacityValue) els.captionBoxOpacityValue.textContent = `${Math.round(value.boxOpacity * 100)}%`;
            if (els.captionShadowInput) els.captionShadowInput.value = String(Math.round(value.shadow * 100));
            if (els.captionShadowValue) els.captionShadowValue.textContent = `${Math.round(value.shadow * 100)}%`;
            if (els.captionColorSelect) els.captionColorSelect.value = value.color;
            if (els.captionAccentSelect) els.captionAccentSelect.value = value.accent;
            if (els.captionHighlightInput) els.captionHighlightInput.value = value.highlightWords || '';
            if (els.captionUppercaseToggle) els.captionUppercaseToggle.checked = Boolean(value.uppercase);
            if (els.captionAutoBreakToggle) els.captionAutoBreakToggle.checked = value.autoBreak !== false;
            if (global.document && global.document.querySelectorAll) {
                global.document.querySelectorAll('.caption-preset').forEach(button => {
                    button.classList.toggle('is-active', button.getAttribute('data-caption-preset') === value.preset);
                });
            }
            return value;
        }

        function readCaptionOptionsFromUI() {
            const current = getCaptionOptions();
            const next = Object.assign({}, current, {
                position: els.captionPositionSelect ? els.captionPositionSelect.value : current.position,
                maxLines: els.captionMaxLinesSelect ? Number(els.captionMaxLinesSelect.value) || current.maxLines : current.maxLines,
                size: els.captionSizeInput ? Number(els.captionSizeInput.value) || current.size : current.size,
                boxOpacity: els.captionBoxOpacityInput ? (Number(els.captionBoxOpacityInput.value) || 0) / 100 : current.boxOpacity,
                shadow: els.captionShadowInput ? (Number(els.captionShadowInput.value) || 0) / 100 : current.shadow,
                color: els.captionColorSelect ? els.captionColorSelect.value : current.color,
                accent: els.captionAccentSelect ? els.captionAccentSelect.value : current.accent,
                highlightWords: els.captionHighlightInput ? els.captionHighlightInput.value : current.highlightWords,
                uppercase: els.captionUppercaseToggle ? els.captionUppercaseToggle.checked : current.uppercase,
                autoBreak: els.captionAutoBreakToggle ? els.captionAutoBreakToggle.checked : current.autoBreak
            });
            saveCaptionOptions(next);
            return syncCaptionOptionsToUI();
        }

        function applyCaptionPreset(name) {
            const preset = captionPresets[name] || captionPresets.creator || captionDefaults;
            saveCaptionOptions(preset);
            return syncCaptionOptionsToUI();
        }

        function resetCaptionOptions() {
            saveCaptionOptions(captionDefaults);
            return syncCaptionOptionsToUI();
        }

        function getQualityOptions() {
            const raw = Object.assign({}, qualityDefaults, state.settings && state.settings.qualityOptions || {});
            const normalized = qualityEffects.normalizeQualityOptions ? qualityEffects.normalizeQualityOptions(raw) : raw;
            return Object.assign({}, qualityDefaults, normalized);
        }

        function saveQualityOptions(value) {
            const merged = Object.assign({}, qualityDefaults, value || {});
            return save('qualityOptions', qualityEffects.normalizeQualityOptions ? qualityEffects.normalizeQualityOptions(merged) : merged);
        }

        function syncQualityOptionsToUI() {
            const value = getQualityOptions();
            const setRange = (input, label, amount) => {
                if (input) input.value = String(Math.round(Number(amount) * 100));
                if (label) label.textContent = `${Math.round(Number(amount) * 100)}%`;
            };
            setRange(els.brightnessInput, els.brightnessValue, value.brightness);
            setRange(els.contrastInput, els.contrastValue, value.contrast);
            setRange(els.saturationInput, els.saturationValue, value.saturation);
            setRange(els.vignetteInput, els.vignetteValue, value.vignette);
            if (els.fadeInSelect) els.fadeInSelect.value = String(value.fadeIn);
            if (els.fadeOutSelect) els.fadeOutSelect.value = String(value.fadeOut);
            if (els.introTextInput) els.introTextInput.value = value.introText || '';
            if (els.outroTextInput) els.outroTextInput.value = value.outroText || '';
            if (els.introDurationSelect) els.introDurationSelect.value = String(value.introDuration);
            if (els.outroDurationSelect) els.outroDurationSelect.value = String(value.outroDuration);
            if (els.watermarkTextInput) els.watermarkTextInput.value = value.watermarkText || '';
            if (els.watermarkPositionSelect) els.watermarkPositionSelect.value = value.watermarkPosition || 'bottom-right';
            if (els.safeGuideToggle) els.safeGuideToggle.checked = value.safeGuide !== false;
            return value;
        }

        function readQualityOptionsFromUI() {
            const current = getQualityOptions();
            const next = Object.assign({}, current, {
                brightness: els.brightnessInput ? (Number(els.brightnessInput.value) || 100) / 100 : current.brightness,
                contrast: els.contrastInput ? (Number(els.contrastInput.value) || 100) / 100 : current.contrast,
                saturation: els.saturationInput ? (Number(els.saturationInput.value) || 100) / 100 : current.saturation,
                vignette: els.vignetteInput ? (Number(els.vignetteInput.value) || 0) / 100 : current.vignette,
                fadeIn: els.fadeInSelect ? Number(els.fadeInSelect.value) || 0 : current.fadeIn,
                fadeOut: els.fadeOutSelect ? Number(els.fadeOutSelect.value) || 0 : current.fadeOut,
                introText: els.introTextInput ? els.introTextInput.value : current.introText,
                outroText: els.outroTextInput ? els.outroTextInput.value : current.outroText,
                introDuration: els.introDurationSelect ? Number(els.introDurationSelect.value) || 0 : current.introDuration,
                outroDuration: els.outroDurationSelect ? Number(els.outroDurationSelect.value) || 0 : current.outroDuration,
                watermarkText: els.watermarkTextInput ? els.watermarkTextInput.value : current.watermarkText,
                watermarkPosition: els.watermarkPositionSelect ? els.watermarkPositionSelect.value : current.watermarkPosition,
                safeGuide: els.safeGuideToggle ? els.safeGuideToggle.checked : current.safeGuide
            });
            saveQualityOptions(next);
            return syncQualityOptionsToUI();
        }

        function resetQualityOptions() {
            saveQualityOptions(qualityDefaults);
            return syncQualityOptionsToUI();
        }

        function getAutoCutOptions() {
            const raw = Object.assign({}, autoCutDefaults, state.settings && state.settings.autoCutOptions || {});
            if (autoCutDetector.normalizeOptions) return autoCutDetector.normalizeOptions(raw);
            raw.silenceThreshold = clamp(raw.silenceThreshold, 0.04, 0.2, autoCutDefaults.silenceThreshold);
            raw.beatSensitivity = clamp(raw.beatSensitivity, 0.35, 0.85, autoCutDefaults.beatSensitivity);
            raw.motionSensitivity = clamp(raw.motionSensitivity, 0.35, 0.9, autoCutDefaults.motionSensitivity);
            raw.handlePadding = clamp(raw.handlePadding, 0, 1.5, autoCutDefaults.handlePadding);
            raw.maxSnapDistance = clamp(raw.maxSnapDistance, 0.4, 3, autoCutDefaults.maxSnapDistance);
            return raw;
        }

        function saveAutoCutOptions(value) {
            const merged = Object.assign({}, autoCutDefaults, value || {});
            return save('autoCutOptions', autoCutDetector.normalizeOptions ? autoCutDetector.normalizeOptions(merged) : merged);
        }

        function syncAutoCutOptionsToUI() {
            const value = getAutoCutOptions();
            const setPercent = (input, label, amount) => {
                if (input) input.value = String(Math.round(amount * 100));
                if (label) label.textContent = `${Math.round(amount * 100)}%`;
            };
            setPercent(els.silenceThresholdInput, els.silenceThresholdValue, value.silenceThreshold);
            setPercent(els.beatSensitivityInput, els.beatSensitivityValue, value.beatSensitivity);
            setPercent(els.motionSensitivityInput, els.motionSensitivityValue, value.motionSensitivity);
            if (els.handlePaddingSelect) els.handlePaddingSelect.value = String(value.handlePadding);
            return value;
        }

        function readAutoCutOptionsFromUI() {
            const current = getAutoCutOptions();
            const next = Object.assign({}, current, {
                silenceThreshold: els.silenceThresholdInput ? (Number(els.silenceThresholdInput.value) || 9) / 100 : current.silenceThreshold,
                beatSensitivity: els.beatSensitivityInput ? (Number(els.beatSensitivityInput.value) || 58) / 100 : current.beatSensitivity,
                motionSensitivity: els.motionSensitivityInput ? (Number(els.motionSensitivityInput.value) || 60) / 100 : current.motionSensitivity,
                handlePadding: els.handlePaddingSelect ? Number(els.handlePaddingSelect.value) || 0 : current.handlePadding
            });
            saveAutoCutOptions(next);
            return syncAutoCutOptionsToUI();
        }

        return Object.freeze({
            getCaptionOptions, saveCaptionOptions, syncCaptionOptionsToUI, readCaptionOptionsFromUI, applyCaptionPreset, resetCaptionOptions,
            getQualityOptions, saveQualityOptions, syncQualityOptionsToUI, readQualityOptionsFromUI, resetQualityOptions,
            getAutoCutOptions, saveAutoCutOptions, syncAutoCutOptionsToUI, readAutoCutOptionsFromUI
        });
    }

    global.AIShortsSettingsController = Object.freeze({ createSettingsController });
})(window);
