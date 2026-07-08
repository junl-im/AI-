// AI Shorts Studio v0.9.6 - render queue, retries, and export reliability controller
'use strict';

(function exposeRenderQueue(global) {
    const config = global.AIShortsRuntimeConfig || {};
    const store = global.AIShortsAppState || {};
    const state = store.state || {};
    const listeners = new Set();
    const MAX_ITEMS = Number(config.RENDER_QUEUE_LIMIT || 12);
    const RETRY_LIMIT = Number(config.RENDER_QUEUE_RETRY_LIMIT || 2);

    let items = [];
    let running = false;
    let lastWorker = null;

    function now() { return Date.now(); }
    function clampPercent(value) {
        const n = Number(value);
        if (!Number.isFinite(n)) return 0;
        return Math.max(0, Math.min(100, n));
    }
    function uid(prefix) {
        return `${prefix || 'rq'}-${now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    }
    function normalizeJob(job, index) {
        const safe = Object.assign({}, job || {});
        return {
            id: safe.id || uid('render'),
            label: safe.label || `렌더 작업 ${index + 1}`,
            filenameHint: safe.filenameHint || '',
            candidateId: safe.candidateId || null,
            payload: safe.payload || null,
            status: safe.status || 'queued',
            progress: clampPercent(safe.progress || 0),
            attempts: Number(safe.attempts || 0),
            error: '',
            createdAt: safe.createdAt || now(),
            startedAt: 0,
            finishedAt: 0
        };
    }
    function snapshot() {
        const total = items.length;
        const done = items.filter(item => item.status === 'done').length;
        const failed = items.filter(item => item.status === 'failed').length;
        const queued = items.filter(item => item.status === 'queued').length;
        const current = items.find(item => item.status === 'running') || null;
        const progress = total ? Math.round(items.reduce((sum, item) => sum + clampPercent(item.progress), 0) / total) : 0;
        return {
            running,
            total,
            done,
            failed,
            queued,
            progress,
            current: current ? Object.assign({}, current) : null,
            items: items.map(item => Object.assign({}, item))
        };
    }
    function emit() {
        const snap = snapshot();
        try { global.dispatchEvent(new CustomEvent('ai-shorts-render-queue', { detail: snap })); } catch (error) { /* ignored */ }
        listeners.forEach(listener => {
            try { listener(snap); } catch (error) { /* ignored */ }
        });
    }
    function subscribe(listener) {
        if (typeof listener === 'function') {
            listeners.add(listener);
            listener(snapshot());
        }
        return () => listeners.delete(listener);
    }
    function setItem(item, patch) {
        Object.assign(item, patch || {});
        item.progress = clampPercent(item.progress);
        emit();
        return item;
    }
    function summarize() {
        const snap = snapshot();
        if (!snap.total) return '대기 중';
        if (snap.running && snap.current) return `${snap.current.label} · ${snap.progress}%`;
        if (snap.failed) return `완료 ${snap.done}/${snap.total} · 실패 ${snap.failed}`;
        return `완료 ${snap.done}/${snap.total}`;
    }
    function clear(options) {
        const keepFailed = options && options.keepFailed;
        if (running) {
            items = items.filter(item => item.status === 'running' || item.status === 'queued' || item.status === 'failed');
        } else if (keepFailed) {
            items = items.filter(item => item.status === 'failed');
        } else {
            items = [];
        }
        emit();
    }
    async function runJobs(jobs, worker) {
        if (running) throw new Error('이미 렌더 큐가 실행 중입니다.');
        if (typeof worker !== 'function') throw new Error('렌더 작업 실행기가 없습니다.');
        const normalized = (Array.isArray(jobs) ? jobs : [jobs]).slice(0, MAX_ITEMS).map(normalizeJob);
        if (!normalized.length) return snapshot();
        items = normalized;
        lastWorker = worker;
        running = true;
        if (store.addDiagnostic) store.addDiagnostic({ type: 'render-queue-start', total: items.length });
        emit();
        for (const item of items) {
            item.attempts += 1;
            setItem(item, { status: 'running', progress: 1, startedAt: now(), error: '' });
            try {
                await worker(item, (percent, status) => {
                    setItem(item, { progress: clampPercent(percent), filenameHint: status || item.filenameHint });
                });
                setItem(item, { status: 'done', progress: 100, finishedAt: now() });
            } catch (error) {
                setItem(item, { status: 'failed', progress: item.progress || 0, finishedAt: now(), error: error && error.message ? error.message : '렌더 실패' });
                if (store.addDiagnostic) store.addDiagnostic({ type: 'render-queue-error', id: item.id, label: item.label, message: item.error });
            }
        }
        running = false;
        if (store.addDiagnostic) store.addDiagnostic({ type: 'render-queue-finish', summary: summarize() });
        emit();
        return snapshot();
    }
    async function retryFailed() {
        if (running) throw new Error('렌더 큐가 실행 중입니다.');
        if (!lastWorker) throw new Error('재시도할 렌더 실행기가 없습니다.');
        const failed = items.filter(item => item.status === 'failed' && item.attempts <= RETRY_LIMIT).map(item => normalizeJob(Object.assign({}, item, { status: 'queued', progress: 0, error: '' }), 0));
        if (!failed.length) return snapshot();
        return runJobs(failed, lastWorker);
    }
    function isRunning() { return running; }

    global.AIShortsRenderQueue = Object.freeze({
        runJobs,
        retryFailed,
        clear,
        subscribe,
        snapshot,
        summarize,
        isRunning
    });
})(window);
