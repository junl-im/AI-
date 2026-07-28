#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const configSource = fs.readFileSync(path.join(root, 'src/config/app-runtime-config.js'), 'utf8');
const buildKey = (configSource.match(/BUILD_KEY:\s*'([^']+)'/) || [])[1] || '';
const pkg = require(path.join(root, 'package.json'));

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
assertIncludes('index.html', `src/ui/cut-marker-overlay.js?v=${buildKey}`);
assertIncludes('assets/css/cut-markers.css', '.cut-marker-overlay');
assertIncludes('src/ui/cut-marker-overlay.js', 'renderCutMarkers');
assertIncludes('src/ui/cut-marker-overlay.js', 'summarizeFocusedPoint');
assertIncludes('src/app.js', 'renderCutMarkerLayer');
assertIncludes('src/app.js', 'snapSelectedBoundaryToNearestCut');
assertIncludes('sw.js', `cut-marker-overlay.js?v=${buildKey}`);

console.log('PASS cut marker overlay smoke checks');
