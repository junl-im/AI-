'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');
function assert(value, message) { if (!value) throw new Error(message); }
let created = 0;
const revoked = [];
const timers = [];
const analysisCalls = [];
const resetOptions = [];
const context = {
    window: null,
    URL: {
        createObjectURL() { created += 1; return `blob:${created}`; },
        revokeObjectURL(value) { revoked.push(value); }
    },
    setTimeout(fn) { timers.push(fn); return timers.length; }
};
context.window = context;
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/app/media-import-controller.js'), 'utf8'), context);
const state = {};
const diagnostics = [];
const elements = { fileInput: { value: 'x' }, selectedBadge: {}, importStatus: {}, recommendationList: { classList: { add() {} } } };
const controller = context.AIShortsMediaImportController.createMediaImportController({
    state,
    utils: {
        detectMediaKind: file => file.type.startsWith('video') ? 'video' : '',
        createObjectUrl: file => context.URL.createObjectURL(file),
        revokeObjectUrl: url => context.URL.revokeObjectURL(url)
    },
    store: {
        resetMedia(options) {
            resetOptions.push(options || {});
            if (!(options && options.skipFileUrlRevoke) && state.fileUrl) context.URL.revokeObjectURL(state.fileUrl);
            state.fileUrl = '';
        },
        addDiagnostic(value) { diagnostics.push(value); }
    },
    elements,
    operationCoordinator: { startMediaSession() { return created + 10; } },
    renderQueue: { isRunning() { return false; } },
    setupMediaPreview() {}, renderAll() {}, updateButtons() {}, activateFlowTab() {}, setProgress() {},
    analyzeCurrentFile(options) { analysisCalls.push(options); }
});
(async () => {
    for (let index = 0; index < 20; index += 1) {
        await controller.importFiles([{ name: `clip-${index}.mp4`, type: 'video/mp4', size: 1024 + index }]);
    }
    assert(created === 20, '20 source URLs created');
    assert(revoked.length === 19, 'previous source URL revoked exactly once per replacement');
    assert(new Set(revoked).size === 19, 'no source URL was revoked twice');
    assert(resetOptions.every(item => item.skipFileUrlRevoke === true), 'state reset skips controller-owned URL revocation');
    assert(state.fileUrl === 'blob:20', 'latest URL remains active');
    timers.forEach(fn => fn());
    assert(analysisCalls.length === 1 && analysisCalls[0].source === 'file-open', 'only the latest delayed analysis starts');
    controller.dispose();
    assert(revoked.length === 20 && revoked[19] === 'blob:20', 'latest URL revoked on dispose');
    assert(diagnostics.filter(item => item.type === 'import').length === 20, 'all imports recorded');
    console.log('PASS v1.5.4 20-cycle media import, stale timer, and single-owner Object URL cleanup');
})().catch(error => { console.error(error); process.exit(1); });
