// AI Shorts Studio v0.2.0 service worker
'use strict';

const CACHE_NAME = 'ai-shorts-studio-shell-v0.2.0-editor-caption-project';
const SHELL_FILES = [
    './',
    './index.html',
    './manifest.webmanifest',
    './assets/css/theme.css?v=0.2.0-editor-caption-project',
    './assets/css/studio.css?v=0.2.0-editor-caption-project',
    './assets/css/editor.css?v=0.2.0-editor-caption-project',
    './assets/icons/ai-shorts.svg',
    './src/config/app-runtime-config.js?v=0.2.0-editor-caption-project',
    './src/utils/core-utils.js?v=0.2.0-editor-caption-project',
    './src/state/app-state.js?v=0.2.0-editor-caption-project',
    './src/analysis/audio-feature-extractor.js?v=0.2.0-editor-caption-project',
    './src/analysis/video-motion-analyzer.js?v=0.2.0-editor-caption-project',
    './src/recommendation/shorts-recommendation-engine.js?v=0.2.0-editor-caption-project',
    './src/caption/caption-service.js?v=0.2.0-editor-caption-project',
    './src/project/project-service.js?v=0.2.0-editor-caption-project',
    './src/render/vertical-renderer.js?v=0.2.0-editor-caption-project',
    './src/download/download-service.js?v=0.2.0-editor-caption-project',
    './src/ui/waveform-view.js?v=0.2.0-editor-caption-project',
    './src/ui/timeline-view.js?v=0.2.0-editor-caption-project',
    './src/security/site-guards.js?v=0.2.0-editor-caption-project',
    './src/boot/runtime-health.js?v=0.2.0-editor-caption-project',
    './src/app.js?v=0.2.0-editor-caption-project',
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
