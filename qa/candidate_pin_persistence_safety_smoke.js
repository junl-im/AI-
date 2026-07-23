#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/ui/candidate-pin-board.js'), 'utf8');

const stored = new Map([[
    'ai-shorts-pinned-candidates-v1',
    JSON.stringify([...Array.from({ length: 16 }, (_, index) => `stale-${index}`), 'keep-a', 'keep-a', '', null, 'keep-b', ...Array.from({ length: 30 }, (_, index) => `overflow-${index}`)])
]]);
const localStorage = {
    getItem(key) { return stored.has(key) ? stored.get(key) : null; },
    setItem(key, value) { stored.set(key, String(value)); },
    removeItem(key) { stored.delete(key); }
};
const recommendations = Array.from({ length: 20 }, (_, index) => ({ id: `keep-${String.fromCharCode(97 + index)}`, score: 100 - index }));
const document = {
    readyState: 'loading',
    body: { dataset: {} },
    addEventListener() {},
    dispatchEvent() {},
    getElementById() { return null; },
    querySelector() { return null; },
    querySelectorAll() { return []; }
};
const window = {
    AIShortsRuntimeConfig: { MAX_PINNED_CANDIDATES: 12 },
    AIShortsAppState: { state: { recommendations, settings: {} } },
    localStorage,
    document,
    setTimeout() { return 1; }
};
const context = vm.createContext({
    window,
    document,
    localStorage,
    CustomEvent: function CustomEvent() {},
    MutationObserver: function MutationObserver() {},
    requestAnimationFrame() { return 1; },
    setTimeout() { return 1; },
    console
});
vm.runInContext(source, context, { filename: 'candidate-pin-board.js' });
const api = window.AIShortsCandidatePinBoard;
if (!api || typeof api.reconcilePins !== 'function') throw new Error('pin board must expose reconciliation for lifecycle safety');
const result = api.reconcilePins();
const reconciled = api.getPinnedIds();
if (!result.changed || result.removed < 16) throw new Error('stale and duplicate pin ids must be removed');
if (reconciled.join(',') !== 'keep-a,keep-b') throw new Error(`unexpected reconciled pins: ${reconciled.join(',')}`);
if (api.togglePin('missing-candidate') !== false) throw new Error('unknown candidate ids must not be persisted');
for (const candidate of recommendations) api.togglePin(candidate.id);
const bounded = api.getPinnedIds();
if (bounded.length > api.maxPins || bounded.length > 12) throw new Error('pinned candidate storage must remain bounded');
if (JSON.parse(stored.get('ai-shorts-pinned-candidates-v1')).length !== bounded.length) throw new Error('bounded pins must be persisted after cleanup');
console.log('PASS bounded self-healing candidate pin persistence');
