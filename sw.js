// AI Shorts Studio v1.5.17 service worker - namespace-safe version-aware cache guard
'use strict';

const CACHE_PREFIX = 'ai-shorts-studio-shell-';
const CACHE_NAME = 'ai-shorts-studio-shell-v1.5.17-important-cascade-reduction';
const SHELL_FILES = [
    './',
    './index.html',
    './manifest.webmanifest',
    './assets/css/theme.css?v=1.5.17-important-cascade-reduction',
    './assets/css/studio.css?v=1.5.17-important-cascade-reduction',
    './assets/css/editor.css?v=1.5.17-important-cascade-reduction',
    './assets/css/ux.css?v=1.5.17-important-cascade-reduction',
    './assets/css/advanced-editor.css?v=1.5.17-important-cascade-reduction',
    './assets/css/layout-dock.css?v=1.5.17-important-cascade-reduction',
    './assets/css/caption-pro.css?v=1.5.17-important-cascade-reduction',
    './assets/css/quality-tools.css?v=1.5.17-important-cascade-reduction',
    './assets/css/auto-cut.css?v=1.5.17-important-cascade-reduction',
    './assets/css/cut-markers.css?v=1.5.17-important-cascade-reduction',
    './assets/css/feedback-ux.css?v=1.5.17-important-cascade-reduction',
    './assets/css/engine-panel.css?v=1.5.17-important-cascade-reduction',
    './assets/css/pro-engine.css?v=1.5.17-important-cascade-reduction',
    './assets/css/hyperflow-tabs.css?v=1.5.17-important-cascade-reduction',
    './assets/css/render-queue.css?v=1.5.17-important-cascade-reduction',
    './assets/css/hyperconnect-flow.css?v=1.5.17-important-cascade-reduction',
    './assets/css/flow-polish.css?v=1.5.17-important-cascade-reduction',
    './assets/css/flow-hotfix.css?v=1.5.17-important-cascade-reduction',
    './assets/css/flow-integrity.css?v=1.5.17-important-cascade-reduction',
    './assets/css/flow-doctor.css?v=1.5.17-important-cascade-reduction',
    './assets/css/responsive-workspace.css?v=1.5.17-important-cascade-reduction',
    './assets/css/flow-quality-gate.css?v=1.5.17-important-cascade-reduction',
    './assets/css/pc-dock-reveal-hotfix.css?v=1.5.17-important-cascade-reduction',
    './assets/css/glass-pro-ui.css?v=1.5.17-important-cascade-reduction',
    './assets/css/workspace-comfort.css?v=1.5.17-important-cascade-reduction',
    './assets/css/motion-stability.css?v=1.5.17-important-cascade-reduction',
    './assets/css/handoff-coach.css?v=1.5.17-important-cascade-reduction',
    './assets/css/save-readiness.css?v=1.5.17-important-cascade-reduction',
    './assets/css/render-quality-planner.css?v=1.5.17-important-cascade-reduction',
    './assets/css/candidate-preview-pro.css?v=1.5.17-important-cascade-reduction',
    './assets/css/candidate-pin-board.css?v=1.5.17-important-cascade-reduction',
    './assets/css/session-continuity.css?v=1.5.17-important-cascade-reduction',
    './assets/css/export-finish-center.css?v=1.5.17-important-cascade-reduction',
    './assets/css/shutter-glass-flow.css?v=1.5.17-important-cascade-reduction',
    './assets/css/update-sentinel.css?v=1.5.17-important-cascade-reduction',
    './assets/css/foundation-polish.css?v=1.5.17-important-cascade-reduction',
    './assets/css/desktop-prime-layout.css?v=1.5.17-important-cascade-reduction',
    './assets/css/hero-command-deck.css?v=1.5.17-important-cascade-reduction',
    './assets/css/ui-refinement.css?v=1.5.17-important-cascade-reduction',
    './assets/css/icon-system.css?v=1.5.17-important-cascade-reduction',
    './assets/css/header-meta-rail.css?v=1.5.17-important-cascade-reduction',
    './assets/css/active-stage-beacon.css?v=1.5.17-important-cascade-reduction',
    './assets/css/workspace-layout-controls.css?v=1.5.17-important-cascade-reduction',
    './assets/css/mobile-menu-guide.css?v=1.5.17-important-cascade-reduction',
    './assets/css/studio-experience.css?v=1.5.17-important-cascade-reduction',
    './assets/icons/ai-shorts.svg',
    './assets/icons/studio/candidates.svg',
    './assets/icons/studio/caption.svg',
    './assets/icons/studio/check.svg',
    './assets/icons/studio/close.svg',
    './assets/icons/studio/stop.svg',
    './assets/icons/studio/compare.svg',
    './assets/icons/studio/cut.svg',
    './assets/icons/studio/device.svg',
    './assets/icons/studio/diagnostics.svg',
    './assets/icons/studio/edit.svg',
    './assets/icons/studio/export.svg',
    './assets/icons/studio/pin.svg',
    './assets/icons/studio/preview.svg',
    './assets/icons/studio/project.svg',
    './assets/icons/studio/render.svg',
    './assets/icons/studio/retry.svg',
    './assets/icons/studio/spark.svg',
    './assets/icons/studio/thumbnail.svg',
    './assets/icons/studio/upload.svg',
    './assets/icons/studio/waveform.svg',
    './src/config/app-runtime-config.js?v=1.5.17-important-cascade-reduction',
    './src/boot/app-version-sync.js?v=1.5.17-important-cascade-reduction',
    './src/boot/update-sentinel.js?v=1.5.17-important-cascade-reduction',
    './src/boot/staged-ui-loader.js?v=1.5.17-important-cascade-reduction',
    './src/utils/core-utils.js?v=1.5.17-important-cascade-reduction',
    './src/state/app-state.js?v=1.5.17-important-cascade-reduction',
    './src/engine/operation-coordinator.js?v=1.5.17-important-cascade-reduction',
    './src/analysis/audio-analysis-core.js?v=1.5.17-important-cascade-reduction',
    './src/analysis/audio-feature-extractor.js?v=1.5.17-important-cascade-reduction',
    './src/analysis/video-motion-analyzer.js?v=1.5.17-important-cascade-reduction',
    './src/analysis/auto-cut-detector.js?v=1.5.17-important-cascade-reduction',
    './src/recommendation/shorts-recommendation-engine.js?v=1.5.17-important-cascade-reduction',
    './src/engine/module-registry.js?v=1.5.17-important-cascade-reduction',
    './src/engine/module-contracts.js?v=1.5.17-important-cascade-reduction',
    './src/engine/analysis-cache.js?v=1.5.17-important-cascade-reduction',
    './src/engine/performance-budget.js?v=1.5.17-important-cascade-reduction',
    './src/engine/analysis-pipeline.js?v=1.5.17-important-cascade-reduction',
    './src/engine/scoring-pipeline.js?v=1.5.17-important-cascade-reduction',
    './src/engine/pro-engine-tuner.js?v=1.5.17-important-cascade-reduction',
    './src/engine/stability-auditor.js?v=1.5.17-important-cascade-reduction',
    './src/engine/engine-boost-profile.js?v=1.5.17-important-cascade-reduction',
    './src/engine/engine-kernel.js?v=1.5.17-important-cascade-reduction',
    './src/caption/caption-service.js?v=1.5.17-important-cascade-reduction',
    './src/project/project-service.js?v=1.5.17-important-cascade-reduction',
    './src/render/quality-effects.js?v=1.5.17-important-cascade-reduction',
    './src/render/vertical-renderer.js?v=1.5.17-important-cascade-reduction',
    './src/download/download-service.js?v=1.5.17-important-cascade-reduction',
    './src/ui/waveform-view.js?v=1.5.17-important-cascade-reduction',
    './src/ui/cut-marker-overlay.js?v=1.5.17-important-cascade-reduction',
    './src/ui/timeline-view.js?v=1.5.17-important-cascade-reduction',
    './src/ui/bottom-dock.js?v=1.5.17-important-cascade-reduction',
    './src/ui/mobile-menu-guide.js?v=1.5.17-important-cascade-reduction',
    './src/ui/feedback-ux.js?v=1.5.17-important-cascade-reduction',
    './src/render/render-queue.js?v=1.5.17-important-cascade-reduction',
    './src/ui/hyperflow-tabs.js?v=1.5.17-important-cascade-reduction',
    './src/ui/motion-stability.js?v=1.5.17-important-cascade-reduction',
    './src/ui/flow-director-final.js?v=1.5.17-important-cascade-reduction',
    './src/ui/flow-command-bridge.js?v=1.5.17-important-cascade-reduction',
    './src/ui/workspace-layout-controls.js?v=1.5.17-important-cascade-reduction',
    './src/ui/startup-performance.js?v=1.5.17-important-cascade-reduction',
    './src/security/site-guards.js?v=1.5.17-important-cascade-reduction',
    './src/boot/service-worker-registration.js?v=1.5.17-important-cascade-reduction',
    './src/boot/runtime-health.js?v=1.5.17-important-cascade-reduction',
    './src/app/render-workflow-controller.js?v=1.5.17-important-cascade-reduction',
    './src/app/settings-controller.js?v=1.5.17-important-cascade-reduction',
    './src/app/media-import-controller.js?v=1.5.17-important-cascade-reduction',
    './src/app.js?v=1.5.17-important-cascade-reduction',
    './src/workers/highlight-analysis.worker.js'
];

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
    event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

function isNavigationRequest(request, url) {
    return request.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('/index.html');
}

function isControlAsset(url) {
    return url.pathname.endsWith('/manifest.webmanifest') || url.pathname.endsWith('/sw.js');
}

async function networkFirst(request, options) {
    const cache = await caches.open(CACHE_NAME);
    const navigationFallback = Boolean(options && options.navigationFallback);
    try {
        const response = await fetch(request, { cache: 'no-store' });
        if (response && response.ok) cache.put(request, response.clone()).catch(() => {});
        return response;
    } catch (_) {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (navigationFallback) {
            const shell = await caches.match('./index.html');
            if (shell) return shell;
        }
        return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }
}

async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response && response.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone()).catch(() => {});
    }
    return response;
}

self.addEventListener('fetch', event => {
    const request = event.request;
    if (request.method !== 'GET') return;
    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;
    if (isNavigationRequest(request, url)) {
        event.respondWith(networkFirst(request, { navigationFallback: true }));
        return;
    }
    if (isControlAsset(url)) {
        event.respondWith(networkFirst(request, { navigationFallback: false }));
        return;
    }
    event.respondWith(cacheFirst(request));
});
