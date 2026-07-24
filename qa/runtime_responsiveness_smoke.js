#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function ok(condition, message) {
    if (!condition) {
        console.error(`FAIL ${message}`);
        process.exit(1);
    }
    console.log(`PASS ${message}`);
}

const html = read('index.html');
const integrity = read('src/ui/flow-integrity.js');
const polish = read('src/ui/flow-polish.js');
const doctor = read('src/ui/flow-doctor.js');
const comfort = read('src/ui/workspace-comfort.js');
const pins = read('src/ui/candidate-pin-board.js');
const director = read('src/ui/flow-director-final.js');
const qualityGate = read('src/ui/flow-quality-gate.js');

ok(html.includes('불러오기 메뉴에서 원본 하나를 선택'), 'mobile guide explains the single import path');
ok(html.includes('aria-label="하단 고정 제작 메뉴바"'), 'bottom navigation has a plain Korean aria label');
ok(!html.includes('Dock에서 원본 선택') && !qualityGate.includes('하단 Dock'), 'visible guidance no longer uses Dock jargon');
ok(integrity.includes('setTextIfChanged(recCount') && !integrity.includes('recCount.textContent ='), 'recommendation count avoids same-value observer writes');
ok(integrity.includes("attributeFilter: ['class', 'disabled', 'aria-disabled']"), 'flow integrity observes only relevant attributes');
ok(polish.includes("let lastSyncSignature = ''") && polish.includes('signature === lastSyncSignature'), 'flow polish skips unchanged state frames');
ok(doctor.includes("let lastTickSignature = ''") && doctor.includes('signature === lastTickSignature'), 'flow doctor skips unchanged state frames');
ok(comfort.includes("observer.observe(list, { childList: true, subtree: true })"), 'workspace candidate observer ignores self-authored attributes');
ok(pins.includes("observer.observe(node, { childList: true, subtree: true, characterData: true })"), 'pin board observer ignores self-authored attributes');
ok(director.includes("document.body.dataset.activeFlowTab !== key"), 'flow director avoids rewriting the active tab with the same value');

console.log('PASS v1.6.1 menu terminology and observer feedback-loop guardrails present');
