// AI Shorts Studio v1.2.9 - vector export completion and recovery center
'use strict';

(function exposeExportFinishCenter(global) {
    const store = global.AIShortsAppState || {};
    const state = store.state || {};
    const renderQueue = global.AIShortsRenderQueue || null;
    let root = null;
    let lastSnapshot = null;

    function $(id) { return document.getElementById(id); }
    function clampText(value, fallback) {
        const text = String(value || '').trim();
        return text || fallback || '';
    }
    function getSelectedCandidate() {
        const selected = state.selectedRecommendation || state.selectedCandidate || null;
        if (selected) return selected;
        const index = Number(state.selectedRecommendationIndex);
        if (Array.isArray(state.recommendations) && Number.isFinite(index) && state.recommendations[index]) return state.recommendations[index];
        return null;
    }
    function formatTime(value) {
        const n = Math.max(0, Number(value) || 0);
        const m = Math.floor(n / 60);
        const s = Math.floor(n % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }
    function summarizeRange() {
        const candidate = getSelectedCandidate();
        if (!candidate) return '선택 후보 없음';
        const start = Number(candidate.start || candidate.startTime || 0);
        const end = Number(candidate.end || candidate.endTime || state.selectedRange && state.selectedRange.end || start + 30);
        return `${formatTime(start)} - ${formatTime(end)} (${Math.max(1, Math.round(end - start))}초)`;
    }
    function activateTab(tab) {
        if (global.AIShortsHyperFlowTabs && typeof global.AIShortsHyperFlowTabs.setActiveFlowTab === 'function') {
            global.AIShortsHyperFlowTabs.setActiveFlowTab(tab, { reveal: true, source: 'export-finish-center' });
            return;
        }
        if (document.body) document.body.dataset.activeFlowTab = tab;
    }
    function copyDiagnostics() {
        const btn = $('diagnosticsBtn');
        if (btn) {
            btn.click();
            return;
        }
        const payload = JSON.stringify({
            version: '1.1.3',
            renderQueue: lastSnapshot,
            selectedRange: summarizeRange(),
            userAgent: navigator.userAgent,
            at: new Date().toISOString()
        }, null, 2);
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(payload).catch(() => {});
    }
    function retryFailed() {
        const btn = $('renderQueueRetryBtn');
        if (btn && !btn.disabled) {
            btn.click();
            return;
        }
        if (renderQueue && typeof renderQueue.retryFailed === 'function') renderQueue.retryFailed().catch(() => {});
    }
    function clearList() {
        const btn = $('renderQueueClearBtn');
        if (btn) {
            btn.click();
            return;
        }
        if (renderQueue && typeof renderQueue.clear === 'function') renderQueue.clear();
        update(null);
    }
    function build() {
        const exportPanel = document.querySelector('[data-flow-panel~="export"]');
        if (!exportPanel || root) return root;
        root = document.createElement('div');
        root.id = 'exportFinishCenter';
        root.className = 'export-finish-center';
        root.dataset.state = 'idle';
        root.setAttribute('aria-label', '저장 완료 센터');
        root.innerHTML = [
            '<div class="export-finish-head">',
            '  <div class="export-finish-title">',
            '    <span class="export-finish-icon studio-icon" id="exportFinishIcon" data-icon="check" aria-hidden="true"></span>',
            '    <span><strong id="exportFinishTitle">저장 완료</strong><small id="exportFinishSub">렌더 결과를 확인하세요.</small></span>',
            '  </div>',
            '  <span class="export-finish-pill" id="exportFinishPill">완료</span>',
            '</div>',
            '<div class="export-finish-grid">',
            '  <div class="export-finish-metric"><span>완료</span><strong id="exportFinishDone">0개</strong></div>',
            '  <div class="export-finish-metric"><span>실패</span><strong id="exportFinishFailed">0개</strong></div>',
            '  <div class="export-finish-metric"><span>선택 구간</span><strong id="exportFinishRange">-</strong></div>',
            '</div>',
            '<p class="export-finish-note" id="exportFinishNote">저장 작업이 끝나면 다운로드 폴더에서 결과물을 확인할 수 있습니다.</p>',
            '<div class="export-finish-actions">',
            '  <button class="btn-secondary" type="button" data-icon="preview" data-export-finish-action="preview">미리보기</button>',
            '  <button class="btn-secondary" type="button" data-icon="candidates" data-export-finish-action="candidates">후보 보기</button>',
            '  <button class="btn-primary" type="button" data-icon="export" data-export-finish-action="save-again">다시 저장</button>',
            '  <button class="btn-secondary" type="button" data-icon="retry" data-export-finish-action="retry">실패 재시도</button>',
            '  <button class="btn-secondary" type="button" data-icon="diagnostics" data-export-finish-action="diagnostics">진단 복사</button>',
            '  <button class="btn-secondary" type="button" data-icon="close" data-export-finish-action="clear">정리</button>',
            '</div>',
            '<div class="export-finish-mini-log" id="exportFinishLog"></div>'
        ].join('');
        exportPanel.appendChild(root);
        root.addEventListener('click', event => {
            const action = event.target && event.target.closest && event.target.closest('[data-export-finish-action]');
            if (!action) return;
            const type = action.getAttribute('data-export-finish-action');
            if (type === 'preview') activateTab('preview');
            else if (type === 'candidates') activateTab('candidates');
            else if (type === 'save-again') activateTab('export');
            else if (type === 'retry') retryFailed();
            else if (type === 'diagnostics') copyDiagnostics();
            else if (type === 'clear') clearList();
        });
        return root;
    }
    function setText(id, text) {
        const el = $(id);
        if (el) el.textContent = text;
    }
    function renderMiniLog(snapshot) {
        const log = $('exportFinishLog');
        if (!log) return;
        const items = snapshot && Array.isArray(snapshot.items) ? snapshot.items.slice(-4) : [];
        log.innerHTML = '';
        items.forEach(item => {
            const row = document.createElement('div');
            row.className = 'export-finish-log-item';
            const icon = item.status === 'done' ? 'check' : item.status === 'failed' ? 'close' : item.status === 'running' ? 'render' : 'retry';
            row.classList.add(`is-${item.status || 'queued'}`);
            row.innerHTML = `<span><i class="studio-icon" data-icon="${icon}" aria-hidden="true"></i>${clampText(item.label, '렌더 작업')}</span><em>${item.status === 'failed' ? clampText(item.error, '실패') : `${Math.round(item.progress || 0)}%`}</em>`;
            log.appendChild(row);
        });
    }
    function update(snapshot) {
        build();
        if (!root) return;
        lastSnapshot = snapshot || lastSnapshot;
        const snap = snapshot || { total: 0, done: 0, failed: 0, running: false, queued: 0, progress: 0, items: [] };
        if (!snap.total || snap.running || snap.queued) {
            root.dataset.state = 'idle';
            return;
        }
        const failed = Number(snap.failed || 0);
        const done = Number(snap.done || 0);
        const total = Number(snap.total || 0);
        const stateName = failed && done ? 'partial' : failed ? 'failed' : 'done';
        root.dataset.state = stateName;
        const finishIcon = $('exportFinishIcon'); if (finishIcon) finishIcon.dataset.icon = stateName === 'done' ? 'check' : 'retry';
        setText('exportFinishTitle', stateName === 'done' ? '저장 완료' : stateName === 'partial' ? '일부 저장 완료' : '저장 실패');
        setText('exportFinishSub', stateName === 'done' ? '결과물을 다운로드 폴더에서 확인하세요.' : '실패 작업은 재시도하거나 진단을 복사하세요.');
        setText('exportFinishPill', stateName === 'done' ? '완료' : stateName === 'partial' ? '부분 완료' : '실패');
        setText('exportFinishDone', `${done}/${total}개`);
        setText('exportFinishFailed', `${failed}개`);
        setText('exportFinishRange', summarizeRange());
        setText('exportFinishNote', stateName === 'done'
            ? '저장 후 바로 업로드하기 전에 미리보기와 자막 위치를 한 번 더 확인하면 안전합니다.'
            : '다운로드 권한, 브라우저 저장 제한, 백그라운드 탭 전환 여부를 확인한 뒤 실패 재시도를 눌러보세요.');
        renderMiniLog(snap);
    }
    function init() {
        build();
        if (renderQueue && typeof renderQueue.subscribe === 'function') renderQueue.subscribe(update);
        global.addEventListener('ai-shorts-render-queue', event => update(event.detail));
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();

    global.AIShortsExportFinishCenter = Object.freeze({ init, update });
})(window);
