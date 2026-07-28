'use strict';
const fs = require('fs'); const vm = require('vm');
const code = fs.readFileSync('src/app/analysis-controller.js','utf8');
const saved=[]; const nodes={};
function el(){ return {hidden:false,disabled:false,textContent:'',value:'',dataset:{},append(){},appendChild(){},setAttribute(){}}; }
const document={createElement:()=>el(),dispatchEvent(){}};
const history=[{id:'timing-a',mediaKey:'media-aaaaaaaa',status:'completed',source:'manual',completedAt:new Date().toISOString(),totalMs:100,stages:[]},{id:'timing-b',mediaKey:'media-bbbbbbbb',status:'failed',source:'manual',completedAt:new Date().toISOString(),totalMs:200,stages:[]}];
const storage={getItem:k=>k.includes('history-policy')?JSON.stringify({retentionDays:90,maxItems:12}):JSON.stringify({schema:'ai-shorts-analysis-timing-history',schemaVersion:2,history}),setItem(){}};
const window={document,localStorage:storage,Blob:global.Blob,CustomEvent:function(){},AIShortsRuntimeConfig:{APP_VERSION:'v1.6.25'},AIShortsDownloadService:{saveBlob:(b,n)=>saved.push({b,n})}}; window.window=window;
vm.runInNewContext(code,{window,console,Date,Math,Object,Array,Set,JSON,Promise,AbortController,performance:{now:()=>0}});
const c=window.AIShortsAnalysisController.createAnalysisController({config:window.AIShortsRuntimeConfig,state:{},store:{},elements:nodes,downloadService:window.AIShortsDownloadService,operationCoordinator:{},engineKernel:{},getActiveMediaElement(){return null;},activateFlowTab(){},updateButtons(){},setProgress(){},toast(){},ensureMotionSmartReframe(){},getAutoCutOptions(){},buildAutoCutTimeline(){},createRecommendations(){},createFallbackAudioAnalysis(){},beginOperation(){},assertOperation(){},finishOperation(){},isAbortError(){}});
const first=c.getTimingHistory()[0]; if(!first) throw new Error('history missing');
if(c.setTimingHistorySelection(first.id,true)!==1) throw new Error('selection failed');
const r=c.exportSelectedTimingHistory(); if(!r.saved||r.historyCount!==1||!saved.length) throw new Error('selected export failed');
console.log('analysis timing selected export smoke passed');
