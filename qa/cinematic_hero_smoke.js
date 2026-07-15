#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/css/hero-command-deck.css'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

function fail(message) {
    console.error('FAIL ' + message);
    process.exit(1);
}

if (html.includes('assets/css/cinematic-hero.css')) fail('superseded cinematic hero stylesheet should not be requested');
if (sw.includes('assets/css/cinematic-hero.css')) fail('superseded cinematic hero stylesheet should not be precached');
if (!html.includes('class="brand-panel cinematic-brand-panel"')) fail('hero keeps the stable brand panel class');
for (const token of ['shorts-hero-bg', 'shorts-glyph', 'shorts-timeline', 'shorts-frame-stack', 'cinematic-title']) {
    if (!html.includes(token)) fail(`shorts identity DOM token missing: ${token}`);
}
for (const token of ['.shorts-light', '.shorts-frame-main', '@keyframes shortsTimelinePulse', '@media (prefers-reduced-motion: reduce)']) {
    if (!css.includes(token)) fail(`shorts identity css guard missing: ${token}`);
}
for (const removed of ['film-strip film-strip-a', 'viewfinder-mark-tl', 'camera-frame-sweep', 'command-reel']) {
    if (html.includes(removed)) fail(`dated decorative token should stay removed: ${removed}`);
}
console.log('PASS cinematic identity is expressed through a clean 9:16 shorts composition');
