// AI Shorts Studio v1.2.1 - render quality planner, estimates, and mobile save guidance
'use strict';

(function bootRenderQualityPlanner(global) {
    const store = global.AIShortsAppState || {};
    const state = store.state || {};
    const presets = Object.freeze({
        fast: { label: '빠른 저장', emoji: '⚡', fps: 24, bitrate: 5.2, speed: 0.72, size: 0.72, note: '짧은 확인용·저사양 기기 추천' },
        balanced: { label: '균형', emoji: '✨', fps: 30, bitrate: 8.0, speed: 1, size: 1, note: '기본 추천·품질과 속도 균형' },
        high: { label: '고품질', emoji: '🎬', fps: 30, bitrate: 12.5, speed: 1.42, size: 1.55, note: '최종 업로드용·시간과 용량 증가' }
    });
    let raf = 0;
    let observer = null;

    function byId(id) { return document.getElementById(id); }
    function getPresetKey() {
        const key = state.settings && state.settings.renderPreset || 'balanced';
        return presets[key] ? key : 'balanced';
    }
    function setPresetKey(key) {
        const next = presets[key] ? key : 'balanced';
        if (store.setSetting) store.setSetting('renderPreset', next);
        else {
            state.settings = state.settings || {};
            state.settings.renderPreset = next;
        }
        if (document.body) document.body.dataset.renderPreset = next;
        schedule();
        try { document.dispatchEvent(new CustomEvent('ai-shorts-render-preset-change', { detail: { preset: next } })); } catch (error) { /* ignored */ }
    }
    function selectedCandidate() {
        const list = Array.isArray(state.recommendations) ? state.recommendations : [];
        return list.find(item => item && item.id === state.selectedRecommendationId) || (state.selectedRange ? Object.assign({ title: '선택 구간' }, state.selectedRange) : null);
    }
    function fmtSeconds(value) {
        const seconds = Math.max(0, Number(value) || 0);
        if (!seconds) return '대기';
        if (seconds < 60) return `${Math.round(seconds)}초`;
        const min = Math.floor(seconds / 60);
        const sec = Math.round(seconds % 60);
        return `${min}분 ${String(sec).padStart(2, '0')}초`;
    }
    function estimateSize(candidate, presetKey) {
        const preset = presets[presetKey] || presets.balanced;
        const duration = Math.max(1, Number(candidate && candidate.duration) || Number(state.selectedRange && state.selectedRange.duration) || 30);
        const captionBonus = Array.isArray(state.captions) && state.captions.length ? 1.04 : 1;
        const mb = Math.max(2, Math.round(duration * preset.bitrate / 8 * captionBonus));
        return `약 ${mb}MB`;
    }
    function estimateTime(candidate, presetKey) {
        const preset = presets[presetKey] || presets.balanced;
        const duration = Math.max(1, Number(candidate && candidate.duration) || Number(state.selectedRange && state.selectedRange.duration) || 30);
        const mobile = isMobileLike() ? 1.35 : 1;
        const seconds = Math.max(4, Math.round(duration * preset.speed * mobile));
        return fmtSeconds(seconds);
    }
    function isMobileLike() {
        const ua = String(navigator.userAgent || '').toLowerCase();
        return /iphone|ipad|ipod|android|mobile/.test(ua) || Math.min(global.innerWidth || 9999, global.innerHeight || 9999) < 760;
    }
    function makePresetButton(key) {
        const preset = presets[key];
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'render-preset-card';
        button.dataset.renderPreset = key;
        button.innerHTML = `<strong>${preset.emoji} ${preset.label}</strong><span>${preset.note}</span>`;
        button.addEventListener('click', () => setPresetKey(key));
        return button;
    }
    function makeAction(label, tab) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'mini-action';
        button.textContent = label;
        button.addEventListener('click', () => {
            const api = global.AIShortsHyperFlowTabs;
            if (api && api.setActiveFlowTab) api.setActiveFlowTab(tab, { reveal: true });
            else if (document.body) document.body.dataset.activeFlowTab = tab;
        });
        return button;
    }
    function ensurePanel() {
        let panel = byId('renderQualityPlanner');
        if (panel) return panel;
        const anchor = document.querySelector('.hyperflow-export-panel .render-queue-card') || document.querySelector('.hyperflow-export-panel');
        if (!anchor || !anchor.parentElement) return null;
        panel = document.createElement('section');
        panel.id = 'renderQualityPlanner';
        panel.className = 'render-quality-planner';
        panel.setAttribute('aria-label', '렌더 품질과 저장 예측');
        panel.innerHTML = '<div class="render-quality-head"><div class="render-quality-copy"><strong id="renderQualityTitle" class="render-quality-title">렌더 품질 프리셋</strong><small id="renderQualityMeta" class="render-quality-meta">저장 전에 품질·예상 시간·예상 용량을 확인하세요.</small></div><span id="renderQualityBadge" class="render-quality-badge">균형</span></div><div id="renderPresetGrid" class="render-preset-grid"></div><div class="render-estimate-grid"><div class="render-estimate-item"><b>예상 시간</b><span id="renderEstimateTime">대기</span></div><div class="render-estimate-item"><b>예상 용량</b><span id="renderEstimateSize">대기</span></div><div class="render-estimate-item"><b>프레임</b><span id="renderEstimateFps">대기</span></div><div class="render-estimate-item"><b>저장 형식</b><span id="renderEstimateFormat">브라우저 자동</span></div></div><div id="renderMobileGuide" class="render-mobile-guide" hidden></div><div id="renderQualityActions" class="render-quality-actions"></div>';
        anchor.parentElement.insertBefore(panel, anchor);
        const grid = byId('renderPresetGrid');
        if (grid) ['fast', 'balanced', 'high'].forEach(key => grid.appendChild(makePresetButton(key)));
        const actions = byId('renderQualityActions');
        if (actions) {
            actions.appendChild(makeAction('📱 미리보기 확인', 'preview'));
            actions.appendChild(makeAction('🎛️ 편집 조정', 'edit'));
            actions.appendChild(makeAction('👆 후보 다시 보기', 'candidates'));
        }
        return panel;
    }
    function setText(id, value) {
        const node = byId(id);
        if (node) node.textContent = value;
    }
    function sync() {
        raf = 0;
        const panel = ensurePanel();
        if (!panel) return;
        const key = getPresetKey();
        const preset = presets[key] || presets.balanced;
        const candidate = selectedCandidate();
        if (document.body) document.body.dataset.renderPreset = key;
        document.querySelectorAll('.render-preset-card').forEach(button => {
            const active = button.dataset.renderPreset === key;
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        setText('renderQualityBadge', `${preset.emoji} ${preset.label}`);
        setText('renderQualityMeta', candidate ? `${candidate.rangeText || '선택 구간'} · ${fmtSeconds(candidate.duration)} · 저장 전 품질을 고르세요.` : '후보를 선택하면 예상 렌더 시간과 용량이 표시됩니다.');
        setText('renderEstimateTime', candidate ? estimateTime(candidate, key) : '대기');
        setText('renderEstimateSize', candidate ? estimateSize(candidate, key) : '대기');
        setText('renderEstimateFps', `${preset.fps}fps`);
        setText('renderEstimateFormat', key === 'high' ? '고품질 WebM/MP4' : '브라우저 최적');
        const guide = byId('renderMobileGuide');
        if (guide) {
            const mobile = isMobileLike();
            guide.hidden = !mobile;
            guide.textContent = mobile ? '모바일 저장 팁: 저장 중 화면을 끄거나 다른 앱으로 이동하면 실패할 수 있습니다. 긴 후보는 빠른 저장 또는 균형 프리셋을 권장합니다.' : '';
        }
    }
    function schedule() {
        if (raf) return;
        raf = requestAnimationFrame(sync);
    }
    function install() {
        ensurePanel();
        if (observer) observer.disconnect();
        observer = new MutationObserver(schedule);
        ['recommendationList', 'selectedRangeText', 'saveReadinessPanel', 'renderQueueStatus'].map(byId).filter(Boolean).forEach(node => observer.observe(node, { childList: true, subtree: true, characterData: true, attributes: true }));
        document.addEventListener('click', event => {
            if (event.target && event.target.closest && event.target.closest('.recommendation-card, [data-flow-tab], #flowExportBtn, #flowExportAllBtn, #exportBtn, #exportAllBtn')) {
                setTimeout(schedule, 60);
                setTimeout(schedule, 240);
            }
        }, true);
        document.addEventListener('ai-shorts-flow-sync', schedule);
        schedule();
    }
    global.AIShortsRenderQualityPlanner = Object.freeze({ presets, getPresetKey, setPresetKey, schedule, estimateSize, estimateTime });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
    else install();
})(window);
