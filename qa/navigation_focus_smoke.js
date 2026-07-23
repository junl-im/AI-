#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
function assert(condition, message) {
    if (!condition) { console.error(`FAIL ${message}`); process.exit(1); }
    console.log(`PASS ${message}`);
}
const pkg = JSON.parse(read('package.json'));
const html = read('index.html');
const app = read('src/app.js');
const director = read('src/ui/flow-director-final.js');
const bridge = read('src/ui/flow-command-bridge.js');
const legacyTabs = read('src/ui/hyperflow-tabs.js');
const css = read('assets/css/desktop-prime-layout.css');
const iconCss = read('assets/css/icon-system.css');
assert(pkg.version === '1.5.25', 'navigation focus release version is v1.5.25');
assert(html.includes('release-device-compat') && html.includes('모바일 · PC 호환'), 'device compatibility sits next to the visible version');
assert(html.includes('data-flow-tab="file"') && html.includes('data-icon="upload"') && html.includes('data-icon="export"') && html.includes('<b>저장</b>'), 'menu uses consistent semantic studio vector icons');
assert(app.includes("activateFlowTab('recommend', { reveal: true, force: true") && app.includes('ai-shorts-navigation-request'), 'file analysis and app milestones request visible navigation');
assert(app.includes('AIShortsFlowCommandBridge') && app.includes('AIShortsFlowDirectorFinal'), 'app progression prefers the single navigation owner');
assert(legacyTabs.includes('dataset.activeFlowTab') && legacyTabs.includes('requested !== active'), 'legacy menu state adopts the director request instead of overwriting it');
assert(director.includes('installProgressNavigation') && director.includes('is-navigation-target') && director.includes('focusMenuTab'), 'director owns automatic progression, panel spotlight and menu centering');
assert(director.includes("setActiveIfNeeded('preview'") && director.includes("setActiveIfNeeded('export'"), 'candidate and render actions navigate once to their result screens');
assert(director.includes("aria-current') !== 'step'") || director.includes("aria-current') !== 'step"), 'active menu exposes current workflow step');
assert(!bridge.includes('LOCAL · PRIVATE · 9:16') && !bridge.includes('brand-compat-pill'), 'command bridge no longer recreates the removed center status');
assert(css.includes('.is-navigation-target') && !css.includes('navigationFocusPulse'), 'desktop workspace keeps the active destination highlight without an orphan animation');
assert(iconCss.includes('studio-icon') && iconCss.includes('mask: var(--studio-icon-url)') && director.includes('studio-vectors'), 'menu uses platform-independent vector assets');
assert(!html.includes('⬇') && !read('src/ui/handoff-coach.js').includes('⬇️') && !read('src/boot/update-sentinel.js').includes('🛰️'), 'prominent workflow copy avoids mismatched colorful emoji');
console.log('PASS v1.5.25 navigation focus and icon consistency guardrails present');
