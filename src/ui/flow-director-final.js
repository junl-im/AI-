// AI Shorts Studio v1.3.1 - workflow navigation, landing beacon, and stage ownership director
// Owns menu state, progression reveal, panel spotlight and scroll positioning.
'use strict';
(function bootFlowDirectorFinal(global) {
    const ORDER = ['file', 'recommend', 'candidates', 'preview', 'waveform', 'cut', 'edit', 'export'];
    const META = {
        file: ['upload', '파일 열기'], recommend: ['spark', '추천 생성'], candidates: ['candidates', '후보 선택'],
        preview: ['preview', '미리보기'], waveform: ['waveform', '파형'], cut: ['cut', '컷 편집'],
        edit: ['edit', '편집'], export: ['export', '저장']
    };
    let raf = 0;
    let revealToken = 0;
    let lastTab = '';
    let lastY = -1;
    let lastAt = 0;
    let clearFocusTimer = 0;
    let lastSpotlightKey = '';
    let liveRegion = null;

    function byId(id) { return document.getElementById(id); }
    function activeTab() {
        const body = document.body;
        return body && body.dataset && body.dataset.activeFlowTab ? body.dataset.activeFlowTab : 'file';
    }
    function isDesktopPrime() {
        return Boolean(document.body && document.body.dataset.desktopLayout === 'prime' && global.matchMedia && global.matchMedia('(min-width: 1180px)').matches);
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
    function focusMenuTab(key) {
        const nodes = tabs().filter(node => node.getAttribute('data-flow-tab') === key);
        nodes.forEach(node => {
            if (!node.scrollIntoView) return;
            try { node.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'auto' }); } catch (_) { /* ignore */ }
        });
    }
    function ensureLiveRegion() {
        if (liveRegion && liveRegion.isConnected) return liveRegion;
        liveRegion = document.getElementById('workflowStageLive');
        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'workflowStageLive';
            liveRegion.className = 'sr-only';
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            document.body.appendChild(liveRegion);
        }
        return liveRegion;
    }
    function ensureStageDecor(panel, key) {
        if (!panel) return;
        let rail = panel.querySelector(':scope > .stage-neon-rail');
        if (!rail) {
            rail = document.createElement('span');
            rail.className = 'stage-neon-rail';
            rail.setAttribute('aria-hidden', 'true');
            panel.appendChild(rail);
        }
        let chip = panel.querySelector(':scope > .stage-progress-chip');
        if (!chip) {
            chip = document.createElement('span');
            chip.className = 'stage-progress-chip';
            chip.setAttribute('aria-hidden', 'true');
            panel.appendChild(chip);
        }
        const spec = META[key] || ['spark', '현재 작업'];
        const signature = key + ':' + spec[0] + ':' + spec[1];
        if (chip.dataset.signature !== signature) {
            chip.dataset.signature = signature;
            chip.innerHTML = '<span class="studio-icon" data-icon="' + spec[0] + '"></span><b>' + spec[1] + ' 진행 중</b>';
        }
        panel.dataset.stageKey = key;
    }
    function spotlight(panel, key, options) {
        const opts = options || {};
        panels().forEach(node => {
            if (node === panel) return;
            node.classList.remove('is-navigation-target', 'is-navigation-pulse', 'is-stage-current', 'is-stage-landing');
            delete node.dataset.stageKey;
        });
        if (!panel) return;
        const stageChanged = key !== lastSpotlightKey;
        ensureStageDecor(panel, key);
        panel.classList.add('is-navigation-target', 'is-stage-current');
        panel.dataset.navigationLabel = (META[key] && META[key][1]) || '현재 작업';
        if (document.body) document.body.dataset.navigationFocus = key;
        if (stageChanged || opts.forcePulse) {
            clearTimeout(clearFocusTimer);
            panel.classList.remove('is-navigation-pulse', 'is-stage-landing');
            void panel.offsetWidth;
            panel.classList.add('is-navigation-pulse', 'is-stage-landing');
            clearFocusTimer = global.setTimeout(() => panel.classList.remove('is-navigation-pulse', 'is-stage-landing'), 940);
            const region = ensureLiveRegion();
            if (region) region.textContent = panel.dataset.navigationLabel + ' 단계로 이동했습니다.';
        }
        lastSpotlightKey = key;
    }
    function setVisible(tab) {
        const key = ORDER.includes(tab) ? tab : 'file';
        const prime = isDesktopPrime();
        panels().forEach(panel => {
            const match = panelTabs(panel).includes(key);
            if (prime && panel.hidden) panel.hidden = false;
            if (panel.classList.contains('is-flow-active') !== match) panel.classList.toggle('is-flow-active', match);
            const ariaHidden = prime || match ? 'false' : 'true';
            if (panel.getAttribute('aria-hidden') !== ariaHidden) panel.setAttribute('aria-hidden', ariaHidden);
            if (match && panel.getAttribute('tabindex') !== '-1') panel.setAttribute('tabindex', '-1');
        });
        tabs().forEach(tabNode => {
            const match = tabNode.getAttribute('data-flow-tab') === key;
            if (tabNode.classList.contains('is-active') !== match) tabNode.classList.toggle('is-active', match);
            const selected = match ? 'true' : 'false';
            if (tabNode.getAttribute('aria-selected') !== selected) tabNode.setAttribute('aria-selected', selected);
            if (match) {
                if (tabNode.getAttribute('aria-current') !== 'step') tabNode.setAttribute('aria-current', 'step');
            } else if (tabNode.hasAttribute('aria-current')) tabNode.removeAttribute('aria-current');
        });
        if (document.body) {
            if (document.body.dataset.activeFlowTab !== key) document.body.dataset.activeFlowTab = key;
            if (document.body.dataset.flowDirector !== 'final') document.body.dataset.flowDirector = 'final';
        }
    }
    function targetTop(panel) {
        const rect = panel.getBoundingClientRect();
        const topGap = global.innerWidth >= 1180 ? 18 : 10;
        return Math.max(0, Math.round(global.scrollY + rect.top - topGap));
    }
    function isPanelFront(panel) {
        if (!panel || !panel.getBoundingClientRect) return false;
        const rect = panel.getBoundingClientRect();
        const topLimit = global.innerWidth >= 1180 ? 18 : 10;
        const bottomLimit = Math.max(240, global.innerHeight - dockHeight() - 28);
        return rect.top >= topLimit && rect.top < 96 && rect.bottom > Math.min(220, bottomLimit);
    }
    function reveal(tab, options) {
        const key = ORDER.includes(tab) ? tab : activeTab();
        const opts = options || {};
        setVisible(key);
        const panel = panelFor(key);
        spotlight(panel, key, opts);
        focusMenuTab(key);
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
                global.scrollTo({ top, behavior: opts.behavior || 'auto' });
                lastTab = key;
                lastY = top;
                lastAt = now;
            }
            panel.classList.add('is-director-revealed');
            global.setTimeout(() => panel.classList.remove('is-director-revealed'), 320);
            try { panel.focus({ preventScroll: true }); } catch (_) { /* ignore */ }
        });
        return true;
    }
    function setActive(tab, options) {
        const key = ORDER.includes(tab) ? tab : 'file';
        reveal(key, Object.assign({ force: true }, options || {}));
        if (global.AIShortsFeedbackUX && global.AIShortsFeedbackUX.vibrate) global.AIShortsFeedbackUX.vibrate('button');
    }
    function patchGlobals() {
        const api = { reveal, panelFor, isComfortablyVisible: isPanelFront, setVisible, setActiveFlowTab: setActive };
        global.AIShortsMotionStability = Object.freeze(api);
        if (global.AIShortsWorkspaceComfort) global.AIShortsWorkspaceComfort = Object.freeze(Object.assign({}, global.AIShortsWorkspaceComfort, { reveal }));
        if (global.AIShortsHyperFlowTabs) {
            global.AIShortsHyperFlowTabs.setActiveFlowTab = setActive;
            global.AIShortsHyperFlowTabs.revealActivePanel = reveal;
            if (global.AIShortsHyperFlowTabs.syncTabs) global.AIShortsHyperFlowTabs.syncTabs();
        }
    }
    function setActiveIfNeeded(tab, options) {
        const key = ORDER.includes(tab) ? tab : 'file';
        if (activeTab() === key) {
            setVisible(key);
            return false;
        }
        setActive(key, options);
        return true;
    }
    function installTabClicks() {
        document.addEventListener('click', event => {
            const tab = event.target && event.target.closest && event.target.closest('[data-flow-tab]');
            if (!tab) return;
            const key = tab.getAttribute('data-flow-tab') || 'file';
            if (tab.tagName !== 'LABEL') event.preventDefault();
            if (tab.classList.contains('is-disabled') || tab.getAttribute('aria-disabled') === 'true') return;
            setActive(key, { force: true, source: 'menu-capture' });
            if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
        }, true);
        document.addEventListener('click', event => {
            const card = event.target && event.target.closest && event.target.closest('.recommendation-card');
            if (card) global.setTimeout(() => setActiveIfNeeded('preview', { force: true, source: 'candidate-selected' }), 80);
        }, true);
    }
    function installProgressNavigation() {
        const fileInput = byId('fileInput');
        const analyze = byId('analyzeBtn');
        if (fileInput) fileInput.addEventListener('change', () => {
            if (!fileInput.files || !fileInput.files.length) return;
            global.setTimeout(() => setActiveIfNeeded('recommend', { force: true, source: 'file-analysis-start' }), 120);
        });
        if (analyze) analyze.addEventListener('click', () => setActiveIfNeeded('recommend', { force: true, source: 'recommend-start' }));
        ['exportBtn', 'exportAllBtn', 'flowExportBtn', 'flowExportAllBtn'].forEach(id => {
            const node = byId(id);
            if (node) node.addEventListener('click', () => global.setTimeout(() => setActiveIfNeeded('export', { force: true, source: 'render-start' }), 80));
        });
        document.addEventListener('ai-shorts-navigation-request', event => {
            const detail = event && event.detail || {};
            if (!ORDER.includes(detail.tab)) return;
            setActive(detail.tab, Object.assign({ force: true, source: 'app-navigation-request' }, detail.options || {}));
        });
    }
    function relabelMenu() {
        tabs().forEach(node => {
            const spec = META[node.getAttribute('data-flow-tab')];
            if (!spec) return;
            const icon = node.querySelector('span');
            const text = node.querySelector('b');
            if (icon && icon.textContent !== spec[0]) icon.textContent = spec[0];
            if (icon && icon.getAttribute('aria-hidden') !== 'true') icon.setAttribute('aria-hidden', 'true');
            if (text && text.textContent !== spec[1].replace(' 생성','').replace(' 선택','').replace(' 편집','')) text.textContent = spec[1].replace(' 생성','').replace(' 선택','').replace(' 편집','');
        });
    }
    function installHeroSocial() {
        const hero = document.querySelector('.cinematic-brand-panel .hero-mainline');
        if (!hero || document.getElementById('socialShutterStrip')) return;
        const strip = document.createElement('div');
        strip.id = 'socialShutterStrip';
        strip.className = 'social-shutter-strip';
        strip.setAttribute('aria-label', '쇼츠 플랫폼 무드');
        strip.innerHTML = '<div class="shutter-tile youtube"><span class="shutter-icon"><i class="studio-icon" data-icon="preview"></i>YouTube</span><small>하이라이트 컷</small></div><div class="shutter-tile instagram"><span class="shutter-icon"><i class="studio-icon" data-icon="candidates"></i>Reels</span><small>세로 프레임</small></div><div class="shutter-tile tiktok"><span class="shutter-icon"><i class="studio-icon" data-icon="waveform"></i>TikTok</span><small>빠른 템포</small></div>';
        hero.appendChild(strip);
    }
    function simplifyHomeCopy() {
        const importGroup = document.querySelector('.command-group-primary .command-group-head small');
        const analyzeGroup = document.querySelector('.command-group-status[aria-label="자동 분석 안내"] .command-group-head small');
        const editGroup = document.querySelector('.command-group-status[aria-label="편집 흐름 안내"] .command-group-head small');
        if (importGroup && importGroup.textContent !== '하단 메뉴바의 파일 열기로 원본을 선택합니다.') importGroup.textContent = '하단 메뉴바의 파일 열기로 원본을 선택합니다.';
        if (analyzeGroup && analyzeGroup.textContent !== '파일을 열면 분석 화면으로 이동하고 완료 후 추천 단계로 연결됩니다.') analyzeGroup.textContent = '파일을 열면 분석 화면으로 이동하고 완료 후 추천 단계로 연결됩니다.';
        if (editGroup && editGroup.textContent !== '추천 → 후보 → 미리보기 → 저장 순서로 화면이 따라갑니다.') editGroup.textContent = '추천 → 후보 → 미리보기 → 저장 순서로 화면이 따라갑니다.';
    }
    function sync() {
        patchGlobals();
        relabelMenu();
        installHeroSocial();
        simplifyHomeCopy();
        setVisible(activeTab());
        spotlight(panelFor(activeTab()), activeTab(), { forcePulse: false });
    }
    function install() {
        if (document.body) {
            if (document.body.dataset.build !== '1.5.3') document.body.dataset.build = '1.5.3';
            if (document.body.dataset.flowDirector !== 'final') document.body.dataset.flowDirector = 'final';
            document.body.dataset.iconLanguage = 'studio-vectors';
        }
        installTabClicks();
        installProgressNavigation();
        sync();
        global.addEventListener('resize', () => setVisible(activeTab()), { passive: true });
        document.addEventListener('ai-shorts-flow-sync', sync);
        const observer = new MutationObserver(() => setVisible(activeTab()));
        observer.observe(document.body, { attributes: true, attributeFilter: ['data-active-flow-tab'] });
    }
    global.AIShortsFlowDirectorFinal = Object.freeze({ reveal, setActive, setVisible, panelFor, sync });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
    else install();
})(window);
