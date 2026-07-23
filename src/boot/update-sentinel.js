// AI Shorts Studio v1.5.24 - visible update sentinel and cache refresh helper
'use strict';

(function installUpdateSentinel(global) {
    const config = global.AIShortsRuntimeConfig || {};
    const versionSync = global.AIShortsVersionSync || {};
    const VERSION = versionSync.version || config.APP_VERSION || 'v1.5.24';
    const BUILD_KEY = versionSync.buildKey || config.BUILD_KEY || '1.3.0-update-sentinel';
    const STORAGE_KEY = 'ai-shorts-studio-update-sentinel-last-seen';
    let panel;
    let live;
    let registrationRef;

    function $(selector, root) {
        return (root || document).querySelector(selector);
    }

    function text(value, fallback) {
        return String(value || fallback || '').trim();
    }

    async function copyText(value) {
        const shared = global.AIShortsCoreUtils;
        if (shared && typeof shared.copyText === 'function') return shared.copyText(value);
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            try {
                await navigator.clipboard.writeText(String(value || ''));
                return true;
            } catch (error) {
                // Continue with the local fallback for permission and focus failures.
            }
        }
        if (!document.body || typeof document.execCommand !== 'function') return false;
        const textarea = document.createElement('textarea');
        textarea.value = String(value || '');
        textarea.setAttribute('readonly', 'readonly');
        textarea.setAttribute('aria-hidden', 'true');
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        let copied = false;
        try { copied = Boolean(document.execCommand('copy')); } catch (error) { copied = false; }
        finally { textarea.remove(); }
        return copied;
    }

    function collectEngineProfile() {
        if (global.AIShortsEngineBoostProfile && global.AIShortsEngineBoostProfile.collect) {
            return global.AIShortsEngineBoostProfile.collect();
        }
        return {
            label: 'MAX-STABLE',
            worker: typeof Worker !== 'undefined',
            offscreenCanvas: typeof OffscreenCanvas !== 'undefined',
            cores: navigator.hardwareConcurrency || 2,
            memory: navigator.deviceMemory || 'unknown'
        };
    }

    async function collectSnapshot() {
        const versionBadge = $('#programInfoBtn');
        const metaVersion = $('meta[name="ai-shorts-version"]');
        const cacheNames = global.caches && caches.keys ? await caches.keys().catch(() => []) : [];
        const swReady = Boolean(navigator.serviceWorker && navigator.serviceWorker.controller);
        const engine = collectEngineProfile();
        return {
            version: VERSION,
            buildKey: BUILD_KEY,
            visibleBadge: text(versionBadge && versionBadge.textContent, 'unknown'),
            metaVersion: text(metaVersion && metaVersion.content, 'unknown'),
            bodyBuild: text(document.body && document.body.dataset.build, 'unknown'),
            serviceWorker: swReady ? 'active' : (navigator.serviceWorker ? 'ready-check' : 'off'),
            cacheCount: cacheNames.filter(name => name.indexOf('ai-shorts-studio-shell-') === 0).length,
            engine
        };
    }

    function setPanelStatus(snapshot) {
        if (!panel) return;
        const cells = {
            version: snapshot.version,
            build: snapshot.buildKey,
            cache: snapshot.cacheCount ? `${snapshot.cacheCount}개 셸 캐시` : '네트워크 우선',
            sw: snapshot.serviceWorker,
            engine: `${snapshot.engine.label || 'MAX-STABLE'} · ${snapshot.engine.cores || 2}코어`,
            capability: snapshot.engine.offscreenCanvas ? 'OffscreenCanvas 가능' : 'Canvas 안정 모드'
        };
        Object.keys(cells).forEach(key => {
            const node = panel.querySelector(`[data-update-field="${key}"]`);
            if (node) node.textContent = cells[key];
        });
        panel.dataset.versionAligned = snapshot.visibleBadge === snapshot.version && snapshot.metaVersion === snapshot.version ? 'true' : 'false';
    }

    function showLive(message) {
        if (!live) return;
        live.textContent = message;
        live.classList.add('is-visible');
        clearTimeout(showLive.timer);
        showLive.timer = setTimeout(() => live.classList.remove('is-visible'), 2400);
    }

    async function refreshPanel() {
        const snapshot = await collectSnapshot();
        setPanelStatus(snapshot);
        return snapshot;
    }

    async function checkForUpdate() {
        const owner = global.AIShortsServiceWorkerRegistration;
        if (owner && typeof owner.checkForUpdate === 'function') {
            const result = await owner.checkForUpdate();
            if (result && result.registration) registrationRef = result.registration;
        }
        await refreshPanel();
        showLive(`${VERSION} 적용 상태를 다시 확인했습니다.`);
    }

    async function clearOldShellCaches() {
        if (!global.caches || !caches.keys) {
            showLive('이 브라우저는 캐시 API를 지원하지 않습니다.');
            return;
        }
        const keys = await caches.keys().catch(() => []);
        const cacheSuffix = String(BUILD_KEY).replace(/^\d+\.\d+\.\d+-/, '');
        const current = `ai-shorts-studio-shell-${VERSION}-${cacheSuffix}`;
        const targets = keys.filter(name => name.indexOf('ai-shorts-studio-shell-') === 0 && name !== current);
        await Promise.all(targets.map(name => caches.delete(name).catch(() => false)));
        await refreshPanel();
        showLive(targets.length ? `이전 캐시 ${targets.length}개를 정리했습니다.` : '정리할 이전 캐시가 없습니다.');
    }

    async function copyDiagnostics() {
        try {
            const snapshot = await collectSnapshot();
            const payload = {
                type: 'ai-shorts-update-sentinel',
                createdAt: new Date().toISOString(),
                snapshot
            };
            const copied = await copyText(JSON.stringify(payload, null, 2));
            if (!copied) throw new Error('클립보드 복사 실패');
            showLive('업데이트 진단을 복사했습니다.');
            return true;
        } catch (error) {
            showLive('업데이트 진단을 복사하지 못했습니다. 브라우저 권한을 확인해주세요.');
            return false;
        }
    }

    function installPanel() {
        const modalPanel = $('#infoDialog .modal-panel');
        if (!modalPanel || $('#updateSentinelPanel')) return;
        panel = document.createElement('section');
        panel.id = 'updateSentinelPanel';
        panel.className = 'update-sentinel-panel';
        panel.setAttribute('aria-label', '업데이트 적용 상태');
        panel.innerHTML = [
            '<div class="update-sentinel-head">',
            '<strong class="icon-surface" data-icon="retry">업데이트 적용 상태</strong>',
            '<span class="update-sentinel-badge">실시간 버전 확인</span>',
            '</div>',
            '<div class="update-sentinel-grid">',
            '<div class="update-sentinel-item"><span>현재 버전</span><b data-update-field="version">확인 중</b></div>',
            '<div class="update-sentinel-item"><span>빌드 키</span><b data-update-field="build">확인 중</b></div>',
            '<div class="update-sentinel-item"><span>캐시 상태</span><b data-update-field="cache">확인 중</b></div>',
            '<div class="update-sentinel-item"><span>서비스워커</span><b data-update-field="sw">확인 중</b></div>',
            '<div class="update-sentinel-item"><span>엔진 프로필</span><b data-update-field="engine">MAX-STABLE</b></div>',
            '<div class="update-sentinel-item"><span>렌더 보조</span><b data-update-field="capability">확인 중</b></div>',
            '</div>',
            '<div class="update-sentinel-actions">',
            '<button type="button" data-update-action="check">업데이트 확인</button>',
            '<button type="button" data-update-action="clear-cache">이전 캐시 정리</button>',
            '<button type="button" data-update-action="copy">진단 복사</button>',
            '</div>',
            '<p class="update-sentinel-note">버전명이 안 바뀌는 것처럼 보이면 여기서 업데이트 확인과 이전 캐시 정리를 실행한 뒤 새로고침하면 됩니다.</p>'
        ].join('');
        modalPanel.appendChild(panel);
        panel.addEventListener('click', event => {
            const action = event.target && event.target.getAttribute && event.target.getAttribute('data-update-action');
            if (action === 'check') checkForUpdate();
            if (action === 'clear-cache') clearOldShellCaches();
            if (action === 'copy') copyDiagnostics();
        });
    }

    function installLiveRegion() {
        if ($('#updateSentinelLive')) return;
        live = document.createElement('div');
        live.id = 'updateSentinelLive';
        live.className = 'update-sentinel-live';
        live.setAttribute('role', 'status');
        live.setAttribute('aria-live', 'polite');
        document.body.appendChild(live);
    }

    function rememberSeenVersion() {
        try {
            const previous = localStorage.getItem(STORAGE_KEY);
            localStorage.setItem(STORAGE_KEY, VERSION);
            if (previous && previous !== VERSION) {
                setTimeout(() => showLive(`${VERSION} 새 버전이 적용됐습니다.`), 650);
            }
        } catch (_) {}
    }

    function watchServiceWorker() {
        if (!navigator.serviceWorker) return;
        navigator.serviceWorker.ready.then(registration => {
            registrationRef = registration;
            registration.addEventListener('updatefound', () => showLive('새 서비스워커 업데이트를 확인했습니다.'));
        }).catch(() => {});
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            refreshPanel();
            showLive('앱 셸이 새 버전으로 전환됐습니다.');
        });
    }

    function init() {
        installPanel();
        installLiveRegion();
        refreshPanel();
        rememberSeenVersion();
        watchServiceWorker();
    }

    global.AIShortsUpdateSentinel = Object.freeze({
        version: VERSION,
        buildKey: BUILD_KEY,
        collectSnapshot,
        refresh: refreshPanel,
        checkForUpdate,
        clearOldShellCaches,
        copyDiagnostics
    });

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
})(window);
