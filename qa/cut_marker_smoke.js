#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

function read(file) {
    return fs.readFileSync(path.join(root, file), 'utf8');
}

function assertIncludes(file, needle) {
    const text = read(file);
    if (!text.includes(needle)) {
        console.error(`FAIL ${file} missing ${needle}`);
        process.exit(1);
    }
}

assertIncludes('index.html', 'cutMarkerOverlay');
assertIncludes('index.html', 'snapStartCutBtn');
assertIncludes('index.html', 'src/ui/cut-marker-overlay.js?v=1.3.1-workspace-control');
assertIncludes('assets/css/cut-markers.css', '.cut-marker-overlay');
assertIncludes('src/ui/cut-marker-overlay.js', 'renderCutMarkers');
assertIncludes('src/ui/cut-marker-overlay.js', 'summarizeFocusedPoint');
assertIncludes('src/app.js', 'renderCutMarkerLayer');
assertIncludes('src/app.js', 'snapSelectedBoundaryToNearestCut');
assertIncludes('sw.js', 'cut-marker-overlay.js?v=1.3.1-workspace-control');

console.log('PASS cut marker overlay smoke checks');
