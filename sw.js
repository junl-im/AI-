// AI Shorts Studio v0.8.2 service worker
'use strict';

const CACHE_NAME = 'ai-shorts-studio-shell-v0.8.2-brand-feedback';
const SHELL_FILES = [
    './',
    './index.html',
    './manifest.webmanifest',
    './assets/css/theme.css?v=0.8.2-brand-feedback',
    './assets/css/studio.css?v=0.8.2-brand-feedback',
    './assets/css/editor.css?v=0.8.2-brand-feedback',
    './assets/css/ux.css?v=0.8.2-brand-feedback',
    './assets/css/advanced-editor.css?v=0.8.2-brand-feedback',
    './assets/css/layout-dock.css?v=0.8.2-brand-feedback',
    './assets/css/caption-pro.css?v=0.8.2-brand-feedback',
    './assets/css/quality-tools.css?v=0.8.2-brand-feedback',
    './assets/css/auto-cut.css?v=0.8.2-brand-feedback',
    './assets/css/cut-markers.css?v=0.8.2-brand-feedback',
    './assets/icons/ai-shorts.svg',
    './src/config/app-runtime-config.js?v=0.8.2-brand-feedback',
    './src/utils/core-utils.js?v=0.8.2-brand-feedback',
    './src/state/app-state.js?v=0.8.2-brand-feedback',
    './src/analysis/audio-feature-extractor.js?v=0.8.2-brand-feedback',
    './src/analysis/video-motion-analyzer.js?v=0.8.2-brand-feedback',
    './src/analysis/auto-cut-detector.js?v=0.8.2-brand-feedback',
    './src/recommendation/shorts-recommendation-engine.js?v=0.8.2-brand-feedback',
    './src/caption/caption-service.js?v=0.8.2-brand-feedback',
    './src/project/project-service.js?v=0.8.2-brand-feedback',
    './src/render/quality-effects.js?v=0.8.2-brand-feedback',
    './src/render/vertical-renderer.js?v=0.8.2-brand-feedback',
    './src/download/download-service.js?v=0.8.2-brand-feedback',
    './src/ui/waveform-view.js?v=0.8.2-brand-feedback',
    './src/ui/cut-marker-overlay.js?v=0.8.2-brand-feedback',
    './src/ui/timeline-view.js?v=0.8.2-brand-feedback',
    './src/ui/ux-controls.js?v=0.8.2-brand-feedback',
    './src/ui/range-drag-controls.js?v=0.8.2-brand-feedback',
    './src/ui/bottom-dock.js?v=0.8.2-brand-feedback',
    './src/security/site-guards.js?v=0.8.2-brand-feedback',
    './src/boot/runtime-health.js?v=0.8.2-brand-feedback',
    './src/app.js?v=0.8.2-brand-feedback',
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
