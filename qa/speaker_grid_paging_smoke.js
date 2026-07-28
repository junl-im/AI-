#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
function ok(value, message) { if (!value) throw new Error(message); }
const window = { window: null, AIShortsRuntimeConfig: {} }; window.window = window;
vm.runInContext(fs.readFileSync(path.join(root, 'src/vision/smart-reframe-engine.js'), 'utf8'), vm.createContext({ window, Object, Array, Map, Set, Math, Number, String, RegExp, Error, Promise, Date, console }));
const engine = window.AIShortsSmartReframe;
const point = (time,x)=>({time,x,y:.42,confidence:.92,source:'face',box:{x:x-.04,y:.34,width:.08,height:.16}});
const subjects = Array.from({length:7},(_,index)=>({id:`subject-${index+1}`,points:[point(0,.1+index*.12),point(8,.1+index*.12)]}));
const cues = subjects.map((subject,index)=>({start:0,end:8,speaker:`S${index+1}`,subjectId:subject.id,confidence:.95-index*.02,priority:index===0?'primary':'auto'}));
let track = engine._test.buildTrack([point(0,.5),point(8,.5)], 'hybrid', {}, {}, { subjects, activeSubjectId:'auto', speakerPriority:true, speakerCues:cues, speakerLayout:{gridPaging:'rotate',gridPageSeconds:2,gridPrimaryPosition:'right',gridPrimarySize:.61} });
const first = engine.getFocusAt(track,.5);
const second = engine.getFocusAt(track,2.1);
ok(first.gridPageCount === 2 && first.gridTotalSubjects === 7, 'seven speakers create two rotating pages');
ok(first.gridSubjects.map(item=>item.subjectId).join(',') === 'subject-1,subject-2,subject-3,subject-4', 'first page keeps primary and first three secondary speakers');
ok(second.gridSubjects.map(item=>item.subjectId).join(',') === 'subject-1,subject-5,subject-6,subject-7', 'second page rotates to the remaining secondary speakers');
ok(second.speakerLayout.gridPrimaryPosition === 'right' && second.speakerLayout.gridPrimarySize === .61, 'three-speaker layout preferences persist on grid focus');
track = engine.updateSpeakerLayout(track,{gridPaging:'priority'});
const fixed = engine.getFocusAt(track,5);
ok(fixed.gridPageCount === 1 && fixed.gridSubjects[3].subjectId === 'subject-4', 'priority mode keeps the top four speakers fixed');
const safe = engine._test.safeSpeakerLayout({gridPrimarySize:9,gridPrimaryPosition:'bad',gridPageSeconds:99});
ok(safe.gridPrimarySize === .65 && safe.gridPrimaryPosition === 'top' && safe.gridPageSeconds === 10, 'grid layout preferences are bounded');
console.log('PASS five-plus speakers rotate deterministically while preserving the primary speaker');
