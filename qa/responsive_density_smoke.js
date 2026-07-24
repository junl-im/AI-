#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const pkg = require(path.join(root, 'package.json'));
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const ui = read('assets/css/ui-refinement.css');
const dock = read('assets/css/pc-dock-reveal-hotfix.css');
const layout = read('assets/css/layout-dock.css');
const polish = read('assets/css/flow-polish.css');
const hero = read('assets/css/hero-command-deck.css');
const prime = read('assets/css/desktop-prime-layout.css');
const beacon = read('assets/css/active-stage-beacon.css');
function ok(value, message) { if (!value) throw new Error(message); }

ok(pkg.version === '1.5.28', 'responsive density release version must be v1.5.28');
ok(ui.includes('@media (min-width: 1180px) and (max-width: 1399px)') && ui.includes('min-height: 264px !important'), 'small-laptop hero density breakpoint is present');
ok(ui.includes('@media (min-width: 721px) and (max-width: 1179px)') && ui.includes('min-height: 300px !important'), 'tablet hero density breakpoint is present');
ok(dock.includes('grid-template-columns: repeat(8, minmax(0, 1fr));') && ui.includes('--hyperflow-dock-height: 72px'), 'tablet dock grid and responsive height token have final single owners');
ok(!layout.includes('.hero-mainline,\n    .brand-topline'), 'legacy mobile layout no longer overrides header display ownership');
ok(!polish.includes('.brand-topline { display: flex; }'), 'flow polish no longer overrides mobile header display ownership');
ok(!hero.includes('min-height: 41px;'), 'header metadata rail owns the final mobile topline height');
ok(!prime.includes('body[data-ui="hyperflow-tabs"] [data-flow-panel].is-navigation-target {\n    position: relative;'), 'desktop layout no longer duplicates navigation target positioning');
ok(beacon.includes('[data-flow-panel].is-navigation-target,') && beacon.includes('position: relative;') && beacon.includes('border-color:') && beacon.includes('box-shadow:'), 'active stage beacon owns navigation target position, border, and shadow');
console.log('PASS v1.5.28 tablet and small-laptop responsive density ownership guardrails');
