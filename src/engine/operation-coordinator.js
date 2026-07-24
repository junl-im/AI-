// AI Shorts Studio v1.6.5 - smart-reframe aware async operation ownership and cancellation coordinator
'use strict';

(function exposeOperationCoordinator(global) {
    const active = new Map();
    let sequence = 0;
    let mediaSessionId = 0;

    function diagnostic(event) {
        const store = global.AIShortsAppState;
        if (store && store.addDiagnostic) store.addDiagnostic(event);
    }

    function createAbortError(reason) {
        const error = new Error(String(reason || '작업이 취소되었습니다.'));
        error.name = 'AbortError';
        return error;
    }

    function isAbortError(error) {
        return Boolean(error && (error.name === 'AbortError' || error.code === 20));
    }

    function emit() {
        const detail = snapshot();
        try { global.dispatchEvent(new CustomEvent('ai-shorts-operation-change', { detail })); } catch (error) { /* ignored */ }
        if (global.document && global.document.body) {
            global.document.body.dataset.activeOperations = detail.active.map(item => item.channel).join(',');
            global.document.body.dataset.mediaSession = String(detail.mediaSessionId);
        }
    }

    function cancel(channel, reason) {
        const key = String(channel || '');
        const entry = active.get(key);
        if (!entry) return false;
        active.delete(key);
        const message = String(reason || `${key} 작업 교체`);
        try {
            if (entry.controller && !entry.controller.signal.aborted) entry.controller.abort(message);
        } catch (error) { /* ignored */ }
        diagnostic({ type: 'operation-cancel', channel: key, operationId: entry.token.id, reason: message });
        emit();
        return true;
    }

    function begin(channel, meta) {
        const key = String(channel || '').trim();
        if (!key) throw new Error('작업 채널 이름이 없습니다.');
        cancel(key, `${key} 새 작업으로 교체`);
        const controller = typeof global.AbortController === 'function' ? new global.AbortController() : null;
        const token = Object.freeze({
            channel: key,
            id: ++sequence,
            mediaSessionId,
            startedAt: Date.now(),
            signal: controller ? controller.signal : null,
            meta: Object.freeze(Object.assign({}, meta || {}))
        });
        active.set(key, { token, controller });
        diagnostic({ type: 'operation-start', channel: key, operationId: token.id, mediaSessionId });
        emit();
        return token;
    }

    function isCurrent(token) {
        if (!token || !token.channel) return false;
        const entry = active.get(token.channel);
        return Boolean(entry && entry.token.id === token.id && (!token.signal || !token.signal.aborted));
    }

    function assertCurrent(token, reason) {
        if (!isCurrent(token)) throw createAbortError(reason || '더 최신 작업이 시작되어 이전 결과를 폐기했습니다.');
        if (token.mediaSessionId !== mediaSessionId) throw createAbortError('원본 미디어가 변경되어 이전 결과를 폐기했습니다.');
        return true;
    }

    function finish(token, meta) {
        if (!isCurrent(token)) return false;
        active.delete(token.channel);
        diagnostic({
            type: 'operation-finish',
            channel: token.channel,
            operationId: token.id,
            elapsedMs: Math.max(0, Date.now() - token.startedAt),
            result: meta && meta.result || 'done'
        });
        emit();
        return true;
    }

    function startMediaSession(meta) {
        mediaSessionId += 1;
        ['analysis', 'smart-reframe', 'preview', 'render'].forEach(channel => cancel(channel, '원본 미디어 변경'));
        diagnostic({ type: 'media-session-start', mediaSessionId, fileName: meta && meta.fileName || '' });
        emit();
        return mediaSessionId;
    }

    function cancelAll(reason) {
        Array.from(active.keys()).forEach(channel => cancel(channel, reason || '전체 작업 취소'));
    }

    function snapshot() {
        return Object.freeze({
            mediaSessionId,
            active: Array.from(active.values()).map(entry => Object.freeze({
                channel: entry.token.channel,
                id: entry.token.id,
                mediaSessionId: entry.token.mediaSessionId,
                startedAt: entry.token.startedAt,
                ageMs: Math.max(0, Date.now() - entry.token.startedAt),
                meta: entry.token.meta
            }))
        });
    }

    global.AIShortsOperationCoordinator = Object.freeze({
        begin,
        cancel,
        cancelAll,
        finish,
        isCurrent,
        assertCurrent,
        startMediaSession,
        snapshot,
        createAbortError,
        isAbortError
    });
})(window);
