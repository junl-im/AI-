#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function pass(name) { console.log('PASS ' + name); }
function fail(name, detail) { console.error('FAIL ' + name + (detail ? ' - ' + detail : '')); process.exit(1); }
function assert(cond, name, detail) { cond ? pass(name) : fail(name, detail); }
const html = read('index.html');
const css = read('assets/css/pc-dock-reveal-hotfix.css');
const comfortCss = read('assets/css/workspace-comfort.css');
const foundationCss = read('assets/css/foundation-polish.css');
const tabs = read('src/ui/hyperflow-tabs.js');
const polish = read('src/ui/flow-polish.js');
const doctor = read('src/ui/flow-doctor.js');
assert(html.includes('assets/css/pc-dock-reveal-hotfix.css'), 'pc dock hotfix stylesheet loaded');
assert(comfortCss.includes('grid-template-columns: repeat(8, minmax(0, 1fr))'), 'workspace comfort owns the readable desktop 8-tab grid');
assert(css.includes('grid-template-columns: none !important'), 'desktop dock removes squeezed status grid columns');
assert(foundationCss.includes('font-size: 12px !important'), 'foundation polish owns the final desktop dock label size');
assert(css.includes('grid-template-columns: repeat(4, minmax(0, 1fr))'), 'tablet/mobile dock preserves 4+4 layout');
assert(css.includes('animation: none !important'), 'candidate guide shimmer disabled');
assert(html.includes('<b>파일 열기</b>'), 'dock file tab label is 파일 열기');
assert(tabs.includes('force: true'), 'dock tab navigation forces workspace reveal');
assert(tabs.includes('if (alreadyComfortable && !opts.force) return;'), 'reveal logic can bypass already-visible guard');
const targetTitle = '후보 카드를 선택하세요';
const targetMeta = '후보 탭에서 마음에 드는 구간을 누르면 미리보기로 자동 이동합니다.';
assert(polish.includes(targetTitle) && doctor.includes(targetTitle), 'candidate guide title text is unified');
assert(polish.includes(targetMeta) && doctor.includes(targetMeta), 'candidate guide meta text is unified');
