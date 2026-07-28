#!/usr/bin/env node
'use strict';
const fs=require('fs'); const path=require('path'); const vm=require('vm');
const root=path.resolve(__dirname,'..'); function ok(v,m){if(!v)throw new Error(m)}
const window={window:null,AIShortsRuntimeConfig:{}}; window.window=window;
vm.runInContext(fs.readFileSync(path.join(root,'src/vision/smart-reframe-engine.js'),'utf8'),vm.createContext({window,Object,Array,Map,Set,Math,Number,String,RegExp,Error,Promise,Date,console}));
const engine=window.AIShortsSmartReframe; const point=(time,x)=>({time,x,y:.42,confidence:.9,source:'face',box:{x:x-.03,y:.35,width:.06,height:.13}});
const subjects=Array.from({length:5},(_,i)=>({id:`subject-${i+1}`,points:[point(0,.12+i*.17),point(5,.12+i*.17)]}));
const cues=[
 {start:0,end:5,speaker:'P',subjectId:'subject-1',confidence:.9,energy:.55,priority:'primary'},
 {start:0,end:5,speaker:'A',subjectId:'subject-2',confidence:.9,energy:.78},
 {start:0,end:5,speaker:'B',subjectId:'subject-3',confidence:.9,energy:.66},
 {start:0,end:5,speaker:'C',subjectId:'subject-4',confidence:.9,energy:.61},
 {start:1.5,end:5,speaker:'D',subjectId:'subject-5',confidence:.9,energy:.82}
];
const track=engine._test.buildTrack([point(0,.5),point(5,.5)],'hybrid',{}, {},{subjects,activeSubjectId:'auto',speakerPriority:true,speakerCues:cues,speakerLayout:{gridPaging:'energy',gridEnergyThreshold:.5,gridEnergyHysteresis:.08,gridEnergyHoldSeconds:1.2}});
const early=engine.getFocusAt(track,2.0);
const settled=engine.getFocusAt(track,3.0);
ok(early.gridPageTrigger==='energy','stable energy trigger is reported');
ok(early.gridSubjects.map(item=>item.subjectId).includes('subject-2'),'incumbent speaker remains during hold window');
ok(!early.gridSubjects.map(item=>item.subjectId).includes('subject-5') || early.gridSubjects.map(item=>item.subjectId).indexOf('subject-5')>1,'new speaker does not immediately displace the incumbent');
ok(settled.gridSubjects.map(item=>item.subjectId)[1]==='subject-5','higher-energy speaker takes the first secondary slot after hold');
const safe=engine._test.safeSpeakerLayout({gridEnergyThreshold:5,gridEnergyHysteresis:-1,gridEnergyHoldSeconds:99,gridTransitionEasing:'bad',gridSlideDirection:'bad'});
ok(safe.gridEnergyThreshold===1&&safe.gridEnergyHysteresis===0&&safe.gridEnergyHoldSeconds===5,'energy controls are bounded');
ok(safe.gridTransitionEasing==='ease-in-out'&&safe.gridSlideDirection==='auto','invalid transition controls use safe defaults');
console.log('PASS energy threshold, hold, and hysteresis stabilize multi-speaker paging');
