'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const configSource = fs.readFileSync(path.join(root, 'src/config/app-runtime-config.js'), 'utf8');
const buildKey = (configSource.match(/BUILD_KEY:\s*'([^']+)'/) || [])[1] || '';
const pkg = require(path.join(root, 'package.json'));
function ok(value, message) { if (!value) throw new Error(message); }
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const loader = fs.readFileSync(path.join(root, 'src/boot/staged-ui-loader.js'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/css/smart-reframe.css'), 'utf8');
['smartReframeSpeakerPriorityToggle', 'smartReframeSpeakerLinkBtn', 'smartReframeSpeakerStatus'].forEach(id => ok(html.includes(`id="${id}"`), `${id} control exists`));
ok(loader.includes("versioned('src/vision/speaker-face-linker.js', 'editing')"), 'speaker linker stays on editing-stage lazy load');
ok(sw.includes(`src/vision/speaker-face-linker.js?v=${buildKey}`), 'speaker linker is available offline');
ok(css.includes('.smart-reframe-speaker-status') && css.includes('.smart-reframe-speaker-toggle'), 'speaker controls have responsive ownership');
console.log('PASS speaker-directed smart reframe UI, staged loading, and offline shell guardrails');
