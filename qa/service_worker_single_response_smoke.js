#!/usr/bin/env node
'use strict';
const fs = require('fs');
const source = fs.readFileSync('sw.js', 'utf8');
const branch = source.match(/if \(isNavigationRequest\(request\)\) \{([\s\S]*?)\n    \}/);
if (!branch) throw new Error('navigation request branch is missing');
const respondCalls = (branch[1].match(/event\.respondWith/g) || []).length;
if (respondCalls !== 1) throw new Error(`navigation branch calls respondWith ${respondCalls} times`);
if (!branch[1].includes('return;')) throw new Error('navigation branch does not stop fall-through');
console.log('PASS v1.5.24 service worker navigation has one response owner');
