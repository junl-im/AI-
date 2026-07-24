// AI Shorts Studio v1.6.4 - stage-aware workspace focus, progressive disclosure, and dock clearance
'use strict';
(function bootWorkflowFocusLayout(global) {
    const STORAGE_KEY = 'ai-shorts-workflow-focus-v1';
    const storageManager = global.AIShortsStorageManager || {};
    const TAB_STAGE = Object.freeze({
        file: 'import',
        recommend: 'analyze',
        candidates: 'edit',
        preview: 'edit',
        waveform: 'edit',
        cut: 'edit',
        edit: 'edit',
        caption: 'edit',
        quality: 'edit',
        export: 'export',
        project: 'export'
    });
    const PHASE_LABEL = Object.freeze({
        import: '불러오기 단계',
        analyze: '자동 분석 단계',
        edit: '편집 단계',
        export: '내보내기 단계'
    });
    const TAB_LABEL = Object.freeze({
        file: '원본 불러오기',
        recommend: '자동 분석',
        candidates: '후보 선택',
        preview: '미리보기',
        waveform: '파형 확인',
        cut: '컷 편집',
        edit: '자막·품질 편집',
        caption: '자막 편집',
        quality: '화질 편집',
        export: '내보내기',
        project: '프로젝트 관리'
    });
    const SUPPORT_BY_TAB = Object.freeze({
        file: ['recommend'],
        recommend: ['candidates'],
        candidates: ['preview'],
        preview: ['candidates', 'edit'],
        waveform: ['cut', 'preview'],
        cut: ['waveform', 'edit'],
        edit: ['preview', 'waveform', 'cut'],
        caption: ['preview', 'waveform', 'cut'],
        quality: ['preview', 'waveform', 'cut'],
        export: ['preview', 'edit'],
        project: ['export', 'preview']
    });

    let toggle = null;
    let badge = null;
    let layoutStatus = null;
    let enabled = true;
    let scheduled = false;
    let dockObserver = null;
    let bodyObserver = null;
    let mediaQuery = null;
    let appliedStyleSignature = '';
    const ownedStyles = new WeakMap();
    const ownedNodes = new Set();


    function setOwnedStyle(node, property, value, priority) {
        if (!node || !node.style) return;
        let saved = ownedStyles.get(node);
        if (!saved) {
            saved = new Map();
            ownedStyles.set(node, saved);
            ownedNodes.add(node);
        }
        if (!saved.has(property)) {
            saved.set(property, {
                value: node.style.getPropertyValue(property),
                priority: node.style.getPropertyPriority(property)
            });
        }
        node.style.setProperty(property, value, priority || 'important');
    }

    function restoreOwnedStyles() {
        ownedNodes.forEach(node => {
            const saved = ownedStyles.get(node);
            if (!saved || !node || !node.style) return;
            saved.forEach((entry, property) => {
                if (entry.value) node.style.setProperty(property, entry.value, entry.priority || '');
                else node.style.removeProperty(property);
            });
            ownedStyles.delete(node);
        });
        ownedNodes.clear();
    }

    function applyPanelGeometry(panel, priority) {
        if (priority === 'later') {
            setOwnedStyle(panel, 'display', 'none');
            return;
        }

        setOwnedStyle(panel, 'height', 'auto');
        setOwnedStyle(panel, 'max-height', 'none');
        setOwnedStyle(panel, 'overflow', 'visible');
        setOwnedStyle(panel, 'align-self', 'stretch');

        if (priority === 'support') {
            setOwnedStyle(panel, 'align-self', 'start');
            setOwnedStyle(panel, 'min-height', '86px');
            setOwnedStyle(panel, 'height', '86px');
            setOwnedStyle(panel, 'max-height', '86px');
            setOwnedStyle(panel, 'padding', '14px 138px 14px 16px');
            setOwnedStyle(panel, 'overflow', 'hidden');
            Array.from(panel.children).forEach(child => {
                if (child.matches('.panel-head, .workflow-panel-open, .stage-neon-rail, .stage-progress-chip')) return;
                setOwnedStyle(child, 'display', 'none');
            });
            const head = panel.querySelector(':scope > .panel-head');
            if (head) setOwnedStyle(head, 'margin', '0');
            return;
        }

        let minimum = '330px';
        if (panel.classList.contains('preview-card')) minimum = 'min(690px, 72vh)';
        else if (panel.classList.contains('waveform-card')) minimum = '390px';
        else if (panel.classList.contains('edit-tools-card') || panel.classList.contains('export-card')) minimum = '520px';
        setOwnedStyle(panel, 'min-height', minimum);
    }

    function applyFocusVisibility(effective, tab) {
        if (!effective) return;
        document.querySelectorAll('.workspace-column-divider').forEach(node => setOwnedStyle(node, 'display', 'none'));
        const allowAuxiliary = tab === 'export' || tab === 'project';
        if (!allowAuxiliary) {
            const utility = document.querySelector('.project-copy-hub');
            const ai = document.getElementById('localAIStudio');
            if (utility) setOwnedStyle(utility, 'display', 'none');
            if (ai) setOwnedStyle(ai, 'display', 'none');
        }
    }

    function safeGet(key, fallback) {
        try {
            if (storageManager.safeGet) return storageManager.safeGet(key, fallback);
            return global.localStorage ? global.localStorage.getItem(key) || fallback : fallback;
        } catch (_) {
            return fallback;
        }
    }

    function safeSet(key, value) {
        try {
            if (storageManager.safeSet) storageManager.safeSet(key, value, { maxCleanupRemovals: 1 });
            else if (global.localStorage) global.localStorage.setItem(key, value);
        } catch (_) { /* preference persistence is optional */ }
    }

    function readEnabled() {
        const value = safeGet(STORAGE_KEY, 'on');
        return value !== 'off';
    }

    function activeTab() {
        return document.body && document.body.dataset.activeFlowTab || 'file';
    }

    function workflowPhase() {
        return document.body && document.body.dataset.workflowPhase || 'import';
    }

    function workspaceMode() {
        return document.body && document.body.dataset.workspaceView || 'balanced';
    }

    function isDesktop() {
        return Boolean(mediaQuery ? mediaQuery.matches : global.matchMedia && global.matchMedia('(min-width: 1180px)').matches);
    }

    function panelTokens(panel) {
        return String(panel && panel.getAttribute('data-flow-panel') || '').split(/\s+/).filter(Boolean);
    }

    function panelPriority(panel, tab) {
        const tokens = panelTokens(panel);
        if (tokens.includes(tab)) return 'primary';
        const support = SUPPORT_BY_TAB[tab] || [];
        if (tokens.some(token => support.includes(token))) return 'support';
        return 'later';
    }

    function ensurePanelOpenButton(panel) {
        let button = panel.querySelector(':scope > .workflow-panel-open');
        const tokens = panelTokens(panel);
        const target = tokens[0] || 'file';
        if (!button) {
            button = document.createElement('button');
            button.type = 'button';
            button.className = 'workflow-panel-open';
            button.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();
                const next = button.dataset.flowTarget || 'file';
                const director = global.AIShortsFlowDirectorFinal;
                if (director && typeof director.setActive === 'function') director.setActive(next, { force: true, source: 'workflow-focus-support' });
                else document.dispatchEvent(new CustomEvent('ai-shorts-navigation-request', { detail: { tab: next, options: { force: true, source: 'workflow-focus-support' } } }));
            });
            panel.appendChild(button);
        }
        button.dataset.flowTarget = target;
        button.setAttribute('aria-label', `${TAB_LABEL[target] || '다음 작업'} 단계 열기`);
        button.textContent = '이 단계 열기';
        return button;
    }

    function updateLayoutStatus(tab, effective) {
        if (!layoutStatus) return;
        if (effective) {
            layoutStatus.textContent = `단계 집중 · ${TAB_LABEL[tab] || '현재 작업'}`;
            return;
        }
        const workspace = global.AIShortsWorkspaceLayout;
        const mode = workspaceMode();
        if (mode === 'preview') layoutStatus.textContent = '미리보기와 후보·편집에 집중하는 배치';
        else if (mode === 'waveform') layoutStatus.textContent = '파형과 컷 편집을 넓게 보는 배치';
        else if (workspace && typeof workspace.getWeights === 'function') {
            const weights = workspace.getWeights();
            const total = Number(weights.left || 0) + Number(weights.center || 0) + Number(weights.right || 0);
            const percent = key => total > 0 ? Math.round((Number(weights[key] || 0) / total) * 100) : 0;
            layoutStatus.textContent = `3열 ${percent('left')} · ${percent('center')} · ${percent('right')}%`;
        } else layoutStatus.textContent = '3열 균형 배치';
    }

    function setAuxiliaryAvailability(effective, tab) {
        const utility = document.querySelector('.project-copy-hub');
        const ai = document.getElementById('localAIStudio');
        const allow = !effective || tab === 'export' || tab === 'project';
        [utility, ai].forEach(node => {
            if (!node) return;
            node.toggleAttribute('inert', !allow);
            node.setAttribute('aria-hidden', allow ? 'false' : 'true');
        });
    }

    function updateDockClearance() {
        const dock = document.getElementById('bottomDock');
        const root = document.documentElement;
        if (!root) return;
        const rect = dock && dock.getBoundingClientRect ? dock.getBoundingClientRect() : null;
        const height = rect && rect.height > 0 ? Math.ceil(rect.height) : (global.innerWidth < 721 ? 150 : 86);
        root.style.setProperty('--hyperflow-dock-height', `${height}px`);
        root.style.setProperty('--workflow-dock-clearance', `${height + 22}px`);
    }

    function updateToggle(effective) {
        if (!toggle) return;
        toggle.setAttribute('aria-pressed', enabled ? 'true' : 'false');
        toggle.dataset.state = enabled ? 'on' : 'off';
        toggle.classList.toggle('is-paused', enabled && !effective);
        const label = toggle.querySelector('[data-workflow-focus-label]');
        if (label) label.textContent = enabled ? '단계 집중' : '전체 보기';
        if (!enabled) toggle.title = '현재 모든 작업 패널을 표시합니다. 누르면 단계 집중을 켭니다.';
        else if (!effective) toggle.title = '미리보기·파형 전용 보기에서는 단계 집중이 잠시 중지됩니다.';
        else toggle.title = '현재 작업과 바로 이어지는 패널만 표시합니다.';
    }

    function updateBadge(tab, effective, hiddenCount) {
        if (!badge) return;
        const phase = workflowPhase();
        const phaseText = PHASE_LABEL[phase] || PHASE_LABEL.import;
        const tabText = TAB_LABEL[tab] || '현재 작업';
        if (!enabled) badge.textContent = `${phaseText} · 전체 패널 표시`;
        else if (!effective) badge.textContent = `${phaseText} · 전용 보기 사용 중`;
        else badge.textContent = `${phaseText} · ${tabText} 집중 · ${hiddenCount}개 정리`;
    }

    function apply() {
        scheduled = false;
        if (!document.body) return;
        const tab = activeTab();
        const viewStage = TAB_STAGE[tab] || 'edit';
        const effective = enabled && isDesktop() && workspaceMode() === 'balanced';
        const panels = Array.from(document.querySelectorAll('[data-flow-panel]'));
        const styleSignature = `${effective ? 'on' : 'off'}:${tab}:${panels.length}:${workspaceMode()}`;
        const styleChanged = styleSignature !== appliedStyleSignature;
        if (styleChanged) {
            restoreOwnedStyles();
            appliedStyleSignature = styleSignature;
        }
        let hiddenCount = 0;

        document.body.dataset.workflowFocus = enabled ? 'on' : 'off';
        document.body.dataset.workflowFocusEffective = effective ? 'on' : 'off';
        document.body.dataset.workflowViewStage = viewStage;

        panels.forEach(panel => {
            ensurePanelOpenButton(panel);
            const priority = panelPriority(panel, tab);
            panel.dataset.workflowPriority = priority;
            panel.classList.toggle('is-workflow-primary', priority === 'primary');
            panel.classList.toggle('is-workflow-support', priority === 'support');
            panel.classList.toggle('is-workflow-later', priority === 'later');
            if (effective && styleChanged) applyPanelGeometry(panel, priority);
            if (effective && priority === 'later') hiddenCount += 1;
        });

        if (styleChanged) applyFocusVisibility(effective, tab);
        setAuxiliaryAvailability(effective, tab);
        updateToggle(effective);
        updateBadge(tab, effective, hiddenCount);
        updateLayoutStatus(tab, effective);
        updateDockClearance();
        document.dispatchEvent(new CustomEvent('ai-shorts-workflow-focus', {
            detail: { enabled, effective, tab, phase: workflowPhase(), viewStage, hiddenCount }
        }));
    }

    function schedule() {
        if (scheduled) return;
        scheduled = true;
        if (typeof global.queueMicrotask === 'function') global.queueMicrotask(apply);
        else Promise.resolve().then(apply).catch(() => { scheduled = false; });
    }

    function setEnabled(next, options) {
        const opts = options || {};
        enabled = Boolean(next);
        if (opts.persist !== false) safeSet(STORAGE_KEY, enabled ? 'on' : 'off');
        schedule();
    }

    function installToggle() {
        toggle = document.getElementById('workflowFocusToggle');
        badge = document.getElementById('workflowFocusBadge');
        layoutStatus = document.getElementById('workspaceLayoutStatus');
        if (!toggle) return;
        toggle.addEventListener('click', () => setEnabled(!enabled));
    }

    function installDockObserver() {
        const dock = document.getElementById('bottomDock');
        if (!dock) return;
        if ('ResizeObserver' in global) {
            dockObserver = new ResizeObserver(updateDockClearance);
            dockObserver.observe(dock);
        }
    }

    function installBodyObserver() {
        if (!document.body || !('MutationObserver' in global)) return;
        bodyObserver = new MutationObserver(records => {
            if (records.some(record => ['data-active-flow-tab', 'data-workspace-view', 'data-workflow-phase'].includes(record.attributeName))) schedule();
        });
        bodyObserver.observe(document.body, {
            attributes: true,
            attributeFilter: ['data-active-flow-tab', 'data-workspace-view', 'data-workflow-phase']
        });
    }

    function init() {
        enabled = readEnabled();
        mediaQuery = global.matchMedia ? global.matchMedia('(min-width: 1180px)') : null;
        installToggle();
        installDockObserver();
        installBodyObserver();
        if (mediaQuery) {
            if (mediaQuery.addEventListener) mediaQuery.addEventListener('change', schedule);
            else if (mediaQuery.addListener) mediaQuery.addListener(schedule);
        }
        ['resize', 'orientationchange', 'pageshow'].forEach(type => global.addEventListener(type, schedule, { passive: true }));
        ['ai-shorts-flow-sync', 'ai-shorts-experience-sync', 'ai-shorts-workspace-mode', 'ai-shorts-workflow-phase'].forEach(type => document.addEventListener(type, schedule));
        document.addEventListener('ai-shorts-hydration-ready', () => {
            appliedStyleSignature = '';
            schedule();
        });
        schedule();
    }

    global.AIShortsWorkflowFocusLayout = Object.freeze({
        sync: schedule,
        setEnabled,
        isEnabled: () => enabled,
        getState: () => ({
            enabled,
            effective: document.body && document.body.dataset.workflowFocusEffective === 'on',
            tab: activeTab(),
            phase: workflowPhase(),
            viewStage: document.body && document.body.dataset.workflowViewStage || 'import'
        })
    });

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
})(window);
