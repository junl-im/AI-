#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const pkg = require(path.join(root, 'package.json'));
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const audit = JSON.parse(read(`qa/runtime-css-ownership-v${pkg.version}.json`));
const reduction = JSON.parse(read('qa/runtime-important-reduction-v1.5.18.json'));
function ok(value, message) { if (!value) throw new Error(message); console.log(`PASS ${message}`); }
ok(pkg.version === '1.5.29', 'refinement priority release version is v1.5.29');
ok(reduction.baselineVersion === '1.5.17' && reduction.removedCount === 81, '81 verified priorities are removed from the v1.5.17 baseline');
ok(reduction.remainingImportant === 678 && audit.importantCount <= 593, 'v1.5.18 reduction remains inherited and the active ceiling is further reduced');
ok(audit.conflictingPropertyCount === 0 && audit.sameValueDuplicateCount === 0 && audit.shadowedDeclarationCount === 0, 'zero-conflict, zero-duplicate, zero-shadow cascade remains intact');
ok(reduction.removed.every(item => ['assets/css/ui-refinement.css', 'assets/css/foundation-polish.css'].includes(item.file)), 'reduction is limited to the two planned owner stylesheets');
const ui = read('assets/css/ui-refinement.css');
const foundation = read('assets/css/foundation-polish.css');
ok(ui.includes('width: min(calc(100% - var(--responsive-shell-gutter-mobile)), 680px) !important'), 'mobile shell geometry keeps required priority');
ok(ui.includes('.social-shutter-strip { display: none !important; }'), 'responsive hero visibility keeps required priority');
ok(foundation.includes('body.has-media .start-command-panel') && foundation.includes('display: none !important'), 'media-state visibility keeps required priority');
ok(foundation.includes('backdrop-filter: none !important') && foundation.includes('animation: none !important'), 'performance-lite safeguards keep required priority');
console.log('PASS v1.5.29 inherits the v1.5.18 refinement and foundation priority guardrails');
