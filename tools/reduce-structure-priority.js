#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const postcss=require('postcss');
const root=path.resolve(__dirname,'..');
const reportPath=path.join(root,'qa','runtime-structure-priority-probe-v1.5.28.json');
const report=JSON.parse(fs.readFileSync(reportPath,'utf8'));
const safe=new Set(report.safe.map(x=>x.id));
const unsafe=new Set(report.unsafe.map(x=>x.id));
const unproven=new Set(report.unproven.map(x=>x.id));
const targetFiles=report.targetFiles;
const removed=[]; const skipped=[]; const missing=[];
function cssNodes(container){return (container.nodes||[]).filter(n=>n.type==='rule'||n.type==='atrule');}
function walk(container, source, prefix=[]){
  const nodes=cssNodes(container);
  nodes.forEach((node,index)=>{
    const rulePath=[...prefix,index];
    if(node.type==='rule'){
      node.walkDecls(decl=>{
        if(!decl.important)return;
        const id=`${source}|${rulePath.join('.')}|${decl.prop}`;
        if(safe.has(id)){
          removed.push({id,file:source,selector:node.selector,prop:decl.prop,value:decl.value,line:decl.source.start.line});
          decl.important=false;
        }else if(unsafe.has(id)||unproven.has(id)){
          skipped.push({id,file:source,selector:node.selector,prop:decl.prop,value:decl.value,reason:unsafe.has(id)?'changed':'unproven'});
        }else{
          missing.push({id,file:source,selector:node.selector,prop:decl.prop,value:decl.value,line:decl.source.start.line});
        }
      });
    }
    if(node.nodes)walk(node,source,rulePath);
  });
}
for(const source of targetFiles){
  const full=path.join(root,source); const ast=postcss.parse(fs.readFileSync(full,'utf8'),{from:full});
  walk(ast,source,[]);
  fs.writeFileSync(full,ast.toString(),'utf8');
}
function countImportant(){
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8'); const names=[...html.matchAll(/assets\/css\/([^?"']+\.css)/g)].map(m=>m[1]); let n=0;
 for(const name of names){const ast=postcss.parse(fs.readFileSync(path.join(root,'assets/css',name),'utf8'));ast.walkDecls(d=>{if(d.important)n++;});} return n;
}
const out={baselineVersion:'1.5.19',targetVersion:'1.5.28',baselineImportant:666,removedCount:removed.length,remainingImportant:countImportant(),files:targetFiles,removed,skippedCount:skipped.length,unmappedSourceDeclarationCount:missing.length,unmappedSourceDeclarations:missing};
const output=path.join(root,'qa','runtime-structure-priority-v1.5.28.json');
let preserved=false;
if(removed.length===0 && fs.existsSync(output)){try{preserved=JSON.parse(fs.readFileSync(output,'utf8')).removedCount>0;}catch(_){preserved=false;}}
if(!preserved)fs.writeFileSync(output,JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({removedCount:removed.length,remainingImportant:out.remainingImportant,skippedCount:skipped.length,unmappedSourceDeclarationCount:missing.length,preservedExistingReport:preserved,byFile:Object.fromEntries([...new Set(removed.map(x=>x.file))].map(f=>[f,removed.filter(x=>x.file===f).length]))},null,2));
