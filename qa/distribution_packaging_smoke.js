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
if (!manifest.includes('# from=1.3.1') || !manifest.includes('# to=1.3.2')) throw new Error('patch version range is not v1.3.1 to v1.3.2');
for (const required of [
  'src/analysis/audio-analysis-core.js',
  'src/render/vertical-renderer.js',
  'src/render/render-queue.js',
  'assets/css/render-queue.css',
  'qa/runtime-media-e2e-v1.3.2.json',
  'qa/media_e2e_audit_smoke.js',
  'qa/workspace_layout_controls_smoke.js',
  'qa/runtime-browser-audit-v1.3.2.json',
  'qa/runtime_browser_audit_smoke.js',
  'index.html',
  'sw.js',
  'package.json',
  'HANDOFF.md',
  'qa/QA_REPORT.md'
]) {
  if (!manifest.includes(required)) throw new Error(`patch manifest incomplete: ${required}`);
}
console.log('PASS full and v1.3.2 overwrite-patch-from-v1.3.1 distribution contract');
