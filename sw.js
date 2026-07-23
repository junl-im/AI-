// AI Shorts Studio v1.5.27 service worker - version-aware cache guard, targeted integrity retry, audit history control, and rollback-safe activation
'use strict';

const CACHE_PREFIX = 'ai-shorts-studio-shell-';
const CACHE_NAME = 'ai-shorts-studio-shell-v1.5.27-selective-cache-integrity-retry-portable-backup';
const SHELL_FILES = [
    './',
    './index.html',
    './manifest.webmanifest',
    './asset-integrity.json',
    './assets/css/theme.css?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './assets/css/studio.css?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './assets/css/editor.css?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './assets/css/ux.css?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './assets/css/advanced-editor.css?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './assets/css/layout-dock.css?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './assets/css/caption-pro.css?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './assets/css/quality-tools.css?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './assets/css/auto-cut.css?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './assets/css/cut-markers.css?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './assets/css/feedback-ux.css?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './assets/css/engine-panel.css?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './assets/css/pro-engine.css?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './assets/css/hyperflow-tabs.css?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './assets/css/render-queue.css?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './assets/css/hyperconnect-flow.css?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './assets/css/flow-polish.css?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './assets/css/flow-hotfix.css?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './assets/css/flow-integrity.css?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './assets/css/flow-doctor.css?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './assets/css/responsive-workspace.css?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './assets/css/flow-quality-gate.css?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './assets/css/pc-dock-reveal-hotfix.css?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './assets/css/glass-pro-ui.css?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './assets/css/workspace-comfort.css?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './assets/css/motion-stability.css?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './assets/css/handoff-coach.css?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './assets/css/save-readiness.css?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './assets/css/render-quality-planner.css?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './assets/css/candidate-preview-pro.css?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './assets/css/candidate-pin-board.css?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './assets/css/session-continuity.css?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './assets/css/storage-health-panel.css?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './assets/css/export-finish-center.css?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './assets/css/shutter-glass-flow.css?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './assets/css/update-sentinel.css?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './assets/css/foundation-polish.css?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './assets/css/desktop-prime-layout.css?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './assets/css/hero-command-deck.css?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './assets/css/ui-refinement.css?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './assets/css/icon-system.css?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './assets/css/header-meta-rail.css?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './assets/css/active-stage-beacon.css?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './assets/css/workspace-layout-controls.css?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './assets/css/mobile-menu-guide.css?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './assets/css/studio-experience.css?v=1.5.27-selective-cache-integrity-retry-portable-backup',
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
    './src/config/app-runtime-config.js?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './src/boot/app-version-sync.js?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './src/boot/update-sentinel.js?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './src/boot/staged-ui-loader.js?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './src/utils/core-utils.js?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './src/storage/storage-manager.js?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './src/storage/session-backup-codec.js?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './src/state/app-state.js?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './src/engine/operation-coordinator.js?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './src/analysis/audio-analysis-core.js?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './src/analysis/audio-feature-extractor.js?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './src/analysis/video-motion-analyzer.js?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './src/analysis/auto-cut-detector.js?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './src/recommendation/shorts-recommendation-engine.js?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './src/engine/module-registry.js?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './src/engine/module-contracts.js?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './src/engine/analysis-cache.js?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './src/engine/performance-budget.js?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './src/engine/analysis-pipeline.js?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './src/engine/scoring-pipeline.js?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './src/engine/pro-engine-tuner.js?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './src/engine/stability-auditor.js?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './src/engine/engine-boost-profile.js?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './src/engine/engine-kernel.js?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './src/caption/caption-service.js?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './src/project/project-service.js?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './src/render/quality-effects.js?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './src/render/vertical-renderer.js?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './src/download/download-service.js?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './src/ui/waveform-view.js?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './src/ui/cut-marker-overlay.js?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './src/ui/timeline-view.js?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './src/ui/bottom-dock.js?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './src/ui/mobile-menu-guide.js?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './src/ui/feedback-ux.js?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './src/render/render-queue.js?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './src/ui/hyperflow-tabs.js?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './src/ui/motion-stability.js?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './src/ui/flow-director-final.js?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './src/ui/flow-command-bridge.js?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './src/ui/workspace-layout-controls.js?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './src/ui/startup-performance.js?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './src/security/site-guards.js?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './src/boot/service-worker-registration.js?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './src/boot/runtime-health.js?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './src/app/render-workflow-controller.js?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './src/app/settings-controller.js?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './src/app/media-import-controller.js?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './src/app.js?v=1.5.27-selective-cache-integrity-retry-portable-backup',
    './src/workers/highlight-analysis.worker.js'
];

const REQUIRED_SHELL_FILES = Object.freeze([
    './index.html',
    './manifest.webmanifest',
    './asset-integrity.json',
    './src/config/app-runtime-config.js?v=1.5.27-selective-cache-integrity-retry-portable-backup'
]);
const INSTALL_REPORT_KEY = './__ai_shorts_sw_install_report__';
const PRECACHE_BATCH_SIZE = 8;
const CACHE_REPAIR_ATTEMPTS = 2;
let integritySampleCursor = 0;
const INTEGRITY_AUDIT_HISTORY_LIMIT = 40;
const INTEGRITY_BACKOFF_BASE_MS = 5 * 60 * 1000;
const INTEGRITY_BACKOFF_MAX_MS = 6 * 60 * 60 * 1000;
const INTEGRITY_MANIFEST_URL = './asset-integrity.json';
const INTEGRITY_MANIFEST_SHA256 = '0562a8fa272b19305ab48aafe9528c6f0dd312d90689ad339814ad492507c15f';
let integrityManifestPromise = null;

function errorMessage(error) {
    return error && error.message ? error.message : String(error || 'unknown cache error');
}

function normalizeAssetKey(file) {
    try {
        const url = new URL(typeof file === 'string' ? file : file && file.url || '', self.location.origin);
        let path = url.pathname.replace(/^\/+/, '');
        if (!path) path = 'index.html';
        return path;
    } catch (_) {
        return String(file || '').replace(/^\.\//, '').split('?')[0] || 'index.html';
    }
}

function cryptoSupported() {
    return Boolean(self.crypto && self.crypto.subtle && typeof self.crypto.subtle.digest === 'function');
}

async function responseSha256(response) {
    if (!cryptoSupported() || !response || typeof response.arrayBuffer !== 'function') return '';
    const buffer = await response.arrayBuffer();
    const digest = await self.crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

async function verifyResponseContent(response, expectedHash) {
    if (!expectedHash) return { supported: cryptoSupported(), verified: false, skipped: true, actualHash: '' };
    if (!cryptoSupported() || !response || typeof response.clone !== 'function' || typeof response.arrayBuffer !== 'function') return { supported: false, verified: false, skipped: true, actualHash: '' };
    const actualHash = await responseSha256(response.clone());
    return { supported: true, verified: actualHash === expectedHash, skipped: false, actualHash };
}

async function putStableCacheResponse(cache, key, response) {
    if (!cache || typeof cache.put !== 'function') return;
    if (!response || typeof response.arrayBuffer !== 'function') {
        await cache.put(key, response);
        return;
    }
    const body = await response.arrayBuffer();
    const init = {
        status: Number(response.status) || 200,
        statusText: String(response.statusText || ''),
        headers: response.headers
    };
    const createResponse = () => new Response(body.slice(0), init);
    // Cache API implementations own their response body. Lightweight QA/cache adapters
    // can otherwise retain an entangled Response clone whose body is later consumed.
    if (typeof cache.add !== 'function') {
        const createAdapter = () => ({
            ok: init.status >= 200 && init.status < 300,
            status: init.status,
            statusText: init.statusText,
            headers: init.headers,
            clone: createAdapter,
            arrayBuffer: async () => body.slice(0),
            json: async () => createResponse().json(),
            text: async () => createResponse().text()
        });
        await cache.put(key, createAdapter());
        return;
    }
    await cache.put(key, createResponse());
}

async function loadIntegrityManifest(cache, options) {
    const force = Boolean(options && options.force);
    if (!force && integrityManifestPromise) return integrityManifestPromise;
    integrityManifestPromise = (async () => {
        if (!cryptoSupported()) return { supported: false, verified: false, source: 'unsupported', assets: {}, manifestHash: '' };
        let response = null;
        let source = 'network';
        try {
            response = await fetch(INTEGRITY_MANIFEST_URL, { cache: 'reload' });
            if (!response || !response.ok) throw new Error(`HTTP ${response && response.status || 0}`);
        } catch (error) {
            source = 'cache';
            response = cache && typeof cache.match === 'function' ? await cache.match(INTEGRITY_MANIFEST_URL) : null;
            if (!response) throw error;
        }
        const verification = await verifyResponseContent(response.clone(), INTEGRITY_MANIFEST_SHA256);
        if (!verification.supported || !verification.verified) throw new Error('Integrity manifest checksum mismatch');
        const manifest = await response.clone().json();
        if (!manifest || manifest.algorithm !== 'sha256' || !manifest.assets || typeof manifest.assets !== 'object') throw new Error('Invalid integrity manifest');
        if (cache && typeof cache.put === 'function' && source === 'network') await putStableCacheResponse(cache, INTEGRITY_MANIFEST_URL, response.clone());
        return { supported: true, verified: true, source, assets: manifest.assets, manifestHash: verification.actualHash, generatedAt: manifest.generatedAt || '' };
    })().catch(error => ({ supported: true, verified: false, source: 'error', assets: {}, manifestHash: '', error: errorMessage(error) }));
    return integrityManifestPromise;
}

async function cacheShellFile(cache, file, options) {
    const settings = options || {};
    const attempts = Math.max(1, Math.min(3, Number(settings.attempts) || 1));
    const manifest = settings.manifest || { supported: false, verified: false, assets: {} };
    const expectedHash = manifest.assets && manifest.assets[normalizeAssetKey(file)] || '';
    let lastError = null;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
            if (manifest.supported && manifest.verified && expectedHash && typeof cache.put === 'function') {
                const response = await fetch(file, { cache: 'reload' });
                if (!response || !response.ok) throw new Error(`HTTP ${response && response.status || 0}`);
                const verification = await verifyResponseContent(response.clone(), expectedHash);
                if (!verification.verified) throw new Error(`Content checksum mismatch: ${file}`);
                await putStableCacheResponse(cache, file, response)
                return { file, ok: true, message: '', attempts: attempt, contentVerified: true, expectedHash, actualHash: verification.actualHash };
            }
            if (typeof cache.add === 'function') await cache.add(file);
            else {
                const response = await fetch(file, { cache: 'reload' });
                if (!response || !response.ok) throw new Error(`HTTP ${response && response.status || 0}`);
                await putStableCacheResponse(cache, file, response)
            }
            return { file, ok: true, message: '', attempts: attempt, contentVerified: false, integrityUnsupported: !manifest.supported || !manifest.verified };
        } catch (error) {
            lastError = error;
        }
    }
    return { file, ok: false, message: errorMessage(lastError), attempts, contentVerified: false };
}

async function writeInstallReport(cache, report) {
    try {
        await putStableCacheResponse(cache, INSTALL_REPORT_KEY, new Response(JSON.stringify(report), {
            status: 200,
            headers: { 'Content-Type': 'application/json; charset=utf-8' }
        }));
    } catch (_) { /* report persistence is best-effort */ }
}

async function precacheShell() {
    const cache = await caches.open(CACHE_NAME);
    const previousCaches = (await caches.keys()).filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME);
    const manifest = await loadIntegrityManifest(cache, { force: true });
    if (manifest.supported && !manifest.verified) {
        await caches.delete(CACHE_NAME);
        throw new Error(`Integrity manifest failed: ${manifest.error || 'checksum mismatch'}`);
    }
    const results = [];
    for (let offset = 0; offset < SHELL_FILES.length; offset += PRECACHE_BATCH_SIZE) {
        const batch = SHELL_FILES.slice(offset, offset + PRECACHE_BATCH_SIZE);
        for (const file of batch) {
            const result = file === INTEGRITY_MANIFEST_URL
                ? { file, ok: true, attempts: 1, contentVerified: Boolean(manifest.verified) }
                : await cacheShellFile(cache, file, { manifest });
            results.push(result);
        }
    }
    const failed = results.filter(item => !item.ok);
    const failedFiles = new Set(failed.map(item => item.file));
    const requiredMissing = REQUIRED_SHELL_FILES.filter(file => failedFiles.has(file) || !results.some(item => item.file === file && item.ok));
    const contentVerified = results.filter(item => item.contentVerified).length;
    const report = {
        cacheName: CACHE_NAME,
        attempted: results.length,
        cached: results.length - failed.length,
        failed: failed.length,
        contentVerified,
        integrityManifest: { supported: manifest.supported, verified: manifest.verified, source: manifest.source, hash: manifest.manifestHash, generatedAt: manifest.generatedAt || '', error: manifest.error || '' },
        rollbackCandidates: previousCaches,
        requiredMissing,
        failures: failed.slice(0, 20),
        installedAt: new Date().toISOString()
    };
    await writeInstallReport(cache, report);
    if (requiredMissing.length) {
        await caches.delete(CACHE_NAME);
        throw new Error(`Required shell cache failed: ${requiredMissing.join(', ')}`);
    }
    return report;
}

async function inspectShellCache(cache, files, options) {
    const targets = Array.isArray(files) ? files : SHELL_FILES;
    if (!cache || typeof cache.match !== 'function') return { checked: targets.length, missing: [], invalid: [], corrupted: [], healthy: targets.length, inspectionSupported: false, hashVerified: 0, hashUnsupported: targets.length };
    const manifest = options && options.manifest || await loadIntegrityManifest(cache);
    const missing = [];
    const invalid = [];
    const corrupted = [];
    let hashVerified = 0;
    let hashUnsupported = 0;
    for (const file of targets) {
        let response = null;
        for (let attempt = 0; attempt < 3 && !response; attempt += 1) {
            try { response = await cache.match(file); } catch (_) { if (attempt < 2) await Promise.resolve(); }
        }
        if (!response) { missing.push(file); continue; }
        if (response.ok === false) { invalid.push(file); continue; }
        if (file === INTEGRITY_MANIFEST_URL) { if (manifest.verified) hashVerified += 1; else hashUnsupported += 1; continue; }
        const expectedHash = manifest.assets && manifest.assets[normalizeAssetKey(file)] || '';
        const verification = await verifyResponseContent(response.clone ? response.clone() : response, expectedHash);
        if (verification.supported && !verification.skipped) {
            if (verification.verified) hashVerified += 1;
            else corrupted.push(file);
        } else hashUnsupported += 1;
    }
    return { checked: targets.length, missing, invalid, corrupted, healthy: targets.length - missing.length - invalid.length - corrupted.length, inspectionSupported: true, hashVerified, hashUnsupported, manifestVerified: Boolean(manifest.verified), manifestError: manifest.error || '' };
}

async function repairShellCache(cache, options) {
    const settings = options || {};
    const targets = Array.isArray(settings.files) && settings.files.length
        ? Array.from(new Set(settings.files.filter(file => SHELL_FILES.includes(file))))
        : (settings.includeOptional === false ? REQUIRED_SHELL_FILES : SHELL_FILES);
    const manifest = await loadIntegrityManifest(cache, { force: Boolean(settings.forceManifest) });
    const before = await inspectShellCache(cache, targets, { manifest });
    const repairTargets = Array.from(new Set(before.missing.concat(before.invalid, before.corrupted || [])));
    const repaired = [];
    const failed = [];
    for (const file of repairTargets) {
        try { if (typeof cache.delete === 'function') await cache.delete(file); } catch (_) { /* overwrite below */ }
        const result = await cacheShellFile(cache, file, { attempts: CACHE_REPAIR_ATTEMPTS, manifest });
        if (result.ok) repaired.push(file);
        else failed.push(result);
    }
    const after = await inspectShellCache(cache, targets, { manifest });
    const requiredMissing = REQUIRED_SHELL_FILES.filter(file => targets.includes(file) && (after.missing.includes(file) || after.invalid.includes(file) || (after.corrupted || []).includes(file)));
    return {
        repaired,
        failed,
        requiredMissing,
        integrity: after,
        repairAttempts: repairTargets.length,
        lastRepairedAt: new Date().toISOString(),
        repairReason: String(settings.reason || 'activation')
    };
}

async function readInstallReport(cache, repairResult, options) {
    const settings = options || {};
    let report = null;
    try {
        const response = await cache.match(INSTALL_REPORT_KEY);
        if (response) report = await response.json();
    } catch (_) { /* no-op */ }
    let cacheEntries = 0;
    try {
        if (cache && typeof cache.keys === 'function') cacheEntries = (await cache.keys()).length;
    } catch (_) { /* optional */ }
    const repair = repairResult || {};
    const integrity = repair.integrity || settings.integrity || (settings.skipInspection ? (report && report.integrity || { checked: 0, missing: [], invalid: [], corrupted: [], healthy: 0, inspectionSupported: true, hashVerified: 0, hashUnsupported: 0, manifestVerified: Boolean(report && report.integrityManifest && report.integrityManifest.verified), manifestError: '' }) : await inspectShellCache(cache, SHELL_FILES));
    return Object.assign({}, report || {}, {
        repaired: repair.repaired || [],
        repairFailed: repair.failed || [],
        repairAttempts: Number(repair.repairAttempts) || 0,
        repairReason: String(repair.repairReason || ''),
        lastRepairedAt: String(repair.lastRepairedAt || ''),
        integrity,
        verified: integrity.missing.length === 0 && integrity.invalid.length === 0 && !(integrity.corrupted && integrity.corrupted.length),
        contentVerified: integrity.missing.length === 0 && integrity.invalid.length === 0 && !(integrity.corrupted && integrity.corrupted.length) && Boolean(integrity.manifestVerified) && Number(integrity.hashUnsupported || 0) === 0,
        cacheEntries,
        cacheName: CACHE_NAME
    });
}

async function runPeriodicIntegrityAudit(cache, requestedSampleSize, options) {
    const settings = options || {};
    const candidates = SHELL_FILES.filter(file => file !== INTEGRITY_MANIFEST_URL);
    const sampleSize = Math.max(4, Math.min(32, Number(requestedSampleSize) || 12, candidates.length));
    const cursor = candidates.length ? integritySampleCursor % candidates.length : 0;
    const previousReport = await readInstallReport(cache, null, { skipInspection: true });
    const previousBackoff = previousReport.integrityBackoff && typeof previousReport.integrityBackoff === 'object' ? previousReport.integrityBackoff : {};
    const now = Date.now();
    const selected = [];
    const skippedBackoff = [];
    let scanned = 0;
    while (selected.length < sampleSize && scanned < candidates.length) {
        const file = candidates[(cursor + scanned) % candidates.length];
        const backoff = previousBackoff[file];
        if (backoff && Number(backoff.nextRetryAtMs) > now) skippedBackoff.push(file);
        else selected.push(file);
        scanned += 1;
    }
    const nextCursor = candidates.length ? (cursor + Math.max(scanned, sampleSize)) % candidates.length : 0;
    integritySampleCursor = nextCursor;
    const manifest = await loadIntegrityManifest(cache);
    const before = await inspectShellCache(cache, selected, { manifest });
    const problemFiles = Array.from(new Set(before.missing.concat(before.invalid, before.corrupted || [])));
    const repair = problemFiles.length
        ? await repairShellCache(cache, { files: selected, reason: String(settings.source || 'periodic-integrity') })
        : { repaired: [], failed: [], requiredMissing: [], integrity: before, repairAttempts: 0, lastRepairedAt: new Date().toISOString(), repairReason: String(settings.source || 'periodic-integrity') };
    const after = repair.integrity || before;
    const remaining = Array.from(new Set(after.missing.concat(after.invalid, after.corrupted || [], repair.failed.map(item => item && item.file || '').filter(Boolean))));
    const integrityBackoff = Object.assign({}, previousBackoff);
    selected.forEach(file => {
        if (!remaining.includes(file)) { delete integrityBackoff[file]; return; }
        const previous = integrityBackoff[file] || {};
        const failures = Math.max(0, Number(previous.failures) || 0) + 1;
        const waitMs = Math.min(INTEGRITY_BACKOFF_MAX_MS, INTEGRITY_BACKOFF_BASE_MS * (2 ** Math.min(8, failures - 1)));
        integrityBackoff[file] = { failures, lastFailedAt: new Date(now).toISOString(), nextRetryAt: new Date(now + waitMs).toISOString(), nextRetryAtMs: now + waitMs };
    });
    const checkedAt = new Date().toISOString();
    const periodicIntegrity = {
        checkedAt,
        source: String(settings.source || 'scheduled'),
        checked: after.checked,
        healthy: after.healthy,
        repaired: repair.repaired.length,
        failed: remaining.length,
        cursor,
        nextCursor,
        sampleSize: selected.length,
        skippedBackoff: skippedBackoff.length,
        missing: after.missing,
        invalid: after.invalid,
        corrupted: after.corrupted || [],
        repairFailed: remaining
    };
    const historyEntry = {
        checkedAt,
        source: periodicIntegrity.source,
        checked: periodicIntegrity.checked,
        healthy: periodicIntegrity.healthy,
        repaired: periodicIntegrity.repaired,
        failed: periodicIntegrity.failed,
        skippedBackoff: periodicIntegrity.skippedBackoff,
        cursor,
        nextCursor
    };
    const history = [historyEntry, ...(Array.isArray(previousReport.integrityHistory) ? previousReport.integrityHistory : [])].slice(0, INTEGRITY_AUDIT_HISTORY_LIMIT);
    const updated = Object.assign({}, previousReport, {
        periodicIntegrity,
        integrityHistory: history,
        integrityBackoff,
        lastRepairedAt: repair.repaired.length ? repair.lastRepairedAt : previousReport.lastRepairedAt || '',
        cacheName: CACHE_NAME
    });
    await writeInstallReport(cache, updated);
    return updated;
}

async function retryFailedIntegrityAssets(cache, requestedFiles) {
    const previous = await readInstallReport(cache, null, { skipInspection: true });
    const periodic = previous.periodicIntegrity || {};
    const candidates = Array.from(new Set((Array.isArray(requestedFiles) ? requestedFiles : [])
        .concat(periodic.repairFailed || [], periodic.missing || [], periodic.invalid || [], periodic.corrupted || [], Object.keys(previous.integrityBackoff || {}))
        .filter(file => SHELL_FILES.includes(file))));
    if (!candidates.length) return { report: previous, result: { requested: 0, repaired: 0, failed: 0, files: [] } };
    const repair = await repairShellCache(cache, { files: candidates, reason: 'manual-failed-asset-retry', forceManifest: true });
    const report = await readInstallReport(cache, repair);
    const remaining = Array.from(new Set((repair.integrity && [] || []).concat(
        repair.integrity && repair.integrity.missing || [],
        repair.integrity && repair.integrity.invalid || [],
        repair.integrity && repair.integrity.corrupted || [],
        (repair.failed || []).map(item => item && item.file || '').filter(Boolean)
    )));
    const now = Date.now();
    const integrityBackoff = Object.assign({}, previous.integrityBackoff || {});
    candidates.forEach(file => {
        if (!remaining.includes(file)) { delete integrityBackoff[file]; return; }
        const prior = integrityBackoff[file] || {};
        const failures = Math.max(0, Number(prior.failures) || 0) + 1;
        const waitMs = Math.min(INTEGRITY_BACKOFF_MAX_MS, INTEGRITY_BACKOFF_BASE_MS * (2 ** Math.min(8, failures - 1)));
        integrityBackoff[file] = { failures, lastFailedAt: new Date(now).toISOString(), nextRetryAt: new Date(now + waitMs).toISOString(), nextRetryAtMs: now + waitMs };
    });
    const historyEntry = { checkedAt: new Date().toISOString(), source: 'manual-failed-asset-retry', checked: candidates.length, healthy: Math.max(0, candidates.length - remaining.length), repaired: repair.repaired.length, failed: remaining.length, skippedBackoff: 0, cursor: integritySampleCursor, nextCursor: integritySampleCursor };
    const updated = Object.assign({}, report, {
        integrityBackoff,
        integrityHistory: [historyEntry, ...(Array.isArray(previous.integrityHistory) ? previous.integrityHistory : [])].slice(0, INTEGRITY_AUDIT_HISTORY_LIMIT),
        cacheName: CACHE_NAME
    });
    await writeInstallReport(cache, updated);
    return { report: updated, result: { requested: candidates.length, repaired: repair.repaired.length, failed: remaining.length, files: candidates, remaining } };
}

async function clearIntegrityAuditState(cache, options) {
    const settings = options || {};
    const previous = await readInstallReport(cache, null, { skipInspection: true });
    const clearedHistory = Array.isArray(previous.integrityHistory) ? previous.integrityHistory.length : 0;
    const clearedBackoff = settings.clearBackoff && previous.integrityBackoff ? Object.keys(previous.integrityBackoff).length : 0;
    const updated = Object.assign({}, previous, {
        integrityHistory: [],
        integrityBackoff: settings.clearBackoff ? {} : previous.integrityBackoff || {},
        periodicIntegrity: settings.clearLatest ? null : previous.periodicIntegrity || null,
        cacheName: CACHE_NAME
    });
    await writeInstallReport(cache, updated);
    return { report: updated, result: { clearedHistory, clearedBackoff, clearLatest: Boolean(settings.clearLatest) } };
}

async function broadcastInstallReport(cache, repaired) {
    if (!self.clients || typeof self.clients.matchAll !== 'function') return;
    const report = await readInstallReport(cache, repaired);
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    clients.forEach(client => {
        if (client && typeof client.postMessage === 'function') client.postMessage({
            type: 'ai-shorts-service-worker-install-report',
            report
        });
    });
}

self.addEventListener('message', event => {
    const data = event && event.data || {};
    const supportedTypes = new Set(['ai-shorts-service-worker-status-request', 'ai-shorts-service-worker-repair-request', 'ai-shorts-service-worker-integrity-sample-request', 'ai-shorts-service-worker-integrity-retry-request', 'ai-shorts-service-worker-integrity-clear-request']);
    if (!supportedTypes.has(data.type)) return;
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);
        let repair = null;
        let report = null;
        let commandResult = null;
        if (data.type === 'ai-shorts-service-worker-repair-request') {
            repair = await repairShellCache(cache, { includeOptional: true, reason: 'manual' });
            report = await readInstallReport(cache, repair);
            await writeInstallReport(cache, report);
        } else if (data.type === 'ai-shorts-service-worker-integrity-sample-request') {
            report = await runPeriodicIntegrityAudit(cache, data.sampleSize, { source: data.source || 'manual' });
        } else if (data.type === 'ai-shorts-service-worker-integrity-retry-request') {
            const outcome = await retryFailedIntegrityAssets(cache, data.files);
            report = outcome.report;
            commandResult = outcome.result;
        } else if (data.type === 'ai-shorts-service-worker-integrity-clear-request') {
            const outcome = await clearIntegrityAuditState(cache, { clearBackoff: Boolean(data.clearBackoff), clearLatest: Boolean(data.clearLatest) });
            report = outcome.report;
            commandResult = outcome.result;
        } else {
            report = await readInstallReport(cache, null);
        }
        const target = event.source;
        if (target && typeof target.postMessage === 'function') target.postMessage({
            type: 'ai-shorts-service-worker-install-report',
            requestId: String(data.requestId || ''),
            report,
            commandResult
        });
        if (repair) await broadcastInstallReport(cache, repair);
    })());
});

self.addEventListener('install', event => {
    event.waitUntil(precacheShell().then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);
        const repair = await repairShellCache(cache, { includeOptional: true, reason: 'activation' });
        if (repair.requiredMissing.length) throw new Error(`Service worker cache repair failed: ${repair.requiredMissing.join(', ')}`);
        const report = await readInstallReport(cache, repair);
        const keys = await caches.keys();
        const rollbackCaches = keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME);
        const activationVerified = report.verified && (!cryptoSupported() || report.contentVerified);
        const finalReport = Object.assign({}, report, { activationVerified, rollbackPreserved: activationVerified ? [] : rollbackCaches });
        await writeInstallReport(cache, finalReport);
        if (!activationVerified) throw new Error('Service worker content integrity verification failed; previous cache preserved');
        await Promise.all(rollbackCaches.map(key => caches.delete(key)));
        await self.clients.claim();
        await broadcastInstallReport(cache, repair);
    })());
});

function isNavigationRequest(request) {
    return request.mode === 'navigate' || request.destination === 'document';
}

function isControlAsset(url) {
    return url.pathname.endsWith('/manifest.webmanifest') || url.pathname.endsWith('/sw.js');
}

const RUNTIME_CACHE_DESTINATIONS = new Set(['style', 'script', 'worker', 'image', 'font']);

function isRuntimeCacheable(request, url) {
    if (!request || !url || !RUNTIME_CACHE_DESTINATIONS.has(request.destination || '')) return false;
    if (request.destination === 'audio' || request.destination === 'video') return false;
    return url.pathname.includes('/assets/') || url.pathname.includes('/src/');
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
    if (cached && cached.ok !== false) return cached;
    const cache = await caches.open(CACHE_NAME);
    if (cached && cached.ok === false && typeof cache.delete === 'function') await cache.delete(request).catch(() => {});
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone()).catch(() => {});
    return response;
}

self.addEventListener('fetch', event => {
    const request = event.request;
    if (request.method !== 'GET') return;
    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;
    if (isNavigationRequest(request)) {
        event.respondWith(networkFirst(request, { navigationFallback: true }));
        return;
    }
    if (isControlAsset(url)) {
        event.respondWith(networkFirst(request, { navigationFallback: false }));
        return;
    }
    if (isRuntimeCacheable(request, url)) {
        event.respondWith(cacheFirst(request));
    }
});
