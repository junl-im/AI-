#!/usr/bin/env node
'use strict';
const fs=require('fs'); const path=require('path'); const root=path.resolve(__dirname,'..'); const version=require(path.join(root,'package.json')).version;
const file=path.join(root,'qa',`runtime-vision-model-pack-performance-v${version}.json`);
function ok(v,m){if(!v)throw new Error(m);console.log(`PASS ${m}`)}
ok(fs.existsSync(file),'model-pack performance browser audit exists'); const r=JSON.parse(fs.readFileSync(file,'utf8'));
ok(r.version===version && r.passed===true,'model-pack performance browser audit matches the release and passed');
ok(Object.values(r.checks||{}).every(Boolean),'benchmark, recommendation, automatic rollback, manual rollback, and privacy checks pass');
ok((r.externalRequests||[]).length===0 && (r.pageErrors||[]).length===0 && (r.consoleErrors||[]).length===0,'performance audit has no external requests or browser errors');
console.log(`PASS v${version} model-pack performance and rollback browser contract`);
