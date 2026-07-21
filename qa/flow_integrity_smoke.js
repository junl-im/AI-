#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const tabs = fs.readFileSync(path.join(root, 'src/ui/hyperflow-tabs.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/css/flow-integrity.css'), 'utf8');
const doctorCss = fs.readFileSync(path.join(root, 'assets/css/flow-doctor.css'), 'utf8');
const guard = fs.readFileSync(path.join(root, 'src/ui/flow-integrity.js'), 'utf8');
function assert(condition, message) { if (!condition) { console.error('FAIL ' + message); process.exit(1); } }
assert(html.includes('data-flow-tab="candidates"') && html.includes('data-flow-panel="candidates"'), 'candidate tab and candidate panel must both exist');
assert(html.includes('class="flow-selection-actions" hidden aria-hidden="true"'), 'top quick action row must be hidden to remove duplicate controls');
assert(html.includes('id="studioGrid" tabindex="-1"'), 'workspace must be focusable/revealable without jumping to hero top');
assert(tabs.includes('function revealActivePanel') && tabs.includes('getPanelForTab'), 'tab controller must reveal active panel in the workspace');
assert(!tabs.includes('scrollIntoView('), 'tab controller must not use browser anchor-style scrollIntoView');
assert(!tabs.includes('scrollTo(0') && !app.includes('scrollTo(0'), 'flow code must not jump to absolute page top');
assert(app.includes("activateFlowTab('candidates', { reveal: true })"), 'recommendation generation must reveal candidates tab');
assert(app.includes("activateFlowTab('preview', { reveal: true })"), 'candidate selection and preview actions must reveal preview tab');
assert(css.includes('.flow-selection-actions') && css.includes('display: none !important'), 'duplicate top flow actions must be visually removed');
assert(css.includes('.action-dock') && css.includes('display: none !important'), 'legacy action dock must be hidden in tab flow');
assert(doctorCss.includes('min-height: 36px') && doctorCss.includes('min-width: 96px'), 'flow doctor must own compact major action buttons');
assert(!css.includes('body[data-ui="hyperflow-tabs"] #previewBtn'), 'flow integrity must not duplicate action sizing');
assert(guard.includes('AIShortsFlowIntegrity') && guard.includes('aria-posinset'), 'flow integrity guard must annotate dock tab ordering');
console.log('PASS flow integrity guardrails present');
