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

function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

(async () => {
    const events = [];
    const window = {
        setTimeout,
        clearTimeout,
        AIShortsRuntimeConfig: { LOCAL_AI_QUEUE_LIMIT: 3, LOCAL_AI_JOB_HISTORY_LIMIT: 6, LOCAL_AI_REQUEST_TIMEOUT_MS: 2000 },
        document: { dispatchEvent(event) { events.push(event.type); } }
    };
    class CustomEvent { constructor(type, init) { this.type = type; this.detail = init && init.detail; } }
    const context = vm.createContext({ window, document: window.document, CustomEvent, AbortController, setTimeout, clearTimeout, console, Date, Error, Promise, Math, Number, String, Object, Array, Map, Set });
    vm.runInContext(source, context, { filename: 'ai-job-coordinator.js' });
    const api = window.AIShortsAIJobCoordinator;
    const order = [];
    const snapshots = [];
    const unsubscribe = api.subscribe(value => snapshots.push(value));

    const first = api.submit('creative', async job => {
        order.push('first-start');
        job.report(35, 'generating');
        await delay(40);
        order.push('first-end');
        return 'one';
    }, { meta: { providerId: 'ollama', capability: 'creative', modelToken: 'safe', prompt: 'must-not-leak' } });
    const second = api.submit('speech', async job => {
        order.push('second-start');
        job.report(60, 'transcribing');
        await delay(5);
        order.push('second-end');
        return 'two';
    }, { meta: { providerId: 'whispercpp', capability: 'speech', fileBytes: 2048 } });

    const values = await Promise.all([first, second]);
    assert(values.join(',') === 'one,two', 'queued local AI jobs resolve with executor results');
    assert(order.join(',') === 'first-start,first-end,second-start,second-end', 'local AI jobs execute serially with concurrency one');
    const completed = api.snapshot();
    assert(completed.active === null && completed.history.length === 2 && completed.history.every(item => item.state === 'completed'), 'completed jobs move into bounded history');
    assert(!JSON.stringify(completed).includes('must-not-leak'), 'job metadata allowlist redacts prompts and arbitrary fields');
    assert(snapshots.some(item => item.active && item.active.progress === 35), 'progress updates are observable');

    let cancelObserved = false;
    const cancellable = api.submit('creative', async job => new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, 500);
        job.signal.addEventListener('abort', () => {
            clearTimeout(timer);
            const error = new Error('cancelled by test');
            error.name = 'AbortError';
            reject(error);
        }, { once: true });
    }), { meta: { providerId: 'ollama', capability: 'creative' } });
    await delay(20);
    assert(api.cancelActive('test cancel') === true, 'active local AI job accepts an explicit cancellation request');
    try { await cancellable; } catch (error) { cancelObserved = error.name === 'AbortError'; }
    assert(cancelObserved && api.snapshot().history[0].state === 'cancelled', 'cancelled job rejects with AbortError and records cancelled state');

    let stubbornCancelled = false;
    const stubborn = api.submit('stubborn', async () => new Promise(() => {}), { meta: { providerId: 'ollama', capability: 'creative' } });
    await delay(20);
    assert(api.cancelActive('force coordinator release') === true, 'uncooperative active job accepts cancellation');
    try {
        await Promise.race([stubborn, delay(250).then(() => { throw new Error('stubborn cancellation did not settle'); })]);
    } catch (error) {
        stubbornCancelled = error.name === 'AbortError';
    }
    assert(stubbornCancelled && api.snapshot().active === null, 'coordinator settles cancellation even when the executor ignores AbortSignal');
    const afterStubborn = await Promise.race([api.submit('after-stubborn', async () => 'released'), delay(250).then(() => { throw new Error('queue stayed blocked after stubborn cancellation'); })]);
    assert(afterStubborn === 'released', 'serial queue continues after forced cancellation settlement');

    const queuedOne = api.submit('one', async () => { await delay(80); return 1; });
    const queuedTwo = api.submit('two', async () => 2);
    await delay(5);
    assert(api.cancel(queuedTwo.jobId, 'remove pending') === true, 'pending local AI job can be removed by id');
    let pendingCancelled = false;
    try { await queuedTwo; } catch (error) { pendingCancelled = error.name === 'AbortError'; }
    await queuedOne;
    assert(pendingCancelled, 'pending cancellation rejects its promise with AbortError');
    assert(events.includes('ai-shorts-local-ai-job-sync'), 'job state changes dispatch a UI synchronization event');

    let timedOut = false;
    const timeoutJob = api.submit('timeout', async () => new Promise(() => {}), { timeoutMs: 1000, meta: { providerId: 'ollama', capability: 'creative' } });
    try { await timeoutJob; } catch (error) { timedOut = error.name === 'TimeoutError' && error.code === 'LOCAL_AI_JOB_TIMEOUT'; }
    assert(timedOut && api.snapshot().history[0].state === 'failed', 'job timeout settles even when the executor ignores AbortSignal');
    assert(source.includes('history.unshift(toHistoryRecord(job))') && !source.includes('history.unshift(job)'), 'history stores detached public records instead of executor closures and promise callbacks');

    const invalidWindow = {
        setTimeout,
        clearTimeout,
        AIShortsRuntimeConfig: { LOCAL_AI_QUEUE_LIMIT: 'broken', LOCAL_AI_JOB_HISTORY_LIMIT: Infinity, LOCAL_AI_REQUEST_TIMEOUT_MS: 'broken' },
        document: { dispatchEvent() {} }
    };
    const invalidContext = vm.createContext({ window: invalidWindow, document: invalidWindow.document, CustomEvent, AbortController, setTimeout, clearTimeout, console, Date, Error, Promise, Math, Number, String, Object, Array, Map, Set });
    vm.runInContext(source, invalidContext, { filename: 'ai-job-coordinator-invalid-config.js' });
    const invalidApi = invalidWindow.AIShortsAIJobCoordinator;
    assert(invalidApi.snapshot().queueLimit === 6, 'invalid queue configuration recovers to the bounded default');
    for (let index = 0; index < 25; index += 1) await invalidApi.submit(`history-${index}`, async () => index);
    assert(invalidApi.snapshot().history.length === 20, 'invalid history configuration recovers to the bounded default retention');
    unsubscribe();
    console.log('PASS bounded queue, serial execution, cancellation, progress, and history redaction');
})().catch(error => {
    console.error(error.stack || error);
    process.exit(1);
});
