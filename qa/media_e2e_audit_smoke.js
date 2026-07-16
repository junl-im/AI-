#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const auditPath = path.join(root, 'qa', 'runtime-media-e2e-v1.3.2.json');
function assert(value, message) {
    if (!value) { console.error(`FAIL ${message}`); process.exit(1); }
    console.log(`PASS ${message}`);
}
assert(fs.existsSync(auditPath), 'real-media E2E audit artifact exists');
const report = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
assert(report.version === '1.3.2', 'real-media E2E audit matches v1.3.2');
for (const key of ['audio', 'video']) {
    const result = report[key];
    assert(result.analysisStatus === '렌더 큐 완료', `${key} reaches render completion`);
    assert(result.recommendationCount > 0 && result.selectedCount === 1, `${key} creates and selects a recommendation`);
    assert(result.queue.done === 1 && result.queue.failed === 0 && result.queue.cancelled === 0, `${key} completes one render job`);
    assert(result.operations.active.length === 0, `${key} leaves no active operation`);
    assert(result.runtime.runtimeErrors === 0 && result.errors.length === 0, `${key} has no runtime errors`);
    assert(Number(result.outputProbe.duration) >= 1.5 && Number(result.outputProbe.size) > 10000, `${key} produces a non-empty playable output`);
}
assert(report.cancel.cancelEnabledDuringRun === true, 'cancel control becomes available during rendering');
assert(report.cancel.queue.cancelled === 1 && report.cancel.downloads.length === 0, 'cancelled render produces no download');
assert(report.cancel.operations.active.length === 0 && report.cancel.errors.length === 0, 'cancel flow cleans up operation state');
assert(report.retry.failed.queue.failed === 1 && report.retry.failed.retryDisabled === false, 'injected playback failure becomes retryable');
assert(report.retry.retried.queue.done === 1 && report.retry.retried.queue.items[0].attempts === 2, 'retry starts a fresh successful render attempt');
assert(Number(report.retry.retried.outputProbe.size) > 10000 && report.retry.retried.errors.length === 0, 'retried output is playable and error-free');
console.log('PASS v1.3.2 MP3, MP4, cancel, and retry browser E2E audit');
