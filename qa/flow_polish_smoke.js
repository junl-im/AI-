#!/usr/bin/env node
'use strict';
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const app = fs.readFileSync('src/app.js', 'utf8');
const tabs = fs.readFileSync('src/ui/hyperflow-tabs.js', 'utf8');
const polish = fs.readFileSync('src/ui/flow-polish.js', 'utf8');
const wave = fs.readFileSync('src/ui/waveform-view.js', 'utf8');
function fail(msg) { console.error('FAIL flow_polish_smoke:', msg); process.exit(1); }
if (!html.includes('data-ui="hyperflow-tabs"')) fail('body must use hyperflow-tabs UI mode');
if (!html.includes('flowSelectionSummary')) fail('selection summary bar missing');
if (!html.includes('compareModeBtn')) fail('comparison mode button missing');
if (!html.includes('autoplayPreviewToggle')) fail('auto preview toggle missing');
if ((html.match(/id="analyzeBtn"/g) || []).length !== 1) fail('recommendation generation button must remain single');
if (!html.includes('tab-state-dot')) fail('bottom dock state badges missing');
if (!html.includes('v1.1.8</button>')) fail('version badge must be simple v1.1.8');
if (!html.includes('Design by <strong>곰같은여우</strong>')) fail('designer signature must stay on header line');
if (tabs.includes('recommendBtn && analyzeBtn')) fail('undefined recommendBtn mirror must be removed');
if (!app.includes('autoplayPreviewToggle')) fail('app must read auto preview toggle');
if (!app.includes('previewSelectedRange();')) fail('auto preview must trigger preview function');
if (!polish.includes('updateTabBadges')) fail('tab badge sync missing');
if (!polish.includes('updateSelectionSummary')) fail('selection summary sync missing');
if (!wave.includes('rec-compare-metrics')) fail('recommendation comparison metrics missing');
console.log('PASS flow_polish_smoke');
