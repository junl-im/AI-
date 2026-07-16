#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const pkg = require(path.join(root, 'package.json'));
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const config = fs.readFileSync(path.join(root, 'src/config/app-runtime-config.js'), 'utf8');
const sync = fs.readFileSync(path.join(root, 'src/boot/app-version-sync.js'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
function assert(condition, message) {
  if (!condition) {
    console.error('FAIL:', message);
    process.exit(1);
  }
}
const version = `v${pkg.version}`;
const plain = pkg.version;
assert(config.includes(`APP_VERSION: '${version}'`), 'runtime config APP_VERSION matches package version');
assert(config.includes(`BUILD_KEY: '${plain}-adaptive-mobile'`), 'runtime config build key is updated');
assert(html.includes(`<meta name="ai-shorts-version" content="${version}" />`), 'html has version meta tag');
assert(html.includes(`>${version}</button>`), 'header version badge matches package version');
assert(html.includes(`AI 쇼츠 제작 스튜디오 ${version}`), 'title/info title includes current version');
assert(html.includes('src/boot/app-version-sync.js'), 'version sync boot module is loaded');
assert(sync.includes('AIShortsVersionSync'), 'version sync API is exported');
assert(sync.includes('runtime-config'), 'version badge marks runtime config as source');
assert(sw.includes('version-aware cache guard'), 'service worker documents version-aware cache guard');
assert(sw.includes(`ai-shorts-studio-shell-${version}-adaptive-mobile`), 'service worker cache name matches the current build');
assert(sw.includes('networkFirst') && sw.includes('request.mode === \'navigate\''), 'service worker uses network-first navigation shell');
assert(sw.includes(`app-version-sync.js?v=${plain}-adaptive-mobile`), 'service worker precaches version sync module');
assert(app.includes('registration.update'), 'app asks service worker to check for updates');
console.log('PASS app version sync and cache guard are aligned');
