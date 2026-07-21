#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`PASS ${message}`);
}

const window = {
  AIShortsRuntimeConfig: {
    MAX_PROJECT_TEXT_CHARS: 4096,
    MAX_PROJECT_RECOMMENDATIONS: 3,
    MAX_PROJECT_CAPTIONS: 2,
    MAX_PROJECT_MEDIA_SECONDS: 3600
  },
  AIShortsCaptionService: { serializeCaptions: cues => (cues || []).map(item => item.text).join('\n') }
};
window.window = window;
const context = vm.createContext({ window, console });
vm.runInContext(fs.readFileSync(path.join(root, 'src/project/project-service.js'), 'utf8'), context);
const service = window.AIShortsProjectService;
assert(service && service.CURRENT_SCHEMA_VERSION === 3, 'project schema guard is exposed at version 3');

const payload = JSON.stringify({
  app: 'AI Shorts Studio',
  schemaVersion: 3,
  settings: JSON.parse('{"__proto__":{"polluted":true},"style":"balanced","unknown":"drop","captionOptions":{"size":60,"evil":"drop"}}'),
  selectedRecommendationId: 'missing',
  recommendations: [
    { id: 'a', start: -10, end: 20, score: 999, title: '<img onerror=1>', reasons: ['ok'] },
    { id: 'b', start: 40, end: 30, score: -4, title: 'B' },
    { id: 'c', start: 60, end: 90, score: 80, title: 'C' },
    { id: 'd', start: 100, end: 130, score: 70, title: 'D' }
  ],
  captions: [
    { start: -1, end: 1, text: 'first' },
    { start: 2, end: 3, text: 'second' },
    { start: 4, end: 5, text: 'third' }
  ],
  copy: { title: 'x'.repeat(800), hashtags: '#tag' }
});
const parsed = service.parseProjectText(payload);
assert(parsed.recommendations.length === 3, 'project recommendation count is bounded');
assert(parsed.captions.length === 2, 'project caption count is bounded');
assert(parsed.recommendations[0].start === 0 && parsed.recommendations[0].score === 100, 'candidate ranges and scores are clamped');
assert(parsed.recommendations[1].end > parsed.recommendations[1].start, 'invalid candidate end time is repaired');
assert(parsed.selectedRecommendationId === 'a', 'missing selected candidate falls back safely');
assert(parsed.settings.style === 'balanced' && !('unknown' in parsed.settings), 'only supported top-level settings are restored');
assert(!('evil' in parsed.settings.captionOptions) && !parsed.settings.polluted, 'nested settings and prototype keys are filtered');
assert(parsed.copy.title.length === 500, 'project copy strings are bounded');
const boundary = service.parseProjectText(JSON.stringify({
  app: 'AI Shorts Studio', schemaVersion: 3,
  recommendations: [{ id: 'edge', start: 3600, end: 9999, title: 'edge' }],
  captions: [{ start: 3600, end: 9999, text: 'edge' }],
  selectedRange: { start: 3600, end: 9999 }
}));
assert(boundary.recommendations[0].end <= 3600 && boundary.recommendations[0].duration > 0, 'candidate intervals stay positive without exceeding the media ceiling');
assert(boundary.captions[0].end <= 3600 && boundary.captions[0].end > boundary.captions[0].start, 'caption intervals stay inside the media ceiling');

let futureRejected = false;
try { service.parseProjectText('{"app":"AI Shorts Studio","schemaVersion":99,"recommendations":[]}'); } catch (error) { futureRejected = /최신 버전/.test(error.message); }
assert(futureRejected, 'future project schemas are rejected with an update message');

let oversizedRejected = false;
try { service.parseProjectText('{' + ' '.repeat(5000)); } catch (error) { oversizedRejected = /너무 큽니다/.test(error.message); }
assert(oversizedRejected, 'oversized project text is rejected before JSON parsing');

const app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
const session = fs.readFileSync(path.join(root, 'src/ui/session-continuity.js'), 'utf8');
assert(app.includes('MAX_PROJECT_FILE_BYTES') && app.includes("type: 'project-file-too-large'"), 'project file reader has a byte-size preflight');
assert(app.includes('MAX_CAPTION_FILE_BYTES') && app.includes("type: 'caption-file-too-large'"), 'caption file reader has a byte-size preflight');
assert(app.includes('if (store.saveSettings) store.saveSettings();'), 'imported project settings are persisted');
assert(app.includes('state.mediaSessionId !== mediaSessionId || state.file !== file'), 'stale delayed auto-analysis is discarded');
assert(app.includes("if (els.fileInput) els.fileInput.value = '';"), 'the same media file can be selected again');
assert(session.includes('projectService.parseProjectText') && session.includes('MAX_SNAPSHOT_CHARS'), 'session restore reuses bounded project validation');

console.log('PASS v1.5.0 project import, session restore, and file-size exception guardrails');
