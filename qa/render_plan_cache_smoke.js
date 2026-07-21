#!/usr/bin/env node
'use strict';
const fs=require('fs'),vm=require('vm'); const code=fs.readFileSync('src/render/vertical-renderer.js','utf8');
const window={AIShortsRuntimeConfig:{},AIShortsCoreUtils:{},AIShortsQualityEffects:{}}; vm.runInNewContext(code,{window,console,Map,Set,Object,Array,Number,String,Math,Error,Promise});
const r=window.AIShortsVerticalRenderer; const a=r.prepareRenderPlan({start:0,end:10,captionOptions:{size:999}}); const b=r.prepareRenderPlan({start:0,end:10,captionOptions:{size:999}});
if(a!==b||a.captionOptions.size!==86) throw new Error('render plan cache failed');
for(let i=0;i<40;i++) r.prepareRenderPlan({start:i,end:i+1});
if(r.getRenderPlanCacheStats().size>24) throw new Error('render plan cache bound failed');
r.clearRenderPlanCache(); if(r.getRenderPlanCacheStats().size!==0) throw new Error('render plan cache cleanup failed');
console.log('PASS render plan cache');
