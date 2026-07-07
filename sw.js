// AI Shorts Studio v0.3.0 service worker
'use strict';

const CACHE_NAME = 'ai-shorts-studio-shell-v0.3.0-uiux-polish';
const SHELL_FILES = [
    './',
    './index.html',
    './manifest.webmanifest',
    './assets/css/theme.css?v=0.3.0-uiux-polish',
    './assets/css/studio.css?v=0.3.0-uiux-polish',
    './assets/css/editor.css?v=0.3.0-uiux-polish',
    './assets/css/ux.css?v=0.3.0-uiux-polish',
    './assets/icons/ai-shorts.svg',
    './src/config/app-runtime-config.js?v=0.3.0-uiux-polish',
    './src/utils/core-utils.js?v=0.3.0-uiux-polish',
    './src/state/app-state.js?v=0.3.0-uiux-polish',
    './src/analysis/audio-feature-extractor.js?v=0.3.0-uiux-polish',
    './src/analysis/video-motion-analyzer.js?v=0.3.0-uiux-polish',
    './src/recommendation/shorts-recommendation-engine.js?v=0.3.0-uiux-polish',
    './src/caption/caption-service.js?v=0.3.0-uiux-polish',
    './src/project/project-service.js?v=0.3.0-uiux-polish',
    './src/render/vertical-renderer.js?v=0.3.0-uiux-polish',
    './src/download/download-service.js?v=0.3.0-uiux-polish',
    './src/ui/waveform-view.js?v=0.3.0-uiux-polish',
    './src/ui/timeline-view.js?v=0.3.0-uiux-polish',
    './src/ui/ux-controls.js?v=0.3.0-uiux-polish',
    './src/security/site-guards.js?v=0.3.0-uiux-polish',
    './src/boot/runtime-health.js?v=0.3.0-uiux-polish',
    './src/app.js?v=0.3.0-uiux-polish',
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
