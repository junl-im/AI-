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
function ok(condition, message) { if (!condition) throw new Error(message); console.log(`PASS ${message}`); }
(async () => {
  const downloads = [];
  const diagnostics = [];
  const window = { Blob, AIShortsRuntimeConfig: { APP_VERSION: 'v1.6.24', DIAGNOSTIC_HISTORY_LIMIT: 20 } };
  vm.runInContext(source, vm.createContext({ window, Blob, Object, Array, Map, Set, Math, Number, String, Date, Error, Promise, JSON, console }), { filename: 'support-diagnostics.js' });
  const service = window.AIShortsSupportDiagnostics;
  const imported = service.inspectBundle({
    schema: service.SCHEMA, schemaVersion: 1, exportType: service.SCHEMA, appVersion: 'v1.6.18', generatedAt: '2026-07-27T01:00:00.000Z',
    runtime: { webAudio: true, worker: false, mediaRecorder: true, serviceWorker: true, secureContext: true, runtimeErrors: 3 },
    serviceWorker: { controlled: false },
    analysis: { schemaVersion: 2, history: [{ id: 'timing-aabbccdd', mediaKey: 'media-aabbccdd', completedAt: '2026-07-27T01:00:00.000Z', status: 'completed', totalMs: 12, stages: [] }] },
    benchmarks: []
  });
  const options = {
    config: window.AIShortsRuntimeConfig,
    appState: { state: { diagnostics: [] }, addDiagnostic(item) { diagnostics.push(item); } },
    analysisController: { createTimingDiagnostics() { return { schemaVersion: 2, history: [] }; } },
    runtimeHealth: { collect() { return { webAudio: true, worker: true, mediaRecorder: true, serviceWorker: true, secureContext: true, runtimeErrors: 0 }; } },
    operationCoordinator: { snapshot() { return { active: [] }; } },
    serviceWorkerRegistration: { getStatus() { return { supported: true, registered: true, controlled: true, active: true }; } },
    visionManager: { listPacks() { return []; } },
    downloadService: { saveBlob(blob, filename) { downloads.push({ blob, filename }); } }
  };
  const comparison = service.compareInspectionToCurrent(imported, options);
  ok(comparison.compatible && comparison.items.length >= 10, 'compatible imported diagnostics compare against the bounded current environment snapshot');
  ok(comparison.items.some(item => item.key === 'app-version' && item.status === 'different'), 'application version drift is reported explicitly');
  ok(comparison.items.some(item => item.key === 'runtime-worker' && item.current === '지원'), 'runtime capability differences show the current browser value');
  ok(comparison.items.some(item => item.key === 'runtime-errors' && item.current === '0건'), 'runtime error counts are compared without exposing raw error messages');
  const exported = service.exportSupportSummaryReport(imported, options);
  ok(exported.saved && downloads.length === 1 && /support-summary/.test(downloads[0].filename), 'support summary report exports through the shared download owner');
  const report = await downloads[0].blob.text();
  ok(report.includes('현재 환경 비교') && report.includes('가져온 앱 버전') && report.includes('개인정보 보호'), 'support report contains comparison, provenance, and privacy guidance');
  ok(!report.includes('fileName') && !report.includes('localPath') && !report.includes('https://'), 'support report excludes file names, local paths, and origins');
  ok(diagnostics.some(item => item.type === 'support-diagnostics-summary-export'), 'summary export records a bounded diagnostic event');
  ok(html.includes('id="supportDiagnosticsComparisonList"') && html.includes('id="supportDiagnosticsReportBtn"'), 'diagnostics modal exposes current-environment comparison and summary report controls');
  ok(app.includes('exportSupportDiagnosticsSummary') && app.includes('compareInspectionToCurrent'), 'app wiring owns comparison rendering and report export');
  ok(css.includes('.support-diagnostics-comparison-list') && css.includes('[data-status="warning"]'), 'comparison rows have explicit status-aware CSS ownership');
  console.log('PASS v1.6.24 support diagnostics comparison and summary report contract');
})().catch(error => { console.error(error && error.stack || error); process.exit(1); });
