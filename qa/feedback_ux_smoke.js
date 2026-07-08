#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/css/feedback-ux.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'src/ui/feedback-ux.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');

const requiredHtml = [
    'Design by <strong>곰같은여우</strong>',
    'feedback-ux.css?v=1.0.2-flow-audit',
    'feedback-ux.js?v=1.0.2-flow-audit'
];
const missingHtml = requiredHtml.filter(token => !html.includes(token));
if (missingHtml.length) {
    console.error('FAIL feedback UX HTML anchors missing: ' + missingHtml.join(', '));
    process.exit(1);
}

const requiredCss = ['brand-signature-pill', 'fx-ripple', 'toast-kind-success', 'toast-kind-error', 'bottom-dock-file'];
const missingCss = requiredCss.filter(token => !css.includes(token));
if (missingCss.length) {
    console.error('FAIL feedback UX CSS anchors missing: ' + missingCss.join(', '));
    process.exit(1);
}

const requiredJs = ['navigator.vibrate', 'classifyText', 'toast-kind-', 'pointerdown', 'AIShortsFeedbackUX'];
const missingJs = requiredJs.filter(token => !js.includes(token));
if (missingJs.length) {
    console.error('FAIL feedback UX JS anchors missing: ' + missingJs.join(', '));
    process.exit(1);
}

if (!app.includes('global.AIShortsFeedbackUX') || !app.includes("toast(message, kind)")) {
    console.error('FAIL app toast is not wired to feedback UX');
    process.exit(1);
}
console.log('PASS brand signature and haptic feedback UX guardrails present');
