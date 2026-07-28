#!/usr/bin/env node
'use strict';
const fs=require('fs'); const path=require('path');
const root=path.resolve(__dirname,'..'); function ok(v,m){if(!v)throw new Error(m)}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const app=fs.readFileSync(path.join(root,'src/app.js'),'utf8');
const css=fs.readFileSync(path.join(root,'assets/css/smart-reframe.css'),'utf8');
ok(html.includes('id="speakerGridManualPageEditor"')&&html.includes('role="list"'),'manual page editor has an accessible list host');
ok(app.includes('function moveSpeakerManualPage(')&&app.includes("card.addEventListener('dragstart'")&&app.includes("card.addEventListener('drop'"),'manual page order supports native drag and drop');
ok(app.includes("[['위', index - 1], ['아래', index + 1]]"),'keyboard-friendly up and down controls are present');
ok(app.includes('commitSpeakerManualPages(pages')&&app.includes('applySpeakerLayoutSettings();'),'reordered pages persist through the shared layout path');
ok(css.includes('.speaker-grid-manual-page-card[data-drop-target="true"]'),'drop target has visible styling');
console.log('PASS accessible manual speaker page reordering controls');
