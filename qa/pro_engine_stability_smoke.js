#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const configSource = fs.readFileSync(path.join(root, 'src/config/app-runtime-config.js'), 'utf8');
const buildKey = (configSource.match(/BUILD_KEY:\s*'([^']+)'/) || [])[1] || '';
const pkg = require(path.join(root, 'package.json'));
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function fail(message) { console.error('FAIL ' + message); process.exit(1); }

[
    'src/engine/module-contracts.js',
    'src/engine/analysis-cache.js',
    'src/engine/pro-engine-tuner.js',
    'src/engine/stability-auditor.js',
    'assets/css/pro-engine.css'
].forEach(file => { if (!fs.existsSync(path.join(root, file))) fail(`missing ${file}`); });

const html = read('index.html');
[
    `src/engine/module-contracts.js?v=${buildKey}`,
    `src/engine/analysis-cache.js?v=${buildKey}`,
    `src/engine/pro-engine-tuner.js?v=${buildKey}`,
    `src/engine/stability-auditor.js?v=${buildKey}`,
    `assets/css/pro-engine.css?v=${buildKey}`
].forEach(token => { if (!html.includes(token)) fail(`index missing ${token}`); });

const kernel = read('src/engine/engine-kernel.js');
[
    'analysis.cache',
    'stability.auditor',
    'pro.engine.tuner',
    'contracts.createContractReport',
    'analysisCache.get',
    'auditRuntime'
].forEach(token => { if (!kernel.includes(token)) fail(`kernel missing ${token}`); });

const app = read('src/app.js');
if (!app.includes('engineKernel.auditRuntime')) fail('app should call runtime auditor');
if (!app.includes('안정')) fail('engine status should expose stability score');

console.log('PASS pro engine stability modules are wired');
