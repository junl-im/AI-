#!/usr/bin/env node
'use strict';

const fs = require('fs');
const vm = require('vm');
const path = require('path');
const root = path.resolve(__dirname, '..');
const context = {
    window: {},
    console,
    Math,
    Number,
    String,
    Array,
    Object,
    JSON
};
context.window.AIShortsCoreUtils = {
    clamp(value, min, max) { return Math.min(max, Math.max(min, Number(value) || 0)); },
    formatRange(start, end) { return `${Math.round(start)}-${Math.round(end)}`; }
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'src/recommendation/shorts-recommendation-engine.js'), 'utf8'), context);
const engine = context.window.AIShortsRecommendationEngine;
const frames = [];
for (let t = 0; t < 130; t += 0.5) {
    const hot = t > 42 && t < 76;
    frames.push({
        time: t,
        rmsNorm: hot ? 0.86 : 0.24,
        peakNorm: hot ? 0.92 : 0.28,
        transientNorm: hot ? 0.72 : 0.18,
        silent: false
    });
}
const recs = engine.createRecommendations({ duration: 130, frames }, { duration: 130, frames: [] }, { duration: '30', style: 'impact', count: 3 });
if (!Array.isArray(recs) || recs.length < 1) {
    console.error('FAIL recommendations not created');
    process.exit(1);
}
if (!(recs[0].start >= 35 && recs[0].start <= 55)) {
    console.error('FAIL expected top recommendation near hot section, got ' + recs[0].start);
    process.exit(1);
}
if (!recs[0].reasons || !recs[0].reasons.length) {
    console.error('FAIL recommendation reasons missing');
    process.exit(1);
}
console.log('PASS recommendation engine smoke');
