#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const cssPath = path.join(root, 'assets/css/cinematic-hero.css');
const css = fs.readFileSync(cssPath, 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

function fail(message) {
    console.error('FAIL ' + message);
    process.exit(1);
}

if (!html.includes('assets/css/cinematic-hero.css?v=1.0.0-cinematic-hero')) fail('cinematic hero stylesheet link missing');
if (!html.includes('class="brand-panel cinematic-brand-panel"')) fail('hero brand panel should use cinematic class');
for (const token of ['cinema-hero-bg', 'film-strip film-strip-a', 'film-strip film-strip-b', 'camera-frame-sweep', 'viewfinder-mark-tl', 'viewfinder-mark-br', 'cinematic-title']) {
    if (!html.includes(token)) fail(`hero cinematic DOM token missing: ${token}`);
}
for (const token of ['@keyframes filmSlideLeft', '@keyframes filmSlideRight', '@keyframes cameraSweep', '@media (prefers-reduced-motion: reduce)', '.cinematic-brand-panel']) {
    if (!css.includes(token)) fail(`cinematic css guard missing: ${token}`);
}
if (!sw.includes('./assets/css/cinematic-hero.css?v=1.0.0-cinematic-hero')) fail('service worker should cache cinematic hero css');
console.log('PASS cinematic hero film/camera identity assets present');
