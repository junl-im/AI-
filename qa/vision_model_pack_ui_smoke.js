#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function assert(condition, message) {
    if (!condition) throw new Error(message);
    console.log(`PASS ${message}`);
}

const html = read('index.html');
const css = read('assets/css/smart-reframe.css');
const loader = read('src/boot/staged-ui-loader.js');
const engine = read('src/vision/smart-reframe-engine.js');
const panel = read('src/ui/vision-model-pack-panel.js');
const ids = ['visionModelPackPanel', 'visionPackStatus', 'visionPackDetail', 'visionPackSelect', 'visionPackBackend', 'visionPackInstallBtn', 'visionPackFolderInput', 'visionPackActivateBtn', 'visionPackDeactivateBtn', 'visionPackVerifyBtn', 'visionPackRemoveBtn', 'visionPackProgress'];
ids.forEach(id => assert(html.includes(`id="${id}"`), `vision model-pack UI exposes ${id}`));
assert(html.includes('<details id="visionModelPackPanel"') && !html.includes('<details id="visionModelPackPanel" class="vision-model-pack-panel" open'), 'vision model-pack controls are collapsed by default');
assert(html.includes('외부 서버·CDN으로 전송하지 않습니다') && html.includes('공식 배포 파일만 설치하세요'), 'model-pack panel explains local-only and trusted-file policy');
const managerIndex = loader.indexOf("src/vision/vision-model-pack-manager.js");
const engineIndex = loader.indexOf("src/vision/smart-reframe-engine.js");
const panelIndex = loader.indexOf("src/ui/vision-model-pack-panel.js");
assert(managerIndex >= 0 && managerIndex < engineIndex && engineIndex < panelIndex, 'editing-stage loader orders manager, engine, and panel without startup hydration');
assert(engine.includes('modelPacks.ensureActiveProvider()') && engine.includes('model-pack failure falls back to native or motion tracking'), 'smart reframe engine activates a verified pack and preserves native/motion fallback');
assert(panel.includes('installFromFiles') && panel.includes('verifyPack') && panel.includes('activatePack') && panel.includes('removePack'), 'panel owns install, verify, activate, and local removal actions');
assert(css.includes('.vision-model-pack-controls') && css.includes('@media (max-width: 760px)'), 'vision model-pack controls include responsive single-column ownership');
console.log('PASS compact browser vision model-pack UI and lazy-loading contract');
