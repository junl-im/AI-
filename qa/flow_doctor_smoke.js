#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function assert(condition, message) { if (!condition) { console.error('FAIL ' + message); process.exit(1); } }
const html = read('index.html');
const loader = read('src/boot/staged-ui-loader.js');
const tabs = read('src/ui/hyperflow-tabs.js');
const doctor = read('src/ui/flow-doctor.js');
const css = read('assets/css/flow-doctor.css');
const pkg = JSON.parse(read('package.json'));
assert(pkg.version === '1.2.9', 'package version must be 1.2.9');
assert(html.includes('assets/css/flow-doctor.css'), 'flow doctor css must be linked');
assert(loader.includes('src/ui/flow-doctor.js'), 'flow doctor script must be staged');
assert(html.includes('data-flow-tab="candidates"') && html.includes('data-flow-panel="candidates"'), 'candidate tab and panel must remain wired');
assert(html.includes('v1.2.9</button>'), 'header version must be simple v1.2.9');
assert(html.includes('class="signature-label">DESIGNED BY</span><strong>곰같은여우</strong>'), 'designer signature must remain in header');
assert(tabs.includes('setActiveFlowTab(key, { reveal: true, force: true })'), 'manual dock tab clicks must force workspace reveal');
assert(doctor.includes('healBrokenFlow') && doctor.includes("setTab('candidates', true)") && doctor.includes("setTab('preview', true)"), 'flow doctor must repair recommendation/candidate/preview path');
assert(doctor.includes('normalizeCandidateEmptyState'), 'flow doctor must normalize empty candidate state');
assert(css.includes('overflow-anchor: none'), 'flow doctor css must reduce scroll anchoring jumps');
assert(css.includes('min-height: 34px') && css.includes('recommend-generate-btn'), 'action density must stay compact');
console.log('PASS flow doctor guardrails present');
