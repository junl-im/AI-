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
const css = read('assets/css/workspace-comfort.css');
const js = read('src/ui/workspace-comfort.js');
const sw = read('sw.js');
const pkg = JSON.parse(read('package.json'));

if (pkg.version !== '1.2.0') fail('package version must be 1.2.0');
assertIncludes('index.html', 'assets/css/workspace-comfort.css?v=1.2.0-workspace-comfort');
assertIncludes('index.html', 'src/ui/workspace-comfort.js?v=1.2.0-workspace-comfort');
assertIncludes('sw.js', 'workspace-comfort.css?v=1.2.0-workspace-comfort');
assertIncludes('sw.js', 'workspace-comfort.js?v=1.2.0-workspace-comfort');
['is-workspace-revealed', 'recommendation-card::before', 'grid-template-columns: repeat(8', 'recommendation-list:not(.empty-state)'].forEach(token => {
    if (!css.includes(token)) fail(`workspace CSS missing ${token}`);
});
['AIShortsWorkspaceComfort', 'reveal(', 'decorateCards', 'stabilizeGuide', 'data-flow-tab', 'recommendation-card'].forEach(token => {
    if (!js.includes(token)) fail(`workspace JS missing ${token}`);
});
if (!html.includes('>v1.2.0</button>')) fail('header version badge must be v1.2.0');
if (!html.includes('Design by <strong>곰같은여우</strong>')) fail('designer signature missing');
console.log('PASS workspace comfort polish linked, cached, and guarded');
