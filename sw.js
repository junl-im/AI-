// AI Shorts Studio v1.0.1 service worker
'use strict';

const CACHE_NAME = 'ai-shorts-studio-shell-v1.0.1-responsive-layout';
const SHELL_FILES = [
    './',
    './index.html',
    './manifest.webmanifest',
    './assets/css/theme.css?v=1.0.1-responsive-layout',
    './assets/css/studio.css?v=1.0.1-responsive-layout',
    './assets/css/editor.css?v=1.0.1-responsive-layout',
    './assets/css/ux.css?v=1.0.1-responsive-layout',
    './assets/css/advanced-editor.css?v=1.0.1-responsive-layout',
    './assets/css/layout-dock.css?v=1.0.1-responsive-layout',
    './assets/css/caption-pro.css?v=1.0.1-responsive-layout',
    './assets/css/quality-tools.css?v=1.0.1-responsive-layout',
    './assets/css/auto-cut.css?v=1.0.1-responsive-layout',
    './assets/css/cut-markers.css?v=1.0.1-responsive-layout',
    './assets/css/feedback-ux.css?v=1.0.1-responsive-layout',
    './assets/css/engine-panel.css?v=1.0.1-responsive-layout',
    './assets/css/pro-engine.css?v=1.0.1-responsive-layout',
    './assets/css/hyperflow-tabs.css?v=1.0.1-responsive-layout',
    './assets/css/render-queue.css?v=1.0.1-responsive-layout',
    './assets/css/hyperconnect-flow.css?v=1.0.1-responsive-layout',
    './assets/css/flow-polish.css?v=1.0.1-responsive-layout',
    './assets/css/flow-hotfix.css?v=1.0.1-responsive-layout',
    './assets/css/flow-integrity.css?v=1.0.1-responsive-layout',
    './assets/css/flow-doctor.css?v=1.0.1-responsive-layout',
    './assets/css/cinematic-hero.css?v=1.0.1-responsive-layout',
    './assets/css/responsive-workspace.css?v=1.0.1-responsive-layout',
    './assets/icons/ai-shorts.svg',
    './src/config/app-runtime-config.js?v=1.0.1-responsive-layout',
    './src/utils/core-utils.js?v=1.0.1-responsive-layout',
    './src/state/app-state.js?v=1.0.1-responsive-layout',
    './src/analysis/audio-feature-extractor.js?v=1.0.1-responsive-layout',
    './src/analysis/video-motion-analyzer.js?v=1.0.1-responsive-layout',
    './src/analysis/auto-cut-detector.js?v=1.0.1-responsive-layout',
    './src/recommendation/shorts-recommendation-engine.js?v=1.0.1-responsive-layout',
    './src/engine/module-registry.js?v=1.0.1-responsive-layout',
    './src/engine/module-contracts.js?v=1.0.1-responsive-layout',
    './src/engine/analysis-cache.js?v=1.0.1-responsive-layout',
    './src/engine/performance-budget.js?v=1.0.1-responsive-layout',
    './src/engine/analysis-pipeline.js?v=1.0.1-responsive-layout',
    './src/engine/scoring-pipeline.js?v=1.0.1-responsive-layout',
    './src/engine/pro-engine-tuner.js?v=1.0.1-responsive-layout',
    './src/engine/stability-auditor.js?v=1.0.1-responsive-layout',
    './src/engine/engine-kernel.js?v=1.0.1-responsive-layout',
    './src/caption/caption-service.js?v=1.0.1-responsive-layout',
    './src/project/project-service.js?v=1.0.1-responsive-layout',
    './src/render/quality-effects.js?v=1.0.1-responsive-layout',
    './src/render/vertical-renderer.js?v=1.0.1-responsive-layout',
    './src/download/download-service.js?v=1.0.1-responsive-layout',
    './src/ui/waveform-view.js?v=1.0.1-responsive-layout',
    './src/ui/cut-marker-overlay.js?v=1.0.1-responsive-layout',
    './src/ui/timeline-view.js?v=1.0.1-responsive-layout',
    './src/ui/ux-controls.js?v=1.0.1-responsive-layout',
    './src/ui/range-drag-controls.js?v=1.0.1-responsive-layout',
    './src/ui/bottom-dock.js?v=1.0.1-responsive-layout',
    './src/ui/feedback-ux.js?v=1.0.1-responsive-layout',
    './src/ui/flow-polish.js?v=1.0.1-responsive-layout',
    './src/ui/flow-hotfix.js?v=1.0.1-responsive-layout',
    './src/render/render-queue.js?v=1.0.1-responsive-layout',
    './src/ui/hyperflow-tabs.js?v=1.0.1-responsive-layout',
    './src/ui/hyperconnect-flow.js?v=1.0.1-responsive-layout',
    './src/ui/flow-integrity.js?v=1.0.1-responsive-layout',
    './src/ui/flow-doctor.js?v=1.0.1-responsive-layout',
    './src/security/site-guards.js?v=1.0.1-responsive-layout',
    './src/boot/runtime-health.js?v=1.0.1-responsive-layout',
    './src/app.js?v=1.0.1-responsive-layout',
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
