#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');

function ok(condition, message) {
    if (!condition) {
        console.error(`FAIL ${message}`);
        process.exit(1);
    }
    console.log(`PASS ${message}`);
}

const window = {
    window: null,
    AIShortsRuntimeConfig: {
        MAX_CAPTION_TEXT_CHARS: 1000,
        MAX_CAPTION_CUES: 2,
        MAX_PROJECT_TEXT_CHARS: 10000,
        MAX_PROJECT_RECOMMENDATIONS: 8,
        MAX_PROJECT_CAPTIONS: 8,
        MAX_PROJECT_MEDIA_SECONDS: 30
    },
    AIShortsCaptionService: {}
};
window.window = window;
const context = vm.createContext({ window, URL, console });
vm.runInContext(fs.readFileSync(path.join(root, 'src/utils/core-utils.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'src/caption/caption-service.js'), 'utf8'), context);
window.AIShortsCaptionService = window.AIShortsCaptionService;
vm.runInContext(fs.readFileSync(path.join(root, 'src/project/project-service.js'), 'utf8'), context);

const utils = window.AIShortsCoreUtils;
const clamped = utils.normalizeMediaRange(999, 1000, 30, 1);
ok(clamped.start === 29 && clamped.end === 30 && clamped.duration === 1, 'manual range start is clamped below the media ceiling');
const reversed = utils.normalizeMediaRange(20, 10, 30, 1);
ok(reversed.start === 20 && reversed.end === 21, 'reversed manual range is repaired to a positive interval');
const shortMedia = utils.normalizeMediaRange(1, 2, 0.4, 1);
ok(shortMedia.start === 0 && shortMedia.end === 0.4 && shortMedia.duration === 0.4, 'sub-second media remains inside its real duration');

const captionService = window.AIShortsCaptionService;
const srt = [
    '1\n00:00:00,000 --> 00:00:01,000\none',
    '2\n00:00:01,000 --> 00:00:02,000\ntwo',
    '3\n00:00:02,000 --> 00:00:03,000\nthree'
].join('\n\n');
const cues = captionService.parseCaptionText(srt);
ok(cues.length === 2, 'caption parsing stops at the configured cue ceiling');
let oversizedRejected = false;
try { captionService.parseCaptionText('x'.repeat(1001)); } catch (error) { oversizedRejected = /너무 큽니다/.test(error.message); }
ok(oversizedRejected, 'oversized pasted caption text is rejected before parsing');

const project = window.AIShortsProjectService.parseProjectText(JSON.stringify({
    app: 'AI Shorts Studio',
    schemaVersion: 3,
    selectedRecommendationId: 'same',
    recommendations: [
        { id: 'same', start: 0, end: 5, title: 'A' },
        { id: 'same', start: 5, end: 10, title: 'B' },
        { id: 'bad\ncontrol', start: 10, end: 15, title: 'C' }
    ]
}));
const ids = project.recommendations.map(item => item.id);
ok(new Set(ids).size === ids.length, 'imported duplicate candidate IDs are made unique');
ok(ids.every(id => !/[\u0000-\u001f\u007f]/.test(id)), 'candidate IDs drop control characters before entering DOM datasets');

const app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
ok(app.includes('utils.normalizeMediaRange') && app.includes("type: 'caption-text-too-large'"), 'app uses bounded manual ranges and caption input diagnostics');
ok(html.includes('id="captionTextInput"') && html.includes('maxlength="1000000"'), 'caption textarea exposes the input ceiling to the browser');
console.log('PASS v1.5.14 manual range, caption size, and candidate identity guardrails');
