#!/usr/bin/env node
'use strict';

const fs = require('fs');
const vm = require('vm');
const path = require('path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
const state = fs.readFileSync(path.join(root, 'src/state/app-state.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/css/auto-cut.css'), 'utf8');

const ids = [
  'autoCutSummary', 'tempoScoreText', 'silenceRiskText', 'cutCountText', 'autoCutTimelineList',
  'silenceThresholdInput', 'beatSensitivityInput', 'motionSensitivityInput', 'handlePaddingSelect',
  'autoTrimBtn', 'autoTrimAllBtn', 'refreshCutsBtn'
];
const missingIds = ids.filter(id => !html.includes(`id="${id}"`));
if (missingIds.length) throw new Error('missing auto cut anchors: ' + missingIds.join(', '));

const appTokens = ['AIShortsAutoCutDetector', 'buildAutoCutTimeline', 'renderAutoCutSummary', 'autoTrimSelectedRange', 'autoTrimAllRecommendations'];
const missingApp = appTokens.filter(token => !app.includes(token));
if (missingApp.length) throw new Error('missing app auto cut tokens: ' + missingApp.join(', '));
if (!state.includes('autoCuts') || !state.includes('autoCutOptions')) throw new Error('state auto cut fields missing');
if (!css.includes('.auto-cut-panel') || !css.includes('.auto-cut-pill')) throw new Error('auto cut css missing');

const context = { window: {}, console, Math, Number, String, Array, Object, JSON };
context.window.AIShortsCoreUtils = { clamp(value, min, max) { return Math.min(max, Math.max(min, Number(value) || 0)); } };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'src/analysis/auto-cut-detector.js'), 'utf8'), context);
const detector = context.window.AIShortsAutoCutDetector;
const audioFrames = [];
for (let t = 0; t < 60; t += 0.5) {
  const silent = t > 10 && t < 12;
  const beat = Math.abs((t % 4) - 0.5) < 0.01 || Math.abs((t % 4) - 2.5) < 0.01;
  audioFrames.push({ time: t, rmsNorm: silent ? 0.03 : 0.55, peakNorm: beat ? 0.9 : 0.4, transientNorm: beat ? 0.82 : 0.2, silent });
}
const motionFrames = [{ time: 15, diffNorm: 0.2 }, { time: 18, diffNorm: 0.8 }, { time: 30, diffNorm: 0.7 }];
const cuts = detector.createAutoCuts({ duration: 60, frames: audioFrames }, { duration: 60, frames: motionFrames }, {});
if (!cuts.summary || cuts.summary.totalCuts < 3) throw new Error('expected cut points');
if (!cuts.silenceSegments.length) throw new Error('expected silence segment');
const recs = detector.enhanceRecommendations([{ id: 'r1', start: 8, end: 20, duration: 12, score: 70, reasons: [] }], cuts, {});
if (!recs[0].cutInfo || typeof recs[0].cutInfo.tempoScore !== 'number') throw new Error('cut insight missing');
const trimmed = detector.autoTrimRange(recs[0], cuts, { handlePadding: 0.7 }, 60);
if (!(trimmed.duration > 0 && trimmed.start >= 0 && trimmed.end <= 60)) throw new Error('trimmed range invalid');
console.log('PASS auto cut smoke');
