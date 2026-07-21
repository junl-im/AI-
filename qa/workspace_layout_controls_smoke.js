#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
function assert(value, message) {
    if (!value) {
        console.error(`FAIL ${message}`);
        process.exit(1);
    }
    console.log(`PASS ${message}`);
}
const pkg = JSON.parse(read('package.json'));
const html = read('index.html');
const css = read('assets/css/workspace-layout-controls.css');
const js = read('src/ui/workspace-layout-controls.js');
const sw = read('sw.js');
assert(pkg.version === '1.5.2', 'workspace controls release version is v1.5.2');
assert(html.includes('workspace-layout-controls.css?v=1.5.2-experience-engine'), 'workspace layout stylesheet is linked');
assert(html.indexOf('workspace-layout-controls.css') > html.indexOf('active-stage-beacon.css'), 'workspace layout stylesheet is the final visual override');
assert(html.includes('workspace-layout-controls.js?v=1.5.2-experience-engine'), 'workspace controller is loaded');
assert(html.includes('id="workspaceLayoutToolbar"') && html.includes('data-workspace-mode="preview"') && html.includes('data-workspace-mode="waveform"'), 'desktop layout toolbar exposes balanced, preview, and waveform views');
assert((html.match(/data-workspace-divider=/g) || []).length === 2, 'two accessible column dividers are present');
assert(html.includes('role="separator"') && html.includes('aria-orientation="vertical"') && html.includes('tabindex="0"'), 'column dividers support assistive technology and keyboard focus');
assert(css.includes('var(--workspace-left-track)') && css.includes('var(--workspace-center-track)') && css.includes('var(--workspace-right-track)'), 'three workspace tracks are configurable');
assert(css.includes('"load divider-left preview divider-right candidates"'), 'resizers sit between the three prime columns');
assert(css.includes('[data-workspace-view="preview"]') && css.includes('[data-workspace-view="waveform"]'), 'preview and waveform focus views are styled');
assert(css.includes('@media (max-width: 1179px)') && css.includes('display: none !important'), 'workspace controls stay desktop-only');
assert(js.includes("const STORAGE_KEY = 'ai-shorts-workspace-layout-v1'"), 'column ratios use a dedicated persistence key');
assert(js.includes("mode = 'balanced';") && !js.includes('JSON.stringify({ weights, mode })'), 'temporary focus mode is not restored over the next launch');
assert(js.includes("['ArrowLeft', 'ArrowRight']") && js.includes("event.key === 'Home'"), 'dividers support keyboard resizing and reset');
assert(js.includes('setPointerCapture') && js.includes('releasePointerCapture'), 'pointer drag stays owned by the active divider');
assert(js.includes('guardFocusMode') && js.includes('ai-shorts-navigation-request') && js.includes('[data-flow-tab]'), 'explicit workflow navigation automatically leaves incompatible focus views');
assert(sw.includes('workspace-layout-controls.css?v=1.5.2-experience-engine') && sw.includes('workspace-layout-controls.js?v=1.5.2-experience-engine'), 'workspace control assets are cached');
console.log('PASS v1.5.2 resizable desktop workspace and focus view guardrails');
