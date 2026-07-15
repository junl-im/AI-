// AI Shorts Studio v1.0.8 - save readiness and export confidence bridge
'use strict';
(function bootSaveReadiness(global) {
    const store = global.AIShortsAppState || {};
    const state = store.state || {};
    let raf = 0;

    function byId(id) { return document.getElementById(id); }
    function recommendations() { return Array.isArray(state.recommendations) ? state.recommendations : []; }
    function selectedCandidate() {
        return recommendations().find(item => item && item.id === state.selectedRecommendationId) || null;
    }
    function hasCaptions() { return Array.isArray(state.captions) && state.captions.length > 0; }
    function fmtSeconds(value) {
        const num = Math.max(0, Number(value) || 0);
        if (num < 60) return `${Math.round(num)}초`;
        const min = Math.floor(num / 60);
        const sec = Math.round(num % 60);
        return `${min}분 ${String(sec).padStart(2, '0')}초`;
    }
    function estimateSize(candidate) {
        if (!candidate) return '대기';
        const duration = Math.max(1, Number(candidate.duration) || 15);
        const quality = String(state.settings && state.settings.renderQuality || state.settings && state.settings.platform || 'balanced');
        const multiplier = quality.includes('high') ? 1.45 : quality.includes('fast') ? .74 : 1;
        const mb = Math.max(2, Math.round(duration * .72 * multiplier));
        return `약 ${mb}MB`;
    }
    function goTab(tab) {
        if (global.AIShortsHyperFlowTabs && global.AIShortsHyperFlowTabs.setActiveFlowTab) {
            global.AIShortsHyperFlowTabs.setActiveFlowTab(tab, { reveal: true, force: true });
        } else if (global.AIShortsMotionStability && global.AIShortsMotionStability.reveal) {
            if (document.body) document.body.dataset.activeFlowTab = tab;
            global.AIShortsMotionStability.reveal(tab, { force: true });
        } else if (document.body) {
            document.body.dataset.activeFlowTab = tab;
        }
    }
    function makeButton(label, tab, id) {
        const button = document.createElement('button');
        button.id = id;
        button.type = 'button';
        button.className = 'mini-action';
        button.textContent = label;
        button.addEventListener('click', () => goTab(tab));
        return button;
    }
    function ensurePreviewStrip() {
        let strip = byId('previewReadyStrip');
        if (strip) return strip;
        const preview = document.querySelector('[data-flow-panel="preview"]');
        const ribbon = byId('previewHandoffRibbon');
        if (!preview) return null;
        strip = document.createElement('div');
        strip.id = 'previewReadyStrip';
        strip.className = 'preview-ready-strip is-empty';
        strip.innerHTML = '<div class="preview-ready-head"><div class="preview-ready-copy"><strong id="previewReadyTitle" class="preview-ready-title">미리보기 준비 대기</strong><small id="previewReadyMeta" class="preview-ready-meta">후보를 선택하면 길이·점수·저장 준비 상태를 바로 확인할 수 있습니다.</small></div></div><div class="preview-ready-actions" id="previewReadyActions"></div>';
        const anchor = ribbon || preview.querySelector('.panel-head');
        if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(strip, anchor.nextSibling);
        else preview.insertBefore(strip, preview.firstChild);
        const actions = byId('previewReadyActions');
        if (actions) {
            actions.appendChild(makeButton('∿ 파형 다듬기', 'waveform', 'previewReadyWaveformBtn'));
            actions.appendChild(makeButton('✂ 컷 확인', 'cut', 'previewReadyCutBtn'));
            actions.appendChild(makeButton('↓ 저장 준비', 'export', 'previewReadyExportBtn'));
        }
        return strip;
    }
    function ensureSavePanel() {
        let panel = byId('saveReadinessPanel');
        if (panel) return panel;
        const exportPanel = document.querySelector('[data-flow-panel="export"]');
        if (!exportPanel) return null;
        panel = document.createElement('div');
        panel.id = 'saveReadinessPanel';
        panel.className = 'save-readiness-panel is-empty';
        panel.innerHTML = '<div class="save-readiness-head"><div class="save-readiness-copy"><strong id="saveReadinessTitle" class="save-readiness-title">저장 준비 대기</strong><small id="saveReadinessMeta" class="save-readiness-meta">후보를 선택하면 저장 전 체크리스트가 표시됩니다.</small></div><span id="saveReadinessBadge" class="save-readiness-badge is-warn">대기</span></div><div class="save-readiness-grid"><div class="save-readiness-item"><b>선택 구간</b><span id="saveReadyRange">대기</span></div><div class="save-readiness-item"><b>길이</b><span id="saveReadyDuration">대기</span></div><div class="save-readiness-item"><b>자막</b><span id="saveReadyCaption">선택</span></div><div class="save-readiness-item"><b>예상 용량</b><span id="saveReadySize">대기</span></div></div><div class="save-readiness-actions" id="saveReadinessActions"></div>';
        const helper = exportPanel.querySelector('.helper-text');
        if (helper && helper.parentNode) helper.parentNode.insertBefore(panel, helper.nextSibling);
        else exportPanel.insertBefore(panel, exportPanel.firstChild);
        const actions = byId('saveReadinessActions');
        if (actions) {
            actions.appendChild(makeButton('◆ 후보 다시 보기', 'candidates', 'saveReadyCandidatesBtn'));
            actions.appendChild(makeButton('▶ 미리보기 확인', 'preview', 'saveReadyPreviewBtn'));
            actions.appendChild(makeButton('◫ 편집 조정', 'edit', 'saveReadyEditBtn'));
        }
        return panel;
    }
    function setText(id, value) {
        const node = byId(id);
        if (node) node.textContent = value;
    }
    function sync() {
        raf = 0;
        const selected = selectedCandidate();
        const preview = ensurePreviewStrip();
        const save = ensureSavePanel();
        const ready = Boolean(selected);
        if (preview) preview.classList.toggle('is-empty', !ready);
        if (save) save.classList.toggle('is-empty', !ready);
        if (selected) {
            const score = Math.round(Number(selected.score) || 0);
            const captionText = hasCaptions() ? `${state.captions.length}개 적용` : '선택 사항';
            setText('previewReadyTitle', selected.title || '선택한 후보');
            setText('previewReadyMeta', `${selected.rangeText || ''} · ${fmtSeconds(selected.duration)} · ${score}점 · 저장 전 파형/컷/자막을 빠르게 확인하세요.`);
            setText('saveReadinessTitle', '저장 준비 완료');
            setText('saveReadinessMeta', '미리보기 확인 후 쇼츠 저장 또는 일괄 저장을 진행할 수 있습니다.');
            setText('saveReadinessBadge', score >= 85 ? '준비 좋음' : '확인 권장');
            setText('saveReadyRange', selected.rangeText || '선택됨');
            setText('saveReadyDuration', fmtSeconds(selected.duration));
            setText('saveReadyCaption', captionText);
            setText('saveReadySize', estimateSize(selected));
            const badge = byId('saveReadinessBadge');
            if (badge) {
                badge.classList.toggle('is-ready', score >= 85);
                badge.classList.toggle('is-warn', score < 85);
            }
        } else {
            const count = recommendations().length;
            setText('previewReadyTitle', count ? '후보를 하나 선택하세요' : '미리보기 준비 대기');
            setText('previewReadyMeta', count ? '후보 탭에서 카드를 선택하면 미리보기와 저장 준비가 자동 연결됩니다.' : '추천 생성 후 후보를 선택하면 이곳에 정보가 표시됩니다.');
            setText('saveReadinessTitle', '저장 준비 대기');
            setText('saveReadinessMeta', count ? '후보를 선택해야 저장 준비 체크리스트가 활성화됩니다.' : '추천 후보 생성과 선택이 먼저 필요합니다.');
            setText('saveReadinessBadge', count ? '후보 선택 필요' : '대기');
            setText('saveReadyRange', '대기');
            setText('saveReadyDuration', '대기');
            setText('saveReadyCaption', hasCaptions() ? `${state.captions.length}개` : '선택');
            setText('saveReadySize', '대기');
            const badge = byId('saveReadinessBadge');
            if (badge) {
                badge.classList.remove('is-ready');
                badge.classList.add('is-warn');
            }
        }
        if (document.body) document.body.dataset.saveReadiness = 'ready';
    }
    function schedule() {
        if (raf) return;
        raf = requestAnimationFrame(sync);
    }
    function install() {
        ensurePreviewStrip();
        ensureSavePanel();
        const observer = new MutationObserver(schedule);
        ['recommendationList', 'selectedRangeText', 'previewStatus', 'captionStatus', 'renderQueueStatus', 'flowSelectionTitle'].map(byId).filter(Boolean).forEach(node => observer.observe(node, { childList: true, subtree: true, characterData: true, attributes: true }));
        document.addEventListener('ai-shorts-flow-sync', schedule);
        document.addEventListener('click', event => {
            if (event.target && event.target.closest && event.target.closest('.recommendation-card, [data-flow-tab], #exportBtn, #thumbnailBtn')) {
                setTimeout(schedule, 80);
                setTimeout(schedule, 280);
            }
        }, true);
        schedule();
    }
    global.AIShortsSaveReadiness = Object.freeze({ schedule, goTab });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
    else install();
})(window);
