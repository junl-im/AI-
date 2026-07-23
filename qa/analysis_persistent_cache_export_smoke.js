#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const cacheSource = fs.readFileSync(path.join(root, 'src/engine/analysis-cache.js'), 'utf8');
const kernelSource = fs.readFileSync(path.join(root, 'src/engine/engine-kernel.js'), 'utf8');
const downloads = [];
const window = {
    structuredClone: global.structuredClone,
    AIShortsRuntimeConfig: {
        APP_VERSION: 'v1.5.27',
        BUILD_KEY: '1.5.27-selective-cache-integrity-retry-portable-backup',
        ANALYSIS_PERSISTENT_CACHE_ENABLED: true
    },
    AIShortsDownloadService: { saveBlob(blob, filename) { downloads.push({ blob, filename }); } }
};
const context = vm.createContext({ window, ArrayBuffer, Date, Object, Map, Math, Number, String, Uint8Array, DataView, WeakMap, Set, Promise, JSON, Blob, console });
vm.runInContext(cacheSource, context, { filename: 'analysis-cache.js' });
const probe = window.AIShortsAnalysisCache.createAnalysisCache(2, { maxAgeMs: 60000 });
probe.set('secret-video.mp4::private/path::fingerprint', { score: 99 });
probe.get('secret-video.mp4::private/path::fingerprint');
vm.runInContext(kernelSource, context, { filename: 'engine-kernel.js' });
const engine = window.AIShortsEngineKernel;
const diagnostics = engine.getAnalysisCacheDiagnostics();
if (!diagnostics.privacy || diagnostics.privacy.includesFileNames || diagnostics.privacy.includesPaths) throw new Error('diagnostics must explicitly exclude file names and paths');
if (!diagnostics.cache || !diagnostics.cache.persistent || diagnostics.cache.persistent.supported !== false) throw new Error('persistent cache must degrade safely when IndexedDB is unavailable');
const serialized = JSON.stringify(diagnostics);
if (serialized.includes('secret-video.mp4') || serialized.includes('private/path')) throw new Error('diagnostic events must use non-reversible key tokens instead of raw cache keys');
if (!diagnostics.recentEvents.some(item => item.keyToken && !item.key)) throw new Error('diagnostics must retain privacy-safe cache event correlation');
const exported = engine.exportAnalysisCacheDiagnostics();
if (!exported.saved || downloads.length !== 1 || !/analysis-cache-diagnostics/.test(downloads[0].filename)) throw new Error('analysis diagnostics must export through the shared download owner');
console.log('PASS privacy-safe layered analysis cache diagnostics export');
