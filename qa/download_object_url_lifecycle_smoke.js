#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/download/download-service.js'), 'utf8');
const timers = [];
const revoked = [];
const anchors = [];
let sequence = 0;
const document = {
    body: { appendChild(node) { anchors.push(node); } },
    createElement(tag) {
        if (tag !== 'a') throw new Error('unexpected element');
        return { href: '', download: '', rel: '', clicked: false, click() { this.clicked = true; }, remove() {} };
    }
};
const window = {
    AIShortsRuntimeConfig: { DOWNLOAD_URL_REVOKE_DELAY_MS: 45000, MAX_ACTIVE_DOWNLOAD_URLS: 12, MIN_DOWNLOAD_URL_AGE_MS: 10000 },
    AIShortsCoreUtils: {},
    AIShortsAppState: { state: { diagnostics: [] }, addDiagnostic() {} },
    URL: { createObjectURL() { return `blob:test-${++sequence}`; }, revokeObjectURL(url) { revoked.push(url); } },
    setTimeout(callback, delay) { timers.push({ callback, delay }); return timers.length; },
    clearTimeout() {},
    addEventListener() {}
};
const context = vm.createContext({
    window,
    document,
    navigator: { userAgent: 'qa', language: 'ko', platform: 'test' },
    matchMedia() { return { matches: false }; },
    HTMLCanvasElement: function HTMLCanvasElement() {},
    HTMLMediaElement: function HTMLMediaElement() {},
    File: function File() {},
    Date,
    Math,
    Object,
    console
});
context.HTMLCanvasElement.prototype = {};
context.HTMLMediaElement.prototype = {};
vm.runInContext(source, context, { filename: 'download-service.js' });
const api = window.AIShortsDownloadService;
api.saveBlob({ size: 1024, type: 'video/webm' }, 'clip.webm');
if (!anchors[0] || !anchors[0].clicked) throw new Error('download anchor must be clicked');
if (revoked.length) throw new Error('object URL must not be revoked synchronously');
if (!timers.length || timers[0].delay < 10000) throw new Error('object URL release must not use the previous 1 second timeout');
if (api.getObjectUrlStats().active !== 1) throw new Error('active download URL must be tracked');
timers[0].callback();
if (revoked.length !== 1 || api.getObjectUrlStats().active !== 0) throw new Error('scheduled release must revoke and remove the URL');
console.log('PASS delayed bounded download object URL lifecycle');
