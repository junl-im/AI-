#!/usr/bin/env node
'use strict';
const fs=require('fs'), vm=require('vm');
const code=fs.readFileSync('src/app/project-io-controller.js','utf8');
const saved=[]; const diagnostics=[];
class BlobMock { constructor(parts, options){ this.parts=parts; this.type=options.type; } }
const window={}; vm.runInNewContext(code,{window,Blob:BlobMock,FileReader:function(){}});
const state={file:{name:'clip.mp4'},recommendations:[{id:'a'}],captions:[]};
const controller=window.AIShortsProjectIOController.createProjectIOController({state,projectService:{createProjectSnapshot:()=>({ok:true}),applyProjectSnapshot:(s,p)=>{s.recommendations=p.recommendations||[];}},downloadService:{saveBlob:(b,n)=>saved.push(n)},utils:{safeFileBaseName:()=> 'clip'},store:{addDiagnostic:d=>diagnostics.push(d)},elements:{titleInput:{value:'t'},hashtagInput:{value:'#x'}},toast:()=>{}});
if(!controller.saveProject()||saved[0]!=='clip-project.json') throw new Error('project export ownership failed');
controller.applyProject({recommendations:[{id:'b'}],copy:{}},'p.json');
if(state.recommendations[0].id!=='b'||!diagnostics.some(d=>d.type==='project-import')) throw new Error('project import apply failed');
console.log('PASS project io controller');
