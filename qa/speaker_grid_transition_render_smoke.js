#!/usr/bin/env node
'use strict';
const fs=require('fs'); const path=require('path'); const vm=require('vm');
const root=path.resolve(__dirname,'..'); function ok(v,m){if(!v)throw new Error(m)}
function run(transition){
 const draws=[]; const alphas=[];
 const ctx={save(){},restore(){},beginPath(){},rect(){},clip(){},fillRect(){},drawImage(...args){draws.push(args);alphas.push(this.globalAlpha==null?1:this.globalAlpha)},createLinearGradient(){return{addColorStop(){}}},measureText(){return{width:10}},set filter(v){this._f=v},get filter(){return this._f||''},set fillStyle(v){this._s=v},get fillStyle(){return this._s},globalAlpha:1};
 const current=[.12,.35,.62,.85].map((x,i)=>({x,y:.42,confidence:.9,subjectId:`subject-${i+1}`}));
 const previous=[.12,.22,.48,.72].map((x,i)=>({x,y:.42,confidence:.9,subjectId:`subject-${i+1}`}));
 const window={window:null,AIShortsRuntimeConfig:{},AIShortsQualityEffects:{getCanvasFilter(){return''}},AIShortsSmartReframe:{getFocusAt(){return{source:'speaker-grid-face',gridSubjects:current,gridPreviousSubjects:previous,gridTransitionProgress:.4,speakerLayout:{gridTransition:transition}}},resolveCropRect(_sw,_sh,_tw,_th,subject){return{sx:subject.x*1000,sy:0,sw:700,sh:900}}}}; window.window=window;
 vm.runInContext(fs.readFileSync(path.join(root,'src/render/vertical-renderer.js'),'utf8'),vm.createContext({window,Object,Array,Map,WeakMap,Math,Number,String,Error,Promise,console,setTimeout,clearTimeout,setInterval,clearInterval,requestAnimationFrame(){}}));
 window.AIShortsVerticalRenderer.drawCoverImage(ctx,{videoWidth:1920,videoHeight:1080},1080,1920,'smart',null,{track:{},time:2,options:{}});
 return {draws,alphas};
}
const fade=run('fade'); const slide=run('slide');
ok(fade.draws.length===9&&fade.alphas.some(value=>value<1),'fade transition draws previous and current four-person pages with alpha blending');
ok(slide.draws.length===9&&slide.draws.slice(1).some(args=>Number(args[5])<0||Number(args[5])>0),'slide transition renders both pages with horizontal offsets');
console.log('PASS grid renderer supports fade and slide page transitions');
