#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/css/responsive-workspace.css'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

function assert(condition, message) {
    if (!condition) {
        console.error(`FAIL ${message}`);
        process.exit(1);
    }
    console.log(`PASS ${message}`);
}

const heroStart = html.indexOf('<section class="brand-panel cinematic-brand-panel"');
const heroEnd = html.indexOf('</section>\n    </header>', heroStart);
const hero = html.slice(heroStart, heroEnd);

assert(html.includes('assets/css/responsive-workspace.css?v=1.1.0-flow-audit'), 'responsive workspace stylesheet is linked');
assert(sw.includes('responsive-workspace.css?v=1.1.0-flow-audit'), 'responsive workspace stylesheet is cached');
assert(html.includes('class="start-command-panel"'), 'separated start command panel exists below hero');
assert(!hero.includes('hero-cta-row'), 'hero title panel does not contain quick action buttons');
assert(!hero.includes('workflow-rail'), 'hero title panel does not contain workflow rail');
assert(html.includes('<b>파일 열기</b>'), 'bottom dock file tab label is 파일 열기');
assert(!html.includes('<b>파일</b><i class="tab-state-dot" data-tab-state="file"'), 'old bottom dock file label is removed');
assert(css.includes('@media (min-width: 1180px)'), 'desktop breakpoint is defined');
assert(css.includes('@media (max-width: 720px)'), 'mobile breakpoint is defined');
assert(css.includes('repeat(8, minmax(0, 1fr))'), 'desktop dock uses 8 equal columns');
assert(css.includes('repeat(4, minmax(0, 1fr))'), 'mobile dock keeps 4-column rows');
assert(css.includes('grid-template-columns: minmax(260px, 360px) minmax(760px, 1fr)'), 'desktop dock separates status and tabs');
