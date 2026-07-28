#!/usr/bin/env node
'use strict';
const fs=require('fs'); const path=require('path'); const vm=require('vm');
const root=path.resolve(__dirname,'..'); const ok=(v,m)=>{if(!v)throw new Error(m)};
const window={window:null,AIShortsRuntimeConfig:{}}; window.window=window;
vm.runInContext(fs.readFileSync(path.join(root,'src/vision/smart-reframe-engine.js'),'utf8'),vm.createContext({window,Object,Array,Map,Set,Math,Number,String,RegExp,Error,Promise,Date,console}));
const engine=window.AIShortsSmartReframe; const point=(time,x)=>({time,x,y:.42,confidence:.92,source:'face',box:{x:x-.03,y:.33,width:.06,height:.14}});
const subjects=Array.from({length:6},(_,i)=>({id:`subject-${i+1}`,points:[point(0,.1+i*.15),point(12,.11+i*.15)]}));
const cues=subjects.map((subject,index)=>({start:0,end:12,speaker:`S${index+1}`,subjectId:subject.id,confidence:.9-index*.01,energy:.8-index*.03,priority:index===0?'primary':'auto'}));
const track=engine._test.buildTrack([point(0,.5),point(12,.5)],'hybrid',{}, {},{subjects,activeSubjectId:'auto',speakerPriority:true,speakerCues:cues,speakerLayout:{gridPaging:'manual',gridPageSeconds:3,gridManualPages:[['subject-1','subject-2','subject-3'],['subject-1','subject-4','subject-5','subject-6']],gridManualPageSeconds:[2,5],gridTransition:'fade',gridTransitionMs:300}});
const first=engine.getFocusAt(track,1.8); const second=engine.getFocusAt(track,2.2); const wrap=engine.getFocusAt(track,7.2);
ok(first.gridPage===0&&first.gridPageDuration===2,'first manual page uses its own two-second duration');
ok(second.gridPage===1&&second.gridPageDuration===5&&second.gridSubjects[1].subjectId==='subject-4','second page starts at the per-page boundary');
ok(wrap.gridPage===0&&wrap.gridSubjects[1].subjectId==='subject-2','manual page cycle wraps using the duration sum');
const safe=engine._test.safeSpeakerLayout({gridPageSeconds:4,gridManualPages:[['subject-1','subject-2','subject-3'],['subject-1','subject-4','subject-5']],gridManualPageSeconds:[.2,99,7]});
ok(safe.gridManualPageSeconds.join(',')==='1,10','per-page durations are bounded and aligned with valid pages');
console.log('PASS manual speaker pages use independent bounded display durations');
