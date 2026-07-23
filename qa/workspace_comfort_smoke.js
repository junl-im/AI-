#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function fail(message) { console.error('FAIL workspace comfort:', message); process.exit(1); }
function assertIncludes(file, token) {
    const text = read(file);
    if (!text.includes(token)) fail(`${file} missing ${token}`);
}

const html = read('index.html');
const loader = read('src/boot/staged-ui-loader.js');
const css = read('assets/css/workspace-comfort.css');
const js = read('src/ui/workspace-comfort.js');
const sw = read('sw.js');
const pkg = JSON.parse(read('package.json'));

if (pkg.version !== '1.5.25') fail('package version must be 1.2.9');
assertIncludes('index.html', 'assets/css/workspace-comfort.css?v=1.5.25-persistent-analysis-selective-recovery-integrity-audit');
if (!loader.includes("versioned('src/ui/workspace-comfort.js', 'shell')")) fail('workspace comfort script must be staged');
assertIncludes('sw.js', 'workspace-comfort.css?v=1.5.25-persistent-analysis-selective-recovery-integrity-audit');
if (!sw.includes('async function cacheFirst')) fail('workspace comfort must use runtime cache-first loading');
['is-workspace-revealed', 'recommendation-card::before', 'grid-template-columns: repeat(8', 'recommendation-list:not(.empty-state)'].forEach(token => {
    if (!css.includes(token)) fail(`workspace CSS missing ${token}`);
});
['AIShortsWorkspaceComfort', 'reveal(', 'decorateCards', 'stabilizeGuide', 'data-flow-tab', 'recommendation-card'].forEach(token => {
    if (!js.includes(token)) fail(`workspace JS missing ${token}`);
});
if (!html.includes('>v1.5.25</button>')) fail('header version badge must be v1.5.25');
if (!html.includes('class="signature-label">DESIGNED BY</span><strong>곰같은여우</strong>')) fail('designer signature missing');
console.log('PASS workspace comfort polish linked, cached, and guarded');
