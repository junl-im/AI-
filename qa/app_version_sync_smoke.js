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
const swRegistration = fs.readFileSync(path.join(root, 'src/boot/service-worker-registration.js'), 'utf8');
function assert(condition, message) {
  if (!condition) {
    console.error('FAIL:', message);
    process.exit(1);
  }
}
const version = `v${pkg.version}`;
const plain = pkg.version;
const buildKey = `${plain}-ui-clarity`;
assert(config.includes(`APP_VERSION: '${version}'`), 'runtime config APP_VERSION matches package version');
assert(config.includes(`BUILD_KEY: '${buildKey}'`), 'runtime config build key is updated');
assert(html.includes(`<meta name="ai-shorts-version" content="${version}" />`), 'html has version meta tag');
assert(html.includes(`>${version}</button>`), 'header version badge matches package version');
assert(html.includes(`AI 쇼츠 제작 스튜디오 ${version}`), 'title/info title includes current version');
assert(html.includes('src/boot/app-version-sync.js'), 'version sync boot module is loaded');

const versionedAssets = Array.from(html.matchAll(/\?v=([^"']+)/g), match => match[1]);
assert(versionedAssets.length > 40 && versionedAssets.every(value => value === buildKey), 'all core HTML assets use the current build key');
assert(!html.includes('1.3.4-css-ownership') && !html.includes('1.3.5-css-ownership'), 'stale HTML build keys are absent');
const registrationIndex = html.indexOf('src/boot/service-worker-registration.js');
const appIndex = html.indexOf('src/app.js');
assert(registrationIndex >= 0 && registrationIndex < appIndex, 'service worker registration module loads before the app');
assert(sync.includes('AIShortsVersionSync'), 'version sync API is exported');
assert(sync.includes('runtime-config'), 'version badge marks runtime config as source');
assert(sw.includes('version-aware cache guard'), 'service worker documents version-aware cache guard');
assert(sw.includes(`ai-shorts-studio-shell-${version}-ui-clarity`), 'service worker cache name matches the current build');
assert(sw.includes('networkFirst') && sw.includes('request.mode === \'navigate\''), 'service worker uses network-first navigation shell');
assert(sw.includes(`app-version-sync.js?v=${buildKey}`), 'service worker precaches version sync module');
assert(html.includes('src/boot/service-worker-registration.js'), 'service worker registration module is loaded');
assert(sw.includes(`service-worker-registration.js?v=${buildKey}`), 'service worker precaches registration module');
assert(swRegistration.includes('registration.update') && swRegistration.includes('config.APP_VERSION'), 'registration module checks for updates with the runtime config version');
assert(!sync.includes('navigator.serviceWorker.ready') && !sync.includes('registration.update'), 'version sync does not issue a second service worker update');
assert(sync.includes('AIShortsServiceWorkerRegistration'), 'manual freshness checks delegate to the registration owner');
assert(sw.includes('isControlAsset') && sw.includes('navigationFallback: false'), 'manifest and worker control assets never fall back to index HTML');
assert(sw.includes("status: 503") && sw.includes("Content-Type': 'text/plain; charset=utf-8'"), 'offline control-asset failures return an explicit non-HTML response');
assert(app.includes('serviceWorkerRegistration.register'), 'app delegates registration to the single-owner module');
console.log('PASS app version sync and cache guard are aligned');
