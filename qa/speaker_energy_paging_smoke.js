#!/usr/bin/env node
'use strict';
const fs=require('fs'); const path=require('path'); const vm=require('vm');
const root=path.resolve(__dirname,'..'); function ok(v,m){if(!v)throw new Error(m)}
const window={window:null,AIShortsRuntimeConfig:{}}; window.window=window;
const context=vm.createContext({window,Object,Array,Map,Set,Math,Number,String,RegExp,Error,Promise,Date,console});
vm.runInContext(fs.readFileSync(path.join(root,'src/vision/smart-reframe-engine.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(root,'src/vision/speaker-face-linker.js'),'utf8'),context);
const engine=window.AIShortsSmartReframe; const linker=window.AIShortsSpeakerFaceLinker;
const point=(time,x)=>({time,x,y:.42,confidence:.9,source:'face',box:{x:x-.03,y:.35,width:.06,height:.13}});
const subjects=Array.from({length:6},(_,i)=>({id:`subject-${i+1}`,points:[point(0,.12+i*.14),point(5,.12+i*.14)]}));
const energies=[.5,.15,.92,.4,.81,.73];
const cues=subjects.map((subject,i)=>({start:0,end:5,speaker:`S${i+1}`,subjectId:subject.id,confidence:.7+i*.01,energy:energies[i],priority:i===0?'primary':'auto'}));
const track=engine._test.buildTrack([point(0,.5),point(5,.5)],'hybrid',{}, {},{subjects,activeSubjectId:'auto',speakerPriority:true,speakerCues:cues,speakerLayout:{gridPaging:'energy'}});
const focus=engine.getFocusAt(track,1);
ok(focus.gridPageTrigger==='energy','energy paging reports its immediate trigger');
ok(focus.gridSubjects.map(item=>item.subjectId).join(',')==='subject-1,subject-3,subject-5,subject-6','primary stays fixed while strongest energy speakers fill the grid immediately');
const normalized=linker.normalizeSegments([{start:0,end:1,speaker:'A',rmsNorm:.82}]);
ok(normalized[0].energy===.82,'local transcript segments preserve bounded RMS energy');
console.log('PASS speech energy immediately selects the strongest active grid speakers');
