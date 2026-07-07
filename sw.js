// AI Shorts Studio v0.6.0 service worker
'use strict';

const CACHE_NAME = 'ai-shorts-studio-shell-v0.6.0-caption-pro';
const SHELL_FILES = [
    './',
    './index.html',
    './manifest.webmanifest',
    './assets/css/theme.css?v=0.6.0-output-pro',
    './assets/css/studio.css?v=0.6.0-output-pro',
    './assets/css/editor.css?v=0.6.0-output-pro',
    './assets/css/ux.css?v=0.6.0-output-pro',
    './assets/css/advanced-editor.css?v=0.6.0-output-pro',
    './assets/css/layout-dock.css?v=0.6.0-output-pro',
    './assets/css/caption-pro.css?v=0.6.0-output-pro',
    './assets/css/quality-tools.css?v=0.6.0-output-pro',
    './assets/icons/ai-shorts.svg',
    './src/config/app-runtime-config.js?v=0.6.0-output-pro',
    './src/utils/core-utils.js?v=0.6.0-output-pro',
    './src/state/app-state.js?v=0.6.0-output-pro',
    './src/analysis/audio-feature-extractor.js?v=0.6.0-output-pro',
    './src/analysis/video-motion-analyzer.js?v=0.6.0-output-pro',
    './src/recommendation/shorts-recommendation-engine.js?v=0.6.0-output-pro',
    './src/caption/caption-service.js?v=0.6.0-output-pro',
    './src/project/project-service.js?v=0.6.0-output-pro',
    './src/render/quality-effects.js?v=0.6.0-output-pro',
    './src/render/vertical-renderer.js?v=0.6.0-output-pro',
    './src/download/download-service.js?v=0.6.0-output-pro',
    './src/ui/waveform-view.js?v=0.6.0-output-pro',
    './src/ui/timeline-view.js?v=0.6.0-output-pro',
    './src/ui/ux-controls.js?v=0.6.0-output-pro',
    './src/ui/range-drag-controls.js?v=0.6.0-output-pro',
    './src/ui/bottom-dock.js?v=0.6.0-output-pro',
    './src/security/site-guards.js?v=0.6.0-output-pro',
    './src/boot/runtime-health.js?v=0.6.0-output-pro',
    './src/app.js?v=0.6.0-output-pro',
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
