#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/css/icon-system.css'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const required = ['upload','spark','candidates','preview','waveform','cut','edit','export','check','retry','thumbnail','diagnostics','caption','compare','pin','project','render','device','close','stop'];
for (const name of required) {
  const file = path.join(root, 'assets/icons/studio', `${name}.svg`);
  if (!fs.existsSync(file)) throw new Error(`missing icon asset: ${name}.svg`);
  const svg = fs.readFileSync(file, 'utf8');
  if (!svg.includes('viewBox="0 0 24 24"') || !svg.includes('stroke-linecap="round"')) throw new Error(`invalid icon geometry: ${name}`);
  if (!css.includes(`[data-icon="${name}"]`)) throw new Error(`missing CSS mapping: ${name}`);
  if (!sw.includes(`./assets/icons/studio/${name}.svg`)) throw new Error(`missing service worker icon cache: ${name}`);
}
if (!html.includes('assets/css/icon-system.css?v=1.6.5-smart-reframe-caption-safe')) throw new Error('icon stylesheet not loaded');
const menu = html.match(/<nav[^>]*class="bottom-dock-tabs"[^>]*>[\s\S]*?<\/nav>/)?.[0] || '';
for (const name of ['upload','spark','candidates','preview','waveform','cut','edit','export']) {
  if (!menu.includes(`data-icon="${name}"`)) throw new Error(`menu icon missing: ${name}`);
}
if (/[＋✦◆▶∿✂◫↓]/.test(menu)) throw new Error('legacy menu glyph remains');
console.log('PASS bespoke vector icon assets and menu integration');
