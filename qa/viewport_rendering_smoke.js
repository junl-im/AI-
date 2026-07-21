#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'assets/css/hero-command-deck.css'), 'utf8');

function assert(condition, message) {
    if (!condition) {
        console.error(`FAIL ${message}`);
        process.exit(1);
    }
    console.log(`PASS ${message}`);
}

assert(css.includes('@supports (content-visibility: auto)'), 'viewport rendering optimization is feature guarded');
for (const selector of ['.caption-pro-panel', '.quality-panel', '.batch-export-panel', '.project-card', '.copy-card']) {
    assert(css.includes(selector), `${selector} participates in below-the-fold paint deferral`);
}
assert(css.includes('content-visibility: auto'), 'below-the-fold groups can skip initial paint');
assert(css.includes('contain-intrinsic-size: auto 380px'), 'deferred groups preserve a stable estimated layout size');
console.log('PASS v1.5.6 viewport rendering diet guardrails present');
