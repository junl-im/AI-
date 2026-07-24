'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
function ok(value, message) { if (!value) throw new Error(message); }
const provider = fs.readFileSync(path.join(root, 'src/ai/local-ai-provider-registry.js'), 'utf8');
const studio = fs.readFileSync(path.join(root, 'src/ui/local-ai-studio.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
ok(provider.includes('segment.speaker || segment.speaker_id || segment.speakerLabel'), 'provider preserves local diarization labels');
ok(studio.includes("'ai-shorts-transcript-ready'") && studio.includes("'ai-shorts-transcript-applied'"), 'local AI studio publishes transcript lifecycle events');
ok(app.includes('linkSpeakerFaces') && app.includes('smartReframeSpeakerPriorityToggle'), 'app connects transcript events to speaker-directed smart reframe');
console.log('PASS local transcript speaker labels and event bridge guardrails');
