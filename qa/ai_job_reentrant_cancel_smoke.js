#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/ai/ai-job-coordinator.js'), 'utf8');

function assert(value, message) {
    if (!value) throw new Error(message);
    console.log(`PASS ${message}`);
}

(async () => {
    const window = {
        setTimeout,
        clearTimeout,
        AIShortsRuntimeConfig: { LOCAL_AI_QUEUE_LIMIT: 3, LOCAL_AI_JOB_HISTORY_LIMIT: 6, LOCAL_AI_REQUEST_TIMEOUT_MS: 2000 },
        document: { dispatchEvent() {} }
    };
    class CustomEvent { constructor(type, init) { this.type = type; this.detail = init && init.detail; } }
    const context = vm.createContext({ window, document: window.document, CustomEvent, AbortController, setTimeout, clearTimeout, console, Date, Error, Promise, Math, Number, String, Object, Array, Map, Set });
    vm.runInContext(source, context, { filename: 'ai-job-coordinator-reentrant-cancel.js' });
    const api = window.AIShortsAIJobCoordinator;

    let executorCalls = 0;
    let cancelledFromListener = false;
    const unsubscribe = api.subscribe(snapshot => {
        if (cancelledFromListener || !snapshot.active || snapshot.active.kind !== 'cancel-before-executor' || snapshot.active.state !== 'running') return;
        cancelledFromListener = true;
        api.cancelActive('cancelled by running-state listener');
    });

    const job = api.submit('cancel-before-executor', async () => {
        executorCalls += 1;
        return 'must-not-run';
    });
    let rejected = false;
    try { await job; }
    catch (error) { rejected = error && error.name === 'AbortError' && /running-state listener/.test(error.message); }
    unsubscribe();

    assert(cancelledFromListener && rejected, 'running-state subscribers can synchronously cancel a newly active job');
    assert(executorCalls === 0, 'an already-aborted job never invokes its executor during reentrant cancellation');
    assert(api.snapshot().active === null && api.snapshot().history[0].state === 'cancelled', 'reentrant cancellation releases the active slot and records a cancelled history item');

    const next = await api.submit('after-reentrant-cancel', async () => 'next-ran');
    assert(next === 'next-ran', 'the queue continues after cancellation before executor invocation');

    console.log('PASS reentrancy-safe cancellation before executor invocation');
})().catch(error => {
    console.error(error.stack || error);
    process.exit(1);
});
