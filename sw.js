// AI Shorts Studio v0.9.5 service worker
'use strict';

const CACHE_NAME = 'ai-shorts-studio-shell-v0.9.5-hyperconnect';
const SHELL_FILES = [
    './',
    './index.html',
    './manifest.webmanifest',
    './assets/css/theme.css?v=0.9.5-hyperconnect',
    './assets/css/studio.css?v=0.9.5-hyperconnect',
    './assets/css/editor.css?v=0.9.5-hyperconnect',
    './assets/css/ux.css?v=0.9.5-hyperconnect',
    './assets/css/advanced-editor.css?v=0.9.5-hyperconnect',
    './assets/css/layout-dock.css?v=0.9.5-hyperconnect',
    './assets/css/caption-pro.css?v=0.9.5-hyperconnect',
    './assets/css/quality-tools.css?v=0.9.5-hyperconnect',
    './assets/css/auto-cut.css?v=0.9.5-hyperconnect',
    './assets/css/cut-markers.css?v=0.9.5-hyperconnect',
    './assets/css/feedback-ux.css?v=0.9.5-hyperconnect',
    './assets/css/engine-panel.css?v=0.9.5-hyperconnect',
    './assets/css/pro-engine.css?v=0.9.5-hyperconnect',
    './assets/icons/ai-shorts.svg',
    './src/config/app-runtime-config.js?v=0.9.5-hyperconnect',
    './src/utils/core-utils.js?v=0.9.5-hyperconnect',
    './src/state/app-state.js?v=0.9.5-hyperconnect',
    './src/analysis/audio-feature-extractor.js?v=0.9.5-hyperconnect',
    './src/analysis/video-motion-analyzer.js?v=0.9.5-hyperconnect',
    './src/analysis/auto-cut-detector.js?v=0.9.5-hyperconnect',
    './src/recommendation/shorts-recommendation-engine.js?v=0.9.5-hyperconnect',
    './src/engine/module-registry.js?v=0.9.5-hyperconnect',
    './src/engine/module-contracts.js?v=0.9.5-hyperconnect',
    './src/engine/analysis-cache.js?v=0.9.5-hyperconnect',
    './src/engine/performance-budget.js?v=0.9.5-hyperconnect',
    './src/engine/analysis-pipeline.js?v=0.9.5-hyperconnect',
    './src/engine/scoring-pipeline.js?v=0.9.5-hyperconnect',
    './src/engine/pro-engine-tuner.js?v=0.9.5-hyperconnect',
    './src/engine/stability-auditor.js?v=0.9.5-hyperconnect',
    './src/engine/engine-kernel.js?v=0.9.5-hyperconnect',
    './src/caption/caption-service.js?v=0.9.5-hyperconnect',
    './src/project/project-service.js?v=0.9.5-hyperconnect',
    './src/render/quality-effects.js?v=0.9.5-hyperconnect',
    './src/render/vertical-renderer.js?v=0.9.5-hyperconnect',
    './src/download/download-service.js?v=0.9.5-hyperconnect',
    './src/ui/waveform-view.js?v=0.9.5-hyperconnect',
    './src/ui/cut-marker-overlay.js?v=0.9.5-hyperconnect',
    './src/ui/timeline-view.js?v=0.9.5-hyperconnect',
    './src/ui/ux-controls.js?v=0.9.5-hyperconnect',
    './src/ui/range-drag-controls.js?v=0.9.5-hyperconnect',
    './src/ui/bottom-dock.js?v=0.9.5-hyperconnect',
    './src/ui/feedback-ux.js?v=0.9.5-hyperconnect',
    './src/security/site-guards.js?v=0.9.5-hyperconnect',
    './src/boot/runtime-health.js?v=0.9.5-hyperconnect',
    './src/app.js?v=0.9.5-hyperconnect',
    './src/workers/highlight-analysis.worker.js'
];

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
    event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
    const request = event.request;
    if (request.method !== 'GET') return;
    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;
    event.respondWith(caches.match(request).then(cached => cached || fetch(request)));
});
