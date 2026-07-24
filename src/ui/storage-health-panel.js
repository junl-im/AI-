// AI Shorts Studio v1.6.1 - user-safe storage summary with gated advanced diagnostics
'use strict';
(function bootStorageHealthPanel(global) {
    if (global.AIShortsStorageHealthPanel) return;
    const storage = global.AIShortsStorageManager || {};
    const serviceWorker = global.AIShortsServiceWorkerRegistration || {};
    const config = global.AIShortsRuntimeConfig || {};
    let root = null;
    let advancedDialog = null;
    let confirmationDialog = null;
    let refreshPromise = null;
    let diagnosticsRefreshPromise = null;
    let refreshIncludesDiagnostics = false;
    let lastStorageSnapshot = null;
    let lastHealthModel = null;
    let advancedReturnFocus = null;
    let pendingConfirmation = null;

    function byId(id) { return document.getElementById(id); }
    function formatBytes(value) {
        const bytes = Math.max(0, Number(value) || 0);
        if (bytes < 1024) return `${Math.round(bytes)}B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10240 ? 1 : 0)}KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)}MB`;
        return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}GB`;
    }
    function feedback(message, kind) {
        const api = global.AIShortsFeedbackUX;
        if (api && typeof api.toast === 'function') api.toast(message, kind || 'action', { duration: 3600 });
    }
    function scheduleFrame(callback) {
        if (typeof global.requestAnimationFrame === 'function') global.requestAnimationFrame(callback);
        else global.setTimeout(callback, 0);
    }
    function focusableElements(container) {
        if (!container) return [];
        return Array.from(container.querySelectorAll('button:not([disabled]), select:not([disabled]), input:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'))
            .filter(node => {
                if (node.hidden || node.getAttribute('aria-hidden') === 'true' || node.closest('[hidden]')) return false;
                const closedDetails = node.closest('details:not([open])');
                if (closedDetails && !node.closest('summary')) return false;
                const style = typeof global.getComputedStyle === 'function' ? global.getComputedStyle(node) : null;
                return !style || style.display !== 'none' && style.visibility !== 'hidden';
            });
    }
    function trapFocus(event, container) {
        if (event.key !== 'Tab') return;
        const focusable = focusableElements(container);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }
    function buildAdvancedDialog() {
        if (advancedDialog) return advancedDialog;
        advancedDialog = document.createElement('div');
        advancedDialog.id = 'storageAdvancedDialog';
        advancedDialog.className = 'storage-diagnostics-modal';
        advancedDialog.hidden = true;
        advancedDialog.setAttribute('aria-hidden', 'true');
        advancedDialog.innerHTML = [
            '<section class="storage-diagnostics-panel" role="dialog" aria-modal="true" aria-labelledby="storageAdvancedTitle" aria-describedby="storageAdvancedDescription">',
            '  <header class="storage-diagnostics-header">',
            '    <div><span class="storage-diagnostics-kicker">고급 설정</span><h2 id="storageAdvancedTitle">저장소 및 오프라인 진단</h2><p id="storageAdvancedDescription">문제가 있을 때만 사용하는 관리 도구입니다. 현재 프로젝트의 원본 파일과 편집 내용은 삭제하지 않습니다.</p></div>',
            '    <button id="storageAdvancedCloseBtn" class="storage-diagnostics-close" type="button" aria-label="고급 진단 닫기">×</button>',
            '  </header>',
            '  <div class="storage-diagnostics-body">',
            '    <div id="storageAdvancedStatus" class="storage-diagnostics-notice" role="status">상세 상태를 확인하고 있습니다.</div>',
            '    <div class="storage-health-metrics" aria-label="상세 저장소 상태">',
            '      <span><small>브라우저 저장소</small><strong id="storageAdvancedUsageMetric">확인 중</strong></span>',
            '      <span><small>로컬 설정·세션</small><strong id="storageLocalMetric">확인 중</strong></span>',
            '      <span><small>오프라인 셸</small><strong id="storageSwMetric">확인 중</strong></span>',
            '      <span><small>세션 복구</small><strong id="storageSessionMetric">확인 중</strong></span>',
            '      <span><small>분석 캐시</small><strong id="analysisCacheMetric">확인 중</strong></span>',
            '    </div>',
            '    <section class="storage-diagnostics-section" aria-labelledby="storageRecoveryHeading">',
            '      <div class="storage-diagnostics-section-head"><div><h3 id="storageRecoveryHeading">저장 공간과 자동 복구</h3><p>일반적인 문제는 자동 복구로 해결하고, 필요할 때만 오래된 백업과 임시 캐시를 정리합니다.</p></div></div>',
            '      <div class="storage-health-actions storage-health-actions-primary">',
            '        <button id="storageHealthRefreshBtn" type="button" data-icon="retry">상태 다시 확인</button>',
            '        <button id="storageHealthRepairBtn" type="button" data-icon="retry">오프라인 기능 복구</button>',
            '        <button id="storageHealthCleanupBtn" class="storage-danger-action" type="button" data-icon="close">오래된 저장소 정리</button>',
            '      </div>',
            '    </section>',
            '    <details class="storage-diagnostics-disclosure">',
            '      <summary><span>분석 캐시 고급 관리</span><small>선택 삭제·조건 정리·namespace·signature</small></summary>',
            '      <div class="storage-diagnostics-section storage-diagnostics-section-inner">',
            '        <div class="storage-diagnostics-warning"><strong>주의</strong><span>캐시를 지워도 프로젝트는 유지되지만, 다음 분석에서 결과를 다시 계산하므로 시간이 더 걸릴 수 있습니다.</span></div>',
            '        <div class="storage-health-actions storage-health-actions-grid">',
            '          <button id="analysisCacheDiagnosticsBtn" type="button" data-icon="diagnostics">분석 진단 저장</button>',
            '          <label class="storage-cache-entry-picker"><span>영구 캐시 항목 (복수 선택)</span><select id="analysisCacheEntrySelect" multiple size="3" aria-label="삭제할 영구 분석 캐시 항목 복수 선택"><option value="">항목 없음</option></select></label>',
            '          <button id="analysisCacheEntryDeleteBtn" class="storage-danger-action" type="button" data-icon="close">선택 캐시 삭제</button>',
            '          <label class="storage-cache-entry-picker storage-cache-filter-picker"><span>조건별 캐시 정리</span><select id="analysisCacheInvalidationSelect" aria-label="무효화할 분석 캐시 조건"><option value="balanced">균형 분석</option><option value="performance">속도 우선</option><option value="quality">품질 우선</option><option value="legacy-contract">이전 분석 계약</option></select></label>',
            '          <button id="analysisCacheInvalidateBtn" class="storage-danger-action" type="button" data-icon="close">조건 캐시 정리</button>',
            '          <label class="storage-cache-entry-picker storage-cache-filter-picker"><span>옵션 signature 정리</span><select id="analysisCacheSignatureSelect" aria-label="정리할 분석 옵션 signature"><option value="">signature 없음</option></select></label>',
            '          <button id="analysisCacheSignatureDeleteBtn" class="storage-danger-action" type="button" data-icon="close">signature 캐시 정리</button>',
            '          <button id="analysisCacheCleanupBtn" class="storage-danger-action" type="button" data-icon="close">분석 캐시 전체 정리</button>',
            '        </div>',
            '        <section class="analysis-cache-maintenance" aria-label="분석 캐시 namespace와 정리 이력">',
            '          <div class="analysis-cache-namespace-card">',
            '            <div><strong>분석 namespace 상태</strong><small id="analysisCacheNamespaceSummary">현재·이전 계약 캐시를 확인하고 있습니다.</small></div>',
            '            <label class="storage-cache-entry-picker"><span>정리할 이전 namespace</span><select id="analysisCacheNamespaceSelect" multiple size="3" aria-label="정리할 이전 분석 캐시 namespace 복수 선택"><option value="">이전 namespace 없음</option></select></label>',
            '            <button id="analysisCacheNamespaceDeleteBtn" class="storage-danger-action" type="button" data-icon="close">선택 namespace 정리</button>',
            '          </div>',
            '          <div class="analysis-cache-trend-card"><strong>namespace 저장 비용 추세</strong><small id="analysisCacheTrendSummary">저장 비용 변화를 확인하고 있습니다.</small><ol id="analysisCacheStorageTrend"><li>추세 기록이 없습니다.</li></ol></div>',
            '          <div class="analysis-cache-history-card"><strong>최근 캐시 정리 이력</strong><ol id="analysisCacheMaintenanceHistory"><li>정리 이력이 없습니다.</li></ol></div>',
            '        </section>',
            '      </div>',
            '    </details>',
            '    <details class="storage-diagnostics-disclosure">',
            '      <summary><span>오프라인 셸 고급 감사</span><small>무결성 검사·실패 자산 재시도·진단 내보내기</small></summary>',
            '      <div class="storage-diagnostics-section storage-diagnostics-section-inner">',
            '        <div class="storage-health-actions">',
            '          <button id="storageIntegrityAuditBtn" type="button" data-icon="diagnostics">셸 표본 검사</button>',
            '          <button id="storageIntegrityDiagnosticsBtn" type="button" data-icon="diagnostics">셸 감사 진단 저장</button>',
            '          <button id="storageIntegrityRetryBtn" type="button" data-icon="retry">실패 자산 재시도</button>',
            '          <button id="storageIntegrityClearBtn" class="storage-danger-action" type="button" data-icon="close">감사 이력 초기화</button>',
            '        </div>',
            '      </div>',
            '    </details>',
            '  </div>',
            '</section>'
        ].join('');
        document.body.appendChild(advancedDialog);
        advancedDialog.addEventListener('click', event => {
            if (event.target === advancedDialog) closeAdvancedDiagnostics();
        });
        const closeButton = byId('storageAdvancedCloseBtn');
        if (closeButton) closeButton.addEventListener('click', closeAdvancedDiagnostics);
        return advancedDialog;
    }
    function buildConfirmationDialog() {
        if (confirmationDialog) return confirmationDialog;
        confirmationDialog = document.createElement('div');
        confirmationDialog.id = 'storageConfirmDialog';
        confirmationDialog.className = 'storage-confirm-modal';
        confirmationDialog.hidden = true;
        confirmationDialog.setAttribute('aria-hidden', 'true');
        confirmationDialog.innerHTML = [
            '<section class="storage-confirm-panel" role="alertdialog" aria-modal="true" aria-labelledby="storageConfirmTitle" aria-describedby="storageConfirmMessage">',
            '  <span class="storage-confirm-icon studio-icon" data-icon="diagnostics" aria-hidden="true"></span>',
            '  <h3 id="storageConfirmTitle">정리 작업 확인</h3>',
            '  <p id="storageConfirmMessage">이 작업을 실행할지 확인해주세요.</p>',
            '  <div class="storage-confirm-safety"><strong>안전 안내</strong><span>현재 프로젝트의 원본 파일과 편집 내용은 삭제되지 않습니다.</span></div>',
            '  <div class="storage-confirm-actions"><button id="storageConfirmCancelBtn" type="button">취소</button><button id="storageConfirmAcceptBtn" class="storage-danger-action" type="button">정리 실행</button></div>',
            '</section>'
        ].join('');
        document.body.appendChild(confirmationDialog);
        confirmationDialog.addEventListener('click', event => {
            if (event.target === confirmationDialog) completeConfirmation(false);
        });
        const cancel = byId('storageConfirmCancelBtn');
        const accept = byId('storageConfirmAcceptBtn');
        if (cancel) cancel.addEventListener('click', () => completeConfirmation(false));
        if (accept) accept.addEventListener('click', () => completeConfirmation(true));
        return confirmationDialog;
    }
    function build() {
        if (root) return root;
        const sessionPanel = byId('sessionContinuityPanel');
        const anchor = sessionPanel || document.querySelector('.start-command-panel') || document.querySelector('.studio-hero');
        if (!anchor) return null;
        root = document.createElement('section');
        root.id = 'storageHealthPanel';
        root.className = 'storage-health-panel';
        root.dataset.level = 'unknown';
        root.dataset.issue = 'checking';
        root.setAttribute('aria-label', '저장 공간과 오프라인 사용 상태');
        root.innerHTML = [
            '<div class="storage-health-copy">',
            '  <span class="storage-health-icon studio-icon" data-icon="check" aria-hidden="true"></span>',
            '  <div><strong id="storageHealthTitle">오프라인 상태 확인 중</strong><small id="storageHealthSummary">저장 공간과 오프라인 사용 준비 상태를 확인하고 있습니다.</small></div>',
            '</div>',
            '<div class="storage-health-user-state">',
            '  <span id="storageHealthStatusPill" class="storage-health-status-pill" data-state="checking">확인 중</span>',
            '  <span class="storage-health-usage"><small>저장 공간</small><strong id="storageUsageMetric">확인 중</strong></span>',
            '</div>',
            '<div class="storage-health-summary-actions">',
            '  <button id="storageHealthAutoRepairBtn" type="button" data-icon="retry" hidden>문제 자동 해결</button>',
            '  <button id="storageAdvancedOpenBtn" class="storage-advanced-open" type="button">고급 진단</button>',
            '</div>'
        ].join('');
        anchor.insertAdjacentElement('afterend', root);
        buildAdvancedDialog();
        buildConfirmationDialog();
        bindActions();
        return root;
    }
    function bindActions() {
        const bindings = [
            ['storageAdvancedOpenBtn', 'click', openAdvancedDiagnostics],
            ['storageHealthAutoRepairBtn', 'click', runAutomaticRepair],
            ['storageHealthRefreshBtn', 'click', () => refresh({ force: true, source: 'manual', includeDiagnostics: true })],
            ['storageHealthCleanupBtn', 'click', cleanup],
            ['analysisCacheDiagnosticsBtn', 'click', exportAnalysisDiagnostics],
            ['analysisCacheCleanupBtn', 'click', cleanupAnalysisCache],
            ['analysisCacheEntryDeleteBtn', 'click', deleteSelectedAnalysisCacheEntry],
            ['analysisCacheInvalidateBtn', 'click', invalidateSelectedAnalysisCache],
            ['analysisCacheSignatureDeleteBtn', 'click', invalidateSelectedAnalysisCacheSignature],
            ['analysisCacheNamespaceDeleteBtn', 'click', deleteSelectedAnalysisCacheNamespaces],
            ['storageIntegrityDiagnosticsBtn', 'click', exportIntegrityDiagnostics],
            ['storageIntegrityAuditBtn', 'click', runIntegrityAudit],
            ['storageIntegrityRetryBtn', 'click', retryFailedIntegrityAssets],
            ['storageIntegrityClearBtn', 'click', clearIntegrityAuditHistory],
            ['storageHealthRepairBtn', 'click', repairOfflineShell]
        ];
        bindings.forEach(([id, eventName, handler]) => {
            const node = byId(id);
            if (node) node.addEventListener(eventName, handler);
        });
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                if (confirmationDialog && !confirmationDialog.hidden) completeConfirmation(false);
                else if (advancedDialog && !advancedDialog.hidden) closeAdvancedDiagnostics();
                return;
            }
            if (confirmationDialog && !confirmationDialog.hidden) trapFocus(event, confirmationDialog);
            else if (advancedDialog && !advancedDialog.hidden) trapFocus(event, advancedDialog);
        });
    }
    function completeConfirmation(accepted) {
        if (!pendingConfirmation) return;
        const pending = pendingConfirmation;
        pendingConfirmation = null;
        if (confirmationDialog) {
            confirmationDialog.hidden = true;
            confirmationDialog.setAttribute('aria-hidden', 'true');
        }
        if (document.body) document.body.classList.remove('storage-confirm-open');
        if (pending.trigger && pending.trigger.isConnected && typeof pending.trigger.focus === 'function') pending.trigger.focus();
        pending.resolve(Boolean(accepted));
    }
    function confirmDestructive(options) {
        build();
        const opts = options || {};
        if (pendingConfirmation) completeConfirmation(false);
        const title = byId('storageConfirmTitle');
        const message = byId('storageConfirmMessage');
        const accept = byId('storageConfirmAcceptBtn');
        if (title) title.textContent = opts.title || '정리 작업 확인';
        if (message) message.textContent = opts.message || '선택한 데이터를 정리합니다. 계속할까요?';
        if (accept) accept.textContent = opts.confirmLabel || '정리 실행';
        confirmationDialog.hidden = false;
        confirmationDialog.setAttribute('aria-hidden', 'false');
        if (document.body) document.body.classList.add('storage-confirm-open');
        return new Promise(resolve => {
            pendingConfirmation = { resolve, trigger: opts.trigger || document.activeElement };
            scheduleFrame(() => {
                const cancel = byId('storageConfirmCancelBtn');
                if (cancel) cancel.focus();
            });
        });
    }
    function openAdvancedDiagnostics() {
        build();
        if (!advancedDialog || !advancedDialog.hidden) return;
        advancedReturnFocus = document.activeElement;
        advancedDialog.hidden = false;
        advancedDialog.setAttribute('aria-hidden', 'false');
        if (document.body) document.body.classList.add('storage-diagnostics-open');
        scheduleFrame(() => {
            const close = byId('storageAdvancedCloseBtn');
            if (close) close.focus();
        });
        refresh({ force: true, source: 'advanced-open', includeDiagnostics: true });
    }
    function closeAdvancedDiagnostics() {
        if (!advancedDialog || advancedDialog.hidden) return;
        if (confirmationDialog && !confirmationDialog.hidden) completeConfirmation(false);
        advancedDialog.hidden = true;
        advancedDialog.setAttribute('aria-hidden', 'true');
        if (document.body) document.body.classList.remove('storage-diagnostics-open');
        if (advancedReturnFocus && advancedReturnFocus.isConnected && typeof advancedReturnFocus.focus === 'function') advancedReturnFocus.focus();
        advancedReturnFocus = null;
    }
    function serviceWorkerProblemCount(status) {
        const report = status && status.installReport;
        const integrity = report && report.integrity || {};
        return (integrity.missing && integrity.missing.length || 0)
            + (integrity.invalid && integrity.invalid.length || 0)
            + (integrity.corrupted && integrity.corrupted.length || 0)
            + (report && report.requiredMissing && report.requiredMissing.length || 0);
    }
    function deriveHealthModel(snapshot, sw) {
        const level = snapshot && snapshot.level || 'unknown';
        const problemCount = serviceWorkerProblemCount(sw);
        const offlineProblem = Boolean(
            sw && (
                sw.update && sw.update.state === 'error'
                || sw.repair && sw.repair.state === 'error'
                || sw.integrityAudit && sw.integrityAudit.state === 'error'
                || sw.installReport && sw.installReport.failed
                || sw.installReport && sw.installReport.rollbackPreserved && sw.installReport.rollbackPreserved.length
                || problemCount
            )
        );
        if (level === 'critical') return { level, issue: 'storage', state: 'critical', title: '저장 공간 정리가 필요합니다', summary: '저장 공간이 거의 찼습니다. 안전하게 정리할 수 있습니다.', action: 'cleanup', actionLabel: '저장 공간 정리' };
        if (offlineProblem) return { level: level === 'unknown' ? 'warning' : level, issue: 'offline', state: 'warning', title: '오프라인 기능 확인이 필요합니다', summary: '오프라인 사용 준비 과정에서 문제를 감지했습니다.', action: 'repair', actionLabel: '문제 자동 해결' };
        if (sw && sw.supported === false) return { level: level === 'unknown' ? 'warning' : level, issue: 'unsupported', state: 'warning', title: '오프라인 저장을 지원하지 않는 환경입니다', summary: '온라인에서는 계속 사용할 수 있지만 브라우저를 닫으면 오프라인 기능이 제한됩니다.', action: '', actionLabel: '' };
        if (sw && sw.supported && !sw.registered) return { level, issue: 'checking', state: 'checking', title: '오프라인 기능 준비 중', summary: '필요한 파일을 브라우저에 안전하게 준비하고 있습니다.', action: '', actionLabel: '' };
        if (level === 'warning') return { level, issue: 'storage', state: 'warning', title: '저장 공간을 확인해주세요', summary: '사용량이 높습니다. 내보내기 전에 여유 공간을 확보하는 것이 좋습니다.', action: 'cleanup', actionLabel: '저장 공간 정리' };
        if (level === 'unknown') return { level, issue: 'checking', state: 'checking', title: '오프라인 상태 확인 중', summary: '저장 공간과 오프라인 사용 준비 상태를 확인하고 있습니다.', action: '', actionLabel: '' };
        return { level, issue: 'none', state: 'healthy', title: '오프라인 사용 준비 완료', summary: '저장 공간과 자동 백업이 정상 범위입니다.', action: '', actionLabel: '' };
    }
    function serviceWorkerText(status) {
        if (!status || !status.supported) return '지원 안 함';
        const report = status.installReport;
        if (!status.registered) return '등록 대기';
        if (!report) return status.controlled ? '제어 중 · 보고 대기' : '활성화 대기';
        if (report.requiredMissing && report.requiredMissing.length) return `핵심 누락 ${report.requiredMissing.length}`;
        const repaired = report.repaired && report.repaired.length || 0;
        const integrity = report.integrity || {};
        const currentProblems = (integrity.missing && integrity.missing.length || 0) + (integrity.invalid && integrity.invalid.length || 0) + (integrity.corrupted && integrity.corrupted.length || 0);
        if (report.rollbackPreserved && report.rollbackPreserved.length) return `롤백 보존 ${report.rollbackPreserved.length}개`;
        if (currentProblems) return `무결성 문제 ${currentProblems}${repaired ? ` · 복구 ${repaired}` : ''}`;
        const audit = status.integrityAudit || {};
        const auditText = audit.completedAt ? ` · 표본 ${audit.checked || 0}개` : '';
        if (report.contentVerified) return `SHA-256 ${integrity.hashVerified || integrity.healthy || 0}개${repaired ? ` · 복구 ${repaired}` : ''}${auditText}`;
        if (report.verified) return `${integrity.healthy || report.cacheEntries || 0}개 상태 검증${repaired ? ` · 복구 ${repaired}` : ''}${auditText}`;
        return `${report.cached || report.cacheEntries || 0}개 캐시${report.failed ? ` · 초기 실패 ${report.failed}` : ''}`;
    }
    function sessionText(status) {
        if (!status) return '모듈 대기';
        if (status.invalid) return '손상 기록 감지';
        const compression = status.compressedBackupCount ? ` · 압축 ${status.compressedBackupCount}개/${status.backupSavingsPercent || 0}% 절감` : '';
        return `스키마 v${status.schemaVersion || config.SESSION_SCHEMA_VERSION || 4} · 백업 ${status.backupCount || 0}/${status.backupLimit || 0}${compression}`;
    }
    function analysisCacheText(status) {
        if (!status) return '엔진 대기';
        const fingerprint = status.fingerprint || {};
        const mode = fingerprint.lastMode === 'full' ? '전체' : fingerprint.lastMode === 'sampled' ? '표본' : '대기';
        const persistent = status.persistent || {};
        const policy = persistent.quotaLevel && persistent.quotaLevel !== 'unknown' ? ` · ${persistent.quotaLevel}` : '';
        const legacy = persistent.legacyNamespaceCount ? ` · 이전 ${persistent.legacyNamespaceCount}종/${persistent.legacyItems || 0}개` : '';
        const persistentText = persistent.enabled ? ` · 영구 ${persistent.size || 0}/${persistent.effectiveMaxItems || persistent.maxItems || 0}${policy}${legacy}` : (persistent.supported === false ? ' · 영구 미지원' : '');
        return `${status.size || 0}/${status.limit || 0} · 적중 ${status.hitRate || 0}% · ${mode} ${fingerprint.lastMs || 0}ms${persistentText}`;
    }
    function render(storageStatus) {
        build();
        if (!root) return;
        const snapshot = storageStatus || storage.status && storage.status() || {};
        lastStorageSnapshot = snapshot;
        const sw = serviceWorker.getStatus ? serviceWorker.getStatus() : null;
        const session = global.AIShortsSessionContinuity && global.AIShortsSessionContinuity.getStatus ? global.AIShortsSessionContinuity.getStatus() : null;
        const engine = global.AIShortsEngineKernel && global.AIShortsEngineKernel.getHealthReport ? global.AIShortsEngineKernel.getHealthReport() : null;
        const ratioPercent = snapshot.quota ? Math.round((snapshot.ratio || 0) * 100) : 0;
        const usageText = snapshot.quota ? `${formatBytes(snapshot.usage)} / ${formatBytes(snapshot.quota)} · ${ratioPercent}%` : formatBytes(snapshot.usage || snapshot.localStorageBytes || 0);
        const model = deriveHealthModel(snapshot, sw);
        lastHealthModel = model;
        root.dataset.level = model.level;
        root.dataset.issue = model.issue;
        const title = byId('storageHealthTitle');
        const summary = byId('storageHealthSummary');
        const pill = byId('storageHealthStatusPill');
        const usageMetric = byId('storageUsageMetric');
        const autoRepair = byId('storageHealthAutoRepairBtn');
        if (title) title.textContent = model.title;
        if (summary) summary.textContent = model.summary;
        if (pill) {
            pill.dataset.state = model.state;
            pill.textContent = model.state === 'healthy' ? '정상' : model.state === 'critical' ? '정리 필요' : model.state === 'warning' ? '확인 필요' : '확인 중';
        }
        if (usageMetric) usageMetric.textContent = usageText;
        if (autoRepair) {
            autoRepair.hidden = !model.action;
            autoRepair.textContent = model.actionLabel || '문제 자동 해결';
        }
        const advancedUsage = byId('storageAdvancedUsageMetric');
        const localMetric = byId('storageLocalMetric');
        const swMetric = byId('storageSwMetric');
        const sessionMetric = byId('storageSessionMetric');
        const analysisMetric = byId('analysisCacheMetric');
        const advancedStatus = byId('storageAdvancedStatus');
        if (advancedUsage) advancedUsage.textContent = usageText;
        if (localMetric) localMetric.textContent = `${formatBytes(snapshot.localStorageBytes || 0)} · 캐시 ${snapshot.cacheCount || 0}개`;
        if (swMetric) swMetric.textContent = serviceWorkerText(sw);
        if (sessionMetric) sessionMetric.textContent = sessionText(session);
        if (analysisMetric) analysisMetric.textContent = analysisCacheText(engine && engine.cache);
        if (advancedStatus) {
            advancedStatus.dataset.state = model.state;
            advancedStatus.textContent = `${model.title} · ${model.summary}`;
        }
        if (document.body) document.body.dataset.storageHealth = model.level;
        return model;
    }
    async function refresh(options) {
        const opts = options || {};
        build();
        const includeDiagnostics = Boolean(opts.includeDiagnostics || advancedDialog && !advancedDialog.hidden);
        if (refreshPromise) {
            if (includeDiagnostics && !refreshIncludesDiagnostics) {
                if (!diagnosticsRefreshPromise) {
                    diagnosticsRefreshPromise = refreshPromise
                        .then(() => refresh({ force: true, source: opts.source || 'diagnostics-followup', includeDiagnostics: true }))
                        .finally(() => { diagnosticsRefreshPromise = null; });
                }
                return diagnosticsRefreshPromise;
            }
            return refreshPromise;
        }
        refreshIncludesDiagnostics = includeDiagnostics;
        refreshPromise = Promise.resolve(storage.estimate ? storage.estimate({ force: Boolean(opts.force) }) : storage.status && storage.status() || {}).then(async snapshot => {
            if (includeDiagnostics) {
                const engine = global.AIShortsEngineKernel || {};
                const cacheSnapshot = engine.refreshPersistentAnalysisCachePolicy ? await engine.refreshPersistentAnalysisCachePolicy() : null;
                await refreshAnalysisCacheEntries(cacheSnapshot);
                await refreshAnalysisCacheMaintenance(cacheSnapshot);
            }
            if (serviceWorker.requestInstallReport) serviceWorker.requestInstallReport();
            render(snapshot);
            return snapshot;
        }).catch(error => {
            const title = byId('storageHealthTitle');
            const summary = byId('storageHealthSummary');
            const pill = byId('storageHealthStatusPill');
            const advancedStatus = byId('storageAdvancedStatus');
            const message = error && error.message || '저장소 상태를 확인하지 못했습니다.';
            if (root) {
                root.dataset.level = 'warning';
                root.dataset.issue = 'inspection';
            }
            if (title) title.textContent = '저장 상태를 확인하지 못했습니다';
            if (summary) summary.textContent = message;
            if (pill) {
                pill.dataset.state = 'warning';
                pill.textContent = '확인 필요';
            }
            if (advancedStatus) {
                advancedStatus.dataset.state = 'warning';
                advancedStatus.textContent = message;
            }
            return null;
        }).finally(() => {
            refreshPromise = null;
            refreshIncludesDiagnostics = false;
        });
        return refreshPromise;
    }
    async function refreshAnalysisCacheEntries(snapshot) {
        const select = byId('analysisCacheEntrySelect');
        const button = byId('analysisCacheEntryDeleteBtn');
        if (!select) return [];
        const engine = global.AIShortsEngineKernel || {};
        const entries = snapshot && Array.isArray(snapshot.entries) ? snapshot.entries : (engine.listPersistentAnalysisCacheEntries ? await engine.listPersistentAnalysisCacheEntries() : []);
        select.replaceChildren(...(entries.length ? entries : [{ token: '', bytes: 0, lastAccessAt: '' }]).map((entry, index) => {
            const option = document.createElement('option');
            option.value = entry.token || '';
            const profile = entry.tier ? ` · ${entry.tier}` : '';
            const contract = entry.contractVersion ? ` · 계약 ${entry.contractVersion}` : '';
            option.textContent = entry.token ? `${index + 1}. ${formatBytes(entry.bytes)}${profile}${contract} · ${entry.lastAccessAt ? new Date(entry.lastAccessAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '사용 시각 없음'}` : '항목 없음';
            option.disabled = !entry.token;
            return option;
        }));
        if (button) button.disabled = !entries.length;
        return entries;
    }
    function formatCacheDate(value) {
        if (!value) return '시각 없음';
        const date = new Date(value);
        if (!Number.isFinite(date.getTime())) return '시각 없음';
        return date.toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    function maintenanceOperationLabel(operation) {
        const labels = {
            'entry-delete': '선택 항목 삭제',
            'criteria-invalidate': '조건 캐시 정리',
            'namespace-delete': '이전 namespace 정리',
            'current-clear': '현재 캐시 전체 정리',
            'automatic-prune': '자동 만료·용량 정리'
        };
        return labels[String(operation || '')] || '캐시 정리';
    }
    async function refreshAnalysisCacheMaintenance(snapshot) {
        const engine = global.AIShortsEngineKernel || {};
        const summary = byId('analysisCacheNamespaceSummary');
        const select = byId('analysisCacheNamespaceSelect');
        const button = byId('analysisCacheNamespaceDeleteBtn');
        const historyRoot = byId('analysisCacheMaintenanceHistory');
        const signatureSelect = byId('analysisCacheSignatureSelect');
        const signatureButton = byId('analysisCacheSignatureDeleteBtn');
        const trendSummary = byId('analysisCacheTrendSummary');
        const trendRoot = byId('analysisCacheStorageTrend');
        const status = snapshot && snapshot.namespaceStatus || (engine.getPersistentAnalysisCacheNamespaceStatus ? await engine.getPersistentAnalysisCacheNamespaceStatus() : null);
        const history = snapshot && Array.isArray(snapshot.maintenanceHistory) ? snapshot.maintenanceHistory : (engine.getAnalysisCacheMaintenanceHistory ? engine.getAnalysisCacheMaintenanceHistory(8) : []);
        const signatureGroups = snapshot && snapshot.optionSignatures && Array.isArray(snapshot.optionSignatures.groups) ? snapshot.optionSignatures.groups : [];
        const trend = snapshot && Array.isArray(snapshot.storageTrend) ? snapshot.storageTrend : [];
        const current = status && status.current || {};
        const legacy = status && Array.isArray(status.legacy) ? status.legacy : [];
        if (summary) {
            summary.textContent = legacy.length
                ? `현재 ${current.count || 0}개 · ${formatBytes(current.bytes || 0)} / 이전 ${status.legacyNamespaceCount || legacy.length}종 · ${status.legacyItems || 0}개 · ${formatBytes(status.legacyBytes || 0)}`
                : `현재 ${current.count || 0}개 · ${formatBytes(current.bytes || 0)} · 이전 namespace 없음`;
        }
        if (select) {
            const source = legacy.length ? legacy : [{ token: '', count: 0, bytes: 0 }];
            select.replaceChildren(...source.map((item, index) => {
                const option = document.createElement('option');
                option.value = item.token || '';
                const contracts = Array.isArray(item.contractVersions) && item.contractVersions.length ? ` · 계약 ${item.contractVersions.join(', ')}` : '';
                option.textContent = item.token ? `${index + 1}. ${item.count || 0}개 · ${formatBytes(item.bytes || 0)}${contracts} · ${formatCacheDate(item.lastAccessAt)}` : '이전 namespace 없음';
                option.disabled = !item.token;
                return option;
            }));
        }
        if (button) button.disabled = !legacy.length;
        if (signatureSelect) {
            const source = signatureGroups.length ? signatureGroups : [{ token: '', count: 0, bytes: 0 }];
            signatureSelect.replaceChildren(...source.map((item, index) => {
                const option = document.createElement('option');
                option.value = item.token || '';
                option.textContent = item.token ? `${index + 1}. ${item.token.slice(0, 8)}… · ${item.count || 0}개 · ${formatBytes(item.bytes || 0)}` : 'signature 없음';
                option.disabled = !item.token;
                return option;
            }));
        }
        if (signatureButton) signatureButton.disabled = !signatureGroups.length;
        if (trendSummary) {
            const latest = trend[0] || null;
            const previous = trend[1] || null;
            const delta = latest && previous ? Number(latest.totalBytes || 0) - Number(previous.totalBytes || 0) : 0;
            trendSummary.textContent = latest ? `전체 ${formatBytes(latest.totalBytes || 0)} · 현재 ${formatBytes(latest.currentBytes || 0)} · 이전 ${formatBytes(latest.legacyBytes || 0)}${previous ? ` · 직전 대비 ${delta >= 0 ? '+' : '-'}${formatBytes(Math.abs(delta))}` : ''}` : '추세 기록이 없습니다.';
        }
        if (trendRoot) {
            const source = trend.length ? trend.slice(0, 8) : [{ at: '', totalBytes: 0, totalItems: 0 }];
            trendRoot.replaceChildren(...source.map(item => {
                const row = document.createElement('li');
                row.textContent = item.at ? `${formatCacheDate(item.at)} · ${item.totalItems || 0}개 · ${formatBytes(item.totalBytes || 0)}` : '추세 기록이 없습니다.';
                return row;
            }));
        }
        if (historyRoot) {
            const source = Array.isArray(history) && history.length ? history : [{ operation: '', at: '', removed: 0, bytes: 0 }];
            historyRoot.replaceChildren(...source.map(item => {
                const row = document.createElement('li');
                row.textContent = item.operation
                    ? `${maintenanceOperationLabel(item.operation)} · ${item.removed || 0}개 · ${formatBytes(item.bytes || 0)} · ${formatCacheDate(item.at)}`
                    : '정리 이력이 없습니다.';
                return row;
            }));
        }
        return Object.freeze({ status, history });
    }
    async function refreshAnalysisCacheDashboard() {
        const engine = global.AIShortsEngineKernel || {};
        const snapshot = engine.getPersistentAnalysisCacheMaintenanceSnapshot ? await engine.getPersistentAnalysisCacheMaintenanceSnapshot({ refresh: false, trendLimit: 12, historyLimit: 8 }) : null;
        await refreshAnalysisCacheEntries(snapshot);
        await refreshAnalysisCacheMaintenance(snapshot);
        return snapshot;
    }
    async function invalidateSelectedAnalysisCacheSignature() {
        const select = byId('analysisCacheSignatureSelect');
        const button = byId('analysisCacheSignatureDeleteBtn');
        const token = select && select.value || '';
        if (!token) { feedback('정리할 옵션 signature를 선택하세요.', 'warning'); return null; }
        if (!await confirmDestructive({ title: '옵션별 분석 캐시 정리', message: '선택한 옵션 signature에 해당하는 분석 결과를 삭제합니다. 다음 분석에서 해당 결과를 다시 계산합니다.', confirmLabel: '선택 캐시 정리', trigger: button })) return null;
        if (button) button.disabled = true;
        try {
            const engine = global.AIShortsEngineKernel || {};
            if (!engine.invalidateAnalysisCache) throw new Error('옵션 signature 캐시 정리를 지원하지 않습니다.');
            const result = await engine.invalidateAnalysisCache({ optionSignatureToken: token, reason: 'option-signature' });
            await refreshAnalysisCacheDashboard();
            render();
            feedback(result && result.removed ? `옵션 signature 캐시 ${result.removed}개 · ${formatBytes(result.bytes || 0)}를 정리했습니다.` : '선택한 signature 캐시가 없습니다.', 'action');
            return result;
        } catch (error) {
            feedback(error && error.message || '옵션 signature 캐시 정리에 실패했습니다.', 'error');
            return null;
        } finally { if (button) button.disabled = false; }
    }
    async function deleteSelectedAnalysisCacheNamespaces() {
        const select = byId('analysisCacheNamespaceSelect');
        const button = byId('analysisCacheNamespaceDeleteBtn');
        const tokens = select ? Array.from(select.selectedOptions || [], option => option.value).filter(Boolean) : [];
        if (!tokens.length) { feedback('정리할 이전 분석 namespace를 선택하세요.', 'warning'); return null; }
        if (!await confirmDestructive({ title: '이전 분석 캐시 정리', message: `선택한 이전 namespace ${tokens.length}개에 저장된 분석 결과를 삭제합니다. 현재 분석 계약의 캐시는 유지됩니다.`, confirmLabel: '이전 캐시 정리', trigger: button })) return null;
        if (button) button.disabled = true;
        try {
            const engine = global.AIShortsEngineKernel || {};
            if (!engine.deletePersistentAnalysisCacheNamespaces) throw new Error('이전 분석 namespace 정리를 지원하지 않습니다.');
            const result = await engine.deletePersistentAnalysisCacheNamespaces(tokens);
            await refreshAnalysisCacheDashboard();
            render();
            if (!result || !result.removed) throw new Error('선택한 이전 namespace에서 정리할 캐시를 찾지 못했습니다.');
            feedback(`이전 namespace ${result.removedNamespaces || 0}종 · 캐시 ${result.removed}개 · ${formatBytes(result.bytes || 0)}를 정리했습니다.`, 'action');
            return result;
        } catch (error) {
            feedback(error && error.message || '이전 namespace 정리에 실패했습니다.', 'error');
            return null;
        } finally { if (button) button.disabled = false; }
    }
    async function deleteSelectedAnalysisCacheEntry() {
        const select = byId('analysisCacheEntrySelect');
        const button = byId('analysisCacheEntryDeleteBtn');
        const tokens = select ? Array.from(select.selectedOptions || [], option => option.value).filter(Boolean) : [];
        if (!tokens.length) { feedback('삭제할 영구 분석 캐시 항목을 선택하세요.', 'warning'); return null; }
        if (!await confirmDestructive({ title: '선택한 분석 캐시 삭제', message: `선택한 분석 캐시 ${tokens.length}개를 삭제합니다. 다음 분석에서 필요한 결과를 다시 생성합니다.`, confirmLabel: '선택 항목 삭제', trigger: button })) return null;
        if (button) button.disabled = true;
        try {
            const engine = global.AIShortsEngineKernel || {};
            const result = engine.deletePersistentAnalysisCacheEntries ? await engine.deletePersistentAnalysisCacheEntries(tokens) : (tokens.length === 1 && engine.deletePersistentAnalysisCacheEntry ? await engine.deletePersistentAnalysisCacheEntry(tokens[0]) : null);
            await refreshAnalysisCacheDashboard();
            render();
            const removed = Number(result && (result.removed === true ? 1 : result.removed)) || 0;
            if (!removed) throw new Error('선택한 캐시 항목을 찾지 못했습니다.');
            feedback(`영구 분석 캐시 ${removed}개 · ${formatBytes(result.bytes || 0)}를 삭제했습니다.`, 'action');
            return result;
        } catch (error) {
            feedback(error && error.message || '선택 캐시 삭제에 실패했습니다.', 'error');
            return null;
        } finally { if (button) button.disabled = false; }
    }
    async function invalidateSelectedAnalysisCache() {
        const select = byId('analysisCacheInvalidationSelect');
        const button = byId('analysisCacheInvalidateBtn');
        const value = select && select.value || '';
        if (!value) return null;
        const label = select && select.selectedOptions && select.selectedOptions[0] ? select.selectedOptions[0].textContent : '선택 조건';
        if (!await confirmDestructive({ title: '조건별 분석 캐시 정리', message: `${label} 조건에 맞는 분석 결과를 삭제합니다. 다른 조건의 캐시는 유지됩니다.`, confirmLabel: '조건 캐시 정리', trigger: button })) return null;
        if (button) button.disabled = true;
        try {
            const engine = global.AIShortsEngineKernel || {};
            if (!engine.invalidateAnalysisCache) throw new Error('조건별 분석 캐시 정리를 지원하지 않습니다.');
            const criteria = value === 'legacy-contract'
                ? { contractVersion: String(config.ANALYSIS_CACHE_CONTRACT_VERSION || '3'), reason: 'legacy-contract' }
                : { tier: value, reason: `tier-${value}` };
            const result = await engine.invalidateAnalysisCache(criteria);
            await refreshAnalysisCacheDashboard();
            render();
            feedback(result && result.removed ? `조건에 맞는 분석 캐시 ${result.removed}개를 정리했습니다.` : '조건에 맞는 분석 캐시가 없습니다.', 'action');
            return result;
        } catch (error) {
            feedback(error && error.message || '조건 캐시 정리에 실패했습니다.', 'error');
            return null;
        } finally { if (button) button.disabled = false; }
    }
    function exportIntegrityDiagnostics() {
        const button = byId('storageIntegrityDiagnosticsBtn');
        if (button) button.disabled = true;
        try {
            if (!serviceWorker.exportIntegrityDiagnostics) throw new Error('셸 감사 진단 내보내기를 지원하지 않습니다.');
            const result = serviceWorker.exportIntegrityDiagnostics();
            if (!result || !result.saved) throw new Error('셸 감사 진단 파일을 저장하지 못했습니다.');
            feedback(`셸 감사 이력 ${result.historyCount || 0}건을 저장했습니다.`, 'export');
            return result;
        } catch (error) {
            feedback(error && error.message || '셸 감사 진단 저장에 실패했습니다.', 'error');
            return null;
        } finally { if (button) button.disabled = false; }
    }
    function exportAnalysisDiagnostics() {
        const button = byId('analysisCacheDiagnosticsBtn');
        if (button) button.disabled = true;
        try {
            const engine = global.AIShortsEngineKernel || {};
            if (!engine.exportAnalysisCacheDiagnostics) throw new Error('분석 캐시 진단 내보내기를 지원하지 않습니다.');
            const result = engine.exportAnalysisCacheDiagnostics();
            if (!result || !result.saved) throw new Error('분석 캐시 진단 파일을 저장하지 못했습니다.');
            feedback(`분석 캐시 진단 ${result.eventCount || 0}개 이벤트를 저장했습니다.`, 'export');
            return result;
        } catch (error) {
            feedback(error && error.message || '분석 캐시 진단 저장에 실패했습니다.', 'error');
            return null;
        } finally { if (button) button.disabled = false; }
    }
    async function runIntegrityAudit() {
        const button = byId('storageIntegrityAuditBtn');
        if (button) button.disabled = true;
        try {
            if (!serviceWorker.requestIntegrityAudit) throw new Error('이 브라우저에서는 셸 표본 검사를 지원하지 않습니다.');
            const result = await serviceWorker.requestIntegrityAudit({ sampleSize: Number(config.SW_INTEGRITY_AUDIT_SAMPLE_SIZE) || 12, timeoutMs: 15000 });
            render();
            const audit = result && result.report && result.report.periodicIntegrity;
            if (!audit) throw new Error('셸 표본 검사 결과를 받지 못했습니다.');
            if (audit.failed) throw new Error(`표본 ${audit.checked || 0}개 중 ${audit.failed}개를 복구하지 못했습니다.`);
            feedback(audit.repaired ? `표본 ${audit.checked}개를 검사하고 ${audit.repaired}개를 복구했습니다.` : `오프라인 셸 표본 ${audit.checked}개가 정상입니다.`, 'action');
            return result;
        } catch (error) {
            feedback(error && error.message || '셸 표본 검사에 실패했습니다.', 'error');
            return null;
        } finally { if (button) button.disabled = false; }
    }
    async function retryFailedIntegrityAssets() {
        const button = byId('storageIntegrityRetryBtn');
        if (button) button.disabled = true;
        try {
            if (!serviceWorker.retryFailedIntegrityAssets) throw new Error('실패 자산 재시도를 지원하지 않습니다.');
            const result = await serviceWorker.retryFailedIntegrityAssets({ timeoutMs: 15000 });
            render();
            const repaired = Number(result && result.repaired) || 0;
            const failed = Number(result && result.failed) || 0;
            if (failed) throw new Error(`실패 자산 ${failed}개를 아직 복구하지 못했습니다.`);
            feedback(repaired ? `실패 자산 ${repaired}개를 다시 복구했습니다.` : '재시도할 실패 자산이 없습니다.', 'action');
            return result;
        } catch (error) {
            feedback(error && error.message || '실패 자산 재시도에 실패했습니다.', 'error');
            return null;
        } finally { if (button) button.disabled = false; }
    }
    async function clearIntegrityAuditHistory() {
        const button = byId('storageIntegrityClearBtn');
        if (!await confirmDestructive({ title: '셸 감사 이력 초기화', message: '오프라인 셸 감사 기록만 삭제합니다. 오프라인 캐시와 프로젝트 데이터는 유지됩니다.', confirmLabel: '감사 이력 초기화', trigger: button })) return null;
        if (button) button.disabled = true;
        try {
            if (!serviceWorker.clearIntegrityAuditHistory) throw new Error('감사 이력 초기화를 지원하지 않습니다.');
            const result = await serviceWorker.clearIntegrityAuditHistory({ clearBackoff: false, timeoutMs: 10000 });
            render();
            feedback(`셸 감사 이력 ${Number(result && result.clearedHistory) || 0}건을 초기화했습니다.`, 'action');
            return result;
        } catch (error) {
            feedback(error && error.message || '감사 이력 초기화에 실패했습니다.', 'error');
            return null;
        } finally { if (button) button.disabled = false; }
    }
    async function cleanupAnalysisCache() {
        const button = byId('analysisCacheCleanupBtn');
        if (!await confirmDestructive({ title: '분석 캐시 전체 정리', message: '저장된 분석 결과를 모두 삭제합니다. 프로젝트와 원본 파일은 유지되며 다음 분석에서 결과를 다시 계산합니다.', confirmLabel: '전체 캐시 정리', trigger: button })) return null;
        if (button) button.disabled = true;
        try {
            const engine = global.AIShortsEngineKernel || {};
            const before = engine.getHealthReport ? engine.getHealthReport().cache : null;
            const after = engine.clearAnalysisCache ? await engine.clearAnalysisCache() : null;
            await refreshAnalysisCacheDashboard();
            render();
            feedback(before && before.size ? `분석 캐시 ${before.size}개를 정리했습니다.` : '정리할 분석 캐시가 없습니다.', 'action');
            return after;
        } finally { if (button) button.disabled = false; }
    }
    async function repairOfflineShell() {
        const button = byId('storageHealthRepairBtn');
        const autoButton = byId('storageHealthAutoRepairBtn');
        if (button) button.disabled = true;
        if (autoButton) autoButton.disabled = true;
        try {
            if (!serviceWorker.repairCache) throw new Error('이 브라우저에서는 오프라인 기능 복구를 지원하지 않습니다.');
            const result = await serviceWorker.repairCache({ timeoutMs: 15000 });
            const report = result && result.report;
            const failed = report ? report.requiredMissing.length + report.repairFailed.length : 1;
            if (failed) throw new Error(`오프라인 기능 ${failed}개를 복구하지 못했습니다.`);
            await refresh({ force: true, source: 'repair', includeDiagnostics: advancedDialog && !advancedDialog.hidden });
            feedback(report && report.repaired.length ? `오프라인 기능 ${report.repaired.length}개를 복구했습니다.` : '오프라인 사용 준비 상태가 정상입니다.', 'action');
            return result;
        } catch (error) {
            feedback(error && error.message || '오프라인 기능 복구에 실패했습니다.', 'error');
            return null;
        } finally {
            if (button) button.disabled = false;
            if (autoButton) autoButton.disabled = false;
        }
    }
    async function cleanup() {
        const button = byId('storageHealthCleanupBtn');
        const autoButton = byId('storageHealthAutoRepairBtn');
        if (!await confirmDestructive({ title: '오래된 저장소 정리', message: '오래된 세션 백업과 임시 캐시를 최대 2개 정리합니다. 현재 프로젝트, 원본 파일, 최신 복구 데이터는 유지됩니다.', confirmLabel: '안전하게 정리', trigger: button || autoButton })) return null;
        if (button) button.disabled = true;
        if (autoButton) autoButton.disabled = true;
        try {
            const session = global.AIShortsSessionContinuity && global.AIShortsSessionContinuity.getStatus ? global.AIShortsSessionContinuity.getStatus() : {};
            const result = storage.cleanup ? await storage.cleanup({
                reason: 'storage-health-panel',
                currentSessionKey: session.storageKey,
                preserveKeys: session.storageKey ? [session.storageKey] : [],
                maxRemovals: 2
            }) : null;
            await refresh({ force: true, source: 'cleanup', includeDiagnostics: advancedDialog && !advancedDialog.hidden });
            const removed = (result && result.local && result.local.removedCount || 0) + (result && result.caches && result.caches.removedCount || 0);
            feedback(removed ? `오래된 저장소 ${removed}개를 정리했습니다.` : '정리할 오래된 저장소가 없습니다.', 'action');
            return result;
        } catch (error) {
            feedback(error && error.message || '저장소 정리에 실패했습니다.', 'error');
            return null;
        } finally {
            if (button) button.disabled = false;
            if (autoButton) autoButton.disabled = false;
        }
    }
    async function runAutomaticRepair() {
        const model = lastHealthModel || deriveHealthModel(lastStorageSnapshot || {}, serviceWorker.getStatus ? serviceWorker.getStatus() : null);
        if (model.action === 'cleanup') return cleanup();
        if (model.action === 'repair') return repairOfflineShell();
        feedback('현재 자동으로 해결할 문제가 없습니다.', 'action');
        return null;
    }
    function install() {
        build();
        refresh({ force: true, source: 'install', includeDiagnostics: false });
        ['ai-shorts-service-worker-status', 'ai-shorts-session-saved', 'ai-shorts-session-migrated', 'ai-shorts-session-backup-recovered', 'ai-shorts-session-recovery-history', 'ai-shorts-storage-status'].forEach(name => {
            document.addEventListener(name, event => render(name === 'ai-shorts-storage-status' && event.detail || null));
        });
    }
    global.AIShortsStorageHealthPanel = Object.freeze({
        build,
        render,
        refresh,
        cleanup,
        runAutomaticRepair,
        openAdvancedDiagnostics,
        closeAdvancedDiagnostics,
        confirmDestructive,
        exportAnalysisDiagnostics,
        exportIntegrityDiagnostics,
        refreshAnalysisCacheEntries,
        refreshAnalysisCacheMaintenance,
        refreshAnalysisCacheDashboard,
        deleteSelectedAnalysisCacheEntry,
        deleteSelectedAnalysisCacheNamespaces,
        invalidateSelectedAnalysisCache,
        invalidateSelectedAnalysisCacheSignature,
        cleanupAnalysisCache,
        runIntegrityAudit,
        retryFailedIntegrityAssets,
        clearIntegrityAuditHistory,
        repairOfflineShell,
        formatBytes
    });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
    else install();
})(window);
