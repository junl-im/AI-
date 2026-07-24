#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');

function assert(condition, message) {
    if (!condition) { console.error(`FAIL ${message}`); process.exit(1); }
    console.log(`PASS ${message}`);
}

const window = { AIShortsRuntimeConfig: {}, AIShortsCoreUtils: {}, AIShortsCaptionService: { serializeCaptions() { return ''; } } };
window.window = window;
const context = vm.createContext({ window, console, setTimeout, clearTimeout });
vm.runInContext(fs.readFileSync(path.join(root, 'src/vision/smart-reframe-engine.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'src/project/project-service.js'), 'utf8'), context);
const engine = window.AIShortsSmartReframe;

const cuts = engine.detectSceneCuts({ frames: [
    { time: 0, diffNorm: 0.04, motionX: 0.2, motionY: 0.4, spatialConfidence: 0.5 },
    { time: 1, diffNorm: 0.06, motionX: 0.22, motionY: 0.4, spatialConfidence: 0.5 },
    { time: 2, diffNorm: 0.92, motionX: 0.82, motionY: 0.4, spatialConfidence: 0.8 },
    { time: 3, diffNorm: 0.05, motionX: 0.8, motionY: 0.4, spatialConfidence: 0.5 }
] });
assert(cuts.length === 1 && cuts[0] === 2, 'abrupt visual changes become protected scene-cut boundaries');

const track = engine._test.buildTrack([
    { time: 0, x: 0.2, y: 0.44, confidence: 0.8, source: 'face' },
    { time: 1, x: 0.22, y: 0.44, confidence: 0.8, source: 'face' },
    { time: 2, x: 0.8, y: 0.42, confidence: 0.9, source: 'face' },
    { time: 3, x: 0.82, y: 0.42, confidence: 0.9, source: 'face' }
], 'face', {}, {}, {
    sceneCuts: [2],
    subjects: [
        { id: 'subject-1', label: '인물 1', points: [
            { time: 0, x: 0.2, y: 0.44, confidence: 0.9, source: 'face', subjectId: 'subject-1', scene: 0 },
            { time: 1, x: 0.22, y: 0.44, confidence: 0.9, source: 'face', subjectId: 'subject-1', scene: 0 }
        ], coverage: 0.5 },
        { id: 'subject-2', label: '인물 2', points: [
            { time: 2, x: 0.8, y: 0.42, confidence: 0.92, source: 'face', subjectId: 'subject-2', scene: 1 },
            { time: 3, x: 0.82, y: 0.42, confidence: 0.92, source: 'face', subjectId: 'subject-2', scene: 1 }
        ], coverage: 0.5 }
    ]
});
assert(track.version === 2 && track.subjects.length === 2 && track.sceneCuts.length === 1, 'track v2 preserves multiple subjects and scene cuts');
const beforeCut = engine.getFocusAt(track, 1.9);
const afterCut = engine.getFocusAt(track, 2.1);
assert(beforeCut.x < 0.4 && afterCut.x > 0.65, 'focus interpolation does not drag the previous scene across a hard cut');

const pinned = engine.selectSubject(track, 'subject-2');
assert(pinned.activeSubjectId === 'subject-2', 'a detected person can be manually pinned as the main subject');
assert(engine.getFocusAt(pinned, 2.5).x > 0.7, 'manual subject selection follows the selected person where visible');
assert(engine.getFocusAt(pinned, 0.5).x < 0.4, 'manual selection falls back safely when the selected person is absent');

let edited = engine.upsertKeyframe(pinned, { time: 1, x: 0.3, y: 0.3, zoom: 1.12 });
edited = engine.upsertKeyframe(edited, { time: 3, x: 0.7, y: 0.5, zoom: 1.24 });
const manual = engine.getFocusAt(edited, 2);
assert(edited.keyframes.length === 2 && manual.source === 'manual', 'manual crop keyframes override automatic focus');
assert(Math.abs(manual.x - 0.5) < 0.001 && Math.abs(manual.zoom - 1.18) < 0.001, 'crop position and zoom interpolate between keyframes');
const removed = engine.removeKeyframe(edited, 1.05, 0.1);
assert(removed.keyframes.length === 1, 'a keyframe can be removed at the current playhead');
assert(engine.clearKeyframes(removed).keyframes.length === 0, 'all manual crop edits can be reset safely');

window.__editedTrack = edited;
const project = vm.runInContext(`window.AIShortsProjectService.createProjectSnapshot({
    settings: { cropMode: 'smart', smartReframeOptions: { captionAvoidance: true, sceneCutProtection: true } },
    smartReframeEdits: window.AIShortsSmartReframe.extractEdits(window.__editedTrack),
    recommendations: [], captions: [], fileMeta: null
}, '', '')`, context);
assert(project.smartReframeEdits.subjectId === 'subject-2' && project.smartReframeEdits.keyframes.length === 2, 'project export preserves subject pin and crop keyframes');
const importedState = vm.runInContext(`(() => {
    const state = { settings: {}, recommendations: [], captions: [] };
    window.AIShortsProjectService.applyProjectSnapshot(state, ${JSON.stringify(project)});
    return state;
})()`, context);
assert(importedState.smartReframeEdits.subjectId === 'subject-2' && importedState.smartReframeEdits.keyframes[1].zoom === 1.24, 'project import restores sanitized smart-reframe edits');

console.log('PASS smart reframe director smoke complete');
