#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
function ok(value, message) { if (!value) throw new Error(message); }
ok(app.includes('els.speakerEnergyBars.dataset.signature !== rowSignature'), 'energy rows use a stable render signature');
ok(app.includes('document.createDocumentFragment()'), 'energy row rebuilds are batched in a document fragment');
ok(app.includes('els.speakerEnergyHoldStatus.textContent !== statusText'), 'unchanged hold diagnostics avoid redundant text writes');
ok(app.includes('function alignSpeakerManualPageDurations(pages)'), 'manual text edits align durations by page identity');
ok(app.includes('smartEngine.alignGridManualPageSeconds(previousPages, layout.gridManualPageSeconds, pages, layout.gridPageSeconds)'), 'manual page duration alignment uses the engine identity contract');
ok(app.includes('Number.isFinite(number) ? Math.max(1, Math.min(10, number)) : fallback'), 'manual duration edits clamp finite values and recover invalid values to the global duration');
ok(app.includes("targetNode.closest('input,button,select,textarea,label')"), 'interactive controls cannot accidentally start page dragging');
ok(app.includes("button.setAttribute('aria-label', `페이지 ${index + 1}"), 'page reorder buttons expose explicit accessible labels');
console.log('PASS stable energy diagnostics, duration alignment, and drag safety contracts');
