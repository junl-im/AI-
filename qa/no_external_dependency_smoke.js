#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const forbidden = [/https?:\/\//i, /cdn\./i, /unpkg/i, /jsdelivr/i];
const hit = forbidden.find(regex => regex.test(html));
if (hit) {
    console.error(`FAIL external dependency detected by ${hit}`);
    process.exit(1);
}
console.log('PASS no external dependency in index.html');
