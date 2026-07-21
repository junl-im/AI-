#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const pkg = require(path.join(root, 'package.json'));
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const engine = fs.readFileSync(path.join(root, 'src/engine/engine-boost-profile.js'), 'utf8');
function ok(condition, message) {
  if (!condition) {
    console.error('FAIL:', message);
    process.exit(1);
  }
}
const version = pkg.version;
ok(html.includes(`src/engine/engine-boost-profile.js?v=${version}-media-engine`), 'engine boost profile script linked');
ok(sw.includes(`./src/engine/engine-boost-profile.js?v=${version}-media-engine`), 'engine boost profile script cached');
ok(engine.includes('AIShortsEngineBoostProfile'), 'engine boost profile exports API');
ok(engine.includes('MAX-STABLE'), 'engine boost profile includes MAX-STABLE mode');
ok(engine.includes('recommendedParallelism'), 'engine boost profile computes parallelism');
ok(engine.includes('maxMotionSamples'), 'engine boost profile computes motion sample budget');
ok(engine.includes('renderQueueLimit'), 'engine boost profile computes render queue limit');
console.log('PASS engine boost profile is wired');
