#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const version = require(path.join(root, 'package.json')).version;
const report = JSON.parse(fs.readFileSync(path.join(root, 'qa', `runtime-css-ownership-v${version}.json`), 'utf8'));
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
function ok(value, message) { if (!value) throw new Error(message); console.log(`PASS ${message}`); }
function single(snapshot, property, owner) {
  const entry = snapshot?.[property];
  ok(entry && entry.owners.length === 1 && entry.owners[0] === owner && entry.winner?.file === owner, `${property} is owned only by ${owner}`);
}
ok(report.highRiskConflictCount === 0, 'high-risk CSS conflict inventory is empty');
single(report.criticalOwnership.heroNoteBase, 'max-width', 'layout-dock.css');
single(report.criticalOwnership.heroNoteBase, 'color', 'glass-pro-ui.css');
for (const property of ['width', 'max-width']) single(report.criticalOwnership.cinematicHeroNoteBase, property, 'hero-command-deck.css');
for (const property of ['max-width', 'font-size']) single(report.criticalOwnership.desktopHeroNote, property, 'ui-refinement.css');
for (const property of ['max-width', 'margin-top']) single(report.criticalOwnership.mobileCinematicHeroNote, property, 'ui-refinement.css');
single(report.criticalOwnership.heroPanelBaseHeight, 'min-height', 'hero-command-deck.css');
single(report.criticalOwnership.desktopHeroPanelHeight, 'min-height', 'ui-refinement.css');
single(report.criticalOwnership.workspaceRevealMotion, 'animation', 'motion-stability.css');
single(report.criticalOwnership.documentScrollBehavior, 'scroll-behavior', 'shutter-glass-flow.css');
ok(!read('assets/css/workspace-comfort.css').includes('workspaceRevealPulse'), 'retired workspace reveal pulse is removed');
ok(!read('assets/css/responsive-workspace.css').includes('max-width: 900px !important'), 'responsive layer no longer overrides final hero copy width');
ok(!read('assets/css/desktop-prime-layout.css').includes('max-width: 720px !important'), 'desktop layout no longer owns final hero copy width');
console.log(`PASS v${version} hero typography and interaction ownership guardrails`);
