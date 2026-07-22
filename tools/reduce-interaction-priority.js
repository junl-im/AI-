#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const postcss = require('postcss');

const root = path.resolve(__dirname, '..');
const releaseVersion = process.env.RELEASE_VERSION || require(path.join(root, 'package.json')).version;
const baselineVersion = '1.5.18';
const targets = [
  ['assets/css/foundation-polish.css', 'button:focus-visible,\nlabel[for]:focus-visible,\nselect:focus-visible,\ninput:focus-visible,\ntextarea:focus-visible,\n.bottom-dock-tab:focus-visible', 'outline'],
  ['assets/css/foundation-polish.css', 'button:focus-visible,\nlabel[for]:focus-visible,\nselect:focus-visible,\ninput:focus-visible,\ntextarea:focus-visible,\n.bottom-dock-tab:focus-visible', 'outline-offset'],
  ['assets/css/glass-pro-ui.css', '.recommendation-card:hover,\n.bottom-dock-tab:hover', 'border-color'],
  ['assets/css/glass-pro-ui.css', '.recommendation-card:hover,\n.bottom-dock-tab:hover', 'background'],
  ['assets/css/motion-stability.css', 'body[data-ui="hyperflow-tabs"] .bottom-dock-tab:active,\nbody[data-ui="hyperflow-tabs"] .recommendation-card:active', 'transform'],
  ['assets/css/ui-refinement.css', 'input:not([type="range"]):not([type="checkbox"]):focus,\nselect:focus,\ntextarea:focus', 'border-color'],
  ['assets/css/ui-refinement.css', 'input:not([type="range"]):not([type="checkbox"]):focus,\nselect:focus,\ntextarea:focus', 'outline'],
  ['assets/css/ui-refinement.css', 'input:not([type="range"]):not([type="checkbox"]):focus,\nselect:focus,\ntextarea:focus', 'box-shadow'],
  ['assets/css/ui-refinement.css', '.btn-secondary:not(:disabled):hover,\n.mini-action:not(:disabled):hover,\nlabel.btn-secondary:hover', 'background'],
  ['assets/css/ui-refinement.css', 'button:disabled,\n.btn-secondary:disabled,\n.mini-action:disabled', 'opacity'],
  ['assets/css/ui-refinement.css', '.upload-tile:hover,\n.upload-tile:focus-visible', 'border-color'],
  ['assets/css/ui-refinement.css', '.upload-tile:hover,\n.upload-tile:focus-visible', 'background']
];

const byFile = new Map();
for (const [file, selector, prop] of targets) {
  if (!byFile.has(file)) byFile.set(file, []);
  byFile.get(file).push({ selector, prop });
}

const removed = [];
const missing = [];
for (const [relative, entries] of byFile) {
  const full = path.join(root, relative);
  const ast = postcss.parse(fs.readFileSync(full, 'utf8'), { from: full });
  let changed = false;
  for (const target of entries) {
    let found = false;
    ast.walkRules(rule => {
      if (rule.selector !== target.selector) return;
      rule.walkDecls(target.prop, decl => {
        found = true;
        if (!decl.important) return;
        removed.push({ file: relative, selector: target.selector, prop: decl.prop, value: decl.value, line: decl.source.start.line });
        decl.important = false;
        changed = true;
      });
    });
    if (!found) missing.push({ file: relative, selector: target.selector, prop: target.prop });
  }
  if (changed) fs.writeFileSync(full, ast.toString(), 'utf8');
}

function countImportant() {
  const cssDir = path.join(root, 'assets', 'css');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const linked = [...html.matchAll(/assets\/css\/([^?\"']+\.css)(?:\?[^\"']*)?/g)].map(match => match[1]);
  return linked.reduce((sum, name) => {
    const ast = postcss.parse(fs.readFileSync(path.join(cssDir, name), 'utf8'));
    ast.walkDecls(decl => { if (decl.important) sum += 1; });
    return sum;
  }, 0);
}

const report = {
  version: releaseVersion,
  baselineVersion,
  baselineImportant: 678,
  removedCount: removed.length,
  remainingImportant: countImportant(),
  strategy: 'Real Chromium hover, keyboard focus-visible, disabled, enabled, and pointer-active computed-style equivalence; geometry and runtime regressions remain separately guarded',
  files: [...byFile.keys()],
  removed,
  missing
};
const output = path.join(root, 'qa', `runtime-interaction-priority-v${releaseVersion}.json`);
let preserve = false;
if (removed.length === 0 && fs.existsSync(output)) {
  try { preserve = JSON.parse(fs.readFileSync(output, 'utf8')).removedCount > 0; } catch (_) { preserve = false; }
}
if (!preserve) fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n', 'utf8');
console.log(JSON.stringify({ ...report, preservedExistingReport: preserve }, null, 2));
if (missing.length) process.exitCode = 2;
