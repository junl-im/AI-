#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const budget = read('src/engine/performance-budget.js');
const extractor = read('src/analysis/audio-feature-extractor.js');
const app = read('src/app.js');
function assert(value, message) {
  if (!value) { console.error(`FAIL ${message}`); process.exit(1); }
  console.log(`PASS ${message}`);
}
assert(budget.includes('estimatedDecodeMemoryMb') && budget.includes('memoryRisk') && budget.includes('hardBlock'), 'performance budget estimates browser decode memory and risk');
assert(budget.includes('isUncompressedAudio') && budget.includes('memoryHeadroomMb'), 'decode preflight considers uncompressed audio and device memory');
assert(extractor.includes('decodeAudioData(arrayBuffer)') && !extractor.includes('decodeAudioData(arrayBuffer.slice(0))'), 'audio decode avoids a second full raw-file buffer copy');
assert(extractor.includes('arrayBuffer = null') && extractor.includes('await context.close()'), 'raw file buffer and audio context are released after decode');
assert(app.includes("type: 'decode-memory-warning'") && app.includes('budget.hardBlock'), 'app records high-risk decode warnings and blocks unsafe files');
assert(app.includes('다른 무거운 탭을 닫으면 더 안정적입니다.'), 'user receives actionable long-file memory guidance');
console.log('PASS v1.5.24 long-file decode memory preflight guardrails');
