// AI Shorts Studio v0.4.0 service worker
'use strict';

const CACHE_NAME = 'ai-shorts-studio-shell-v0.4.0-drag-batch';
const SHELL_FILES = [
    './',
    './index.html',
    './manifest.webmanifest',
    './assets/css/theme.css?v=0.4.0-drag-batch',
    './assets/css/studio.css?v=0.4.0-drag-batch',
    './assets/css/editor.css?v=0.4.0-drag-batch',
    './assets/css/ux.css?v=0.4.0-drag-batch',
    './assets/css/advanced-editor.css?v=0.4.0-drag-batch',
    './assets/icons/ai-shorts.svg',
    './src/config/app-runtime-config.js?v=0.4.0-drag-batch',
    './src/utils/core-utils.js?v=0.4.0-drag-batch',
    './src/state/app-state.js?v=0.4.0-drag-batch',
    './src/analysis/audio-feature-extractor.js?v=0.4.0-drag-batch',
    './src/analysis/video-motion-analyzer.js?v=0.4.0-drag-batch',
    './src/recommendation/shorts-recommendation-engine.js?v=0.4.0-drag-batch',
    './src/caption/caption-service.js?v=0.4.0-drag-batch',
    './src/project/project-service.js?v=0.4.0-drag-batch',
    './src/render/vertical-renderer.js?v=0.4.0-drag-batch',
    './src/download/download-service.js?v=0.4.0-drag-batch',
    './src/ui/waveform-view.js?v=0.4.0-drag-batch',
    './src/ui/timeline-view.js?v=0.4.0-drag-batch',
    './src/ui/ux-controls.js?v=0.4.0-drag-batch',
    './src/ui/range-drag-controls.js?v=0.4.0-drag-batch',
    './src/security/site-guards.js?v=0.4.0-drag-batch',
    './src/boot/runtime-health.js?v=0.4.0-drag-batch',
    './src/app.js?v=0.4.0-drag-batch',
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
