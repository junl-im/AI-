#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const context = {
    window: {
        AIShortsCaptionService: {
            serializeCaptions(cues) { return (cues || []).map(cue => cue.text).join('\n'); }
        }
    }
};
context.global = context.window;
vm.createContext(context);
const source = fs.readFileSync(path.join(root, 'src/project/project-service.js'), 'utf8');
vm.runInContext(source, context, { filename: 'project-service.js' });

const svc = context.window.AIShortsProjectService;
if (!svc) throw new Error('project service was not exposed');
const state = {
    fileMeta: { name: 'song.mp3', duration: 120 },
    file: { name: 'song.mp3' },
    fileKind: 'audio',
    settings: { duration: '30', captionStyle: 'bold' },
    selectedRecommendationId: 'rec-1',
    selectedRange: { start: 10, end: 40 },
    recommendations: [{ id: 'rec-1', start: 10, end: 40, duration: 30 }],
    captions: [{ start: 10, end: 12, text: 'hello' }]
};
const snapshot = svc.createProjectSnapshot(state, 'title', '#tag');
if (snapshot.schemaVersion !== 5) throw new Error('snapshot schema version mismatch');
const parsed = svc.parseProjectText(JSON.stringify(snapshot));
const target = { settings: {}, recommendations: [], captions: [] };
svc.applyProjectSnapshot(target, parsed);
if (target.recommendations.length !== 1 || target.captions.length !== 1) throw new Error('project apply failed');
if (target.selectedRange.start !== 10) throw new Error('selected range not restored');
console.log('PASS project service smoke');
