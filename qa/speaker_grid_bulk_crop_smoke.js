#!/usr/bin/env node
'use strict';
const fs=require('fs'); const path=require('path'); const vm=require('vm');
const root=path.resolve(__dirname,'..'); function ok(v,m){if(!v)throw new Error(m)}
const window={window:null,AIShortsRuntimeConfig:{}}; window.window=window;
vm.runInContext(fs.readFileSync(path.join(root,'src/vision/smart-reframe-engine.js'),'utf8'),vm.createContext({window,Object,Array,Map,Set,Math,Number,String,RegExp,Error,Promise,Date,console}));
const engine=window.AIShortsSmartReframe;
let track=engine._test.buildTrack([{time:0,x:.5,y:.45,confidence:.6,source:'motion'}],'hybrid',{}, {},{speakerCues:[
 {start:0,end:1,speaker:'A',subjectId:'subject-1',gridCrop:{x:0,y:0,zoom:1}},
 {start:2,end:3,speaker:'B',subjectId:'subject-2',gridCrop:{x:.02,y:.03,zoom:1.04}},
 {start:4,end:5,speaker:'C',subjectId:'subject-3',gridCrop:{x:-.02,y:0,zoom:1.02}}
]});
const keys=track.speakerCues.slice(0,2).map(engine.speakerCueKey);
track=engine.updateSpeakerCuesBulk(track,keys,{gridCrop:{x:.14,y:-.11,zoom:1.22}});
ok(track.speakerCues[0].gridCrop.x===.14&&track.speakerCues[1].gridCrop.zoom===1.22,'selected cues receive the same bounded grid crop');
ok(track.speakerCues[2].gridCrop.x===-.02&&track.speakerCues[2].gridCrop.zoom===1.02,'unselected cue crop stays unchanged');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'); const app=fs.readFileSync(path.join(root,'src/app.js'),'utf8');
ok(html.includes('id="speakerCueBulkGridCropToggle"'),'bulk grid crop field exists');
ok(app.includes("patch.gridCrop = {")&&html.includes('현재 grid cell crop 적용'),'bulk preview and patch share current crop controls');
console.log('PASS selected speaker cues support bounded bulk grid crop edits');
