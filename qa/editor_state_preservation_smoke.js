#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const app = fs.readFileSync(path.resolve(__dirname, '..', 'src/app.js'), 'utf8');
const source = fs.readFileSync(path.resolve(__dirname, '..', 'src/app/render-workflow-controller.js'), 'utf8');

function ok(condition, message) {
    if (!condition) throw new Error(message);
    console.log(`PASS ${message}`);
}

ok(source.includes('function captureEditorSelection()'), 'render flow captures the active editor selection');
ok(source.includes('function restoreEditorSelection(editorSnapshot, sourceFile)'), 'render flow has an explicit editor selection restore path');
ok(source.includes('state.file !== sourceFile'), 'selection restoration is guarded against media replacement');
ok(/finally\s*\{[\s\S]*finishOperation\(token, completionResult\);[\s\S]*restoreEditorSelection\(editorSelection, sourceFile\);[\s\S]*\}/.test(source), 'selection is restored on success, failure, and cancellation');
ok((source.match(/finishOperation\(token, completionResult\)/g) || []).length === 1, 'render operation has one deterministic finish path');
ok(app.includes('try { media.currentTime = selected.start; }'), 'manual range seek uses the normalized start boundary');
console.log('PASS render editor-state preservation guardrails');
