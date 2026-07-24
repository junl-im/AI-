#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const version = require('../package.json').version;
const file = path.join(root, 'qa', `runtime-workflow-focus-layout-v${version}.json`);
function ok(condition, message) {
  if (!condition) { console.error(`FAIL ${message}`); process.exit(1); }
  console.log(`PASS ${message}`);
}
ok(fs.existsSync(file), `v${version} workflow focus browser audit exists`);
const report = JSON.parse(fs.readFileSync(file, 'utf8'));
ok(report.version === version, 'workflow focus audit version matches package');
const d = report.desktop;
ok(d.errors.length === 0 && report.mobile.errors.length === 0, 'desktop and mobile focus audits have no page errors');
ok(d.initial.state.enabled === true && d.initial.state.effective === true && d.initial.active === 'file', 'desktop stage focus is enabled by default on the import step');
ok(d.initial.visible.length === 2 && d.initial.visible[0].priority === 'primary' && d.initial.visible[1].priority === 'support', 'initial desktop view keeps one primary and one compact next-step panel');
ok(d.initial.visible[1].height <= 90 && d.initial.auxiliary.utility === 'none' && d.initial.auxiliary.ai === 'none', 'unrelated auxiliary tools stay out of the import workflow');
ok(Math.abs(d.initial.dockHeight - d.initial.dockVariable) <= 2 && d.initial.clearance >= d.initial.dockHeight + 20, 'measured dock height controls the bottom safety clearance');
ok(d.initial.overflow <= 0 && d.preview.overflow <= 0, 'focused import and preview layouts have no horizontal overflow');
ok(d.preview.active === 'preview' && d.preview.visible.length === 3, 'preview focus keeps preview plus two bounded support cards');
ok(d.preview.visible.filter(item => item.priority === 'support').every(item => item.height <= 90 && item.supportButton === 'flex'), 'support panels are compact and keyboard-accessible');
ok(d.supportNavigation.active === 'candidates' && d.supportNavigation.primary === 'candidates', 'support card action promotes the selected step to primary');
ok(d.full.state.enabled === false && d.full.effective === 'off' && d.full.visibleCount === 8, 'full view restores every desktop workflow panel');
ok(d.full.utility !== 'none' && d.full.ai !== 'none', 'full view restores project, copy, and Local AI tools');
ok(d.explicitMode.state.enabled === true && d.explicitMode.effective === 'off' && d.explicitMode.togglePaused === true, 'explicit preview mode temporarily pauses automatic stage focus');
ok(JSON.stringify(d.phases) === JSON.stringify(['analyze', 'edit', 'export']), 'workflow phase follows imported media, recommendations, and export completion');
const m = report.mobile.result;
ok(m.state.enabled === true && m.effective === 'off', 'mobile keeps its existing single-tab workflow instead of desktop stage focus');
ok(m.toggleDisplay === 'none' && m.badgeDisplay === 'none' && m.visible.length === 1, 'mobile hides desktop layout controls and shows one active panel');
ok(m.overflow <= 0 && Math.abs(m.dockHeight - m.dockVariable) <= 2, 'mobile has no overflow and uses measured dock clearance');
console.log(`PASS v${version} workflow focus browser behavior and dock safety`);
