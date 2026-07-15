// AI Shorts Studio v1.1.3 - candidate comparison and preview pro bridge
'use strict';
(function bootCandidatePreviewPro(global) {
    const store = global.AIShortsAppState || {};
    const state = store.state || {};
    let raf = 0;
    let currentSort = 'score';

    function byId(id) { return document.getElementById(id); }
    function list() { return Array.isArray(state.recommendations) ? state.recommendations : []; }
    function selected() { return list().find(item => item && item.id === state.selectedRecommendationId) || null; }
    function fmtSeconds(value) {
        const num = Math.max(0, Number(value) || 0);
        return `${Math.round(num)}초`;
    }
    function goTab(tab) {
        if (global.AIShortsHyperFlowTabs && global.AIShortsHyperFlowTabs.setActiveFlowTab) {
            global.AIShortsHyperFlowTabs.setActiveFlowTab(tab, { reveal: true, force: true });
        } else if (document.body) {
            document.body.dataset.activeFlowTab = tab;
            if (global.AIShortsMotionStability && global.AIShortsMotionStability.reveal) global.AIShortsMotionStability.reveal(tab, { force: true });
        }
    }
    function clickCandidate(id) {
        const card = document.querySelector(`.recommendation-card[data-id="${String(id).replace(/"/g, '\\"')}"]`);
        if (card) {
            card.classList.add('is-pro-focus');
            window.setTimeout(() => card.classList.remove('is-pro-focus'), 900);
            card.click();
        }
    }
    function sortedCandidates() {
        const copy = list().slice();
        if (currentSort === 'duration') copy.sort((a, b) => (Number(a.duration) || 0) - (Number(b.duration) || 0));
        else if (currentSort === 'start') copy.sort((a, b) => (Number(a.start) || 0) - (Number(b.start) || 0));
        else copy.sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0));
        return copy;
    }
    function ensureBoard() {
        let board = byId('candidateProBoard');
        if (board) return board;
        const zone = document.querySelector('[data-flow-panel="candidates"]');
        const listNode = byId('recommendationList');
        if (!zone) return null;
        board = document.createElement('div');
        board.id = 'candidateProBoard';
        board.className = 'candidate-pro-board';
        board.innerHTML = '<div class="candidate-pro-top"><div class="candidate-pro-title"><strong id="candidateProTitle">후보 비교 준비</strong><small id="candidateProMeta">추천 생성 후 상위 후보를 한눈에 비교하고 바로 선택할 수 있습니다.</small></div><div class="candidate-pro-pills" id="candidateProPills"></div></div><div class="candidate-pro-actions" id="candidateProActions"></div><div class="candidate-pro-compare" id="candidateProCompare"></div>';
        if (listNode && listNode.parentNode) listNode.parentNode.insertBefore(board, listNode);
        else zone.insertBefore(board, zone.firstChild);
        const actions = byId('candidateProActions');
        if (actions) {
            [['score', '점수순'], ['duration', '짧은 길이'], ['start', '빠른 시작']].forEach(([key, label]) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.dataset.candidateSort = key;
                btn.textContent = label;
                btn.addEventListener('click', () => {
                    currentSort = key;
                    schedule();
                    const listEl = byId('recommendationList');
                    if (listEl) listEl.dataset.candidateSort = key;
                });
                actions.appendChild(btn);
            });
            const preview = document.createElement('button');
            preview.id = 'candidateProPreviewBtn';
            preview.type = 'button';
            preview.textContent = '▶ 선택 미리보기';
            preview.addEventListener('click', () => goTab(selected() ? 'preview' : 'candidates'));
            actions.appendChild(preview);
        }
        return board;
    }
    function ensurePreviewHud() {
        let hud = byId('previewProHud');
        if (hud) return hud;
        const preview = document.querySelector('[data-flow-panel="preview"]');
        if (!preview) return null;
        const anchor = byId('previewReadyStrip') || byId('previewHandoffRibbon') || preview.querySelector('.panel-head');
        hud = document.createElement('div');
        hud.id = 'previewProHud';
        hud.className = 'preview-pro-hud';
        hud.innerHTML = '<div class="preview-pro-main"><strong id="previewProTitle">선택 후보 미리보기</strong><small id="previewProMeta">후보를 선택하면 이곳에 핵심 정보가 고정됩니다.</small><div class="preview-pro-actions" id="previewProActions"></div></div><div class="preview-pro-stats"><div class="preview-pro-stat"><span>구간</span><b id="previewProRange">대기</b></div><div class="preview-pro-stat"><span>길이</span><b id="previewProDuration">대기</b></div><div class="preview-pro-stat"><span>점수</span><b id="previewProScore">대기</b></div></div>';
        if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(hud, anchor.nextSibling);
        else preview.insertBefore(hud, preview.firstChild);
        const actions = byId('previewProActions');
        if (actions) {
            [['◆ 후보 변경', 'candidates'], ['∿ 파형 조정', 'waveform'], ['↓ 저장으로', 'export']].forEach(([label, tab]) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.textContent = label;
                button.addEventListener('click', () => goTab(tab));
                actions.appendChild(button);
            });
        }
        return hud;
    }
    function setText(id, text) {
        const node = byId(id);
        if (node) node.textContent = text;
    }
    function renderPills(items, picked) {
        const node = byId('candidateProPills');
        if (!node) return;
        node.replaceChildren();
        const count = items.length;
        const top = items[0];
        const score = top ? Math.round(Number(top.score) || 0) : 0;
        const selectedLabel = picked ? '선택됨' : '선택 대기';
        [[`${count}개 후보`, count ? 'is-ready' : ''], [`최고 ${score}점`, score >= 85 ? 'is-hot' : ''], selectedLabel, picked ? 'is-ready' : ''].forEach(pair => {
            const label = Array.isArray(pair) ? pair[0] : pair;
            const cls = Array.isArray(pair) ? pair[1] : '';
            const pill = document.createElement('span');
            pill.className = `candidate-pro-pill ${cls || ''}`.trim();
            pill.textContent = label;
            node.appendChild(pill);
        });
    }
    function renderCompare(items, picked) {
        const node = byId('candidateProCompare');
        if (!node) return;
        node.replaceChildren();
        if (!items.length) {
            const empty = document.createElement('div');
            empty.className = 'candidate-pro-item';
            empty.innerHTML = '<span class="candidate-pro-rank">대기</span><b>추천 후보가 아직 없습니다</b><small>추천 메뉴에서 추천 생성을 누르면 후보가 표시됩니다.</small>';
            node.appendChild(empty);
            return;
        }
        items.slice(0, 3).forEach((item, index) => {
            const card = document.createElement('button');
            card.type = 'button';
            card.className = `candidate-pro-item ${picked && picked.id === item.id ? 'is-selected' : ''}`;
            card.dataset.candidateProId = item.id;
            const title = item.title || `후보 ${index + 1}`;
            const duration = fmtSeconds(item.duration || ((Number(item.end) || 0) - (Number(item.start) || 0)));
            card.innerHTML = `<span class="candidate-pro-rank">TOP ${index + 1}</span><b>${title}</b><small>${item.rangeText || ''} · ${duration}</small><span class="candidate-pro-score">${Math.round(Number(item.score) || 0)}점</span>`;
            card.addEventListener('click', () => clickCandidate(item.id));
            node.appendChild(card);
        });
    }
    function sync() {
        raf = 0;
        ensureBoard();
        ensurePreviewHud();
        const items = sortedCandidates();
        const picked = selected();
        renderPills(items, picked);
        renderCompare(items, picked);
        document.querySelectorAll('[data-candidate-sort]').forEach(btn => btn.classList.toggle('is-active', btn.dataset.candidateSort === currentSort));
        const count = items.length;
        setText('candidateProTitle', picked ? '선택 후보가 고정되었습니다' : count ? '후보를 비교하고 선택하세요' : '후보 비교 준비');
        setText('candidateProMeta', picked ? `${picked.title || '선택 후보'} · ${picked.rangeText || ''} · 미리보기/파형/저장으로 바로 이어집니다.` : count ? '상위 3개 후보를 비교하거나 아래 전체 카드에서 원하는 구간을 선택하세요.' : '추천 생성 후 후보 비교 보드가 활성화됩니다.');
        if (picked) {
            setText('previewProTitle', picked.title || '선택한 후보');
            setText('previewProMeta', '현재 선택 구간이 미리보기·파형·저장 탭에 연결되어 있습니다.');
            setText('previewProRange', picked.rangeText || '선택됨');
            setText('previewProDuration', fmtSeconds(picked.duration));
            setText('previewProScore', `${Math.round(Number(picked.score) || 0)}점`);
        } else {
            setText('previewProTitle', count ? '후보 선택이 필요합니다' : '선택 후보 미리보기');
            setText('previewProMeta', count ? '후보 탭에서 카드를 선택하면 미리보기 정보가 고정됩니다.' : '추천 생성 후 후보를 선택하면 이곳에 핵심 정보가 표시됩니다.');
            setText('previewProRange', '대기');
            setText('previewProDuration', '대기');
            setText('previewProScore', '대기');
        }
        const previewButton = byId('candidateProPreviewBtn');
        if (previewButton) previewButton.disabled = !picked;
        if (document.body) document.body.dataset.candidatePreviewPro = 'ready';
    }
    function schedule() {
        if (raf) return;
        raf = requestAnimationFrame(sync);
    }
    function install() {
        ensureBoard();
        ensurePreviewHud();
        const observer = new MutationObserver(schedule);
        ['recommendationList', 'recommendationCount', 'selectedRangeText', 'previewStatus', 'saveReadinessPanel'].map(byId).filter(Boolean).forEach(node => observer.observe(node, { childList: true, subtree: true, characterData: true, attributes: true }));
        document.addEventListener('ai-shorts-flow-sync', schedule);
        document.addEventListener('click', event => {
            if (event.target && event.target.closest && event.target.closest('.recommendation-card, [data-flow-tab], #analyzeBtn')) {
                window.setTimeout(schedule, 80);
                window.setTimeout(schedule, 260);
            }
        }, true);
        schedule();
    }
    global.AIShortsCandidatePreviewPro = Object.freeze({ schedule, goTab, clickCandidate });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
    else install();
})(window);
