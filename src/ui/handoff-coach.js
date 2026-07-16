// AI Shorts Studio v1.0.8 - candidate handoff coach and preview bridge
'use strict';
(function bootHandoffCoach(global) {
    const store = global.AIShortsAppState || {};
    const state = store.state || {};
    let rafToken = 0;

    function coachById(id) { return document.getElementById(id); }
    function coachRecommendations() { return Array.isArray(state.recommendations) ? state.recommendations : []; }
    function coachSelected() {
        const list = coachRecommendations();
        return list.find(item => item && item.id === state.selectedRecommendationId) || null;
    }
    function coachHasAnalysis() { return Boolean(state.audioAnalysis || state.motionAnalysis); }
    function coachSetTab(tab) {
        if (global.AIShortsHyperFlowTabs && global.AIShortsHyperFlowTabs.setActiveFlowTab) {
            global.AIShortsHyperFlowTabs.setActiveFlowTab(tab, { reveal: true, force: true });
        } else if (document.body) {
            document.body.dataset.activeFlowTab = tab;
        }
    }
    function coachMakeButton(label, tab, id) {
        const button = document.createElement('button');
        button.id = id;
        button.type = 'button';
        button.className = 'mini-action';
        button.textContent = label;
        button.dataset.icon = ({ recommend: 'spark', candidates: 'candidates', preview: 'preview', waveform: 'waveform', cut: 'cut', edit: 'edit', export: 'export' })[tab] || 'spark';
        button.addEventListener('click', () => coachSetTab(tab));
        return button;
    }
    function coachEnsureCandidateCard() {
        let card = coachById('candidateHandoffCard');
        if (card) return card;
        const zone = document.querySelector('[data-flow-panel="candidates"]');
        const guide = coachById('recommendFlowGuide');
        if (!zone) return null;
        card = document.createElement('div');
        card.id = 'candidateHandoffCard';
        card.className = 'candidate-handoff-card';
        card.innerHTML = '<div class="candidate-handoff-copy"><strong class="candidate-handoff-title" id="candidateHandoffTitle">추천 후보를 준비하세요</strong><small class="candidate-handoff-meta" id="candidateHandoffMeta">파일을 열고 추천을 생성하면 여기서 후보 선택 단계가 안내됩니다.</small></div><div class="candidate-handoff-actions" id="candidateHandoffActions"></div>';
        if (guide && guide.parentNode) guide.parentNode.insertBefore(card, guide.nextSibling);
        else zone.insertBefore(card, zone.firstChild);
        const actions = coachById('candidateHandoffActions');
        if (actions) {
            actions.appendChild(coachMakeButton('추천으로', 'recommend', 'candidateGoRecommendBtn'));
            actions.appendChild(coachMakeButton('미리보기', 'preview', 'candidateGoPreviewBtn'));
        }
        return card;
    }
    function coachEnsurePreviewRibbon() {
        let ribbon = coachById('previewHandoffRibbon');
        if (ribbon) return ribbon;
        const preview = document.querySelector('[data-flow-panel="preview"]');
        const head = preview && preview.querySelector('.panel-head');
        if (!preview) return null;
        ribbon = document.createElement('div');
        ribbon.id = 'previewHandoffRibbon';
        ribbon.className = 'preview-handoff-ribbon is-empty';
        ribbon.innerHTML = '<div class="preview-handoff-copy"><strong class="preview-handoff-title" id="previewHandoffTitle">후보를 선택하면 미리보기 준비</strong><small class="preview-handoff-meta" id="previewHandoffMeta">후보 탭에서 카드를 선택하면 이곳에 구간 정보와 다음 작업이 표시됩니다.</small></div><div class="preview-handoff-actions" id="previewHandoffActions"></div>';
        if (head && head.parentNode) head.parentNode.insertBefore(ribbon, head.nextSibling);
        else preview.insertBefore(ribbon, preview.firstChild);
        const actions = coachById('previewHandoffActions');
        if (actions) {
            actions.appendChild(coachMakeButton('후보로', 'candidates', 'previewGoCandidatesBtn'));
            actions.appendChild(coachMakeButton('파형 조정', 'waveform', 'previewGoWaveformBtn'));
            actions.appendChild(coachMakeButton('저장', 'export', 'previewGoExportBtn'));
        }
        return ribbon;
    }
    function coachUpdateCandidateCard() {
        const card = coachEnsureCandidateCard();
        if (!card) return;
        const title = coachById('candidateHandoffTitle');
        const meta = coachById('candidateHandoffMeta');
        const previewButton = coachById('candidateGoPreviewBtn');
        const recommendButton = coachById('candidateGoRecommendBtn');
        const selected = coachSelected();
        const count = coachRecommendations().length;
        card.classList.toggle('is-empty', !count);
        if (selected) {
            if (title) title.textContent = '선택 완료 · 미리보기로 이어졌습니다';
            if (meta) meta.textContent = `${selected.title || '선택 후보'} · ${selected.rangeText || ''} · ${Math.round(Number(selected.score) || 0)}점`;
            if (previewButton) previewButton.disabled = false;
            if (recommendButton) recommendButton.disabled = false;
        } else if (count) {
            if (title) title.textContent = `${count}개 후보 중 마음에 드는 구간을 선택하세요`;
            if (meta) meta.textContent = '카드를 누르면 자동으로 미리보기 탭에 연결되고, 파형/컷/저장까지 이어집니다.';
            if (previewButton) previewButton.disabled = true;
            if (recommendButton) recommendButton.disabled = false;
        } else if (coachHasAnalysis()) {
            if (title) title.textContent = '추천 생성이 필요합니다';
            if (meta) meta.textContent = '추천 메뉴에서 추천 생성을 누르면 후보 카드가 이곳에 나타납니다.';
            if (previewButton) previewButton.disabled = true;
            if (recommendButton) recommendButton.disabled = false;
        } else {
            if (title) title.textContent = '파일을 열면 자동 분석합니다';
            if (meta) meta.textContent = '분석 후 추천 생성 → 후보 선택 → 미리보기 순서로 연결됩니다.';
            if (previewButton) previewButton.disabled = true;
            if (recommendButton) recommendButton.disabled = true;
        }
    }
    function coachUpdatePreviewRibbon() {
        const ribbon = coachEnsurePreviewRibbon();
        if (!ribbon) return;
        const title = coachById('previewHandoffTitle');
        const meta = coachById('previewHandoffMeta');
        const waveformButton = coachById('previewGoWaveformBtn');
        const exportButton = coachById('previewGoExportBtn');
        const selected = coachSelected();
        ribbon.classList.toggle('is-empty', !selected);
        if (selected) {
            if (title) title.textContent = selected.title || '선택한 쇼츠 후보';
            if (meta) meta.textContent = `${selected.rangeText || ''} · ${Math.round(Number(selected.score) || 0)}점 · 미리보기 확인 후 파형 조정 또는 저장으로 이동하세요.`;
            if (waveformButton) waveformButton.disabled = false;
            if (exportButton) exportButton.disabled = false;
        } else {
            if (title) title.textContent = '후보를 선택하면 미리보기 준비';
            if (meta) meta.textContent = '후보 탭에서 카드를 선택하면 구간 정보와 다음 작업 버튼이 표시됩니다.';
            if (waveformButton) waveformButton.disabled = true;
            if (exportButton) exportButton.disabled = true;
        }
    }
    function coachSync() {
        rafToken = 0;
        coachUpdateCandidateCard();
        coachUpdatePreviewRibbon();
        if (document.body) document.body.dataset.handoffCoach = 'ready';
    }
    function coachSchedule() {
        if (rafToken) return;
        rafToken = requestAnimationFrame(coachSync);
    }
    function coachInstall() {
        coachEnsureCandidateCard();
        coachEnsurePreviewRibbon();
        const observer = new MutationObserver(coachSchedule);
        ['recommendationList', 'recommendationCount', 'selectedRangeText', 'previewStatus', 'analysisStatus'].map(coachById).filter(Boolean).forEach(node => observer.observe(node, { attributes: true, childList: true, subtree: true, characterData: true }));
        document.addEventListener('ai-shorts-flow-sync', coachSchedule);
        document.addEventListener('click', event => {
            if (event.target && event.target.closest && event.target.closest('.recommendation-card')) {
                global.setTimeout(coachSchedule, 60);
                global.setTimeout(coachSchedule, 260);
            }
        }, true);
        coachSchedule();
    }
    global.AIShortsHandoffCoach = Object.freeze({ schedule: coachSchedule, setTab: coachSetTab });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', coachInstall);
    else coachInstall();
})(window);
