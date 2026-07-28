#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function fail(message) { console.error('FAIL motion stability:', message); process.exit(1); }
function has(file, token) { if (!read(file).includes(token)) fail(`${file} missing ${token}`); }
const html = read('index.html');
const loader = read('src/boot/staged-ui-loader.js');
const pkg = JSON.parse(read('package.json'));
if (!/^1\.6\.\d+$/.test(pkg.version)) fail('package version must be 1.2.9');
const config = read('src/config/app-runtime-config.js');
const buildKey = (config.match(/BUILD_KEY:\s*'([^']+)'/) || [])[1] || '';
has('index.html', `assets/css/motion-stability.css?v=${buildKey}`);
if (html.includes('<script defer src="src/ui/motion-stability.js')) fail('motion stability must not consume a direct startup script');
if (!loader.includes("versioned('src/ui/motion-stability.js', 'shell')")) fail('motion stability must hydrate in the shell phase');
has('src/ui/motion-stability.js', 'AIShortsMotionStability');
has('src/ui/motion-stability.js', "behavior: 'auto'");
has('src/ui/motion-stability.js', 'pending =');
has('src/ui/hyperflow-tabs.js', 'AIShortsMotionStability');
has('src/ui/workspace-comfort.js', 'double-scroll shake');
has('src/ui/flow-quality-gate.js', 'AIShortsMotionStability');
has('assets/css/motion-stability.css', 'scroll-behavior: auto !important');
has('assets/css/motion-stability.css', '.is-motion-stable-revealed');
has('sw.js', `motion-stability.css?v=${buildKey}`);
has('sw.js', `motion-stability.js?v=${buildKey}`);
if (/scrollTo\(\{[^}]*behavior:\s*'smooth'/.test(read('src/ui/hyperflow-tabs.js'))) fail('hyperflow-tabs still uses smooth scroll reveal');
if (/scrollTo\(\{[^}]*behavior:\s*'smooth'/.test(read('src/ui/flow-quality-gate.js'))) fail('flow-quality-gate still uses smooth scroll reveal');
console.log('PASS motion stability centralizes tab reveal and removes double smooth scroll');
