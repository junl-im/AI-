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

const html = read('index.html');
const refinement = read('assets/css/ui-refinement.css');
const comfort = read('assets/css/workspace-comfort.css');
const pcHotfix = read('assets/css/pc-dock-reveal-hotfix.css');
const dockMarkup = (html.match(/<nav[^>]*class="bottom-dock-tabs"[^>]*>[\s\S]*?<\/nav>/) || [''])[0];
const tabs = (dockMarkup.match(/data-flow-tab=/g) || []).length;

assert(tabs === 8, 'menu bar keeps exactly eight workflow destinations');
assert(refinement.includes('width: min(1080px, calc(100% - 28px)) !important'), 'desktop menu frame uses a wider but viewport-safe width');
assert(refinement.includes('body[data-ui="hyperflow-tabs"] .bottom-dock-tabs {\n    width: 100% !important;'), 'menu rail is explicitly contained by its parent frame');
assert(refinement.includes('max-width: 100% !important;') && refinement.includes('min-width: 0 !important;'), 'menu rail cannot retain an oversized legacy minimum');
assert(comfort.includes('grid-template-columns: repeat(8, minmax(0, 1fr)) !important'), 'desktop comfort layer no longer forces 112px minimum columns');
assert(!comfort.includes('--comfort-dock-max') && !comfort.includes('minmax(112px, 1fr)'), 'obsolete 1180px-plus inner rail constraint is removed');
assert(pcHotfix.includes('@media (min-width: 721px) and (max-width: 1179px)') && pcHotfix.includes('repeat(8, minmax(0, 1fr))'), 'small PC and tablet widths use a compact single-row eight-tab layout');
console.log('PASS v1.5.16 PC menu containment guardrails present');
