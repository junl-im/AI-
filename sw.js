// AI Shorts Studio v0.9.3 service worker
'use strict';

const CACHE_NAME = 'ai-shorts-studio-shell-v0.9.3-pro-engine';
const SHELL_FILES = [
    './',
    './index.html',
    './manifest.webmanifest',
    './assets/css/theme.css?v=0.9.3-pro-engine',
    './assets/css/studio.css?v=0.9.3-pro-engine',
    './assets/css/editor.css?v=0.9.3-pro-engine',
    './assets/css/ux.css?v=0.9.3-pro-engine',
    './assets/css/advanced-editor.css?v=0.9.3-pro-engine',
    './assets/css/layout-dock.css?v=0.9.3-pro-engine',
    './assets/css/caption-pro.css?v=0.9.3-pro-engine',
    './assets/css/quality-tools.css?v=0.9.3-pro-engine',
    './assets/css/auto-cut.css?v=0.9.3-pro-engine',
    './assets/css/cut-markers.css?v=0.9.3-pro-engine',
    './assets/css/feedback-ux.css?v=0.9.3-pro-engine',
    './assets/css/engine-panel.css?v=0.9.3-pro-engine',
    './assets/css/pro-engine.css?v=0.9.3-pro-engine',
    './assets/icons/ai-shorts.svg',
    './src/config/app-runtime-config.js?v=0.9.3-pro-engine',
    './src/utils/core-utils.js?v=0.9.3-pro-engine',
    './src/state/app-state.js?v=0.9.3-pro-engine',
    './src/analysis/audio-feature-extractor.js?v=0.9.3-pro-engine',
    './src/analysis/video-motion-analyzer.js?v=0.9.3-pro-engine',
    './src/analysis/auto-cut-detector.js?v=0.9.3-pro-engine',
    './src/recommendation/shorts-recommendation-engine.js?v=0.9.3-pro-engine',
    './src/engine/module-registry.js?v=0.9.3-pro-engine',
    './src/engine/module-contracts.js?v=0.9.3-pro-engine',
    './src/engine/analysis-cache.js?v=0.9.3-pro-engine',
    './src/engine/performance-budget.js?v=0.9.3-pro-engine',
    './src/engine/analysis-pipeline.js?v=0.9.3-pro-engine',
    './src/engine/scoring-pipeline.js?v=0.9.3-pro-engine',
    './src/engine/pro-engine-tuner.js?v=0.9.3-pro-engine',
    './src/engine/stability-auditor.js?v=0.9.3-pro-engine',
    './src/engine/engine-kernel.js?v=0.9.3-pro-engine',
    './src/caption/caption-service.js?v=0.9.3-pro-engine',
    './src/project/project-service.js?v=0.9.3-pro-engine',
    './src/render/quality-effects.js?v=0.9.3-pro-engine',
    './src/render/vertical-renderer.js?v=0.9.3-pro-engine',
    './src/download/download-service.js?v=0.9.3-pro-engine',
    './src/ui/waveform-view.js?v=0.9.3-pro-engine',
    './src/ui/cut-marker-overlay.js?v=0.9.3-pro-engine',
    './src/ui/timeline-view.js?v=0.9.3-pro-engine',
    './src/ui/ux-controls.js?v=0.9.3-pro-engine',
    './src/ui/range-drag-controls.js?v=0.9.3-pro-engine',
    './src/ui/bottom-dock.js?v=0.9.3-pro-engine',
    './src/ui/feedback-ux.js?v=0.9.3-pro-engine',
    './src/security/site-guards.js?v=0.9.3-pro-engine',
    './src/boot/runtime-health.js?v=0.9.3-pro-engine',
    './src/app.js?v=0.9.3-pro-engine',
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
