// AI Shorts Studio v1.2.0 service worker - version-aware cache guard
'use strict';

const CACHE_NAME = 'ai-shorts-studio-shell-v1.2.0-menu-runtime-stability';
const SHELL_FILES = [
    './',
    './index.html',
    './manifest.webmanifest',
    './assets/css/theme.css?v=1.2.0-flow-audit',
    './assets/css/studio.css?v=1.2.0-flow-audit',
    './assets/css/editor.css?v=1.2.0-flow-audit',
    './assets/css/ux.css?v=1.2.0-flow-audit',
    './assets/css/advanced-editor.css?v=1.2.0-flow-audit',
    './assets/css/layout-dock.css?v=1.2.0-flow-audit',
    './assets/css/caption-pro.css?v=1.2.0-flow-audit',
    './assets/css/quality-tools.css?v=1.2.0-flow-audit',
    './assets/css/auto-cut.css?v=1.2.0-flow-audit',
    './assets/css/cut-markers.css?v=1.2.0-flow-audit',
    './assets/css/feedback-ux.css?v=1.2.0-flow-audit',
    './assets/css/engine-panel.css?v=1.2.0-flow-audit',
    './assets/css/pro-engine.css?v=1.2.0-flow-audit',
    './assets/css/hyperflow-tabs.css?v=1.2.0-flow-audit',
    './assets/css/render-queue.css?v=1.2.0-flow-audit',
    './assets/css/hyperconnect-flow.css?v=1.2.0-flow-audit',
    './assets/css/flow-polish.css?v=1.2.0-flow-audit',
    './assets/css/flow-hotfix.css?v=1.2.0-flow-audit',
    './assets/css/flow-integrity.css?v=1.2.0-flow-audit',
    './assets/css/flow-doctor.css?v=1.2.0-flow-audit',
    './assets/css/cinematic-hero.css?v=1.2.0-flow-audit',
    './assets/css/responsive-workspace.css?v=1.2.0-flow-audit',
    './assets/css/flow-quality-gate.css?v=1.2.0-flow-audit',
    './assets/css/pc-dock-reveal-hotfix.css?v=1.2.0-dock-reveal',
    './assets/css/glass-pro-ui.css?v=1.2.0-glass-pro',
    './assets/css/workspace-comfort.css?v=1.2.0-workspace-comfort',
    './assets/css/motion-stability.css?v=1.2.0-motion-stability',
    './assets/css/handoff-coach.css?v=1.2.0-handoff-coach',
    './assets/css/save-readiness.css?v=1.2.0-save-readiness',
    './assets/css/render-quality-planner.css?v=1.2.0-render-quality',
    './assets/css/candidate-preview-pro.css?v=1.2.0-candidate-preview',
    './assets/css/candidate-pin-board.css?v=1.2.0-candidate-pin',
    './assets/css/session-continuity.css?v=1.2.0-session-continuity',
    './assets/css/export-finish-center.css?v=1.2.0-export-finish',
    './assets/css/shutter-glass-flow.css?v=1.2.0-command-bridge',
    './assets/css/update-sentinel.css?v=1.2.0-update-sentinel',
    './assets/css/foundation-polish.css?v=1.2.0-foundation-polish',
    './assets/css/desktop-prime-layout.css?v=1.2.0-desktop-prime',
    './assets/icons/ai-shorts.svg',
    './src/config/app-runtime-config.js?v=1.2.0-flow-audit',
    './src/boot/app-version-sync.js?v=1.2.0-version-sync',
    './src/boot/update-sentinel.js?v=1.2.0-update-sentinel',
    './src/utils/core-utils.js?v=1.2.0-flow-audit',
    './src/state/app-state.js?v=1.2.0-flow-audit',
    './src/analysis/audio-feature-extractor.js?v=1.2.0-flow-audit',
    './src/analysis/video-motion-analyzer.js?v=1.2.0-flow-audit',
    './src/analysis/auto-cut-detector.js?v=1.2.0-flow-audit',
    './src/recommendation/shorts-recommendation-engine.js?v=1.2.0-flow-audit',
    './src/engine/module-registry.js?v=1.2.0-flow-audit',
    './src/engine/module-contracts.js?v=1.2.0-flow-audit',
    './src/engine/analysis-cache.js?v=1.2.0-flow-audit',
    './src/engine/performance-budget.js?v=1.2.0-flow-audit',
    './src/engine/analysis-pipeline.js?v=1.2.0-flow-audit',
    './src/engine/scoring-pipeline.js?v=1.2.0-flow-audit',
    './src/engine/pro-engine-tuner.js?v=1.2.0-flow-audit',
    './src/engine/stability-auditor.js?v=1.2.0-flow-audit',
    './src/engine/engine-boost-profile.js?v=1.2.0-engine-boost',
    './src/engine/engine-kernel.js?v=1.2.0-flow-audit',
    './src/caption/caption-service.js?v=1.2.0-flow-audit',
    './src/project/project-service.js?v=1.2.0-flow-audit',
    './src/render/quality-effects.js?v=1.2.0-flow-audit',
    './src/render/vertical-renderer.js?v=1.2.0-flow-audit',
    './src/download/download-service.js?v=1.2.0-flow-audit',
    './src/ui/waveform-view.js?v=1.2.0-flow-audit',
    './src/ui/cut-marker-overlay.js?v=1.2.0-flow-audit',
    './src/ui/timeline-view.js?v=1.2.0-flow-audit',
    './src/ui/ux-controls.js?v=1.2.0-flow-audit',
    './src/ui/range-drag-controls.js?v=1.2.0-flow-audit',
    './src/ui/bottom-dock.js?v=1.2.0-flow-audit',
    './src/ui/feedback-ux.js?v=1.2.0-flow-audit',
    './src/ui/flow-polish.js?v=1.2.0-flow-audit',
    './src/ui/flow-hotfix.js?v=1.2.0-flow-audit',
    './src/render/render-queue.js?v=1.2.0-flow-audit',
    './src/ui/hyperflow-tabs.js?v=1.2.0-flow-audit',
    './src/ui/hyperconnect-flow.js?v=1.2.0-flow-audit',
    './src/ui/flow-integrity.js?v=1.2.0-flow-audit',
    './src/ui/flow-doctor.js?v=1.2.0-flow-audit',
    './src/ui/flow-quality-gate.js?v=1.2.0-flow-audit',
    './src/ui/workspace-comfort.js?v=1.2.0-workspace-comfort',
    './src/ui/motion-stability.js?v=1.2.0-motion-stability',
    './src/ui/handoff-coach.js?v=1.2.0-handoff-coach',
    './src/ui/save-readiness.js?v=1.2.0-save-readiness',
    './src/ui/render-quality-planner.js?v=1.2.0-render-quality',
    './src/ui/candidate-preview-pro.js?v=1.2.0-candidate-preview',
    './src/ui/candidate-pin-board.js?v=1.2.0-candidate-pin',
    './src/ui/session-continuity.js?v=1.2.0-session-continuity',
    './src/ui/export-finish-center.js?v=1.2.0-export-finish',
    './src/ui/flow-director-final.js?v=1.2.0-command-bridge',
    './src/ui/flow-command-bridge.js?v=1.2.0-no-shake-command',
    './src/ui/startup-performance.js?v=1.2.0-foundation-polish',
    './src/security/site-guards.js?v=1.2.0-flow-audit',
    './src/boot/runtime-health.js?v=1.2.0-flow-audit',
    './src/app.js?v=1.2.0-flow-audit',
    './src/workers/highlight-analysis.worker.js'
];

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
    event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

function isShellNavigation(request, url) {
    return request.mode === 'navigate' ||
        url.pathname.endsWith('/') ||
        url.pathname.endsWith('/index.html') ||
        url.pathname.endsWith('/manifest.webmanifest') ||
        url.pathname.endsWith('/sw.js');
}

async function networkFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    try {
        const response = await fetch(request, { cache: 'no-store' });
        if (response && response.ok) cache.put(request, response.clone()).catch(() => {});
        return response;
    } catch (_) {
        const cached = await caches.match(request);
        if (cached) return cached;
        return caches.match('./index.html');
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
    event.respondWith(isShellNavigation(request, url) ? networkFirst(request) : cacheFirst(request));
});
