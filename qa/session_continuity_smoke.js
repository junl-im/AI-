// AI Shorts Studio v1.2.3 - session continuity smoke test
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function assert(condition, message) { if (!condition) { console.error(message); process.exit(1); } }
const html = read('index.html');
const css = read('assets/css/session-continuity.css');
const js = read('src/ui/session-continuity.js');
const pkg = JSON.parse(read('package.json'));
assert(html.includes('assets/css/session-continuity.css'), 'index.html must load session-continuity.css');
assert(html.includes('src/ui/session-continuity.js'), 'index.html must load session-continuity.js');
assert(css.includes('.session-continuity-panel'), 'session continuity panel style missing');
assert(css.includes('data-session-continuity'), 'session continuity body state style missing');
assert(js.includes('AIShortsSessionContinuity'), 'session continuity public API missing');
assert(js.includes('saveSnapshotNow'), 'manual/autosave function missing');
assert(js.includes('restoreSnapshot'), 'restore function missing');
assert(js.includes('beforeunload'), 'beforeunload save guard missing');
assert(js.includes('ai-shorts-session-restored'), 'session restored event missing');
assert(pkg.qaChecks.includes('node --check src/ui/session-continuity.js'), 'package qaChecks missing syntax check');
assert(pkg.qaChecks.includes('node qa/session_continuity_smoke.js'), 'package qaChecks missing session continuity smoke');
console.log('session continuity smoke passed');
