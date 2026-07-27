#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const required = ['README.md', 'HANDOFF.md', 'PROJECT_NOTES.md', 'CHANGELOG.md', 'AUDIT_REPORT.md', 'DELIVERY_RULES.md', 'qa/QA_REPORT.md'];
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
const delivery = fs.readFileSync(path.join(root, 'DELIVERY_RULES.md'), 'utf8');
if (!delivery.includes('## 1. 작업한 내역') || !delivery.includes('## 2. 다운로드 파일') || !delivery.includes('## 3. 다음 예정 내역') || !delivery.includes('통파일 ZIP') || !delivery.includes('붙여넣기 패치 ZIP')) {
    console.error('FAIL DELIVERY_RULES lacks the required final response contract');
    process.exit(1);
}
console.log('PASS docs handoff smoke');
