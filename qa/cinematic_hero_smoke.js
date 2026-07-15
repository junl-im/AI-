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
if (!html.includes('class="brand-panel cinematic-brand-panel"')) fail('hero brand panel should preserve the stable cinematic class');
for (const token of ['cinema-hero-bg', 'cinema-gradient-orb-a', 'cinema-gradient-orb-b', 'camera-frame-sweep', 'cinematic-title']) {
    if (!html.includes(token)) fail(`editorial cinematic DOM token missing: ${token}`);
}
for (const token of ['.cinema-gradient-orb', '.camera-frame-sweep', '@keyframes editorialSweep', '@media (prefers-reduced-motion: reduce)']) {
    if (!css.includes(token)) fail(`editorial cinematic css guard missing: ${token}`);
}
for (const removed of ['film-strip film-strip-a', 'film-strip film-strip-b', 'viewfinder-mark-tl', 'viewfinder-mark-br']) {
    if (html.includes(removed)) fail(`dated decorative token should be removed: ${removed}`);
}
console.log('PASS cinematic identity is consolidated into the restrained editorial masthead');
