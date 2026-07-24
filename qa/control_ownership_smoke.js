#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const pkg = require(path.join(root, 'package.json'));
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const responsive = fs.readFileSync(path.join(root, 'assets/css/responsive-workspace.css'), 'utf8');
const shutter = fs.readFileSync(path.join(root, 'assets/css/shutter-glass-flow.css'), 'utf8');
const director = fs.readFileSync(path.join(root, 'src/ui/flow-director-final.js'), 'utf8');
function ok(value, message) { if (!value) throw new Error(message); }
ok(pkg.version === '1.6.0', 'control ownership release version is v1.6.0');
ok(!/class="[^"]*command-group/.test(html), 'retired command-group markup is absent');
ok(!/\.command-group(?:[\s,{.:#>]|$)/.test(responsive), 'responsive layer has no retired command-group selectors');
ok(!/\.command-group(?:[\s,{.:#>]|$)/.test(shutter), 'shutter layer has no retired command-group selectors');
ok(!director.includes('command-group-primary') && !director.includes('command-group-status'), 'flow director no longer probes retired command groups');
ok(html.includes('flow-overview-panel') && responsive.includes('.workflow-rail-separated'), 'current start overview remains intact');
console.log('PASS v1.6.0 command/control ownership and retired command-group cleanup');
