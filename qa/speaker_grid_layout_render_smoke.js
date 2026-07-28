#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
function ok(value, message) { if (!value) throw new Error(message); }
const draws=[];
const context2d={save(){},restore(){},beginPath(){},rect(){},clip(){},fillRect(){},drawImage(...args){draws.push(args)},createLinearGradient(){return{addColorStop(){}}},measureText(){return{width:10}},set filter(v){this._f=v},get filter(){return this._f||''},set fillStyle(v){this._s=v},get fillStyle(){return this._s}};
const subjects=[.2,.5,.8].map((x,index)=>({x,y:.4,zoom:1,confidence:.9-index*.03,subjectId:`subject-${index+1}`}));
const window={window:null,AIShortsRuntimeConfig:{},AIShortsQualityEffects:{getCanvasFilter(){return''}},AIShortsSmartReframe:{getFocusAt(){return{source:'speaker-grid-face',gridSubjects:subjects,speakerLayout:{gridPrimaryPosition:'right',gridPrimarySize:.6}}},resolveCropRect(_sw,_sh,_tw,_th,subject){return{sx:subject.x*1000,sy:0,sw:700,sh:900}}}}; window.window=window;
vm.runInContext(fs.readFileSync(path.join(root,'src/render/vertical-renderer.js'),'utf8'),vm.createContext({window,Object,Array,Map,WeakMap,Math,Number,String,Error,Promise,console,setTimeout,clearTimeout,setInterval,clearInterval,requestAnimationFrame(){}}));
window.AIShortsVerticalRenderer.drawCoverImage(context2d,{videoWidth:1920,videoHeight:1080},1080,1920,'smart',null,{track:{},time:2,options:{}});
const panes=draws.slice(1);
ok(panes.length===3,'three-speaker layout draws three independent panes after the background');
const primary=panes[0], secondaryA=panes[1], secondaryB=panes[2];
ok(Number(primary[5]) > Number(secondaryA[5]), 'right-side primary pane starts after the secondary column');
ok(Number(primary[7]) > Number(secondaryA[7]), 'primary pane is wider than the secondary column at sixty percent');
ok(Number(secondaryA[5]) === Number(secondaryB[5]) && Number(secondaryB[6]) > Number(secondaryA[6]), 'secondary speakers stack vertically on the opposite side');
console.log('PASS three-speaker renderer honors primary side and size preferences');
