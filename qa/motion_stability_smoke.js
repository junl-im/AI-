#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function fail(message) { console.error('FAIL motion stability:', message); process.exit(1); }
function has(file, token) { if (!read(file).includes(token)) fail(`${file} missing ${token}`); }
const html = read('index.html');
const pkg = JSON.parse(read('package.json'));
if (pkg.version !== '1.6.4') fail('package version must be 1.2.9');
has('index.html', 'assets/css/motion-stability.css?v=1.6.4-recovery-loop-impact-preview');
has('index.html', 'src/ui/motion-stability.js?v=1.6.4-recovery-loop-impact-preview');
has('src/ui/motion-stability.js', 'AIShortsMotionStability');
has('src/ui/motion-stability.js', "behavior: 'auto'");
has('src/ui/motion-stability.js', 'pending =');
has('src/ui/hyperflow-tabs.js', 'AIShortsMotionStability');
has('src/ui/workspace-comfort.js', 'double-scroll shake');
has('src/ui/flow-quality-gate.js', 'AIShortsMotionStability');
has('assets/css/motion-stability.css', 'scroll-behavior: auto !important');
has('assets/css/motion-stability.css', '.is-motion-stable-revealed');
has('sw.js', 'motion-stability.css?v=1.6.4-recovery-loop-impact-preview');
has('sw.js', 'motion-stability.js?v=1.6.4-recovery-loop-impact-preview');
if (/scrollTo\(\{[^}]*behavior:\s*'smooth'/.test(read('src/ui/hyperflow-tabs.js'))) fail('hyperflow-tabs still uses smooth scroll reveal');
if (/scrollTo\(\{[^}]*behavior:\s*'smooth'/.test(read('src/ui/flow-quality-gate.js'))) fail('flow-quality-gate still uses smooth scroll reveal');
console.log('PASS motion stability centralizes tab reveal and removes double smooth scroll');
