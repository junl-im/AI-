#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
function ok(value, message) { if (!value) throw new Error(message); }
const window = { window: null, AIShortsRuntimeConfig: {} };
window.window = window;
vm.runInContext(
    fs.readFileSync(path.join(root, 'src/vision/smart-reframe-engine.js'), 'utf8'),
    vm.createContext({ window, Object, Array, Map, Set, Math, Number, String, RegExp, Error, Promise, Date, console })
);
const test = window.AIShortsSmartReframe._test;
const pages = [
    ['subject-1', 'subject-2', 'subject-3'],
    ['subject-1', 'subject-4', 'subject-5'],
    ['subject-1', 'subject-6', 'subject-7'],
    ['subject-1', 'subject-8', 'subject-9']
];
const recovered = test.safeGridManualPageSeconds([NaN, 'broken', '', null], pages, 4);
ok(recovered.join(',') === '4,4,4,4', 'invalid and empty page durations recover to the global page duration');
const bounded = test.safeGridManualPageSeconds([0.2, 99], pages.slice(0, 2), 4);
ok(bounded.join(',') === '1,10', 'finite page durations remain bounded to one through ten seconds');
const shortLayout = { gridTransition: 'fade', gridTransitionMs: 1200, gridTransitionEasing: 'linear', gridPageSeconds: 1 };
ok(test.transitionWindowSeconds(shortLayout, 1) === 0.5, 'transition window is capped to half of a short page');
ok(test.transitionProgress(0.6, shortLayout, 1) === 1, 'short pages reach a stable non-transition frame before the next page');
const longLayout = { gridTransition: 'fade', gridTransitionMs: 1200, gridTransitionEasing: 'linear', gridPageSeconds: 5 };
ok(test.transitionWindowSeconds(longLayout, 5) === 1.2, 'long pages preserve the requested transition duration');
ok(test.transitionProgress(0.6, { ...shortLayout, gridTransition: 'none' }, 1) === 1, 'disabled transitions remain fully settled');
console.log('PASS resilient manual page durations and bounded transition windows');
