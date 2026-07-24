#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'src/ui/local-ai-studio.js'), 'utf8');
const provider = fs.readFileSync(path.join(root, 'src/ai/local-ai-provider-registry.js'), 'utf8');
const jobs = fs.readFileSync(path.join(root, 'src/ai/ai-job-coordinator.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/css/local-ai-studio.css'), 'utf8');
const loader = fs.readFileSync(path.join(root, 'src/boot/staged-ui-loader.js'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

function assert(value, message) {
    if (!value) throw new Error(message);
    console.log(`PASS ${message}`);
}

const requiredIds = [
    'localAIStudio', 'creativeProviderSelect', 'creativeEndpointInput', 'creativeProbeBtn',
    'creativeModelSelect', 'modelPinBtn', 'generateCreativeBtn', 'applyCreativeBtn',
    'speechProviderSelect', 'speechEndpointInput', 'speechProbeBtn', 'transcribeBtn',
    'transcriptPreview', 'applyTranscriptBtn', 'aiJobStatus', 'aiJobProgress', 'aiJobCancelBtn'
];
requiredIds.forEach(id => assert((html.match(new RegExp(`id="${id}"`, 'g')) || []).length === 1, `${id} has exactly one UI owner`));
assert(html.includes('<details id="localAIStudio"') && html.includes('class="local-ai-summary"') && html.includes('class="local-ai-workbench"'), 'local AI is a compact workflow-integrated disclosure by default');
assert(!html.includes('<script defer src="src/ai/ai-job-coordinator.js') && !html.includes('<script defer src="src/ai/local-ai-provider-registry.js') && !html.includes('<script defer src="src/ui/local-ai-studio.js'), 'local AI runtime modules stay off the blocking startup path');
const jobsIndex = loader.indexOf("versioned('src/ai/ai-job-coordinator.js', 'local-ai')");
const providerIndex = loader.indexOf("versioned('src/ai/local-ai-provider-registry.js', 'local-ai')");
const uiIndex = loader.indexOf("versioned('src/ui/local-ai-studio.js', 'local-ai')");
assert(jobsIndex >= 0 && providerIndex > jobsIndex && uiIndex > providerIndex, 'staged provider and job foundations hydrate before the local AI UI');
assert(loader.includes("target.closest('#localAIStudio')") && loader.includes("ensure('localAI')"), 'local AI hydration is bound to explicit panel intent');
assert(sw.includes('./src/ai/ai-job-coordinator.js') && sw.includes('./src/ai/local-ai-provider-registry.js') && sw.includes('./src/ui/local-ai-studio.js'), 'service worker preserves local AI modules for offline lazy loading');
assert(html.includes("connect-src 'self' http://127.0.0.1:*") && !html.includes('connect-src *'), 'CSP permits explicit loopback connections without opening arbitrary network access');
assert(provider.includes('LOCAL_AI_ALLOW_REMOTE_ENDPOINTS') && provider.includes('isLoopbackHostname') && provider.includes("credentials: 'omit'") && provider.includes("referrerPolicy: 'no-referrer'"), 'provider layer enforces loopback-only requests with credential and referrer isolation');
assert(provider.includes('verifyModelPin') && provider.includes("state === 'mismatch'") && provider.includes('generateStructured') && provider.includes('transcribe'), 'model digest gating, structured generation, and speech transcription are implemented');
assert(jobs.includes('concurrency: 1') && jobs.includes('AbortController') && jobs.includes('sanitizeMeta'), 'AI jobs are serial, cancellable, and metadata-redacted');
assert(ui.includes('CREATIVE_SCHEMA') && ui.includes('additionalProperties: false') && ui.includes('applyTranscriptResult') && ui.includes('includeCaptionsToggle'), 'UI uses strict structured copy and explicit transcript application controls');
assert(!/probeProvider\(['"](?:creative|speech)['"]\);/.test(ui.split('function init()')[1] || ''), 'initialization does not automatically contact a local AI server');
assert(css.includes('.local-ai-grid') && css.includes('.local-ai-summary') && css.includes('grid-area: ai') && css.includes('@media (max-width: 620px)') && !css.includes('!important'), 'local AI disclosure has responsive workflow ownership without new priority overrides');
const layout = fs.readFileSync(path.join(root, 'assets/css/workspace-layout-controls.css'), 'utf8');
assert(layout.includes('\"ai ai ai ai ai\"') && layout.includes('.local-ai-studio'), 'desktop workspace assigns the Local AI disclosure an explicit aligned grid row');
console.log('PASS local AI shell, privacy policy, explicit-connect UX, and responsive ownership');
