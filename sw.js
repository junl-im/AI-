// AI Shorts Studio v0.4.1 service worker
'use strict';

const CACHE_NAME = 'ai-shorts-studio-shell-v0.4.1-layout-dock';
const SHELL_FILES = [
    './',
    './index.html',
    './manifest.webmanifest',
    './assets/css/theme.css?v=0.4.1-layout-dock',
    './assets/css/studio.css?v=0.4.1-layout-dock',
    './assets/css/editor.css?v=0.4.1-layout-dock',
    './assets/css/ux.css?v=0.4.1-layout-dock',
    './assets/css/advanced-editor.css?v=0.4.1-layout-dock',
    './assets/css/layout-dock.css?v=0.4.1-layout-dock',
    './assets/icons/ai-shorts.svg',
    './src/config/app-runtime-config.js?v=0.4.1-layout-dock',
    './src/utils/core-utils.js?v=0.4.1-layout-dock',
    './src/state/app-state.js?v=0.4.1-layout-dock',
    './src/analysis/audio-feature-extractor.js?v=0.4.1-layout-dock',
    './src/analysis/video-motion-analyzer.js?v=0.4.1-layout-dock',
    './src/recommendation/shorts-recommendation-engine.js?v=0.4.1-layout-dock',
    './src/caption/caption-service.js?v=0.4.1-layout-dock',
    './src/project/project-service.js?v=0.4.1-layout-dock',
    './src/render/vertical-renderer.js?v=0.4.1-layout-dock',
    './src/download/download-service.js?v=0.4.1-layout-dock',
    './src/ui/waveform-view.js?v=0.4.1-layout-dock',
    './src/ui/timeline-view.js?v=0.4.1-layout-dock',
    './src/ui/ux-controls.js?v=0.4.1-layout-dock',
    './src/ui/range-drag-controls.js?v=0.4.1-layout-dock',
    './src/ui/bottom-dock.js?v=0.4.1-layout-dock',
    './src/security/site-guards.js?v=0.4.1-layout-dock',
    './src/boot/runtime-health.js?v=0.4.1-layout-dock',
    './src/app.js?v=0.4.1-layout-dock',
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
