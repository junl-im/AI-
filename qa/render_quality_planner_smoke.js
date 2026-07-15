// AI Shorts Studio v1.2.1 - Render quality planner smoke test
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const assert = (condition, message) => {
    if (!condition) {
        console.error(`FAIL: ${message}`);
        process.exit(1);
    }
};

const html = read('index.html');
const css = read('assets/css/render-quality-planner.css');
const js = read('src/ui/render-quality-planner.js');
const app = read('src/app.js');
const renderer = read('src/render/vertical-renderer.js');
const sw = read('sw.js');
const pkg = JSON.parse(read('package.json'));

assert(html.includes('assets/css/render-quality-planner.css'), 'render quality CSS is linked in HTML');
assert(html.includes('src/ui/render-quality-planner.js'), 'render quality planner script is linked in HTML');
assert(sw.includes('render-quality-planner.css') && sw.includes('render-quality-planner.js'), 'service worker caches render quality assets');
assert(js.includes('fast') && js.includes('balanced') && js.includes('high'), 'three render presets are defined');
assert(js.includes('예상 시간') || css.includes('render-estimate'), 'render estimates are represented');
assert(js.includes('모바일 저장 팁'), 'mobile save guide exists');
assert(app.includes('getExportFrameRate') && app.includes('getExportBitrate'), 'app reads render preset for export');
assert(app.includes('videoBitsPerSecond: getExportBitrate()'), 'export passes bitrate to renderer');
assert(renderer.includes('videoBitsPerSecond'), 'vertical renderer accepts bitrate option');
assert(pkg.qaChecks.includes('node qa/render_quality_planner_smoke.js'), 'QA runner includes render quality planner smoke test');
console.log('render_quality_planner_smoke: ok');
