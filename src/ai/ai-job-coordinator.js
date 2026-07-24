// AI Shorts Studio v1.6.1 - bounded serial local AI job queue with cancellation and redacted history
'use strict';

(function exposeAIJobCoordinator(global) {
    const config = global.AIShortsRuntimeConfig || {};
    const queue = [];
    const history = [];
    const listeners = new Set();
    const queueLimit = Math.max(1, Math.min(20, Number(config.LOCAL_AI_QUEUE_LIMIT || 6)));
    const historyLimit = Math.max(5, Math.min(100, Number(config.LOCAL_AI_JOB_HISTORY_LIMIT || 20)));
    let active = null;
    let sequence = 0;

    function now() { return new Date().toISOString(); }

    function abortError(message) {
        const error = new Error(message || '작업이 취소되었습니다.');
        error.name = 'AbortError';
        return error;
    }

    function timeoutError(message) {
        const error = new Error(message || '로컬 AI 작업 제한 시간을 초과했습니다.');
        error.name = 'TimeoutError';
        error.code = 'LOCAL_AI_JOB_TIMEOUT';
        return error;
    }

    function safeText(value, maxLength) {
        return String(value == null ? '' : value).replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, maxLength || 120);
    }

    function sanitizeMeta(value) {
        const input = value && typeof value === 'object' ? value : {};
        const allowed = ['providerId', 'capability', 'modelToken', 'source', 'fileBytes', 'language', 'transport'];
        const output = {};
        allowed.forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(input, key)) return;
            const item = input[key];
            if (typeof item === 'number' && Number.isFinite(item)) output[key] = item;
            else if (typeof item === 'boolean') output[key] = item;
            else if (typeof item === 'string') output[key] = safeText(item, 120);
        });
        return Object.freeze(output);
    }

    function publicJob(job) {
        if (!job) return null;
        return Object.freeze({
            id: job.id,
            kind: job.kind,
            state: job.state,
            progress: job.progress,
            message: job.message,
            createdAt: job.createdAt,
            startedAt: job.startedAt || '',
            endedAt: job.endedAt || '',
            elapsedMs: job.elapsedMs || 0,
            meta: job.meta,
            error: job.error || ''
        });
    }

    function snapshot() {
        return Object.freeze({
            active: publicJob(active),
            queued: Object.freeze(queue.map(publicJob)),
            history: Object.freeze(history.map(publicJob)),
            queueLimit,
            concurrency: 1
        });
    }

    function emit() {
        const value = snapshot();
        listeners.forEach(listener => {
            try { listener(value); } catch (_) { /* listener isolation */ }
        });
        if (global.document) global.document.dispatchEvent(new CustomEvent('ai-shorts-local-ai-job-sync', { detail: value }));
    }

    function remember(job) {
        history.unshift(job);
        if (history.length > historyLimit) history.splice(historyLimit);
    }

    function settle(job, state, error) {
        job.state = state;
        job.endedAt = now();
        job.elapsedMs = Math.max(0, Date.now() - job.startedAtMs);
        job.progress = state === 'completed' ? 100 : job.progress;
        job.message = state === 'completed' ? '완료' : state === 'cancelled' ? '취소됨' : '실패';
        job.error = error ? safeText(error.message || error, 300) : '';
        remember(job);
        active = null;
        emit();
        global.setTimeout(pump, 0);
    }

    async function pump() {
        if (active || !queue.length) return;
        const job = queue.shift();
        active = job;
        job.state = 'running';
        job.startedAt = now();
        job.startedAtMs = Date.now();
        job.message = '시작 중';
        emit();
        const timeoutMs = Math.max(1000, Math.min(30 * 60 * 1000, Number(job.timeoutMs || config.LOCAL_AI_REQUEST_TIMEOUT_MS || 120000)));
        const timer = global.setTimeout(() => {
            job.timedOut = true;
            job.controller.abort(timeoutError());
        }, timeoutMs);
        const report = (progress, message) => {
            if (active !== job || job.state !== 'running') return false;
            job.progress = Math.max(0, Math.min(99, Number(progress) || 0));
            if (message) job.message = safeText(message, 160);
            emit();
            return true;
        };
        try {
            const result = await job.executor(Object.freeze({ signal: job.controller.signal, report, jobId: job.id }));
            global.clearTimeout(timer);
            settle(job, 'completed');
            job.resolve(result);
        } catch (error) {
            global.clearTimeout(timer);
            const timedOut = Boolean(job.timedOut || error && (error.name === 'TimeoutError' || error.code === 'LOCAL_AI_JOB_TIMEOUT' || error.code === 'LOCAL_AI_TIMEOUT'));
            const cancelled = !timedOut && Boolean(job.controller.signal.aborted || error && error.name === 'AbortError');
            const finalError = timedOut ? timeoutError(error && error.message) : cancelled ? abortError(error && error.message) : error;
            settle(job, cancelled ? 'cancelled' : 'failed', finalError);
            job.reject(finalError);
        }
    }

    function submit(kind, executor, options) {
        if (typeof executor !== 'function') return Promise.reject(new TypeError('AI 작업 실행 함수가 필요합니다.'));
        if (queue.length + (active ? 1 : 0) >= queueLimit) return Promise.reject(new Error(`로컬 AI 작업은 최대 ${queueLimit}개까지 대기할 수 있습니다.`));
        const opts = options || {};
        const id = `ai-job-${Date.now().toString(36)}-${(++sequence).toString(36)}`;
        let resolvePromise;
        let rejectPromise;
        const promise = new Promise((resolve, reject) => { resolvePromise = resolve; rejectPromise = reject; });
        const job = {
            id,
            kind: safeText(kind || 'local-ai', 60),
            state: 'queued',
            progress: 0,
            message: '대기 중',
            createdAt: now(),
            startedAt: '',
            endedAt: '',
            elapsedMs: 0,
            startedAtMs: 0,
            error: '',
            timedOut: false,
            meta: sanitizeMeta(opts.meta),
            timeoutMs: opts.timeoutMs,
            controller: new AbortController(),
            executor,
            resolve: resolvePromise,
            reject: rejectPromise
        };
        queue.push(job);
        Object.defineProperty(promise, 'jobId', { value: id, enumerable: true });
        emit();
        global.setTimeout(pump, 0);
        return promise;
    }

    function cancel(jobId, reason) {
        const id = String(jobId || '');
        if (active && (!id || active.id === id)) {
            active.controller.abort(abortError(reason || '사용자가 로컬 AI 작업을 취소했습니다.'));
            active.message = '취소 요청';
            emit();
            return true;
        }
        const index = queue.findIndex(item => item.id === id);
        if (index < 0) return false;
        const [job] = queue.splice(index, 1);
        job.startedAtMs = Date.now();
        settleQueuedCancellation(job, reason);
        return true;
    }

    function settleQueuedCancellation(job, reason) {
        job.state = 'cancelled';
        job.endedAt = now();
        job.message = '대기 중 취소됨';
        job.error = safeText(reason || '사용자가 대기 작업을 취소했습니다.', 300);
        remember(job);
        job.reject(abortError(job.error));
        emit();
    }

    function cancelActive(reason) { return cancel('', reason); }

    function cancelAll(reason) {
        const cancelledActive = cancelActive(reason);
        const pending = queue.splice(0);
        pending.forEach(job => settleQueuedCancellation(job, reason));
        return cancelledActive || pending.length > 0;
    }

    function subscribe(listener) {
        if (typeof listener !== 'function') return () => {};
        listeners.add(listener);
        try { listener(snapshot()); } catch (_) { /* ignored */ }
        return () => listeners.delete(listener);
    }

    function clearHistory() {
        history.length = 0;
        emit();
    }

    global.AIShortsAIJobCoordinator = Object.freeze({ submit, cancel, cancelActive, cancelAll, subscribe, snapshot, clearHistory });
})(window);
