#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
function assert(condition, message) {
    if (!condition) { console.error(`FAIL ${message}`); process.exit(1); }
    console.log(`PASS ${message}`);
}

const pkg = JSON.parse(read('package.json'));
const loader = read('src/boot/staged-ui-loader.js');
const health = read('src/boot/runtime-health.js');
const renderer = read('src/render/vertical-renderer.js');
const app = read('src/app.js');
const session = read('src/ui/session-continuity.js');
const bridge = read('src/ui/flow-command-bridge.js');

assert(pkg.version === '1.6.4' && pkg.scripts.test === 'npm run check', 'release version and standard test alias are aligned');
assert(loader.includes("config.APP_VERSION || 'v1.6.4'") && loader.includes('config.BUILD_KEY'), 'staged modules inherit the current runtime version and build key');
assert(!loader.includes("const VERSION = '1.2.6'") && loader.includes("'cut', 'edit'"), 'stale loader version and edit/editor key mismatch are removed');
assert(loader.includes('UI 모듈 로드 시간 초과') && loader.includes("type: 'staged-ui-load-error'"), 'staged loading has a timeout and diagnostic path');
assert(health.includes("unhandledrejection") && health.includes("window.error") && health.includes('recentErrors'), 'runtime health captures synchronous and asynchronous browser errors');
assert(renderer.includes('let intervalTimer = 0') && renderer.includes('let stopTimer = 0') && renderer.includes('function cleanup()'), 'renderer owns and clears all recording timers');
assert(app.includes("type: 'preview-playback-error'") && app.includes('stopPreview({ cancel: true'), 'preview playback rejection exits without leaving RAF or interval work running');
assert(!bridge.includes('syncTopLine'), 'removed header-status bridge references cannot throw during startup');
assert(session.includes('visibilitychange') && session.includes('stopHeartbeat()') && session.includes('30000'), 'session autosave pauses in hidden pages and uses a lower-frequency heartbeat');
console.log('PASS v1.6.4 code and engine stability guardrails present');
