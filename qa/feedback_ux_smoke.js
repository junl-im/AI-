#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const config = fs.readFileSync(path.join(root, 'src/config/app-runtime-config.js'), 'utf8');
const buildKey = (config.match(/BUILD_KEY:\s*'([^']+)'/) || [])[1] || '';
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/css/feedback-ux.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'src/ui/feedback-ux.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
const loader = fs.readFileSync(path.join(root, 'src/boot/staged-ui-loader.js'), 'utf8');

const requiredHtml = [
    'class="signature-label">DESIGNED BY</span><strong>곰같은여우</strong>',
    `feedback-ux.css?v=${buildKey}`
];
const missingHtml = requiredHtml.filter(token => !html.includes(token));
if (missingHtml.length) {
    console.error('FAIL feedback UX HTML anchors missing: ' + missingHtml.join(', '));
    process.exit(1);
}


if (html.includes('<script defer src="src/ui/feedback-ux.js')) {
    console.error('FAIL feedback UX JS must not increase direct startup scripts');
    process.exit(1);
}
if (!loader.includes("versioned('src/ui/feedback-ux.js', 'shell')")) {
    console.error('FAIL feedback UX JS is not hydrated with the shell phase');
    process.exit(1);
}

const requiredCss = ['brand-signature-pill', 'fx-ripple', 'toast-kind-success', 'toast-kind-error'];
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
