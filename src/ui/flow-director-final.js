// AI Shorts Studio v1.1.5 - Final single-owner flow director
// Owns tab visibility + scroll reveal to remove panel shaking from competing modules.
'use strict';
(function bootFlowDirectorFinal(global) {
    const ORDER = ['file', 'recommend', 'candidates', 'preview', 'waveform', 'cut', 'edit', 'export'];
    const META = {
        file: ['📂', '파일 열기'],
        recommend: ['✨', '추천 생성'],
        candidates: ['🎯', '후보 선택'],
        preview: ['📱', '미리보기'],
        waveform: ['〰️', '파형'],
        cut: ['✂️', '컷 편집'],
        edit: ['🎛️', '편집'],
        export: ['📦', '저장']
    };
    let raf = 0;
    let revealToken = 0;
    let lastTab = '';
    let lastY = -1;
    let lastAt = 0;

    function byId(id) { return document.getElementById(id); }
    function activeTab() {
        const body = document.body;
        return body && body.dataset && body.dataset.activeFlowTab ? body.dataset.activeFlowTab : 'file';
    }
    function tabs() { return Array.from(document.querySelectorAll('[data-flow-tab]')); }
    function panels() { return Array.from(document.querySelectorAll('[data-flow-panel]')); }
    function panelTabs(panel) { return String(panel.getAttribute('data-flow-panel') || '').split(/\s+/).filter(Boolean); }
    function panelFor(tab) {
        const key = tab || activeTab();
        return panels().find(panel => panelTabs(panel).includes(key)) || null;
    }
    function dockHeight() {
        const dock = byId('bottomDock');
        const rect = dock && dock.getBoundingClientRect ? dock.getBoundingClientRect() : null;
        return rect ? Math.max(0, rect.height || 0) : 0;
    }
    function setVisible(tab) {
        const key = ORDER.includes(tab) ? tab : 'file';
        panels().forEach(panel => {
            const match = panelTabs(panel).includes(key);
            panel.classList.toggle('is-flow-active', match);
            panel.setAttribute('aria-hidden', match ? 'false' : 'true');
            if (match) panel.setAttribute('tabindex', '-1');
        });
        tabs().forEach(tabNode => {
            const match = tabNode.getAttribute('data-flow-tab') === key;
            tabNode.classList.toggle('is-active', match);
            tabNode.setAttribute('aria-selected', match ? 'true' : 'false');
        });
        if (document.body) {
            document.body.dataset.activeFlowTab = key;
            document.body.dataset.flowDirector = 'final';
        }
    }
    function targetTop(panel) {
        const rect = panel.getBoundingClientRect();
        const topGap = global.innerWidth >= 980 ? 14 : 10;
        return Math.max(0, Math.round(global.scrollY + rect.top - topGap));
    }
    function isPanelFront(panel) {
        if (!panel || !panel.getBoundingClientRect) return false;
        const rect = panel.getBoundingClientRect();
        const topLimit = global.innerWidth >= 980 ? 16 : 10;
        const bottomLimit = Math.max(240, global.innerHeight - dockHeight() - 28);
        return rect.top >= topLimit && rect.top < 86 && rect.bottom > Math.min(220, bottomLimit);
    }
    function reveal(tab, options) {
        const key = ORDER.includes(tab) ? tab : activeTab();
        const opts = options || {};
        setVisible(key);
        const panel = panelFor(key);
        if (!panel || !global.requestAnimationFrame) return false;
        const token = ++revealToken;
        if (raf) global.cancelAnimationFrame(raf);
        raf = global.requestAnimationFrame(() => {
            raf = 0;
            if (token !== revealToken || !panel.isConnected) return;
            const now = Date.now();
            const top = targetTop(panel);
            const nearRepeat = key === lastTab && Math.abs(top - lastY) < 4 && (now - lastAt) < 520;
            const alreadyFront = isPanelFront(panel);
            if ((opts.force || !alreadyFront) && !nearRepeat && Math.abs(global.scrollY - top) > 6) {
                global.scrollTo({ top, behavior: 'auto' });
                lastTab = key;
                lastY = top;
                lastAt = now;
            }
            panel.classList.add('is-director-revealed');
            global.setTimeout(() => panel.classList.remove('is-director-revealed'), 320);
            try { panel.focus({ preventScroll: true }); } catch (error) { /* ignore */ }
        });
        return true;
    }
    function setActive(tab, options) {
        const key = ORDER.includes(tab) ? tab : 'file';
        reveal(key, Object.assign({ force: true }, options || {}));
        if (global.AIShortsFeedbackUX && global.AIShortsFeedbackUX.vibrate) {
            global.AIShortsFeedbackUX.vibrate('button');
        }
    }
    function patchGlobals() {
        const api = { reveal, panelFor, isComfortablyVisible: isPanelFront, setVisible, setActiveFlowTab: setActive };
        global.AIShortsMotionStability = Object.freeze(api);
        if (global.AIShortsWorkspaceComfort) {
            global.AIShortsWorkspaceComfort = Object.freeze(Object.assign({}, global.AIShortsWorkspaceComfort, { reveal }));
        }
        if (global.AIShortsHyperFlowTabs) {
            global.AIShortsHyperFlowTabs.setActiveFlowTab = setActive;
            global.AIShortsHyperFlowTabs.revealActivePanel = reveal;
            if (global.AIShortsHyperFlowTabs.syncTabs) global.AIShortsHyperFlowTabs.syncTabs();
        }
    }
    function installTabClicks() {
        document.addEventListener('click', event => {
            const tab = event.target && event.target.closest && event.target.closest('[data-flow-tab]');
            if (!tab) return;
            const key = tab.getAttribute('data-flow-tab') || 'file';
            if (tab.tagName !== 'LABEL') event.preventDefault();
            if (tab.classList.contains('is-disabled') || tab.getAttribute('aria-disabled') === 'true') return;
            setActive(key, { force: true, source: 'final-capture' });
            if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
        }, true);
        document.addEventListener('click', event => {
            const card = event.target && event.target.closest && event.target.closest('.recommendation-card');
            if (!card) return;
            global.setTimeout(() => setActive('preview', { force: true }), 80);
        }, true);
    }
    function relabelDock() {
        const labels = {
            file: ['📂', '파일 열기'],
            recommend: ['✨', '추천'],
            candidates: ['🎯', '후보'],
            preview: ['📱', '미리보기'],
            waveform: ['〰️', '파형'],
            cut: ['✂️', '컷'],
            edit: ['🎛️', '편집'],
            export: ['📦', '저장']
        };
        tabs().forEach(node => {
            const key = node.getAttribute('data-flow-tab');
            const spec = labels[key];
            if (!spec) return;
            const icon = node.querySelector('span');
            const text = node.querySelector('b');
            if (icon) icon.textContent = spec[0];
            if (text) text.textContent = spec[1];
        });
    }
    function installHeroSocial() {
        const hero = document.querySelector('.cinematic-brand-panel .hero-mainline');
        if (!hero || document.getElementById('socialShutterStrip')) return;
        const strip = document.createElement('div');
        strip.id = 'socialShutterStrip';
        strip.className = 'social-shutter-strip';
        strip.setAttribute('aria-label', '쇼츠 플랫폼 무드');
        strip.innerHTML = [
            '<div class="shutter-tile youtube"><span class="shutter-icon"><i>▶</i>YouTube</span><small>찰칵 · 하이라이트 컷</small></div>',
            '<div class="shutter-tile instagram"><span class="shutter-icon"><i>◎</i>Reels</span><small>빛나는 세로 프레임</small></div>',
            '<div class="shutter-tile tiktok"><span class="shutter-icon"><i>♪</i>TikTok</span><small>빠른 템포 쇼츠</small></div>'
        ].join('');
        hero.appendChild(strip);
    }
    function simplifyHomeCopy() {
        const importGroup = document.querySelector('.command-group-primary .command-group-head small');
        const analyzeGroup = document.querySelector('.command-group-status[aria-label="자동 분석 안내"] .command-group-head small');
        const editGroup = document.querySelector('.command-group-status[aria-label="편집 흐름 안내"] .command-group-head small');
        if (importGroup) importGroup.textContent = '하단 Dock의 파일 열기로 원본을 선택합니다.';
        if (analyzeGroup) analyzeGroup.textContent = '파일을 열면 자동으로 분석하고 추천 단계로 연결됩니다.';
        if (editGroup) editGroup.textContent = '추천 → 후보 선택 → 미리보기 → 저장 순서로 진행합니다.';
    }
    function sync() {
        patchGlobals();
        relabelDock();
        installHeroSocial();
        simplifyHomeCopy();
        setVisible(activeTab());
    }
    function install() {
        if (document.body) {
            document.body.dataset.build = '1.1.5';
            document.body.dataset.flowDirector = 'final';
        }
        installTabClicks();
        sync();
        global.addEventListener('resize', () => setVisible(activeTab()), { passive: true });
        document.addEventListener('ai-shorts-flow-sync', () => sync());
        const observer = new MutationObserver(() => setVisible(activeTab()));
        observer.observe(document.body, { attributes: true, attributeFilter: ['data-active-flow-tab'] });
    }
    global.AIShortsFlowDirectorFinal = Object.freeze({ reveal, setActive, setVisible, panelFor, sync });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
    else install();
})(window);
