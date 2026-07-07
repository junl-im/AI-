#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const files = [];
function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.isFile() && entry.name.endsWith('.js')) files.push(full);
    }
}
walk(path.join(root, 'src'));
let failed = false;
for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    const names = new Map();
    const regex = /function\s+([A-Za-z0-9_$]+)\s*\(/g;
    let match;
    while ((match = regex.exec(text))) {
        const count = names.get(match[1]) || 0;
        names.set(match[1], count + 1);
    }
    const dupes = Array.from(names.entries()).filter(([, count]) => count > 1);
    if (dupes.length) {
        failed = true;
        console.error(`FAIL duplicate function declarations in ${path.relative(root, file)}: ${dupes.map(([name]) => name).join(', ')}`);
    }
}
if (failed) process.exit(1);
console.log('PASS no duplicate function declarations');
