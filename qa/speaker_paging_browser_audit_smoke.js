#!/usr/bin/env node
'use strict';
const fs=require('fs'); const path=require('path'); const root=path.resolve(__dirname,'..');
const version=require(path.join(root,'package.json')).version; const file=path.join(root,'qa',`runtime-speaker-paging-v${version}.json`);
function ok(v,m){if(!v)throw new Error(m)}
ok(fs.existsSync(file),'current-version speaker paging browser evidence exists');
const report=JSON.parse(fs.readFileSync(file,'utf8'));
ok(report.version===version&&report.passed===true,'speaker paging browser audit passed for current version');
['energyImmediateSelection','manualPageOrder','slideTransitionState','bulkGridCropApplied','noRuntimeErrors'].forEach(key=>ok(report.checks&&report.checks[key]===true,`${key} passed`));
console.log('PASS current-version energy/manual paging and bulk grid crop browser evidence');
