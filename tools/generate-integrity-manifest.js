#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const root = path.resolve(__dirname, '..');
const swPath = path.join(root, 'sw.js');
const manifestPath = path.join(root, 'asset-integrity.json');
let sw = fs.readFileSync(swPath, 'utf8');
const shellMatch = sw.match(/const SHELL_FILES = \[([\s\S]*?)\n\];/);
if (!shellMatch) throw new Error('SHELL_FILES not found');
const entries = [...shellMatch[1].matchAll(/'([^']+)'/g)].map(match => match[1]);
const assets = {};
for (const entry of entries) {
    const clean = entry.split('?')[0].replace(/^\.\//, '');
    const key = clean || 'index.html';
    if (key === 'asset-integrity.json') continue;
    const filePath = path.join(root, key);
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) throw new Error(`Missing shell file: ${entry}`);
    assets[key] = crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}
const runtime = require(path.join(root, 'package.json'));
const manifest = {
    app: 'AI Shorts Studio',
    version: runtime.version,
    buildKey: '1.6.5-smart-reframe-caption-safe',
    algorithm: 'sha256',
    generatedAt: new Date().toISOString(),
    assetCount: Object.keys(assets).length,
    assets
};
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
const manifestHash = crypto.createHash('sha256').update(fs.readFileSync(manifestPath)).digest('hex');
sw = sw.replace(/const INTEGRITY_MANIFEST_SHA256 = '[^']*';/, `const INTEGRITY_MANIFEST_SHA256 = '${manifestHash}';`);
fs.writeFileSync(swPath, sw);
console.log(JSON.stringify({ manifestPath, manifestHash, assetCount: manifest.assetCount }));
