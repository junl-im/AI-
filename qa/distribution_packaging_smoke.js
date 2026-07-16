#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const pkg = require(path.join(root, 'package.json'));
for (const file of ['tools/create-release-zip.sh','tools/create-patch-zip.sh','tools/create-distribution-zips.sh','PATCH_MANIFEST.txt']) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`missing distribution asset: ${file}`);
}
if (!pkg.scripts['package:full'] || !pkg.scripts['package:patch'] || !pkg.scripts.package) throw new Error('dual package scripts missing');
const manifest = fs.readFileSync(path.join(root, 'PATCH_MANIFEST.txt'), 'utf8');
if (!manifest.includes('# from=1.2.7')) throw new Error('patch source version missing');
if (!manifest.includes('assets/css/header-meta-rail.css') || !manifest.includes('index.html')) throw new Error('patch manifest incomplete');
console.log('PASS full and overwrite-patch distribution contract');
