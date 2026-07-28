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
const ids = ['visionModelPackPanel', 'visionPackStatus', 'visionPackDetail', 'visionPackSelect', 'visionPackBackend', 'visionPackInstallBtn', 'visionPackFolderInput', 'visionPackActivateBtn', 'visionPackDeactivateBtn', 'visionPackVerifyBtn', 'visionPackBenchmarkBtn', 'visionPackRollbackBtn', 'visionPackRecommendation', 'visionPackBenchmarkDetail', 'visionPackRemoveBtn', 'visionPackProgress', 'visionPackHistoryChart', 'visionPackHistoryDetail', 'visionPackStorageSummary', 'visionPackStorageDetail', 'visionPackCleanupBtn'];
ids.forEach(id => assert(html.includes(`id="${id}"`), `vision model-pack UI exposes ${id}`));
assert(html.includes('<details id="visionModelPackPanel"') && !html.includes('<details id="visionModelPackPanel" class="vision-model-pack-panel" open'), 'vision model-pack controls are collapsed by default');
assert(html.includes('외부 서버·CDN으로 전송하지 않습니다') && html.includes('공식 배포 파일만 설치하세요'), 'model-pack panel explains local-only and trusted-file policy');
const managerIndex = loader.indexOf("src/vision/vision-model-pack-manager.js");
const engineIndex = loader.indexOf("src/vision/smart-reframe-engine.js");
const panelIndex = loader.indexOf("src/ui/vision-model-pack-panel.js");
assert(managerIndex >= 0 && managerIndex < engineIndex && engineIndex < panelIndex, 'editing-stage loader orders manager, engine, and panel without startup hydration');
assert(engine.includes('modelPacks.ensureActiveProvider()') && engine.includes('model-pack failure falls back to native or motion tracking'), 'smart reframe engine activates a verified pack and preserves native/motion fallback');
assert(panel.includes('renderBenchmarkHistory') && panel.includes('createElementNS') && panel.includes('installFromFiles') && panel.includes('verifyPack') && panel.includes('activatePack') && panel.includes('benchmarkPack') && panel.includes('rollbackToPrevious') && panel.includes('removePack') && panel.includes('cleanupOrphanedCache') && panel.includes('storageDiagnostics'), 'panel owns install, verify, benchmark, rollback, activation, removal, and orphan-cache cleanup actions');
assert(css.includes('.vision-model-pack-controls') && css.includes('.vision-model-pack-diagnostics') && css.includes('.vision-model-pack-history-chart') && css.includes('.vision-model-pack-storage') && css.includes('@media (max-width: 760px)'), 'vision model-pack controls and diagnostics include responsive ownership');
console.log('PASS compact browser vision model-pack storage UI and lazy-loading contract');
