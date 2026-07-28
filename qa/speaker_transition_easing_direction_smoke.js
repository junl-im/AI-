#!/usr/bin/env node
'use strict';
const fs=require('fs'); const path=require('path'); const vm=require('vm');
const root=path.resolve(__dirname,'..'); function ok(v,m){if(!v)throw new Error(m)}
const engineWindow={window:null,AIShortsRuntimeConfig:{}}; engineWindow.window=engineWindow;
vm.runInContext(fs.readFileSync(path.join(root,'src/vision/smart-reframe-engine.js'),'utf8'),vm.createContext({window:engineWindow,Object,Array,Map,Set,Math,Number,String,RegExp,Error,Promise,Date,console}));
const ease=engineWindow.AIShortsSmartReframe._test.easeTransitionProgress;
ok(ease(.25,'ease-in')<.25,'ease-in starts slower than linear');
ok(ease(.25,'ease-out')>.25,'ease-out starts faster than linear');
ok(Math.abs(ease(.5,'ease-in-out')-.5)<.0001,'ease-in-out keeps midpoint');
function render(direction){
 const draws=[]; const ctx={save(){},restore(){},beginPath(){},rect(){},clip(){},fillRect(){},drawImage(...args){draws.push(args)},createLinearGradient(){return{addColorStop(){}}},measureText(){return{width:10}},set filter(v){this._f=v},get filter(){return this._f||''},set fillStyle(v){this._s=v},globalAlpha:1};
 const current=[.12,.35,.62,.85].map((x,i)=>({x,y:.42,confidence:.9,subjectId:`subject-${i+1}`}));
 const previous=[.12,.22,.48,.72].map((x,i)=>({x,y:.42,confidence:.9,subjectId:`subject-${i+1}`}));
 const window={window:null,AIShortsRuntimeConfig:{},AIShortsQualityEffects:{getCanvasFilter(){return''}},AIShortsSmartReframe:{getFocusAt(){return{source:'speaker-grid-face',gridSubjects:current,gridPreviousSubjects:previous,gridTransitionProgress:.4,speakerLayout:{gridTransition:'slide',gridSlideDirection:direction}}},resolveCropRect(){return{sx:0,sy:0,sw:700,sh:900}}}}; window.window=window;
 vm.runInContext(fs.readFileSync(path.join(root,'src/render/vertical-renderer.js'),'utf8'),vm.createContext({window,Object,Array,Map,WeakMap,Math,Number,String,Error,Promise,console,setTimeout,clearTimeout,setInterval,clearInterval,requestAnimationFrame(){}}));
 window.AIShortsVerticalRenderer.drawCoverImage(ctx,{videoWidth:1920,videoHeight:1080},1080,1920,'smart',null,{track:{},time:2,options:{}});
 return draws.slice(1).map(args=>({x:Number(args[5]),y:Number(args[6])}));
}
const down=render('down'); const right=render('right');
ok(down.some(item=>item.y!==0),'vertical slide direction changes destination Y');
ok(right.some(item=>item.x!==0),'horizontal slide direction changes destination X');
console.log('PASS transition easing and directional slide rendering');
