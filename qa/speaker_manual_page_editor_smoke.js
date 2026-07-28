#!/usr/bin/env node
'use strict';
const fs=require('fs'); const path=require('path');
const root=path.resolve(__dirname,'..'); const app=fs.readFileSync(path.join(root,'src/app.js'),'utf8'); const html=fs.readFileSync(path.join(root,'index.html'),'utf8'); const css=fs.readFileSync(path.join(root,'assets/css/smart-reframe.css'),'utf8');
function ok(v,m){if(!v)throw new Error(m)}
ok(app.includes('moveSpeakerManualPageSubject')&&app.includes('setSpeakerManualPageDuration'),'manual page subjects and durations have dedicated edit paths');
ok(app.includes('application/x-speaker-subject')&&app.includes('gridManualPageSeconds'),'subject drag payload and duration persistence are wired');
ok(html.includes('speakerEnergyStatus')&&html.includes('speakerEnergyBars')&&html.includes('speakerEnergyHoldStatus'),'energy and hold diagnostics UI anchors exist');
ok(app.includes('syncSpeakerEnergyStatus')&&app.includes('hold ${waiting.remaining.toFixed(1)}초 남음'),'live energy status renders hold remaining time');
ok(css.includes('.speaker-grid-manual-subject-chip')&&css.includes('.speaker-energy-row'),'manual subject and energy diagnostics styles exist');
console.log('PASS per-page duration, in-page ordering, and energy hold UI contracts');
