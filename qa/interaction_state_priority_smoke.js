#!/usr/bin/env node
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const pkg = require(path.join(root, 'package.json'));
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const current = JSON.parse(read(`qa/runtime-interaction-state-v${pkg.version}.json`));
const baseline = JSON.parse(read('qa/runtime-interaction-state-v1.5.18.json'));
const reduction = JSON.parse(read('qa/runtime-interaction-priority-v1.5.19.json'));
const cascade = JSON.parse(read(`qa/runtime-css-ownership-v${pkg.version}.json`));
function ok(value, message) { if (!value) throw new Error(message); console.log(`PASS ${message}`); }

ok(pkg.version === '1.6.3', 'interaction-state priority release version is v1.6.3');
ok(reduction.baselineVersion === '1.5.18' && reduction.removedCount === 12, '12 interaction-state priorities are removed from the v1.5.18 baseline');
ok(reduction.baselineImportant === 678 && reduction.remainingImportant === 666 && cascade.importantCount === 593, 'interaction priority contract is inherited and active important count is reduced to 593');
ok(reduction.missing.length === 0, 'all planned interaction declarations were found and reduced');
ok(cascade.conflictingPropertyCount === 0 && cascade.sameValueDuplicateCount === 0 && cascade.shadowedDeclarationCount === 0, 'zero-conflict, zero-duplicate, zero-shadow cascade remains intact');

const baselineModes = JSON.parse(JSON.stringify(baseline.modes));
const currentModes = JSON.parse(JSON.stringify(current.modes));
assert.deepStrictEqual(currentModes, baselineModes, 'desktop and mobile interaction computed styles must match v1.5.18');
ok(Object.values(current.modes).every(mode => mode.errors.length === 0), 'interaction audit has no page errors');
ok(Object.values(current.modes).every(mode => Object.keys(mode.states).length === 17), '17 hover, focus, disabled, enabled, and active states are covered per viewport');

const ui = read('assets/css/ui-refinement.css');
ok(/\.btn-secondary:not\(:disabled\):hover,[\s\S]*?border-color:\s*rgba\(103, 232, 249, 0\.30\)\s*!important/.test(ui), 'button hover border keeps the priority proven necessary against the important base border');
ok(/bottom-dock-tab:not\(\.is-disabled\):hover\s*\{[\s\S]*?color:\s*#dbe4ef\s*!important;[\s\S]*?background:\s*rgba\(148, 163, 184, 0\.055\)\s*!important/.test(ui), 'dock hover color and surface keep the priorities proven necessary');
ok(/bottom-dock-tab:not\(\.is-disabled\)\s*\{\s*color:\s*#9ba7b8\s*!important/.test(ui), 'enabled dock color keeps the priority proven necessary at compact breakpoints');
ok(!/button:disabled,[\s\S]*?opacity:\s*0\.42\s*!important/.test(ui), 'disabled opacity now uses normal cascade priority');
console.log('PASS v1.6.3 interaction-state priority reduction with unchanged computed states');
