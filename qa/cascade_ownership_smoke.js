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

assert(pkg.version === '1.6.9', 'cascade ownership release version is v1.6.9');
assert(report.version === pkg.version, 'CSS ownership report matches the release');
assert(report.conflictingPropertyCount === 0, 'selector-property conflicts remain at zero');
assert(report.highRiskConflictCount === 0, 'high-risk CSS conflicts remain at zero');
assert(report.shadowedDeclarationCount === 0, 'shadowed CSS declarations remain at zero');
assert(Array.isArray(report.propertyConflicts) && report.propertyConflicts.length === 0, 'full conflict inventory is empty');
assert(Object.keys(report.conflictCategoryCounts || {}).length === 0, 'conflict category inventory is empty');
assert(report.importantCount <= 593, 'important declaration ceiling is preserved');
console.log('PASS v1.6.9 zero-conflict geometry, token, and fallback ownership guardrails');
