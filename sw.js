// AI Shorts Studio v1.0.6 service worker - Motion Stability Polish
'use strict';

const CACHE_NAME = 'ai-shorts-studio-shell-v1.0.6-motion-stability';
const SHELL_FILES = [
    './',
    './index.html',
    './manifest.webmanifest',
    './assets/css/theme.css?v=1.0.6-flow-audit',
    './assets/css/studio.css?v=1.0.6-flow-audit',
    './assets/css/editor.css?v=1.0.6-flow-audit',
    './assets/css/ux.css?v=1.0.6-flow-audit',
    './assets/css/advanced-editor.css?v=1.0.6-flow-audit',
    './assets/css/layout-dock.css?v=1.0.6-flow-audit',
    './assets/css/caption-pro.css?v=1.0.6-flow-audit',
    './assets/css/quality-tools.css?v=1.0.6-flow-audit',
    './assets/css/auto-cut.css?v=1.0.6-flow-audit',
    './assets/css/cut-markers.css?v=1.0.6-flow-audit',
    './assets/css/feedback-ux.css?v=1.0.6-flow-audit',
    './assets/css/engine-panel.css?v=1.0.6-flow-audit',
    './assets/css/pro-engine.css?v=1.0.6-flow-audit',
    './assets/css/hyperflow-tabs.css?v=1.0.6-flow-audit',
    './assets/css/render-queue.css?v=1.0.6-flow-audit',
    './assets/css/hyperconnect-flow.css?v=1.0.6-flow-audit',
    './assets/css/flow-polish.css?v=1.0.6-flow-audit',
    './assets/css/flow-hotfix.css?v=1.0.6-flow-audit',
    './assets/css/flow-integrity.css?v=1.0.6-flow-audit',
    './assets/css/flow-doctor.css?v=1.0.6-flow-audit',
    './assets/css/cinematic-hero.css?v=1.0.6-flow-audit',
    './assets/css/responsive-workspace.css?v=1.0.6-flow-audit',
    './assets/css/flow-quality-gate.css?v=1.0.6-flow-audit',
    './assets/css/pc-dock-reveal-hotfix.css?v=1.0.6-dock-reveal',
    './assets/css/glass-pro-ui.css?v=1.0.6-glass-pro',
    './assets/css/workspace-comfort.css?v=1.0.6-workspace-comfort',
    './assets/css/motion-stability.css?v=1.0.6-motion-stability',
    './assets/icons/ai-shorts.svg',
    './src/config/app-runtime-config.js?v=1.0.6-flow-audit',
    './src/utils/core-utils.js?v=1.0.6-flow-audit',
    './src/state/app-state.js?v=1.0.6-flow-audit',
    './src/analysis/audio-feature-extractor.js?v=1.0.6-flow-audit',
    './src/analysis/video-motion-analyzer.js?v=1.0.6-flow-audit',
    './src/analysis/auto-cut-detector.js?v=1.0.6-flow-audit',
    './src/recommendation/shorts-recommendation-engine.js?v=1.0.6-flow-audit',
    './src/engine/module-registry.js?v=1.0.6-flow-audit',
    './src/engine/module-contracts.js?v=1.0.6-flow-audit',
    './src/engine/analysis-cache.js?v=1.0.6-flow-audit',
    './src/engine/performance-budget.js?v=1.0.6-flow-audit',
    './src/engine/analysis-pipeline.js?v=1.0.6-flow-audit',
    './src/engine/scoring-pipeline.js?v=1.0.6-flow-audit',
    './src/engine/pro-engine-tuner.js?v=1.0.6-flow-audit',
    './src/engine/stability-auditor.js?v=1.0.6-flow-audit',
    './src/engine/engine-kernel.js?v=1.0.6-flow-audit',
    './src/caption/caption-service.js?v=1.0.6-flow-audit',
    './src/project/project-service.js?v=1.0.6-flow-audit',
    './src/render/quality-effects.js?v=1.0.6-flow-audit',
    './src/render/vertical-renderer.js?v=1.0.6-flow-audit',
    './src/download/download-service.js?v=1.0.6-flow-audit',
    './src/ui/waveform-view.js?v=1.0.6-flow-audit',
    './src/ui/cut-marker-overlay.js?v=1.0.6-flow-audit',
    './src/ui/timeline-view.js?v=1.0.6-flow-audit',
    './src/ui/ux-controls.js?v=1.0.6-flow-audit',
    './src/ui/range-drag-controls.js?v=1.0.6-flow-audit',
    './src/ui/bottom-dock.js?v=1.0.6-flow-audit',
    './src/ui/feedback-ux.js?v=1.0.6-flow-audit',
    './src/ui/flow-polish.js?v=1.0.6-flow-audit',
    './src/ui/flow-hotfix.js?v=1.0.6-flow-audit',
    './src/render/render-queue.js?v=1.0.6-flow-audit',
    './src/ui/hyperflow-tabs.js?v=1.0.6-flow-audit',
    './src/ui/hyperconnect-flow.js?v=1.0.6-flow-audit',
    './src/ui/flow-integrity.js?v=1.0.6-flow-audit',
    './src/ui/flow-doctor.js?v=1.0.6-flow-audit',
    './src/ui/flow-quality-gate.js?v=1.0.6-flow-audit',
    './src/ui/workspace-comfort.js?v=1.0.6-workspace-comfort',
    './src/ui/motion-stability.js?v=1.0.6-motion-stability',
    './src/security/site-guards.js?v=1.0.6-flow-audit',
    './src/boot/runtime-health.js?v=1.0.6-flow-audit',
    './src/app.js?v=1.0.6-flow-audit',
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
