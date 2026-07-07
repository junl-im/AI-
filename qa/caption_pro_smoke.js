#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
const render = fs.readFileSync(path.join(root, 'src/render/vertical-renderer.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/css/caption-pro.css'), 'utf8');

const ids = [
    'captionPositionSelect', 'captionMaxLinesSelect', 'captionSizeInput', 'captionBoxOpacityInput',
    'captionShadowInput', 'captionColorSelect', 'captionAccentSelect', 'captionHighlightInput',
    'captionUppercaseToggle', 'captionAutoBreakToggle', 'captionResetBtn'
];
const missingIds = ids.filter(id => !html.includes(`id="${id}"`));
if (missingIds.length) throw new Error('missing caption pro anchors: ' + missingIds.join(', '));

const requiredAppTokens = ['CAPTION_PRESETS', 'getCaptionOptions', 'syncCaptionOptionsToUI', 'captionOptions: getCaptionOptions()'];
const missingApp = requiredAppTokens.filter(token => !app.includes(token));
if (missingApp.length) throw new Error('missing caption app tokens: ' + missingApp.join(', '));

const requiredRenderTokens = ['normalizeCaptionOptions', 'highlightSet', 'drawCaptionLine', 'captionOptions'];
const missingRender = requiredRenderTokens.filter(token => !render.includes(token));
if (missingRender.length) throw new Error('missing caption render tokens: ' + missingRender.join(', '));

if (!css.includes('.caption-pro-panel') || !css.includes('.caption-preset')) throw new Error('caption pro css missing');
console.log('PASS caption pro smoke');
