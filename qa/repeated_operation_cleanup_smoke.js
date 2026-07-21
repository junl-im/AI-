'use strict';
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const events = [];
const body = { dataset: {} };
const context = {
    window: null,
    document: { body },
    AbortController,
    CustomEvent: class CustomEvent { constructor(type, init) { this.type = type; this.detail = init && init.detail; } },
    dispatchEvent(event) { events.push(event); },
    AIShortsAppState: { addDiagnostic() {} }
};
context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync('src/engine/operation-coordinator.js', 'utf8'), context);
const coordinator = context.AIShortsOperationCoordinator;

for (let cycle = 0; cycle < 20; cycle += 1) {
    coordinator.startMediaSession({ fileName: `cycle-${cycle}.mp4` });
    const analysis = coordinator.begin('analysis', { cycle });
    assert.equal(coordinator.snapshot().active.length, 1);
    assert.equal(coordinator.finish(analysis, { result: 'done' }), true);
    const preview = coordinator.begin('preview', { cycle });
    const render = coordinator.begin('render', { cycle });
    assert.equal(coordinator.snapshot().active.length, 2);
    coordinator.cancel('preview', 'cycle cleanup');
    assert.equal(coordinator.finish(render, { result: 'done' }), true);
    assert.equal(coordinator.snapshot().active.length, 0, `cycle ${cycle} leaked operation ownership`);
    assert.equal(preview.signal.aborted, true);
}
assert.equal(body.dataset.activeOperations, '');
assert.ok(events.length >= 100, 'operation state changes should remain observable');
console.log('repeated_operation_cleanup_smoke: ok');
