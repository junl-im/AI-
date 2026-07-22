#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const pkg = require(path.join(root, 'package.json'));
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const css = read('assets/css/ui-refinement.css');
const layout = read('assets/css/layout-dock.css');
const header = read('assets/css/header-meta-rail.css');
const stage = read('assets/css/studio-experience.css');
function ok(value, message) { if (!value) throw new Error(message); }
ok(pkg.version === '1.5.20', 'UI clarity release version must be v1.5.20');
ok(css.includes('min-height: 316px !important') && css.includes('min-height: 278px !important') && css.includes('min-height: 266px !important'), 'desktop and mobile hero density targets are present');
ok(css.includes('min-height: 60px !important') && css.includes('min-height: 56px !important'), 'mobile workflow and dock compact geometry is present');
ok(css.includes('.panel-head::before') && css.includes('.workspace-layout-button[aria-pressed="true"]'), 'panel and workspace hierarchy polish is present');
ok(!/\.brand-right-actions,\s*\n\.designer-mini/.test(layout), 'legacy layout layer no longer hides the active header actions');
ok(/grid-template-columns:\s*minmax\(0, 1fr\) auto(?:\s*!important)?;/.test(header), 'header metadata rail remains the final two-column owner');
ok(stage.includes('.hyperflow-stage {') && /display:\s*flex(?:\s*!important)?;/.test(stage), 'studio experience remains the visible stage owner');
console.log('PASS v1.5.20 compact hero, clearer panel hierarchy, and header ownership cleanup');
