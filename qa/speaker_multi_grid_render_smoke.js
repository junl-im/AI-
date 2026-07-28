#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
function ok(value, message) { if (!value) throw new Error(message); }
const draws=[];
const context2d={save(){},restore(){},beginPath(){},rect(){},clip(){},fillRect(){},drawImage(...args){draws.push(args)},createLinearGradient(){return{addColorStop(){}}},measureText(){return{width:10}},set filter(v){this._f=v},get filter(){return this._f||''},set fillStyle(v){this._s=v},get fillStyle(){return this._s}};
const subjects=[.15,.4,.65,.85].map((x,index)=>({x,y:.4,confidence:.9-index*.03,subjectId:`subject-${index+1}`}));
const window={window:null,AIShortsRuntimeConfig:{},AIShortsQualityEffects:{getCanvasFilter(){return''}},AIShortsSmartReframe:{getFocusAt(){return{source:'speaker-grid-face',gridSubjects:subjects}},resolveCropRect(_sw,_sh,_tw,_th,subject){return{sx:subject.x*1000,sy:0,sw:700,sh:900}}}}; window.window=window;
vm.runInContext(fs.readFileSync(path.join(root,'src/render/vertical-renderer.js'),'utf8'),vm.createContext({window,Object,Array,Map,WeakMap,Math,Number,String,Error,Promise,console,setTimeout,clearTimeout,setInterval,clearInterval,requestAnimationFrame(){}}));
window.AIShortsVerticalRenderer.drawCoverImage(context2d,{videoWidth:1920,videoHeight:1080},1080,1920,'smart',null,{track:{},time:2,options:{}});
ok(draws.length===5,'grid composition draws one background and four independent speaker panes');
ok(draws.slice(1).every(args=>Number(args[7])>0&&Number(args[8])>0),'every grid pane receives a positive output rectangle');
console.log('PASS vertical renderer composes four simultaneous speakers into a 2x2 grid');
