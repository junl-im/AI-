// AI Shorts Studio v1.1.3 - pinned candidates and save estimate comparison
'use strict';
(function bootCandidatePinBoard(global) {
    const store = global.AIShortsAppState || {};
    const state = store.state || {};
    const STORAGE_KEY = 'ai-shorts-pinned-candidates-v1';
    let pinnedIds = loadPins();
    let showPinnedOnly = false;
    let raf = 0;
    let observer = null;

    function byId(id) { return document.getElementById(id); }
    function candidates() { return Array.isArray(state.recommendations) ? state.recommendations.filter(Boolean) : []; }
    function selectedId() { return state.selectedRecommendationId || ''; }
    function selected() { return candidates().find(item => item.id === selectedId()) || null; }
    function pinnedCandidates() { return candidates().filter(item => pinnedIds.has(item.id)); }
    function topCandidates(limit) { return candidates().slice().sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0)).slice(0, limit || 3); }
    function escape(value) { return String(value == null ? '' : value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }
    function fmtSeconds(value) {
        const seconds = Math.max(0, Number(value) || 0);
        if (!seconds) return '대기';
        if (seconds < 60) return `${Math.round(seconds)}초`;
        const min = Math.floor(seconds / 60);
        const sec = Math.round(seconds % 60);
        return `${min}분 ${String(sec).padStart(2, '0')}초`;
    }
    function durationOf(candidate) {
        return Math.max(0, Number(candidate && candidate.duration) || ((Number(candidate && candidate.end) || 0) - (Number(candidate && candidate.start) || 0)) || 0);
    }
    function activePresetKey() {
        const planner = global.AIShortsRenderQualityPlanner;
        if (planner && planner.getPresetKey) return planner.getPresetKey();
        return state.settings && state.settings.renderPreset || 'balanced';
    }
    function estimateSize(candidate) {
        const planner = global.AIShortsRenderQualityPlanner;
        if (planner && planner.estimateSize) return planner.estimateSize(candidate, activePresetKey());
        const duration = Math.max(1, durationOf(candidate) || 30);
        return `약 ${Math.max(2, Math.round(duration * 8 / 8))}MB`;
    }
    function estimateTime(candidate) {
        const planner = global.AIShortsRenderQualityPlanner;
        if (planner && planner.estimateTime) return planner.estimateTime(candidate, activePresetKey());
        return fmtSeconds(Math.max(4, durationOf(candidate) || 30));
    }
    function loadPins() {
        try {
            const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            return new Set(Array.isArray(parsed) ? parsed.filter(Boolean) : []);
        } catch (error) {
            return new Set();
        }
    }
    function savePins() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(pinnedIds))); } catch (error) { /* ignored */ }
        if (document.body) document.body.dataset.pinnedCandidates = String(pinnedIds.size);
    }
    function goTab(tab) {
        const api = global.AIShortsHyperFlowTabs;
        if (api && api.setActiveFlowTab) api.setActiveFlowTab(tab, { reveal: true, force: true });
        else if (global.AIShortsMotionStability && global.AIShortsMotionStability.reveal) global.AIShortsMotionStability.reveal(tab, { force: true });
    }
    function selectCandidate(id, tab) {
        const card = document.querySelector(`.recommendation-card[data-id="${String(id).replace(/"/g, '\\"')}"]`);
        if (card) card.click();
        if (tab) window.setTimeout(() => goTab(tab), 80);
    }
    function togglePin(id) {
        if (!id) return;
        if (pinnedIds.has(id)) pinnedIds.delete(id);
        else pinnedIds.add(id);
        savePins();
        try { document.dispatchEvent(new CustomEvent('ai-shorts-pinned-candidates-change', { detail: { count: pinnedIds.size } })); } catch (error) { /* ignored */ }
        schedule();
    }
    function ensurePinBoard() {
        let board = byId('candidatePinBoard');
        if (board) return board;
        const zone = document.querySelector('[data-flow-panel="candidates"]');
        if (!zone) return null;
        const anchor = byId('candidateProBoard') || byId('recommendationList') || zone.firstElementChild;
        board = document.createElement('section');
        board.id = 'candidatePinBoard';
        board.className = 'candidate-pin-board';
        board.setAttribute('aria-label', '핀 고정 후보');
        board.innerHTML = '<div class="pin-board-head"><div class="pin-board-copy"><strong id="pinBoardTitle">후보 핀 보드</strong><small id="pinBoardMeta">마음에 드는 후보를 핀으로 고정하고 비교하세요.</small></div><div class="pin-board-actions"><button id="pinOnlyToggle" type="button">📌 핀 후보만 보기</button><button id="pinClearBtn" type="button">핀 비우기</button></div></div><div id="pinCandidateList" class="pin-candidate-list"></div>';
        if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(board, anchor.nextSibling);
        else zone.insertBefore(board, zone.firstChild);
        const only = byId('pinOnlyToggle');
        if (only) only.addEventListener('click', () => { showPinnedOnly = !showPinnedOnly; schedule(); });
        const clear = byId('pinClearBtn');
        if (clear) clear.addEventListener('click', () => { pinnedIds = new Set(); savePins(); schedule(); });
        return board;
    }
    function ensureSaveCompare() {
        let panel = byId('candidateSaveCompare');
        if (panel) return panel;
        const exportPanel = document.querySelector('[data-flow-panel="export"]') || document.querySelector('.hyperflow-export-panel');
        if (!exportPanel) return null;
        const anchor = byId('renderQualityPlanner') || byId('saveReadinessPanel') || exportPanel.firstElementChild;
        panel = document.createElement('section');
        panel.id = 'candidateSaveCompare';
        panel.className = 'candidate-save-compare';
        panel.setAttribute('aria-label', '후보별 저장 예상 비교');
        panel.innerHTML = '<div class="save-compare-head"><div class="save-compare-copy"><strong id="saveCompareTitle">후보별 저장 예상</strong><small id="saveCompareMeta">선택 후보와 핀 후보의 예상 시간·용량을 비교합니다.</small></div><div class="save-compare-actions"><button id="saveCompareCandidateBtn" type="button">👆 후보로 이동</button><button id="saveComparePreviewBtn" type="button">📱 미리보기</button></div></div><div id="saveCompareList" class="save-compare-list"></div>';
        if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(panel, anchor.nextSibling);
        else exportPanel.insertBefore(panel, exportPanel.firstChild);
        const c = byId('saveCompareCandidateBtn');
        if (c) c.addEventListener('click', () => goTab('candidates'));
        const p = byId('saveComparePreviewBtn');
        if (p) p.addEventListener('click', () => goTab('preview'));
        return panel;
    }
    function decorateCards() {
        document.querySelectorAll('.recommendation-card[data-id]').forEach(card => {
            const id = card.dataset.id;
            if (!id) return;
            card.classList.add('has-pin-toggle');
            card.classList.toggle('is-pinned-candidate', pinnedIds.has(id));
            let button = card.querySelector(':scope > .candidate-pin-toggle');
            if (!button) {
                button = document.createElement('button');
                button.type = 'button';
                button.className = 'candidate-pin-toggle';
                button.addEventListener('click', event => {
                    event.preventDefault();
                    event.stopPropagation();
                    togglePin(id);
                });
                card.appendChild(button);
            }
            button.dataset.pinCandidateId = id;
            button.classList.toggle('is-pinned', pinnedIds.has(id));
            button.setAttribute('aria-pressed', pinnedIds.has(id) ? 'true' : 'false');
            button.textContent = pinnedIds.has(id) ? '📌' : '핀';
        });
        document.querySelectorAll('.candidate-pro-item[data-candidate-pro-id]').forEach(card => {
            card.classList.toggle('is-pinned-candidate', pinnedIds.has(card.dataset.candidateProId));
        });
        const listEl = byId('recommendationList');
        if (listEl) {
            listEl.dataset.pinnedOnly = showPinnedOnly ? 'true' : 'false';
            listEl.querySelectorAll('.recommendation-card[data-id]').forEach(card => {
                card.hidden = showPinnedOnly && !pinnedIds.has(card.dataset.id);
            });
        }
    }
    function makeCandidateRow(candidate, kind) {
        const selectedClass = candidate.id === selectedId() ? ' is-selected' : '';
        const title = escape(candidate.title || '쇼츠 후보');
        const range = escape(candidate.rangeText || '구간 대기');
        const score = Math.round(Number(candidate.score) || 0);
        const duration = fmtSeconds(durationOf(candidate));
        const size = estimateSize(candidate);
        const time = estimateTime(candidate);
        const cls = kind === 'save' ? 'save-compare-row' : 'pin-candidate-row';
        const main = kind === 'save' ? 'save-compare-main' : 'pin-candidate-main';
        const meta = kind === 'save' ? 'save-compare-meta' : 'pin-candidate-meta';
        const chip = kind === 'save' ? 'save-compare-chip' : 'pin-candidate-chip';
        return `<div class="${cls}${selectedClass}" data-pin-row-id="${escape(candidate.id)}"><div class="${main}"><b>${title}</b><small>${range} · ${duration}</small><div class="${meta}"><span class="${chip} is-score">${score}점</span><span class="${chip}">${time}</span><span class="${chip} is-size">${size}</span></div></div><button type="button" data-pin-select="${escape(candidate.id)}">선택</button><button type="button" data-pin-toggle-row="${escape(candidate.id)}">${pinnedIds.has(candidate.id) ? '핀 해제' : '핀 고정'}</button></div>`;
    }
    function renderPinnedBoard() {
        ensurePinBoard();
        const listNode = byId('pinCandidateList');
        if (!listNode) return;
        const pinned = pinnedCandidates();
        const all = candidates();
        const title = byId('pinBoardTitle');
        const meta = byId('pinBoardMeta');
        if (title) title.textContent = pinned.length ? `핀 고정 후보 ${pinned.length}개` : '후보 핀 보드';
        if (meta) meta.textContent = pinned.length ? '고정한 후보는 저장 탭에서도 예상 시간·용량 비교에 표시됩니다.' : '후보 카드의 핀 버튼으로 마음에 드는 구간을 고정하세요.';
        const only = byId('pinOnlyToggle');
        if (only) {
            only.classList.toggle('is-active', showPinnedOnly);
            only.textContent = showPinnedOnly ? '전체 후보 보기' : '📌 핀 후보만 보기';
            only.disabled = !all.length;
        }
        const clear = byId('pinClearBtn');
        if (clear) clear.disabled = !pinned.length;
        if (!pinned.length) {
            listNode.innerHTML = '<div class="pin-board-empty">아직 핀 고정된 후보가 없습니다. 후보 카드 오른쪽의 핀 버튼을 눌러 비교 후보를 모아두세요.</div>';
            return;
        }
        listNode.innerHTML = pinned.map(item => makeCandidateRow(item, 'pin')).join('');
    }
    function renderSaveCompare() {
        ensureSaveCompare();
        const listNode = byId('saveCompareList');
        if (!listNode) return;
        const picked = selected();
        const pinned = pinnedCandidates();
        const rows = [];
        if (picked) rows.push(picked);
        pinned.forEach(item => { if (!rows.some(row => row.id === item.id)) rows.push(item); });
        if (!rows.length) topCandidates(3).forEach(item => rows.push(item));
        const title = byId('saveCompareTitle');
        const meta = byId('saveCompareMeta');
        if (title) title.textContent = rows.length ? '후보별 저장 예상 비교' : '후보별 저장 예상';
        if (meta) meta.textContent = rows.length ? `현재 프리셋 ${activePresetKey()} 기준 · 선택/핀 후보를 비교합니다.` : '후보를 선택하거나 핀 고정하면 예상 저장 정보가 표시됩니다.';
        if (!rows.length) {
            listNode.innerHTML = '<div class="save-compare-empty">추천 후보가 아직 없습니다. 추천 생성 후 후보를 선택하면 저장 예상이 표시됩니다.</div>';
            return;
        }
        listNode.innerHTML = rows.slice(0, 5).map(item => makeCandidateRow(item, 'save')).join('');
    }
    function bindDynamicActions() {
        document.querySelectorAll('[data-pin-select]').forEach(button => {
            if (button.dataset.boundPinSelect === 'true') return;
            button.dataset.boundPinSelect = 'true';
            button.addEventListener('click', () => selectCandidate(button.dataset.pinSelect, 'preview'));
        });
        document.querySelectorAll('[data-pin-toggle-row]').forEach(button => {
            if (button.dataset.boundPinToggle === 'true') return;
            button.dataset.boundPinToggle = 'true';
            button.addEventListener('click', () => togglePin(button.dataset.pinToggleRow));
        });
    }
    function sync() {
        raf = 0;
        decorateCards();
        renderPinnedBoard();
        renderSaveCompare();
        bindDynamicActions();
        if (document.body) document.body.dataset.candidatePinBoard = 'ready';
    }
    function schedule() {
        if (raf) return;
        raf = requestAnimationFrame(sync);
    }
    function install() {
        ensurePinBoard();
        ensureSaveCompare();
        if (observer) observer.disconnect();
        observer = new MutationObserver(schedule);
        ['recommendationList', 'candidateProCompare', 'selectedRangeText', 'renderQualityPlanner', 'saveReadinessPanel'].map(byId).filter(Boolean).forEach(node => observer.observe(node, { childList: true, subtree: true, characterData: true, attributes: true }));
        document.addEventListener('click', event => {
            if (event.target && event.target.closest && event.target.closest('.recommendation-card, .candidate-pro-item, [data-flow-tab], [data-render-preset]')) {
                setTimeout(schedule, 60);
                setTimeout(schedule, 240);
            }
        }, true);
        document.addEventListener('ai-shorts-flow-sync', schedule);
        document.addEventListener('ai-shorts-render-preset-change', schedule);
        document.addEventListener('ai-shorts-pinned-candidates-change', schedule);
        schedule();
    }
    global.AIShortsCandidatePinBoard = Object.freeze({ schedule, togglePin, pinnedCandidates, selectCandidate });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
    else install();
})(window);
