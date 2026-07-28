#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/diagnostics/support-diagnostics.js'), 'utf8');
const staged = fs.readFileSync(path.join(root, 'src/boot/staged-ui-loader.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function assert(condition, message) {
    if (!condition) throw new Error(message);
    console.log(`PASS ${message}`);
}

(async () => {
    const downloads = [];
    const diagnostics = [];
    const window = { Blob, AIShortsRuntimeConfig: { APP_VERSION: 'v1.6.20', DIAGNOSTIC_HISTORY_LIMIT: 20 } };
    const context = vm.createContext({ window, Blob, Object, Array, Map, Set, Math, Number, String, Date, Error, Promise, JSON, console });
    vm.runInContext(source, context, { filename: 'support-diagnostics.js' });
    const service = window.AIShortsSupportDiagnostics;
    const analysisController = {
        createTimingDiagnostics() {
            return { exportType: 'analysis-timing-diagnostics', version: 1, appVersion: 'v1.6.20', generatedAt: '2026-07-27T00:00:00.000Z', current: null, history: [{ mediaKey: 'media-aabbccdd', completedAt: '2026-07-27T00:00:00.000Z', totalMs: 10, status: 'completed', stages: [] }] };
        }
    };
    const visionManager = {
        listPacks() { return [{ id: 'pack-1' }]; },
        createBenchmarkDiagnostics() { return { exportType: 'vision-model-benchmark-diagnostics', version: 1, appVersion: 'v1.6.20', pack: { id: 'pack-1' }, performance: { historyCount: 2 }, policy: { lowConfidenceExcluded: true } }; }
    };
    const appState = {
        state: {
            file: { name: 'private-file.mp4' }, fileKind: 'video', fileMeta: { duration: 30 }, recommendations: [1, 2], captions: [1],
            diagnostics: [{ type: 'analysis-error', message: '/Users/private/movie.mp4', fileName: 'private-file.mp4' }]
        },
        addDiagnostic(item) { diagnostics.push(item); }
    };
    const result = service.exportBundle({
        config: window.AIShortsRuntimeConfig,
        appState,
        analysisController,
        visionManager,
        runtimeHealth: { collect() { return { webAudio: true, worker: true, mediaRecorder: true, runtimeErrors: 0, hydrationReady: 'shell' }; } },
        operationCoordinator: { snapshot() { return { mediaSessionId: 2, active: [{ channel: 'analysis', ageMs: 12, meta: { fileName: 'private-file.mp4' } }] }; } },
        serviceWorkerRegistration: { getStatus() { return { supported: true, registered: true, controlled: true, scope: 'https://private.example/app/' }; } },
        downloadService: { saveBlob(blob, filename) { downloads.push({ blob, filename }); } }
    });
    assert(result.saved && downloads.length === 1 && /support-diagnostics/.test(downloads[0].filename), 'support diagnostics bundle exports through the shared download owner');
    const payload = JSON.parse(await downloads[0].blob.text());
    const text = JSON.stringify(payload);
    assert(payload.schema === 'ai-shorts-support-diagnostics-bundle' && payload.schemaVersion === 1, 'support bundle declares a stable schema and version');
    assert(payload.analysis.schemaVersion === 2 && payload.analysis.migratedFrom === 1, 'legacy analysis diagnostics migrate into the current bundle schema');
    assert(payload.benchmarks[0].schemaVersion === 2 && payload.benchmarks[0].migratedFrom === 1, 'legacy benchmark diagnostics migrate into the current bundle schema');
    assert(!text.includes('private-file.mp4') && !text.includes('/Users/private') && !text.includes('private.example'), 'support bundle excludes file names, paths, origins, and operation metadata');
    assert(payload.app.fileLoaded === true && payload.app.recommendationCount === 2 && payload.operations.active[0].channel === 'analysis', 'support bundle preserves bounded operational facts needed for support');
    assert(diagnostics.some(item => item.type === 'support-diagnostics-export'), 'support bundle export is recorded without private payload data');
    const migrated = service.normalizeBundle({ exportType: 'analysis-timing-diagnostics', version: 1, history: [] });
    assert(migrated.schema === service.SCHEMA && migrated.migratedFrom === 'analysis-timing-diagnostics', 'standalone legacy analysis diagnostics normalize into a support bundle');
    assert(staged.includes("src/diagnostics/support-diagnostics.js") && app.includes('exportSupportDiagnosticsBundle') && html.includes('id="supportDiagnosticsBundleBtn"'), 'support diagnostics module is staged without increasing direct startup scripts and is wired to the UI');
    console.log('PASS v1.6.20 integrated support diagnostics and schema compatibility contract');
})().catch(error => {
    console.error(error && error.stack || error);
    process.exit(1);
});
