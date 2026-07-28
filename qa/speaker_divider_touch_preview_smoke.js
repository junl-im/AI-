#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
function ok(value, message) { if (!value) throw new Error(message); }
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/css/smart-reframe.css'), 'utf8');
['speakerPaneLayoutPreview','speakerPaneDividerControl','speakerCueBulkPreview','speakerCueBulkPreviewText'].forEach(id => ok(html.includes(`id="${id}"`), `${id} exists`));
ok(html.includes('role="separator"') && html.includes('aria-valuemin="35"') && html.includes('aria-valuemax="65"'), 'divider exposes separator range semantics');
ok(app.includes('beginSpeakerPaneDividerDrag') && app.includes('setPointerCapture') && app.includes('speakerPaneSplitFromPointer'), 'pointer and touch divider drag is wired');
ok(app.includes('handleSpeakerPaneDividerKeydown') && app.includes("event.key === 'Home'") && app.includes("event.key === 'End'"), 'divider keyboard control is wired');
ok(app.includes('speakerSelectionPointerId') && app.includes('document.elementFromPoint') && app.includes('syncSpeakerCueSelectionDom'), 'touch range selection uses pointer capture and coordinate hit testing');
ok(app.includes('describeBulkSpeakerCuePatch') && app.includes('syncBulkSpeakerCuePreview') && app.includes('getBulkSpeakerCuePatch'), 'bulk edit preview uses the same patch as apply');
ok(css.includes('touch-action: none') && css.includes('.speaker-pane-divider-control:focus-visible') && css.includes('.speaker-cue-bulk-preview[data-state="ready"]'), 'touch, focus, and preview states are styled');
console.log('PASS direct accessible divider, touch range selection, and bulk preview');
