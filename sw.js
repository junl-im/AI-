// AI Shorts Studio v0.7.0 service worker
'use strict';

const CACHE_NAME = 'ai-shorts-studio-shell-v0.7.0-auto-cut';
const SHELL_FILES = [
    './',
    './index.html',
    './manifest.webmanifest',
    './assets/css/theme.css?v=0.7.0-auto-cut',
    './assets/css/studio.css?v=0.7.0-auto-cut',
    './assets/css/editor.css?v=0.7.0-auto-cut',
    './assets/css/ux.css?v=0.7.0-auto-cut',
    './assets/css/advanced-editor.css?v=0.7.0-auto-cut',
    './assets/css/layout-dock.css?v=0.7.0-auto-cut',
    './assets/css/caption-pro.css?v=0.7.0-auto-cut',
    './assets/css/quality-tools.css?v=0.7.0-auto-cut',
    './assets/css/auto-cut.css?v=0.7.0-auto-cut',
    './assets/icons/ai-shorts.svg',
    './src/config/app-runtime-config.js?v=0.7.0-auto-cut',
    './src/utils/core-utils.js?v=0.7.0-auto-cut',
    './src/state/app-state.js?v=0.7.0-auto-cut',
    './src/analysis/audio-feature-extractor.js?v=0.7.0-auto-cut',
    './src/analysis/video-motion-analyzer.js?v=0.7.0-auto-cut',
    './src/analysis/auto-cut-detector.js?v=0.7.0-auto-cut',
    './src/recommendation/shorts-recommendation-engine.js?v=0.7.0-auto-cut',
    './src/caption/caption-service.js?v=0.7.0-auto-cut',
    './src/project/project-service.js?v=0.7.0-auto-cut',
    './src/render/quality-effects.js?v=0.7.0-auto-cut',
    './src/render/vertical-renderer.js?v=0.7.0-auto-cut',
    './src/download/download-service.js?v=0.7.0-auto-cut',
    './src/ui/waveform-view.js?v=0.7.0-auto-cut',
    './src/ui/timeline-view.js?v=0.7.0-auto-cut',
    './src/ui/ux-controls.js?v=0.7.0-auto-cut',
    './src/ui/range-drag-controls.js?v=0.7.0-auto-cut',
    './src/ui/bottom-dock.js?v=0.7.0-auto-cut',
    './src/security/site-guards.js?v=0.7.0-auto-cut',
    './src/boot/runtime-health.js?v=0.7.0-auto-cut',
    './src/app.js?v=0.7.0-auto-cut',
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
