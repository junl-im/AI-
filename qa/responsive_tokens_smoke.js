#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const pkg = require(path.join(root, 'package.json'));
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const theme = read('assets/css/theme.css');
const ui = read('assets/css/ui-refinement.css');
const header = read('assets/css/header-meta-rail.css');
const prime = read('assets/css/desktop-prime-layout.css');
const responsive = read('assets/css/responsive-workspace.css');
function ok(value, message) { if (!value) throw new Error(message); }
ok(pkg.version === '1.5.25', 'responsive token release version must be v1.5.25');
for (const token of [
  '--responsive-shell-gutter-wide', '--responsive-shell-gutter-compact', '--responsive-shell-gutter-mobile',
  '--responsive-shell-bottom-wide', '--responsive-shell-bottom-laptop', '--responsive-shell-bottom-tablet',
  '--responsive-title-wide', '--responsive-title-laptop', '--responsive-title-tablet', '--responsive-title-mobile'
]) ok(theme.includes(token), `responsive token exists: ${token}`);
ok(ui.includes('var(--responsive-shell-gutter-wide)') && ui.includes('var(--responsive-title-mobile)'), 'final responsive skin consumes common geometry tokens');
ok(/grid-template-columns:\s*minmax\(0, 1fr\) auto(?:\s*!important)?;/.test(header) && /align-items:\s*center(?:\s*!important)?;/.test(header), 'header metadata rail owns final grid alignment');
ok(!responsive.includes('.cinematic-brand-panel .brand-topline {\n    display:'), 'responsive workspace no longer owns header display');
ok(!prime.includes('is-navigation-target::after {'), 'desktop prime no longer paints the retired navigation pseudo-label');
ok(!ui.includes('is-navigation-target::after {'), 'UI refinement no longer styles the retired navigation pseudo-label');
console.log('PASS v1.5.25 common responsive geometry tokens and header/stage ownership cleanup');
