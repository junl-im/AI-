// AI Shorts Studio v0.8.0 service worker
'use strict';

const CACHE_NAME = 'ai-shorts-studio-shell-v0.8.0-cut-markers';
const SHELL_FILES = [
    './',
    './index.html',
    './manifest.webmanifest',
    './assets/css/theme.css?v=0.8.0-cut-markers',
    './assets/css/studio.css?v=0.8.0-cut-markers',
    './assets/css/editor.css?v=0.8.0-cut-markers',
    './assets/css/ux.css?v=0.8.0-cut-markers',
    './assets/css/advanced-editor.css?v=0.8.0-cut-markers',
    './assets/css/layout-dock.css?v=0.8.0-cut-markers',
    './assets/css/caption-pro.css?v=0.8.0-cut-markers',
    './assets/css/quality-tools.css?v=0.8.0-cut-markers',
    './assets/css/auto-cut.css?v=0.8.0-cut-markers',
    './assets/css/cut-markers.css?v=0.8.0-cut-markers',
    './assets/icons/ai-shorts.svg',
    './src/config/app-runtime-config.js?v=0.8.0-cut-markers',
    './src/utils/core-utils.js?v=0.8.0-cut-markers',
    './src/state/app-state.js?v=0.8.0-cut-markers',
    './src/analysis/audio-feature-extractor.js?v=0.8.0-cut-markers',
    './src/analysis/video-motion-analyzer.js?v=0.8.0-cut-markers',
    './src/analysis/auto-cut-detector.js?v=0.8.0-cut-markers',
    './src/recommendation/shorts-recommendation-engine.js?v=0.8.0-cut-markers',
    './src/caption/caption-service.js?v=0.8.0-cut-markers',
    './src/project/project-service.js?v=0.8.0-cut-markers',
    './src/render/quality-effects.js?v=0.8.0-cut-markers',
    './src/render/vertical-renderer.js?v=0.8.0-cut-markers',
    './src/download/download-service.js?v=0.8.0-cut-markers',
    './src/ui/waveform-view.js?v=0.8.0-cut-markers',
    './src/ui/cut-marker-overlay.js?v=0.8.0-cut-markers',
    './src/ui/timeline-view.js?v=0.8.0-cut-markers',
    './src/ui/ux-controls.js?v=0.8.0-cut-markers',
    './src/ui/range-drag-controls.js?v=0.8.0-cut-markers',
    './src/ui/bottom-dock.js?v=0.8.0-cut-markers',
    './src/security/site-guards.js?v=0.8.0-cut-markers',
    './src/boot/runtime-health.js?v=0.8.0-cut-markers',
    './src/app.js?v=0.8.0-cut-markers',
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
