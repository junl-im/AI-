#!/usr/bin/env node
'use strict';
const fs=require('fs'); const path=require('path');
const root=path.resolve(__dirname,'..'); const version=require(path.join(root,'package.json')).version; const file=path.join(root,'qa',`runtime-speaker-page-timing-v${version}.json`);
if(!fs.existsSync(file)) throw new Error(`missing browser audit: ${path.basename(file)}`);
const report=JSON.parse(fs.readFileSync(file,'utf8'));
if(!report.passed||Object.values(report.checks||{}).some(value=>value!==true)) throw new Error('speaker page timing browser audit failed');
console.log(`PASS speaker page timing browser audit v${version}`);
