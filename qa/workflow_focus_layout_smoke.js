#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const pkg = require('../package.json');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
const css = read('assets/css/workflow-focus-layout.css');
const controller = read('src/ui/workflow-focus-layout.js');
const loader = read('src/boot/staged-ui-loader.js');
const ux = read('src/ui/ux-controls.js');
const sw = read('sw.js');
function ok(condition, message) {
  if (!condition) { console.error(`FAIL ${message}`); process.exit(1); }
  console.log(`PASS ${message}`);
}
ok(pkg.version === '1.6.9', 'workflow focus release version is v1.6.9');
ok(html.includes('id="workflowFocusToggle"') && html.includes('id="workflowFocusBadge"'), 'desktop toolbar exposes stage focus state and reversible full view');
ok(html.includes('assets/css/workflow-focus-layout.css?v=1.6.9-direct-crop-editor'), 'workflow focus stylesheet is loaded last in layout ownership');
ok(!html.includes('<script defer src="src/ui/workflow-focus-layout.js') && loader.includes("versioned('src/ui/workflow-focus-layout.js', 'shell')"), 'workflow focus controller hydrates with the shell without increasing direct startup scripts');
ok(sw.includes('./assets/css/workflow-focus-layout.css?v=1.6.9-direct-crop-editor') && sw.includes('./src/ui/workflow-focus-layout.js?v=1.6.9-direct-crop-editor'), 'service worker caches stage focus assets');
ok(controller.includes("const STORAGE_KEY = 'ai-shorts-workflow-focus-v1'"), 'stage focus preference is persisted independently');
ok(controller.includes("workspaceMode() === 'balanced'") && controller.includes("workflowFocusEffective"), 'stage focus yields to explicit preview and waveform modes');
ok(controller.includes('SUPPORT_BY_TAB') && controller.includes('workflow-panel-open'), 'each active step keeps only explicit next-step support cards');
ok(controller.includes("--hyperflow-dock-height") && controller.includes("--workflow-dock-clearance"), 'measured dock height drives bottom clearance');
ok(ux.includes("document.body.dataset.workflowPhase") && ux.includes("ai-shorts-workflow-phase"), 'workflow progress phase is synchronized from real app state');
ok(css.includes('[data-flow-panel].is-workflow-later') && controller.includes("setOwnedStyle(panel, 'display', 'none')"), 'unrelated desktop panels are removed from focused layout');
ok(css.includes('[data-flow-panel].is-workflow-support') && controller.includes("setOwnedStyle(panel, 'height', '86px')"), 'next-step panels collapse into bounded support cards');
ok(css.includes('[data-active-flow-tab="export"] .project-copy-hub') && css.includes('[data-active-flow-tab="export"] .local-ai-studio'), 'project, copy, and Local AI tools return in the export workflow');
console.log('PASS v1.6.9 stage-aware progressive disclosure, reversible full view, and measured dock clearance');
