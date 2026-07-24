#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function fail(message) {
    console.error('FAIL ' + message);
    process.exit(1);
}

const headerMatch = html.match(/<header class="studio-hero">([\s\S]*?)<\/header>/);
if (!headerMatch) fail('studio hero header missing');
const header = headerMatch[1];
const dialogMatch = html.match(/<div id="infoDialog"[\s\S]*?<\/div>\s*<\/div>/);
if (!dialogMatch) fail('program info dialog missing');
const dialog = dialogMatch[0];

if (!header.includes('원본의 빛나는 순간을 찾아 추천하고') || !header.includes('세로 쇼츠로 완성')) {
    fail('top header should show a short product introduction');
}
if (!header.includes('class="signature-label">DESIGNED BY</span><strong>곰같은여우</strong>')) {
    fail('brand signature should remain in the header');
}
if (header.includes('패치') || header.includes('Modular Engine') || header.includes('HyperFlow') || header.includes('바로 분석')) {
    fail('top header should not show patch labels, engine labels, HyperFlow jargon, or analysis button');
}
if (!html.includes('<title>AI 쇼츠 제작 스튜디오 v1.6.2</title>')) {
    fail('document title should be clean and version-only');
}
if (!html.includes('>v1.6.2</button>')) {
    fail('version badge should show only the version number');
}
if (dialog.includes('패치') || dialog.includes('HyperFlow') || dialog.includes('Modular Engine')) {
    fail('program info dialog should not contain patch or internal engine jargon');
}
if (!dialog.includes('긴 음악이나 영상을 열면') || !dialog.includes('Design by 곰같은여우')) {
    fail('program info dialog should explain the product simply and include the brand credit');
}
console.log('PASS clean program introduction and version info guardrails present');
