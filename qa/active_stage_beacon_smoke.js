#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/css/active-stage-beacon.css'), 'utf8');
const director = fs.readFileSync(path.join(root, 'src/ui/flow-director-final.js'), 'utf8');
function assert(value, message) { if (!value) { console.error('FAIL:', message); process.exit(1); } }
assert(html.includes('assets/css/active-stage-beacon.css?v=1.5.29-analysis-signature-storage-trend'), 'active stage beacon stylesheet is loaded');
assert(html.indexOf('active-stage-beacon.css') > html.indexOf('header-meta-rail.css'), 'stage beacon is the final visual override');
assert(css.includes('.stage-neon-rail') && css.includes('.stage-progress-chip'), 'persistent rail and progress chip are styled');
assert(css.includes('stageLandingSweep') && css.includes('stageLandingGlow'), 'landing sweep and glow animations exist');
assert(css.includes('prefers-reduced-motion'), 'reduced motion is respected');
assert(css.includes('data-navigation-focus="export"') && css.includes('data-navigation-focus="recommend"'), 'stage-specific neon tones are defined');
assert(director.includes('ensureStageDecor') && director.includes('is-stage-current') && director.includes('is-stage-landing'), 'director owns persistent and landing stage classes');
assert(director.includes('workflowStageLive') && director.includes("aria-live', 'polite'"), 'stage changes are announced accessibly');
assert(director.includes("stageChanged || opts.forcePulse"), 'landing animation only repeats for a new stage or explicit pulse');
console.log('PASS active workflow stage neon landing beacon');
