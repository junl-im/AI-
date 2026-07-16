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
if (!manifest.includes('# from=1.2.8') || !manifest.includes('# to=1.2.9')) throw new Error('patch version range is not v1.2.8 to v1.2.9');
for (const required of [
  'assets/css/ui-refinement.css',
  'assets/css/workspace-comfort.css',
  'src/boot/staged-ui-loader.js',
  'src/boot/runtime-health.js',
  'src/render/vertical-renderer.js',
  'src/ui/flow-command-bridge.js',
  'qa/runtime-browser-audit-v1.2.9.json',
  'qa/runtime_browser_audit_smoke.js',
  'index.html'
]) {
  if (!manifest.includes(required)) throw new Error(`patch manifest incomplete: ${required}`);
}
console.log('PASS full and v1.2.8 overwrite-patch distribution contract');
