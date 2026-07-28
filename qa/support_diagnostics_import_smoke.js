#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/diagnostics/support-diagnostics.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/css/foundation-polish.css'), 'utf8');

function assert(condition, message) {
    if (!condition) throw new Error(message);
    console.log(`PASS ${message}`);
}

(async () => {
    const downloads = [];
    const diagnostics = [];
    const window = { Blob, AIShortsRuntimeConfig: { APP_VERSION: 'v1.6.20' } };
    const context = vm.createContext({ window, Blob, Object, Array, Map, Set, Math, Number, String, Date, Error, Promise, JSON, console });
    vm.runInContext(source, context, { filename: 'support-diagnostics.js' });
    const service = window.AIShortsSupportDiagnostics;

    const current = {
        schema: service.SCHEMA,
        schemaVersion: 1,
        exportType: service.SCHEMA,
        appVersion: 'v1.6.20',
        generatedAt: '2026-07-27T05:00:00.000Z',
        analysis: {
            exportType: 'analysis-timing-diagnostics', schemaVersion: 2,
            history: [{ id: 'timing-aabbccdd', mediaKey: 'media-aabbccdd', status: 'completed', totalMs: 100, fileName: 'private.mp4', error: '/Users/private/movie.mp4', stages: [{ key: 'engine', label: '엔진', durationMs: 80 }] }]
        },
        benchmarks: [{ exportType: 'vision-model-benchmark-diagnostics', schemaVersion: 2, pack: { id: 'pack-1', name: 'Vision', files: 2, sourceUrl: 'https://private.example/model.bin' }, performance: { historyCount: 1, latest: [{ backend: 'gpu', medianMs: 4, p95Ms: 5, measuredAt: '2026-07-27T05:00:00.000Z' }] } }],
        runtime: { webAudio: true, runtimeErrors: 1 },
        diagnostics: [{ type: 'runtime-error', message: '/private/path' }]
    };
    const inspection = service.inspectBundle(current);
    assert(inspection.valid && inspection.compatible && inspection.summary.analysisHistoryCount === 1 && inspection.summary.benchmarkCount === 1, 'current support bundle is inspected without mutating project state');
    const normalizedText = JSON.stringify(inspection.normalized);
    assert(!normalizedText.includes('private.mp4') && !normalizedText.includes('/Users/private') && !normalizedText.includes('private.example'), 'import normalization strips file names, paths, URLs, and unapproved fields');

    const legacyAnalysis = service.parseBundleText(JSON.stringify({ exportType: 'analysis-timing-diagnostics', version: 1, appVersion: 'v1.6.15', history: [] }));
    assert(legacyAnalysis.compatible && legacyAnalysis.migrated && legacyAnalysis.normalized.migratedFrom === 'analysis-timing-diagnostics', 'legacy analysis diagnostics migrate into a read-only support preview');

    const legacyBenchmark = service.inspectBundle({ exportType: 'vision-model-benchmark-diagnostics', version: 1, pack: { id: 'pack-legacy' }, performance: { historyCount: 2 } });
    assert(legacyBenchmark.compatible && legacyBenchmark.normalized.benchmarks.length === 1 && legacyBenchmark.migrated, 'legacy benchmark diagnostics migrate into the current support bundle');

    const future = service.inspectBundle({ schema: service.SCHEMA, schemaVersion: 99, exportType: service.SCHEMA });
    assert(!future.compatible && future.code === 'future-schema' && /업데이트/.test(future.issues[0].action), 'future schema files are rejected with an explicit update action');

    const corrupted = service.parseBundleText('{"schema":');
    assert(!corrupted.compatible && corrupted.code === 'invalid-json' && /손상/.test(corrupted.issues[0].message), 'corrupted JSON receives distinct repair guidance');

    const unknown = service.inspectBundle({ schema: 'other-product-diagnostics', schemaVersion: 1 });
    assert(!unknown.compatible && unknown.code === 'unsupported-schema', 'unknown diagnostic schemas are not silently normalized');

    const oversized = await service.inspectFile({ name: 'huge.json', size: 4097, type: 'application/json', text: async () => '{}' }, { maxBytes: 4096 });
    assert(!oversized.compatible && oversized.code === 'file-too-large', 'oversized diagnostic files are rejected before reading');

    const imported = await service.inspectFile({ name: 'legacy-analysis.json', size: 128, type: 'application/json', text: async () => JSON.stringify({ exportType: 'analysis-timing-diagnostics', version: 1, history: [] }) }, { maxBytes: 4096 });
    const exported = service.exportNormalizedInspection(imported, { downloadService: { saveBlob(blob, filename) { downloads.push({ blob, filename }); } }, appState: { addDiagnostic(item) { diagnostics.push(item); } } });
    assert(exported.saved && downloads.length === 1 && /normalized/.test(downloads[0].filename), 'compatible imports can be saved as a normalized bundle through the shared download owner');
    const normalized = JSON.parse(await downloads[0].blob.text());
    assert(normalized.schema === service.SCHEMA && normalized.schemaVersion === service.SCHEMA_VERSION, 'normalized export uses the current support bundle schema');
    assert(diagnostics.some(item => item.type === 'support-diagnostics-normalized-export'), 'normalized export records a bounded diagnostic event');

    assert(html.includes('id="supportDiagnosticsImportBtn"') && html.includes('id="supportDiagnosticsFileInput"') && html.includes('id="supportDiagnosticsDialog"') && html.includes('id="supportDiagnosticsNormalizedBtn"'), 'support diagnostics import and preview controls are exposed in the analysis UI');
    assert(app.includes('handleSupportDiagnosticsFile') && app.includes('renderSupportDiagnosticsInspection') && app.includes('exportNormalizedSupportDiagnostics'), 'app wiring owns import, preview, and normalized export actions');
    assert(css.includes('.support-diagnostics-summary') && css.includes('.support-diagnostics-issues') && css.includes('.support-diagnostics-actions'), 'support diagnostics preview has explicit CSS ownership');
    console.log('PASS v1.6.20 support diagnostics import, compatibility, and corruption guidance contract');
})().catch(error => {
    console.error(error && error.stack || error);
    process.exit(1);
});
