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
const listeners = new Map();
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
    addEventListener(type, callback) { listeners.set(type, callback); }
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
api.saveBlob({ size: 1024, type: 'video/webm' }, 'clip-1.webm');
if (!anchors[0] || !anchors[0].clicked) throw new Error('download anchor must be clicked');
if (revoked.length) throw new Error('current object URL must not be revoked synchronously');
if (!timers.length || timers[0].delay < 10000) throw new Error('object URL release must keep a browser-safe delay');
if (api.getObjectUrlStats().active !== 1) throw new Error('active download URL must be tracked');

api.saveBlob({ size: 2048, type: 'video/webm' }, 'clip-2.webm');
if (revoked.length !== 1 || revoked[0] !== 'blob:test-1') throw new Error('a new export must release the superseded download URL');
if (api.getObjectUrlStats().active !== 1) throw new Error('repeated exports must keep at most one active download URL');
if (!anchors[1] || !anchors[1].clicked) throw new Error('replacement download anchor must be clicked');

timers[1].callback();
if (revoked.length !== 2 || revoked[1] !== 'blob:test-2' || api.getObjectUrlStats().active !== 0) throw new Error('scheduled release must revoke the latest URL');

api.saveBlob({ size: 4096, type: 'video/webm' }, 'clip-3.webm');
if (typeof listeners.get('beforeunload') !== 'function' || typeof listeners.get('pagehide') !== 'function') throw new Error('download URLs must have unload lifecycle owners');
listeners.get('beforeunload')();
if (revoked.length !== 3 || revoked[2] !== 'blob:test-3' || api.getObjectUrlStats().active !== 0) throw new Error('beforeunload must release all remaining download URLs');
console.log('PASS delayed, single-active, unload-safe download Object URL lifecycle');
