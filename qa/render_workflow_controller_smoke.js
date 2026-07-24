#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/app/render-workflow-controller.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

function assert(value, message) {
    if (!value) throw new Error(message);
    console.log(`PASS ${message}`);
}

class FakeNode {
    constructor(tagName) {
        this.tagName = String(tagName || '').toUpperCase();
        this.children = [];
        this.dataset = {};
        this.style = {};
        this.attributes = {};
        this.className = '';
        this.textContent = '';
        this.disabled = false;
    }
    appendChild(child) { this.children.push(child); child.parentNode = this; return child; }
    removeChild(child) { this.children.splice(this.children.indexOf(child), 1); return child; }
    setAttribute(name, value) { this.attributes[name] = String(value); }
    get firstChild() { return this.children[0] || null; }
}

function findByClass(node, className) {
    if (!node) return null;
    if (String(node.className || '').split(/\s+/).includes(className)) return node;
    for (const child of node.children || []) {
        const found = findByClass(child, className);
        if (found) return found;
    }
    return null;
}

const document = {
    body: new FakeNode('body'),
    createElement: tagName => new FakeNode(tagName)
};
const window = { document };
vm.runInNewContext(source, { window, console, Object, Array, Number, String, Boolean, Math, Date, Error, Promise, Set, Map });
assert(window.AIShortsRenderWorkflowController && typeof window.AIShortsRenderWorkflowController.create === 'function', 'render workflow controller exposes a factory');
assert(!source.includes('.innerHTML'), 'render queue UI does not build user-facing rows with innerHTML');
assert(html.indexOf('src/app/render-workflow-controller.js') < html.indexOf('src/app.js'), 'render workflow controller loads before the main app');
assert(sw.includes('./src/app/render-workflow-controller.js?v=1.6.1-advanced-diagnostics-gate'), 'render workflow controller is available offline');

const sourceFile = { name: 'source.mp4' };
const state = {
    file: sourceFile,
    selectedRecommendationId: 'first',
    selectedRange: { start: 1, end: 4, duration: 3, score: 90 },
    recommendations: [
        { id: 'first', start: 1, end: 4, duration: 3, score: 90, rangeText: '0:01 - 0:04' },
        { id: 'second', start: 5, end: 8, duration: 3, score: 88, rangeText: '0:05 - 0:08' }
    ],
    settings: { cropMode: 'center', thumbnailTemplate: 'neon', captionOffset: 0, captionStyle: 'bold' },
    waveformBins: [],
    captions: []
};
const elements = {
    previewCanvas: {},
    previewStatus: new FakeNode('div'),
    renderQueueStatus: new FakeNode('div'),
    renderQueueList: new FakeNode('div'),
    renderQueueCancelBtn: new FakeNode('button'),
    renderQueueRetryBtn: new FakeNode('button'),
    renderQueueClearBtn: new FakeNode('button'),
    titleInput: { value: 'title' }
};
let finishCount = 0;
let saveCount = 0;
const controller = window.AIShortsRenderWorkflowController.create({
    state,
    elements,
    document,
    utils: {
        safeFileBaseName: () => 'source',
        extensionFromMime: () => 'webm'
    },
    store: { addDiagnostic() {} },
    renderer: {
        inspectRenderCapability: () => ({ ok: true, reasons: [], warnings: [], mimeType: 'video/webm' }),
        recordVerticalSegment: async (_canvas, _media, _options, progress) => {
            progress(50, '렌더링');
            return { blob: { size: 128 }, mimeType: 'video/webm' };
        }
    },
    downloadService: { saveBlob() { saveCount += 1; } },
    renderQueue: {
        async runJobs(jobs, worker) {
            for (const job of jobs) await worker(job, () => {}, null);
            return { total: jobs.length, done: jobs.length, failed: 0, cancelled: 0 };
        },
        retryableJobs: () => []
    },
    operationCoordinator: {
        begin: () => ({ channel: 'render', signal: null }),
        assertCurrent() {},
        finish() { finishCount += 1; return true; }
    },
    getActiveMediaElement: () => ({}),
    getQualityOptions: () => ({}),
    getCaptionOptions: () => ({}),
    getExportFrameRate: () => 30,
    getExportBitrate: () => 1000000,
    updateSelectedRangeControls() {},
    renderAll() {},
    updateButtons() {},
    setProgress() {},
    stopPreview() {},
    activateFlowTab() {},
    toast() {}
});

controller.renderQueue({
    running: false,
    total: 1,
    done: 0,
    failed: 1,
    cancelled: 0,
    items: [{ status: 'failed', label: '<img src=x onerror=alert(1)>', error: '<script>alert(1)</script>', progress: 42 }]
});
assert(findByClass(elements.renderQueueList, 'render-queue-title').children[1].textContent === '<img src=x onerror=alert(1)>', 'queue labels remain literal text');
assert(findByClass(elements.renderQueueList, 'render-queue-error').textContent === '<script>alert(1)</script>', 'queue errors remain literal text');

(async () => {
    const job = controller.buildExportPayload(state.recommendations[1], 0, 1);
    await controller.runJobs([job]);
    assert(saveCount === 1, 'render workflow saves one completed output');
    assert(finishCount === 1, 'render operation finishes exactly once');
    assert(state.selectedRecommendationId === 'first' && state.selectedRange.start === 1, 'editor selection is restored after rendering');
    console.log('PASS v1.6.1 modular render workflow guardrails');
})().catch(error => {
    console.error(error.stack || error.message || error);
    process.exit(1);
});
