// AI Shorts Studio v1.6.9 - throttled render queue, ETA, retries, and cancellation
'use strict';

(function exposeRenderQueue(global) {
    const config = global.AIShortsRuntimeConfig || {};
    const store = global.AIShortsAppState || {};
    const listeners = new Set();
    const MAX_ITEMS = Number(config.RENDER_QUEUE_LIMIT || 12);
    const RETRY_LIMIT = Number(config.RENDER_QUEUE_RETRY_LIMIT || 2);
    const EMIT_INTERVAL_MS = 140;

    let items = [];
    let running = false;
    let lastWorker = null;
    let activeController = null;
    let emitTimer = 0;
    let lastEmitAt = 0;

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
            statusText: safe.statusText || '',
            candidateId: safe.candidateId || null,
            payload: safe.payload || null,
            status: safe.status || 'queued',
            progress: clampPercent(safe.progress || 0),
            attempts: Number(safe.attempts || 0),
            error: '',
            createdAt: safe.createdAt || now(),
            startedAt: 0,
            finishedAt: 0,
            elapsedMs: 0,
            etaSeconds: null,
            progressRate: 0,
            lastProgressAt: 0
        };
    }
    function snapshot() {
        const total = items.length;
        const done = items.filter(item => item.status === 'done').length;
        const failed = items.filter(item => item.status === 'failed').length;
        const cancelled = items.filter(item => item.status === 'cancelled').length;
        const queued = items.filter(item => item.status === 'queued').length;
        const current = items.find(item => item.status === 'running') || null;
        const progress = total ? Math.round(items.reduce((sum, item) => sum + clampPercent(item.progress), 0) / total) : 0;
        return {
            running,
            total,
            done,
            failed,
            cancelled,
            queued,
            progress,
            current: current ? Object.assign({}, current) : null,
            items: items.map(item => Object.assign({}, item))
        };
    }
    function emitNow() {
        if (emitTimer) {
            clearTimeout(emitTimer);
            emitTimer = 0;
        }
        lastEmitAt = now();
        const snap = snapshot();
        try { global.dispatchEvent(new CustomEvent('ai-shorts-render-queue', { detail: snap })); } catch (error) { /* ignored */ }
        listeners.forEach(listener => {
            try { listener(snap); } catch (error) { /* ignored */ }
        });
    }
    function emit(force) {
        if (force || now() - lastEmitAt >= EMIT_INTERVAL_MS) {
            emitNow();
            return;
        }
        if (!emitTimer) emitTimer = setTimeout(emitNow, Math.max(0, EMIT_INTERVAL_MS - (now() - lastEmitAt)));
    }
    function subscribe(listener) {
        if (typeof listener === 'function') {
            listeners.add(listener);
            listener(snapshot());
        }
        return () => listeners.delete(listener);
    }
    function setItem(item, patch, options) {
        Object.assign(item, patch || {});
        item.progress = clampPercent(item.progress);
        emit(Boolean(options && options.force));
        return item;
    }
    function updateProgress(item, percent, statusText) {
        const progress = clampPercent(percent);
        const timestamp = now();
        const roundedChanged = Math.round(progress) !== Math.round(item.progress);
        const statusChanged = Boolean(statusText && statusText !== item.statusText);
        if (!roundedChanged && !statusChanged && timestamp - item.lastProgressAt < EMIT_INTERVAL_MS) return;
        item.progress = progress;
        item.statusText = statusText || item.statusText;
        item.lastProgressAt = timestamp;
        item.elapsedMs = item.startedAt ? Math.max(0, timestamp - item.startedAt) : 0;
        if (item.elapsedMs > 500 && progress > 2 && progress < 100) {
            const rate = progress / item.elapsedMs;
            const rawEta = rate > 0 ? ((100 - progress) / rate) / 1000 : null;
            if (Number.isFinite(rawEta)) {
                item.etaSeconds = Number.isFinite(item.etaSeconds) ? Math.round(item.etaSeconds * 0.68 + rawEta * 0.32) : Math.round(rawEta);
                item.progressRate = rate * 1000;
            }
        }
        emit(false);
    }
    function summarize() {
        const snap = snapshot();
        if (!snap.total) return '대기 중';
        if (snap.running && snap.current) return `${snap.current.label} · ${Math.round(snap.current.progress)}%`;
        if (snap.failed) return `완료 ${snap.done}/${snap.total} · 실패 ${snap.failed}`;
        if (snap.cancelled) return `완료 ${snap.done}/${snap.total} · 취소 ${snap.cancelled}`;
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
        emit(true);
    }
    function abortError(reason) {
        const error = new Error(String(reason || '렌더 작업이 취소되었습니다.'));
        error.name = 'AbortError';
        return error;
    }
    function isAbortError(error) { return Boolean(error && error.name === 'AbortError'); }
    function cancel(reason) {
        if (!activeController || activeController.signal.aborted) return false;
        activeController.abort(String(reason || '사용자가 렌더 작업을 취소했습니다.'));
        return true;
    }
    async function runJobs(jobs, worker, options) {
        if (running) throw new Error('이미 렌더 큐가 실행 중입니다.');
        if (typeof worker !== 'function') throw new Error('렌더 작업 실행기가 없습니다.');
        const normalized = (Array.isArray(jobs) ? jobs : [jobs]).slice(0, MAX_ITEMS).map(normalizeJob);
        if (!normalized.length) return snapshot();
        const externalSignal = options && options.signal || null;
        activeController = typeof global.AbortController === 'function' ? new global.AbortController() : null;
        const signal = activeController ? activeController.signal : externalSignal;
        const relayAbort = () => { if (activeController && !activeController.signal.aborted) activeController.abort(externalSignal.reason); };
        if (externalSignal) {
            if (externalSignal.aborted) relayAbort();
            else externalSignal.addEventListener('abort', relayAbort, { once: true });
        }
        items = normalized;
        lastWorker = worker;
        running = true;
        if (store.addDiagnostic) store.addDiagnostic({ type: 'render-queue-start', total: items.length });
        emit(true);
        try {
            for (const item of items) {
                if (signal && signal.aborted) {
                    setItem(item, { status: 'cancelled', finishedAt: now(), error: String(signal.reason || '렌더 취소') }, { force: true });
                    continue;
                }
                item.attempts += 1;
                setItem(item, { status: 'running', progress: 1, startedAt: now(), error: '', statusText: '렌더 준비 중', etaSeconds: null, elapsedMs: 0 }, { force: true });
                try {
                    await worker(item, (percent, status) => {
                        if (signal && signal.aborted) return;
                        updateProgress(item, percent, status);
                    }, signal);
                    if (signal && signal.aborted) throw abortError(signal.reason);
                    setItem(item, { status: 'done', progress: 100, finishedAt: now(), elapsedMs: Math.max(0, now() - item.startedAt), etaSeconds: 0, statusText: '저장 완료' }, { force: true });
                } catch (error) {
                    if (isAbortError(error) || (signal && signal.aborted)) {
                        setItem(item, { status: 'cancelled', progress: item.progress || 0, finishedAt: now(), elapsedMs: Math.max(0, now() - item.startedAt), etaSeconds: null, error: error && error.message || '렌더 취소', statusText: '사용자 취소' }, { force: true });
                    } else {
                        setItem(item, { status: 'failed', progress: item.progress || 0, finishedAt: now(), elapsedMs: Math.max(0, now() - item.startedAt), etaSeconds: null, error: error && error.message ? error.message : '렌더 실패', statusText: '렌더 실패' }, { force: true });
                        if (store.addDiagnostic) store.addDiagnostic({ type: 'render-queue-error', id: item.id, label: item.label, message: item.error });
                    }
                }
            }
        } finally {
            running = false;
            if (externalSignal) externalSignal.removeEventListener('abort', relayAbort);
            activeController = null;
            if (store.addDiagnostic) store.addDiagnostic({ type: 'render-queue-finish', summary: summarize() });
            emit(true);
        }
        return snapshot();
    }
    function retryableJobs() {
        return items
            .filter(item => item.status === 'failed' && item.attempts <= RETRY_LIMIT)
            .map((item, index) => normalizeJob(Object.assign({}, item, {
                status: 'queued',
                statusText: '재시도 대기',
                progress: 0,
                error: '',
                startedAt: 0,
                finishedAt: 0,
                elapsedMs: 0,
                etaSeconds: null,
                progressRate: 0
            }), index));
    }
    async function retryFailed(worker, options) {
        if (running) throw new Error('렌더 큐가 실행 중입니다.');
        const selectedWorker = typeof worker === 'function' ? worker : lastWorker;
        if (!selectedWorker) throw new Error('재시도할 렌더 실행기가 없습니다.');
        const failed = retryableJobs();
        if (!failed.length) return snapshot();
        return runJobs(failed, selectedWorker, options);
    }
    function isRunning() { return running; }

    global.AIShortsRenderQueue = Object.freeze({
        runJobs,
        retryFailed,
        retryableJobs,
        clear,
        subscribe,
        snapshot,
        summarize,
        isRunning,
        cancel
    });
})(window);
