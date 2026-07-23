#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

function createHarness(failPattern) {
    const handlers = {};
    const stores = new Map();
    const deleted = [];
    let skipWaitingCalls = 0;
    function keyOf(input) { return typeof input === 'string' ? input : input && input.url || String(input || ''); }
    function cache(name) {
        if (!stores.has(name)) stores.set(name, new Map());
        const store = stores.get(name);
        return {
            async add(item) {
                const key = keyOf(item);
                if (failPattern && failPattern.test(key)) throw new Error(`forced failure: ${key}`);
                store.set(key, new Response(`cached:${key}`, { status: 200 }));
            },
            async put(item, response) { store.set(keyOf(item), response); },
            async match(item) { return store.get(keyOf(item)) || null; }
        };
    }
    const caches = {
        async open(name) { return cache(name); },
        async keys() { return [...stores.keys()]; },
        async delete(name) { deleted.push(name); return stores.delete(name); },
        async match(item) { for (const store of stores.values()) if (store.has(keyOf(item))) return store.get(keyOf(item)); return null; }
    };
    const self = {
        location: { origin: 'https://studio.test' },
        clients: { async claim() {}, async matchAll() { return []; } },
        async skipWaiting() { skipWaitingCalls += 1; },
        addEventListener(type, handler) { handlers[type] = handler; }
    };
    vm.runInContext(source, vm.createContext({ self, caches, URL, Response, console, fetch: async () => { throw new Error('offline'); } }), { filename: 'sw.js' });
    async function dispatch(type) {
        const waits = [];
        handlers[type]({ waitUntil(value) { waits.push(Promise.resolve(value)); } });
        await Promise.all(waits);
    }
    return { handlers, stores, deleted, dispatch, get skipWaitingCalls() { return skipWaitingCalls; } };
}

(async () => {
    const optional = createHarness(/assets\/icons\/studio\/waveform\.svg/);
    await optional.dispatch('install');
    if (optional.skipWaitingCalls !== 1) throw new Error('optional shell failure must not block activation');
    const currentStore = [...optional.stores.entries()].find(([name]) => name.includes('ai-shorts-studio-shell-v'));
    if (!currentStore) throw new Error('current cache must remain after optional failure');
    const reportResponse = currentStore[1].get('./__ai_shorts_sw_install_report__');
    const report = reportResponse && await reportResponse.json();
    if (!report || report.failed < 1 || report.requiredMissing.length) throw new Error('optional failure must be recorded without required cache damage');

    const critical = createHarness(/index\.html/);
    let rejected = false;
    try { await critical.dispatch('install'); } catch (_) { rejected = true; }
    if (!rejected || critical.skipWaitingCalls !== 0) throw new Error('critical shell failure must reject installation before skipWaiting');
    if (!critical.deleted.some(name => name.includes('ai-shorts-studio-shell-v'))) throw new Error('failed critical cache must be removed for a clean retry');
    console.log('PASS resilient service worker install and critical-cache rollback');
})().catch(error => { console.error(error.stack || error); process.exit(1); });
