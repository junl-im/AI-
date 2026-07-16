// AI Shorts Studio v1.3.1 - session continuity with visibility-aware autosave
'use strict';
(function bootSessionContinuity(global) {
    if (global.AIShortsSessionContinuity) return;
    const store = global.AIShortsAppState || {};
    const state = store.state || {};
    const projectService = global.AIShortsProjectService || {};
    const STORAGE_KEY = 'ai-shorts-session-continuity-v112';
    const SAVE_DELAY = 900;
    let saveTimer = 0;
    let syncTimer = 0;
    let panelReady = false;
    let heartbeatTimer = 0;

    function byId(id) { return document.getElementById(id); }
    function safeParse(text) { try { return JSON.parse(text); } catch (error) { return null; } }
    function nowIso() { return new Date().toISOString(); }
    function hasWork() {
        return Boolean(state.fileMeta || (state.recommendations && state.recommendations.length) || state.selectedRange || (state.captions && state.captions.length));
    }
    function fileKey(meta) {
        if (!meta) return '';
        return [meta.name || '', meta.size || 0, Math.round(Number(meta.duration) || 0)].join('|');
    }
    function currentCopy() {
        const title = byId('titleInput');
        const hashtags = byId('hashtagInput');
        return { title: title ? title.value : '', hashtags: hashtags ? hashtags.value : '' };
    }
    function createSnapshot() {
        let base = null;
        if (projectService.createProjectSnapshot) {
            base = projectService.createProjectSnapshot(state, currentCopy().title, currentCopy().hashtags);
        } else {
            base = {
                app: 'AI Shorts Studio',
                schemaVersion: 2,
                fileMeta: state.fileMeta || null,
                fileName: state.file && state.file.name || state.fileMeta && state.fileMeta.name || '',
                fileKind: state.fileKind || '',
                settings: state.settings || {},
                selectedRecommendationId: state.selectedRecommendationId || '',
                selectedRange: state.selectedRange || null,
                recommendations: state.recommendations || [],
                captions: state.captions || [],
                copy: currentCopy()
            };
        }
        base.schemaVersion = Math.max(3, Number(base.schemaVersion || 0));
        base.savedAt = nowIso();
        base.session = {
            version: '1.1.3',
            fileKey: fileKey(base.fileMeta),
            hasMediaInMemory: Boolean(state.file),
            recommendationCount: Array.isArray(base.recommendations) ? base.recommendations.length : 0,
            captionCount: Array.isArray(base.captions) ? base.captions.length : 0,
            selected: base.selectedRecommendationId || ''
        };
        return base;
    }
    function loadSnapshot() {
        try { return safeParse(localStorage.getItem(STORAGE_KEY) || ''); } catch (error) { return null; }
    }
    function saveSnapshotNow(reason) {
        if (!hasWork()) return false;
        try {
            const snapshot = createSnapshot();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
            if (document.body) document.body.dataset.sessionContinuity = 'saved';
            updatePanel(snapshot, reason || 'autosave');
            return true;
        } catch (error) {
            if (store.addDiagnostic) store.addDiagnostic({ type: 'session-save-error', message: error.message });
            return false;
        }
    }
    function scheduleSave(reason) {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => saveSnapshotNow(reason), SAVE_DELAY);
    }
    function clearSnapshot() {
        try { localStorage.removeItem(STORAGE_KEY); } catch (error) { /* ignored */ }
        if (document.body) document.body.dataset.sessionContinuity = 'none';
        updatePanel(null, 'clear');
    }
    function formatSavedAt(value) {
        if (!value) return '저장 시간 없음';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '저장 시간 없음';
        return date.toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    function ensurePanel() {
        let panel = byId('sessionContinuityPanel');
        if (panel) return panel;
        const startPanel = document.querySelector('.start-command-panel') || document.querySelector('.studio-hero');
        if (!startPanel) return null;
        panel = document.createElement('section');
        panel.id = 'sessionContinuityPanel';
        panel.className = 'session-continuity-panel';
        panel.setAttribute('aria-label', '작업 세션 복구');
        panel.innerHTML = '<div class="session-continuity-copy"><span class="session-continuity-icon studio-icon" data-icon="retry" aria-hidden="true"></span><div><strong id="sessionContinuityTitle">작업 세션 자동 저장 준비</strong><small id="sessionContinuityMeta">후보와 선택 구간이 생기면 자동으로 가볍게 저장합니다.</small></div></div><div class="session-continuity-actions"><button id="sessionRestoreBtn" class="primary" type="button">이전 작업 복구</button><button id="sessionSaveBtn" type="button">지금 저장</button><button id="sessionClearBtn" type="button">기록 지우기</button></div>';
        startPanel.insertAdjacentElement('afterend', panel);
        const restore = byId('sessionRestoreBtn');
        const save = byId('sessionSaveBtn');
        const clear = byId('sessionClearBtn');
        if (restore) restore.addEventListener('click', restoreSnapshot);
        if (save) save.addEventListener('click', () => saveSnapshotNow('manual'));
        if (clear) clear.addEventListener('click', clearSnapshot);
        panelReady = true;
        return panel;
    }
    function updatePanel(snapshot, reason) {
        ensurePanel();
        const stored = snapshot || loadSnapshot();
        const title = byId('sessionContinuityTitle');
        const meta = byId('sessionContinuityMeta');
        const restore = byId('sessionRestoreBtn');
        const save = byId('sessionSaveBtn');
        const clear = byId('sessionClearBtn');
        const canRestore = Boolean(stored && stored.app === 'AI Shorts Studio' && Array.isArray(stored.recommendations) && stored.recommendations.length);
        if (document.body) document.body.dataset.sessionContinuity = canRestore ? 'available' : (hasWork() ? 'saved' : 'none');
        if (title) {
            title.textContent = canRestore ? '이전 작업 세션이 있습니다' : '작업 세션 자동 저장';
        }
        if (meta) {
            if (canRestore) {
                const count = stored.recommendations.length;
                const selected = stored.selectedRecommendationId ? ' · 선택 후보 있음' : '';
                meta.innerHTML = `${stored.fileName || '이전 파일'} · 후보 ${count}개${selected} · <span class="session-continuity-timestamp">${formatSavedAt(stored.savedAt || stored.createdAt)}</span>`;
            } else {
                meta.textContent = hasWork() ? '현재 작업 상태를 로컬에 보존하고 있습니다.' : '파일을 열고 후보를 만들면 자동으로 가볍게 저장합니다.';
            }
        }
        if (restore) restore.disabled = !canRestore;
        if (save) save.disabled = !hasWork();
        if (clear) clear.disabled = !stored;
        if (reason && reason !== 'sync' && global.AIShortsFeedbackUX && global.AIShortsFeedbackUX.toast) {
            if (reason === 'manual') global.AIShortsFeedbackUX.toast('작업 세션을 저장했습니다.', 'save');
            if (reason === 'clear') global.AIShortsFeedbackUX.toast('작업 세션 기록을 지웠습니다.', 'action');
        }
    }
    function restoreSnapshot() {
        const snapshot = loadSnapshot();
        if (!snapshot || !Array.isArray(snapshot.recommendations) || !snapshot.recommendations.length) return;
        try {
            if (projectService.applyProjectSnapshot) projectService.applyProjectSnapshot(state, snapshot);
            else {
                state.recommendations = snapshot.recommendations || [];
                state.selectedRecommendationId = snapshot.selectedRecommendationId || state.recommendations[0].id || '';
                state.selectedRange = snapshot.selectedRange || null;
                state.captions = snapshot.captions || [];
                state.settings = Object.assign({}, state.settings || {}, snapshot.settings || {});
            }
            if (snapshot.copy) {
                const title = byId('titleInput');
                const hashtags = byId('hashtagInput');
                if (title && snapshot.copy.title) title.value = snapshot.copy.title;
                if (hashtags && snapshot.copy.hashtags) hashtags.value = snapshot.copy.hashtags;
            }
            if (store.saveSettings) store.saveSettings();
            if (global.AIShortsStudioApp && global.AIShortsStudioApp.renderAll) global.AIShortsStudioApp.renderAll();
            const targetTab = state.selectedRecommendationId ? 'preview' : 'candidates';
            const tabs = global.AIShortsHyperFlowTabs;
            if (tabs && tabs.setActiveFlowTab) tabs.setActiveFlowTab(targetTab, { reveal: true, force: true });
            else if (global.AIShortsMotionStability && global.AIShortsMotionStability.reveal) global.AIShortsMotionStability.reveal(targetTab, { force: true });
            document.dispatchEvent(new CustomEvent('ai-shorts-session-restored', { detail: { targetTab, count: state.recommendations.length } }));
            if (global.AIShortsFeedbackUX && global.AIShortsFeedbackUX.toast) global.AIShortsFeedbackUX.toast('이전 후보와 선택 구간을 복구했습니다. 원본 파일이 필요하면 다시 열어주세요.', 'action');
            scheduleSave('restore');
            updatePanel(snapshot, 'restore');
        } catch (error) {
            if (store.addDiagnostic) store.addDiagnostic({ type: 'session-restore-error', message: error.message });
            if (global.AIShortsFeedbackUX && global.AIShortsFeedbackUX.toast) global.AIShortsFeedbackUX.toast('작업 세션 복구에 실패했습니다.', 'error');
        }
    }
    function scheduleSync() {
        clearTimeout(syncTimer);
        syncTimer = setTimeout(() => updatePanel(null, 'sync'), 160);
    }
    function stopHeartbeat() {
        if (heartbeatTimer) global.clearInterval(heartbeatTimer);
        heartbeatTimer = 0;
    }
    function startHeartbeat() {
        stopHeartbeat();
        if (document.hidden) return;
        heartbeatTimer = global.setInterval(() => {
            if (document.hidden) return;
            if (hasWork()) saveSnapshotNow('interval');
            else scheduleSync();
        }, 30000);
    }
    function handleVisibilityChange() {
        if (document.hidden) {
            if (hasWork()) saveSnapshotNow('hidden');
            stopHeartbeat();
            return;
        }
        scheduleSync();
        startHeartbeat();
    }
    function install() {
        ensurePanel();
        updatePanel(null, 'sync');
        ['click', 'change', 'input'].forEach(type => document.addEventListener(type, event => {
            const target = event.target;
            if (!target || !target.closest) return;
            if (target.closest('.recommendation-card, [data-pin-toggle], [data-render-preset], #titleInput, #hashtagInput, #captionTextInput, [data-flow-tab], .caption-preset, .quality-panel, .caption-pro-panel')) {
                scheduleSave(type);
                scheduleSync();
            }
        }, true));
        ['ai-shorts-flow-sync', 'ai-shorts-render-preset-change', 'ai-shorts-pinned-candidates-change', 'ai-shorts-session-restored'].forEach(eventName => {
            document.addEventListener(eventName, () => { scheduleSave(eventName); scheduleSync(); });
        });
        window.addEventListener('beforeunload', () => saveSnapshotNow('beforeunload'));
        window.addEventListener('pagehide', () => { if (hasWork()) saveSnapshotNow('pagehide'); stopHeartbeat(); });
        document.addEventListener('visibilitychange', handleVisibilityChange);
        startHeartbeat();
    }
    global.AIShortsSessionContinuity = Object.freeze({ saveSnapshotNow, restoreSnapshot, clearSnapshot, loadSnapshot, scheduleSave });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
    else install();
})(window);
