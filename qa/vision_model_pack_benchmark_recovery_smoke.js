'use strict';
const fs=require('fs'); const code=fs.readFileSync('src/vision/vision-model-pack-manager.js','utf8');
if(!code.includes('function armBenchmarkRecovery')) throw new Error('recovery hook missing');
if(!code.includes("addEventListener('visibilitychange'")) throw new Error('visibility recovery missing');
if(!code.includes("addEventListener('focus'")) throw new Error('focus recovery missing');
if(!code.includes("type: 'benchmark-refresh-recovered'")) throw new Error('recovery diagnostic missing');
console.log('vision model benchmark recovery smoke passed');
