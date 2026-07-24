#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const urls = html.match(/https?:\/\/[^\s"'<>;]+/gi) || [];
const allowedLoopback = url => {
    try {
        const host = new URL(url.replace(/:\*$/, ':80')).hostname.toLowerCase().replace(/^\[|\]$/g, '');
        return host === 'localhost' || host.endsWith('.localhost') || host === '::1' || /^127(?:\.\d{1,3}){3}$/.test(host);
    } catch (_) { return false; }
};
const external = urls.filter(url => !allowedLoopback(url));
const forbiddenText = [/cdn\./i, /unpkg/i, /jsdelivr/i];
const textHit = forbiddenText.find(regex => regex.test(html));
if (external.length || textHit) {
    console.error(`FAIL external dependency detected: ${external.join(', ') || textHit}`);
    process.exit(1);
}
if (!html.includes('localhost 전용')) {
    console.error('FAIL loopback network allowance is missing an explicit user-facing policy');
    process.exit(1);
}
console.log('PASS no external dependency in index.html; explicit loopback-only local AI endpoints are allowed');
