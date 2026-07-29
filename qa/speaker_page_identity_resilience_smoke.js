#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
function ok(value, message) { if (!value) throw new Error(message); console.log(`PASS ${message}`); }
const window = { window: null, AIShortsRuntimeConfig: {} };
window.window = window;
vm.runInContext(
    fs.readFileSync(path.join(root, 'src/vision/smart-reframe-engine.js'), 'utf8'),
    vm.createContext({ window, Object, Array, Map, Set, Math, Number, String, RegExp, Error, Promise, Date, console })
);
const align = window.AIShortsSmartReframe._test.alignGridManualPageSeconds;
const first = ['subject-1', 'subject-2', 'subject-3'];
const second = ['subject-1', 'subject-3', 'subject-2'];
const third = ['subject-1', 'subject-4'];
const duplicateSetSwap = align([first, second, third], [2, 7, 4], [second, first, third], 3);
ok(duplicateSetSwap.join(',') === '7,2,4', 'exact page order keeps distinct durations when duplicate subject sets swap positions');
const inPageReorder = align([first], [6.5], [['subject-3', 'subject-1', 'subject-2']], 3);
ok(inPageReorder.join(',') === '6.5', 'set identity preserves duration when subjects are reordered inside one page');
const newPageFallback = align([first], [2], [first, ['subject-8', 'subject-9']], 4.5);
ok(newPageFallback.join(',') === '2,4.5', 'new manual pages inherit the bounded global page duration');
console.log('PASS duplicate-set page identity and duration ownership resilience');
