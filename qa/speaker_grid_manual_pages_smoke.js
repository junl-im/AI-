#!/usr/bin/env node
'use strict';
const fs=require('fs'); const path=require('path'); const vm=require('vm');
const root=path.resolve(__dirname,'..'); function ok(v,m){if(!v)throw new Error(m)}
const window={window:null,AIShortsRuntimeConfig:{}}; window.window=window;
vm.runInContext(fs.readFileSync(path.join(root,'src/vision/smart-reframe-engine.js'),'utf8'),vm.createContext({window,Object,Array,Map,Set,Math,Number,String,RegExp,Error,Promise,Date,console}));
const engine=window.AIShortsSmartReframe; const point=(time,x)=>({time,x,y:.43,confidence:.9,source:'face'});
const subjects=Array.from({length:6},(_,i)=>({id:`subject-${i+1}`,points:[point(0,.1+i*.14),point(6,.1+i*.14)]}));
const cues=subjects.map((subject,i)=>({start:0,end:6,speaker:`S${i+1}`,subjectId:subject.id,confidence:.9-i*.02,priority:i===0?'primary':'auto'}));
const track=engine._test.buildTrack([point(0,.5),point(6,.5)],'hybrid',{}, {},{subjects,activeSubjectId:'auto',speakerPriority:true,speakerCues:cues,speakerLayout:{gridPaging:'manual',gridPageSeconds:2,gridTransition:'fade',gridTransitionMs:400,gridManualPages:[['subject-1','subject-5','subject-3'],['subject-1','subject-6','subject-2','subject-4']]}});
const first=engine.getFocusAt(track,.8); const second=engine.getFocusAt(track,2.5); const transition=engine.getFocusAt(track,2.1);
ok(first.gridSubjects.map(item=>item.subjectId).join(',')==='subject-1,subject-5,subject-3','first manual page preserves user order');
ok(second.gridSubjects.map(item=>item.subjectId).join(',')==='subject-1,subject-6,subject-2,subject-4','second manual page preserves user composition');
ok(transition.gridPreviousSubjects.length===3&&transition.gridTransitionProgress>0&&transition.gridTransitionProgress<1,'manual page boundary exposes previous subjects and bounded transition progress');
const safe=engine._test.safeSpeakerLayout({gridPaging:'manual',gridManualPages:[['subject-1','bad','subject-1','subject-2','subject-3','subject-4','subject-5']],gridTransition:'slide',gridTransitionMs:9999});
ok(safe.gridManualPages[0].join(',')==='subject-1,subject-2,subject-3,subject-4'&&safe.gridTransition==='slide'&&safe.gridTransitionMs===1200,'manual pages and transition duration are bounded');
console.log('PASS manual grid pages persist order and expose transition state');
