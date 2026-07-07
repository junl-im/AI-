#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const required = ['README.md', 'HANDOFF.md', 'PROJECT_NOTES.md', 'CHANGELOG.md', 'qa/QA_REPORT.md'];
const missing = required.filter(file => !fs.existsSync(path.join(root, file)));
if (missing.length) {
    console.error('FAIL missing docs: ' + missing.join(', '));
    process.exit(1);
}
const handoff = fs.readFileSync(path.join(root, 'HANDOFF.md'), 'utf8');
if (!handoff.includes('검수 순서') || !handoff.includes('알려진 제한')) {
    console.error('FAIL HANDOFF lacks QA/known limitation sections');
    process.exit(1);
}
console.log('PASS docs handoff smoke');
