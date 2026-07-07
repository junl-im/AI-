#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
const render = fs.readFileSync(path.join(root, 'src/render/vertical-renderer.js'), 'utf8');
const quality = fs.readFileSync(path.join(root, 'src/render/quality-effects.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/css/quality-tools.css'), 'utf8');

const ids = [
  'brightnessInput', 'contrastInput', 'saturationInput', 'vignetteInput',
  'fadeInSelect', 'fadeOutSelect', 'introTextInput', 'outroTextInput',
  'watermarkTextInput', 'watermarkPositionSelect', 'safeGuideToggle',
  'qualityResetBtn', 'copyBoostBtn'
];
const missingIds = ids.filter(id => !html.includes(`id="${id}"`));
if (missingIds.length) throw new Error('missing quality anchors: ' + missingIds.join(', '));

const appTokens = ['QUALITY_DEFAULTS', 'getQualityOptions', 'syncQualityOptionsToUI', 'createBoostedCopy'];
const missingApp = appTokens.filter(token => !app.includes(token));
if (missingApp.length) throw new Error('missing app quality tokens: ' + missingApp.join(', '));

const qualityTokens = ['normalizeQualityOptions', 'getCanvasFilter', 'calculateFadeVolume', 'drawSafeGuide', 'drawWatermark', 'drawIntroOutro'];
const missingQuality = qualityTokens.filter(token => !quality.includes(token));
if (missingQuality.length) throw new Error('missing quality module tokens: ' + missingQuality.join(', '));

const renderTokens = ['qualityEffects', 'qualityOptions', 'drawQualityOverlay', 'drawWatermark', 'drawIntroOutro'];
const missingRender = renderTokens.filter(token => !render.includes(token));
if (missingRender.length) throw new Error('missing render quality tokens: ' + missingRender.join(', '));

if (!css.includes('.quality-panel') || !css.includes('.quality-grid')) throw new Error('quality css missing');
console.log('PASS output quality smoke');
