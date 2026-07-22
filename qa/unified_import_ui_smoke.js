#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
function assert(condition, message) {
    if (!condition) throw new Error(message);
    console.log('PASS ' + message);
}

const html = read('index.html');
const controller = read('src/ui/studio-experience-controller.js');
const workspaceCss = read('assets/css/workspace-layout-controls.css');
const heroCss = read('assets/css/hero-command-deck.css');

assert((html.match(/id="fileInput"/g) || []).length === 1, 'one primary media input exists');
assert(/<label id="fileDrop"[^>]+data-import-owner="primary"[\s\S]*?<input type="file" id="fileInput"/.test(html), 'primary media input belongs to the original import card');
assert(/<button id="heroWorkspaceStartBtn"[^>]+aria-controls="fileDrop"/.test(html), 'hero CTA navigates to the primary import card');
assert(/<button id="bottomFileBtn"[^>]+aria-controls="fileDrop"/.test(html), 'dock import tab navigates to the primary import card');
assert(!/<label[^>]+(?:id="heroWorkspaceStartBtn"|id="bottomFileBtn")[^>]+for="fileInput"/.test(html), 'hero and dock never own direct picker labels');
assert(!html.includes('id="mobileActionBar"') && !html.includes('id="mobileAnalyzeBtn"'), 'retired duplicate mobile action bar is absent');
assert(html.includes('class="project-copy-hub"') && html.includes('작업 상태 JSON · 원본 미포함'), 'project JSON and copy tools form one clearly separated utility hub');
assert(workspaceCss.includes('grid-area: utility') && workspaceCss.includes('grid-template-areas: "project copy"'), 'desktop project and copy cards share an aligned utility grid');
assert(heroCss.includes('.hero-launch-layout') && heroCss.includes('.command-deck-kicker') && heroCss.includes('.hero-start-meta'), 'hero launch card uses the redesigned visual hierarchy');
assert(controller.includes('function focusImportPanel') && controller.includes("focusImportPanel('hero')") && !controller.includes('fileInput.click()'), 'all navigation entries converge on the import card without direct picker duplication');
assert(html.includes('자막 SRT/VTT 불러오기') && html.includes('작업 JSON 불러오기'), 'non-media file inputs are explicitly labeled by purpose');
console.log('PASS v1.5.17 unified media import and desktop utility hub guardrails');
