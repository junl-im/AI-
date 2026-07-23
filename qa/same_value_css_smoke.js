#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const pkg = require('../package.json');
const root = path.resolve(__dirname, '..');
const report = JSON.parse(fs.readFileSync(path.join(root, 'qa', `runtime-css-ownership-v${pkg.version}.json`), 'utf8'));

function assert(condition, message) {
    if (!condition) throw new Error(message);
    console.log(`PASS ${message}`);
}

assert(pkg.version === '1.5.24', 'same-value CSS cleanup release version is v1.5.24');
assert(report.version === pkg.version, 'same-value CSS report matches the release');
assert(report.sameValueDuplicateCount === 0, 'cross-file same-value selector-property duplicates remain at zero');
assert(report.sharedPropertyCount === 0, 'cross-file shared selector-property declarations remain at zero');
assert(Array.isArray(report.sameValueDuplicates) && report.sameValueDuplicates.length === 0, 'same-value duplicate inventory is empty');
assert(report.conflictingPropertyCount === 0 && report.shadowedDeclarationCount === 0, 'zero-conflict cascade remains intact');
assert(report.importantCount <= 801, 'important declaration ceiling is reduced to 801');
assert(fs.existsSync(path.join(root, 'tools', 'consolidate-same-value-css.js')), 'reproducible same-value consolidation tool is included');
console.log('PASS v1.5.24 duplicate-free CSS declaration ownership guardrails');
