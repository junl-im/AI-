#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const version = require('../package.json').version;
const root = path.resolve(__dirname, '..');
const cssDir = path.join(root, 'assets', 'css');
const files = fs.readdirSync(cssDir).filter(name => name.endsWith('.css')).sort();
const owners = new Map();
let importantCount = 0;
for (const file of files) {
    const source = fs.readFileSync(path.join(cssDir, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    importantCount += (source.match(/!important/g) || []).length;
    for (const match of source.matchAll(/([^{}]+)\{/g)) {
        const raw = match[1].replace(/\s+/g, ' ').trim();
        if (!raw || raw.startsWith('@') || raw === '0%' || raw === '100%') continue;
        raw.split(',').map(item => item.trim()).filter(Boolean).forEach(selector => {
            if (!owners.has(selector)) owners.set(selector, new Set());
            owners.get(selector).add(file);
        });
    }
}
const conflicts = Array.from(owners, ([selector, set]) => ({ selector, owners: Array.from(set).sort(), ownerCount: set.size }))
    .filter(item => item.ownerCount > 1)
    .sort((a, b) => b.ownerCount - a.ownerCount || a.selector.localeCompare(b.selector));
const report = {
    version,
    generatedAt: new Date().toISOString(),
    cssFiles: files.length,
    importantCount,
    duplicateSelectorCount: conflicts.length,
    highConflictSelectorCount: conflicts.filter(item => item.ownerCount >= 5).length,
    topConflicts: conflicts.slice(0, 30)
};
fs.writeFileSync(path.join(__dirname, `runtime-css-ownership-v${version}.json`), JSON.stringify(report, null, 2) + '\n');
console.log(`PASS CSS ownership audit: ${files.length} files, ${conflicts.length} shared selectors, ${importantCount} !important declarations`);
