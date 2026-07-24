// AI Shorts Studio v1.6.4 - adaptive mobile workflow menu and next-action guide
'use strict';

(function bootMobileMenuGuide(global) {
    const ORDER = ['file', 'recommend', 'candidates', 'preview', 'waveform', 'cut', 'edit', 'export'];
    const LABELS = {
        file: '불러오기',
        recommend: '추천',
        candidates: '후보',
        preview: '미리보기',
        waveform: '파형',
        cut: '컷',
        edit: '편집',
        export: '저장'
    };
    const MOBILE_QUERY = '(max-width: 720px)';
    let expanded = false;
    let raf = 0;
    let lastActive = '';

    function byId(id) { return document.getElementById(id); }
    function tabs() { return Array.from(document.querySelectorAll('#bottomDock [data-flow-tab]')); }
    function isMobile() { return Boolean(global.matchMedia && global.matchMedia(MOBILE_QUERY).matches); }
    function activeTab() {
        const key = document.body && document.body.dataset.activeFlowTab;
        return ORDER.includes(key) ? key : 'file';
    }
    function nextTab(key) {
        const index = ORDER.indexOf(key);
        return index >= 0 && index < ORDER.length - 1 ? ORDER[index + 1] : '';
    }
    function addUnique(list, key) {
        if (ORDER.includes(key) && !list.includes(key)) list.push(key);
    }
    function priorityTabs(current) {
        const list = [];
        const index = Math.max(0, ORDER.indexOf(current));
        addUnique(list, 'file');
        addUnique(list, current);
        addUnique(list, nextTab(current));

        if (index >= ORDER.indexOf('preview')) addUnique(list, 'export');
        else if (current === 'recommend') addUnique(list, 'candidates');
        else addUnique(list, 'preview');

        for (let distance = 1; list.length < 4 && distance < ORDER.length; distance += 1) {
            addUnique(list, ORDER[index + distance]);
            addUnique(list, ORDER[index - distance]);
        }
        ORDER.forEach(key => { if (list.length < 4) addUnique(list, key); });
        return list.slice(0, 4);
    }
    function guideText(current) {
        const state = global.AIShortsAppState && global.AIShortsAppState.state || {};
        if (state.isAnalyzing) return '현재 추천 분석 중 · 완료 후 후보로 이동';
        const next = nextTab(current);
        if (!next) return `현재 ${LABELS[current]} · 제작 마무리`;
        return `현재 ${LABELS[current]} · 다음 ${LABELS[next]}`;
    }
    function setExpanded(next, source) {
        expanded = Boolean(next && isMobile());
        const body = document.body;
        const toggle = byId('mobileDockMenuToggle');
        if (body) {
            body.dataset.mobileMenuMode = expanded ? 'expanded' : 'compact';
            body.dataset.mobileMenuSource = source || 'auto';
        }
        if (toggle) {
            toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
            const label = toggle.querySelector('b');
            if (label) label.textContent = expanded ? '간단 메뉴' : '전체 메뉴';
            toggle.setAttribute('aria-label', expanded ? '모바일 메뉴 간단히 접기' : '모바일 전체 메뉴 펼치기');
        }
    }
    function syncNow(options) {
        raf = 0;
        const opts = options || {};
        const current = activeTab();
        const mobile = isMobile();
        const priority = priorityTabs(current);
        const activeChanged = current !== lastActive;
        lastActive = current;

        if (!mobile) {
            setExpanded(false, 'desktop');
            tabs().forEach(node => {
                delete node.dataset.mobilePriority;
                node.removeAttribute('aria-hidden');
            });
            return;
        }
        if (activeChanged && !opts.keepExpanded) setExpanded(false, 'stage-change');
        else if (!document.body.dataset.mobileMenuMode) setExpanded(false, 'initial');

        tabs().forEach(node => {
            const key = node.getAttribute('data-flow-tab') || '';
            const important = priority.includes(key);
            node.dataset.mobilePriority = important ? 'true' : 'false';
            if (!expanded && !important) node.setAttribute('aria-hidden', 'true');
            else node.removeAttribute('aria-hidden');
        });
        const guide = byId('mobileDockGuideText');
        if (guide) guide.textContent = guideText(current);
        const count = byId('mobileDockVisibleCount');
        if (count) count.textContent = expanded ? '8개 메뉴' : '핵심 4개';
    }
    function schedule(options) {
        if (raf) return;
        raf = global.requestAnimationFrame ? global.requestAnimationFrame(() => syncNow(options)) : 0;
        if (!global.requestAnimationFrame) syncNow(options);
    }
    function install() {
        const toggle = byId('mobileDockMenuToggle');
        if (!toggle) return;
        toggle.addEventListener('click', () => {
            setExpanded(!expanded, 'user');
            syncNow({ keepExpanded: true });
        });
        document.addEventListener('ai-shorts-flow-sync', () => schedule());
        global.addEventListener('resize', () => schedule({ keepExpanded: true }), { passive: true });
        global.addEventListener('orientationchange', () => schedule(), { passive: true });
        const observer = new MutationObserver(() => schedule());
        observer.observe(document.body, { attributes: true, attributeFilter: ['data-active-flow-tab'] });
        document.body.dataset.mobileMenuController = 'ready';
        syncNow();
    }

    global.AIShortsMobileMenuGuide = Object.freeze({
        sync: syncNow,
        setExpanded,
        getPriorityTabs: () => priorityTabs(activeTab()),
        isExpanded: () => expanded
    });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
    else install();
})(window);
