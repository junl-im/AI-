#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');

function assert(condition, message) {
    if (!condition) { console.error(`FAIL ${message}`); process.exit(1); }
    console.log(`PASS ${message}`);
}

const window = {
    AIShortsRuntimeConfig: { EXPORT_WIDTH: 1080, EXPORT_HEIGHT: 1920 },
    AIShortsCoreUtils: {},
    AIShortsQualityEffects: {}
};
window.window = window;
const context = vm.createContext({ window, console, Map, WeakMap, Set, Object, Array, Math, Number, String, Error, Promise, setTimeout, clearTimeout });
vm.runInContext(fs.readFileSync(path.join(root, 'src/render/vertical-renderer.js'), 'utf8'), context);
const renderer = window.AIShortsVerticalRenderer;

function makeContext() {
    const calls = [];
    return {
        calls,
        save() {}, restore() {},
        drawImage(...args) { calls.push(args); },
        createLinearGradient() { return { addColorStop() {} }; },
        fillRect() {}, measureText() { return { width: 0 }; }
    };
}

const source = { videoWidth: 1920, videoHeight: 1080 };
const beforeEngine = makeContext();
renderer.drawCoverImage(beforeEngine, source, 1080, 1920, 'smart', null, { track: { id: 'late-track' }, time: 2 });
assert(beforeEngine.calls.length === 1 && beforeEngine.calls[0].length === 9, 'smart mode safely falls back to centered cover before lazy engine hydration');

let requestedTime = -1;
window.AIShortsSmartReframe = {
    getFocusAt(track, time) { requestedTime = time; return { x: 0.78, y: 0.42, confidence: 0.9, source: 'face' }; },
    resolveCropRect() { return { sx: 1220, sy: 30, sw: 607.5, sh: 1080 }; }
};
const afterEngine = makeContext();
renderer.drawCoverImage(afterEngine, source, 1080, 1920, 'smart', null, {
    track: { id: 'late-track' },
    time: 2.5,
    captionOptions: { position: 'lower' },
    options: { captionAvoidance: true }
});
const args = afterEngine.calls[0];
assert(requestedTime === 2.5, 'renderer resolves subject position at the current media timestamp');
assert(args[1] === 1220 && args[2] === 30 && args[3] === 607.5 && args[4] === 1080, 'renderer uses the smart-reframe source rectangle after lazy hydration');
assert(args[5] === 0 && args[6] === 0 && args[7] === 1080 && args[8] === 1920, 'smart crop fills the vertical export canvas');

console.log('PASS smart reframe render smoke complete');
