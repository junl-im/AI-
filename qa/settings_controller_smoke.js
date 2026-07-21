'use strict';
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

function element(value) {
    return { value: value == null ? '' : String(value), textContent: '', checked: false };
}

const presetButtons = ['creator', 'news'].map(name => ({
    active: false,
    getAttribute: key => key === 'data-caption-preset' ? name : '',
    classList: { toggle(_name, active) { this.owner.active = active; }, owner: null }
}));
presetButtons.forEach(button => { button.classList.owner = button; });
const context = { window: null, document: { querySelectorAll: () => presetButtons } };
context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync('src/app/settings-controller.js', 'utf8'), context);

const state = { settings: {} };
const elements = {
    captionSizeInput: element(120), captionSizeValue: element(), captionMaxLinesSelect: element(5),
    captionBoxOpacityInput: element(95), captionBoxOpacityValue: element(), captionShadowInput: element(80), captionShadowValue: element(),
    captionPositionSelect: element('lower'), captionColorSelect: element('#fff'), captionAccentSelect: element('#ff0'),
    captionHighlightInput: element('AI'), captionUppercaseToggle: element(), captionAutoBreakToggle: element(),
    brightnessInput: element(110), brightnessValue: element(), contrastInput: element(105), contrastValue: element(),
    saturationInput: element(120), saturationValue: element(), vignetteInput: element(20), vignetteValue: element(),
    silenceThresholdInput: element(12), silenceThresholdValue: element(), beatSensitivityInput: element(60), beatSensitivityValue: element(),
    motionSensitivityInput: element(65), motionSensitivityValue: element(), handlePaddingSelect: element(0.8)
};
elements.captionUppercaseToggle.checked = true;
elements.captionAutoBreakToggle.checked = true;
const store = { setSetting(key, value) { state.settings[key] = value; } };
const controller = context.AIShortsSettingsController.createSettingsController({
    state, store, elements,
    captionDefaults: { preset: 'creator', position: 'lower', size: 58, maxLines: 2, boxOpacity: 0.5, shadow: 0.7, autoBreak: true },
    captionPresets: { creator: { preset: 'creator', size: 62 }, news: { preset: 'news', size: 52 } },
    qualityDefaults: { brightness: 1, contrast: 1, saturation: 1, vignette: 0.2, safeGuide: true },
    autoCutDefaults: { silenceThreshold: 0.09, beatSensitivity: 0.58, motionSensitivity: 0.6, handlePadding: 0.7, maxSnapDistance: 1.4 }
});

const caption = controller.readCaptionOptionsFromUI();
assert.equal(caption.size, 86, 'caption size must clamp to safe max');
assert.equal(caption.maxLines, 3, 'caption line count must clamp');
assert.equal(elements.captionSizeValue.textContent, '86');
controller.applyCaptionPreset('news');
assert.equal(state.settings.captionOptions.preset, 'news');
assert.equal(presetButtons[1].active, true);

const quality = controller.readQualityOptionsFromUI();
assert.equal(quality.brightness, 1.1);
assert.equal(elements.brightnessValue.textContent, '110%');

const cuts = controller.readAutoCutOptionsFromUI();
assert.equal(cuts.silenceThreshold, 0.12);
assert.equal(cuts.handlePadding, 0.8);
assert.equal(elements.motionSensitivityValue.textContent, '65%');
console.log('settings_controller_smoke: ok');
