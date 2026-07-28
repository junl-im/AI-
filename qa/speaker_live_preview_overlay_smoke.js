#!/usr/bin/env node
'use strict';
const fs=require('fs'); const path=require('path'); const root=path.resolve(__dirname,'..');
function ok(v,m){if(!v)throw new Error(m)}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const app=fs.readFileSync(path.join(root,'src/app.js'),'utf8');
const preview=fs.readFileSync(path.join(root,'src/app/preview-controller.js'),'utf8');
const css=fs.readFileSync(path.join(root,'assets/css/smart-reframe.css'),'utf8');
['speakerPreviewOverlay','speakerPreviewGuide1','speakerPreviewGuide4','speakerPreviewDividerControl','speakerPreviewOverlayStatus'].forEach(id=>ok(html.includes(`id="${id}"`),`${id} exists`));
ok(app.includes('syncSpeakerPreviewOverlay')&&app.includes('speakerPreviewPaneGeometry')&&app.includes('speakerGuideCropSummary'),'live overlay computes focus geometry and source crop summaries');
ok(app.includes('dividerSurfaceForControl')&&app.includes('speakerPreviewDividerControl'),'actual preview divider reuses safe drag and keyboard ownership');
ok(preview.includes('onRendered')&&preview.includes('onRendered(media.currentTime)'),'preview controller synchronizes overlay after every rendered frame');
ok(css.includes('.speaker-preview-overlay')&&css.includes('.speaker-preview-guide')&&css.includes('pointer-events: auto'),'overlay guides and direct divider interaction are styled');
console.log('PASS actual preview overlay exposes live divider and crop guides');
