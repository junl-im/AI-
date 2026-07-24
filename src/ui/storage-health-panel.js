// AI Shorts Studio v1.5.29 - selective cache, recovery, and service worker audit controls
'use strict';
(function bootStorageHealthPanel(global) {
    if (global.AIShortsStorageHealthPanel) return;
    const storage = global.AIShortsStorageManager || {};
    const serviceWorker = global.AIShortsServiceWorkerRegistration || {};
    const config = global.AIShortsRuntimeConfig || {};
    let root = null;
    let refreshPromise = null;

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
    function build() {
        if (root) return root;
        const sessionPanel = byId('sessionContinuityPanel');
        const anchor = sessionPanel || document.querySelector('.start-command-panel') || document.querySelector('.studio-hero');
        if (!anchor) return null;
        root = document.createElement('section');
        root.id = 'storageHealthPanel';
        root.className = 'storage-health-panel';
        root.dataset.level = 'unknown';
        root.setAttribute('aria-label', '브라우저 저장소 및 오프라인 진단');
        root.innerHTML = [
            '<div class="storage-health-copy">',
            '  <span class="storage-health-icon studio-icon" data-icon="diagnostics" aria-hidden="true"></span>',
            '  <div><strong>저장소 · 오프라인 진단</strong><small id="storageHealthSummary">저장 공간과 서비스워커 상태를 확인하고 있습니다.</small></div>',
            '</div>',
            '<div class="storage-health-metrics">',
            '  <span><small>브라우저 저장소</small><strong id="storageUsageMetric">확인 중</strong></span>',
            '  <span><small>로컬 설정·세션</small><strong id="storageLocalMetric">확인 중</strong></span>',
            '  <span><small>오프라인 셸</small><strong id="storageSwMetric">확인 중</strong></span>',
            '  <span><small>세션 복구</small><strong id="storageSessionMetric">확인 중</strong></span>',
            '  <span><small>분석 캐시</small><strong id="analysisCacheMetric">확인 중</strong></span>',
            '</div>',
            '<div class="storage-health-actions">',
            '  <button id="storageHealthRefreshBtn" type="button" data-icon="retry">다시 확인</button>',
            '  <button id="analysisCacheDiagnosticsBtn" type="button" data-icon="diagnostics">분석 진단 저장</button>',
            '  <label class="storage-cache-entry-picker"><span>영구 캐시 항목 (복수 선택)</span><select id="analysisCacheEntrySelect" multiple size="3" aria-label="삭제할 영구 분석 캐시 항목 복수 선택"><option value="">항목 없음</option></select></label>',
            '  <button id="analysisCacheEntryDeleteBtn" type="button" data-icon="close">선택 캐시 삭제</button>',
            '  <label class="storage-cache-entry-picker storage-cache-filter-picker"><span>조건별 캐시 정리</span><select id="analysisCacheInvalidationSelect" aria-label="무효화할 분석 캐시 조건"><option value="balanced">균형 분석</option><option value="performance">속도 우선</option><option value="quality">품질 우선</option><option value="legacy-contract">이전 분석 계약</option></select></label>',
            '  <button id="analysisCacheInvalidateBtn" type="button" data-icon="close">조건 캐시 정리</button>',
            '  <label class="storage-cache-entry-picker storage-cache-filter-picker"><span>옵션 signature 정리</span><select id="analysisCacheSignatureSelect" aria-label="정리할 분석 옵션 signature"><option value="">signature 없음</option></select></label>',
            '  <button id="analysisCacheSignatureDeleteBtn" type="button" data-icon="close">signature 캐시 정리</button>',
            '  <button id="analysisCacheCleanupBtn" type="button" data-icon="close">분석 캐시 전체 정리</button>',
            '  <button id="storageIntegrityAuditBtn" type="button" data-icon="diagnostics">셸 표본 검사</button>',
            '  <button id="storageIntegrityDiagnosticsBtn" type="button" data-icon="diagnostics">셸 감사 진단</button>',
            '  <button id="storageIntegrityRetryBtn" type="button" data-icon="retry">실패 자산 재시도</button>',
            '  <button id="storageIntegrityClearBtn" type="button" data-icon="close">감사 이력 초기화</button>',
            '  <button id="storageHealthRepairBtn" type="button" data-icon="retry">오프라인 셸 복구</button>',
            '  <button id="storageHealthCleanupBtn" type="button" data-icon="close">오래된 저장소 정리</button>',
            '</div>',
            '<section class="analysis-cache-maintenance" aria-label="분석 캐시 namespace와 정리 이력">',
            '  <div class="analysis-cache-namespace-card">',
            '    <div><strong>분석 namespace 상태</strong><small id="analysisCacheNamespaceSummary">현재·이전 계약 캐시를 확인하고 있습니다.</small></div>',
            '    <label class="storage-cache-entry-picker"><span>정리할 이전 namespace</span><select id="analysisCacheNamespaceSelect" multiple size="3" aria-label="정리할 이전 분석 캐시 namespace 복수 선택"><option value="">이전 namespace 없음</option></select></label>',
            '    <button id="analysisCacheNamespaceDeleteBtn" type="button" data-icon="close">선택 namespace 정리</button>',
            '  </div>',
            '  <div class="analysis-cache-trend-card"><strong>namespace 저장 비용 추세</strong><small id="analysisCacheTrendSummary">저장 비용 변화를 확인하고 있습니다.</small><ol id="analysisCacheStorageTrend"><li>추세 기록이 없습니다.</li></ol></div>',
            '  <div class="analysis-cache-history-card"><strong>최근 캐시 정리 이력</strong><ol id="analysisCacheMaintenanceHistory"><li>정리 이력이 없습니다.</li></ol></div>',
            '</section>'
        ].join('');
        anchor.insertAdjacentElement('afterend', root);
        const refreshButton = byId('storageHealthRefreshBtn');
        const cleanupButton = byId('storageHealthCleanupBtn');
        const analysisDiagnosticsButton = byId('analysisCacheDiagnosticsBtn');
        const analysisCleanupButton = byId('analysisCacheCleanupBtn');
        const analysisEntryDeleteButton = byId('analysisCacheEntryDeleteBtn');
        const analysisInvalidateButton = byId('analysisCacheInvalidateBtn');
        const analysisSignatureDeleteButton = byId('analysisCacheSignatureDeleteBtn');
        const analysisNamespaceDeleteButton = byId('analysisCacheNamespaceDeleteBtn');
        const integrityDiagnosticsButton = byId('storageIntegrityDiagnosticsBtn');
        const integrityAuditButton = byId('storageIntegrityAuditBtn');
        const integrityRetryButton = byId('storageIntegrityRetryBtn');
        const integrityClearButton = byId('storageIntegrityClearBtn');
        const repairButton = byId('storageHealthRepairBtn');
        if (refreshButton) refreshButton.addEventListener('click', () => refresh({ force: true, source: 'manual' }));
        if (cleanupButton) cleanupButton.addEventListener('click', cleanup);
        if (analysisDiagnosticsButton) analysisDiagnosticsButton.addEventListener('click', exportAnalysisDiagnostics);
        if (analysisCleanupButton) analysisCleanupButton.addEventListener('click', cleanupAnalysisCache);
        if (analysisEntryDeleteButton) analysisEntryDeleteButton.addEventListener('click', deleteSelectedAnalysisCacheEntry);
        if (analysisInvalidateButton) analysisInvalidateButton.addEventListener('click', invalidateSelectedAnalysisCache);
        if (analysisSignatureDeleteButton) analysisSignatureDeleteButton.addEventListener('click', invalidateSelectedAnalysisCacheSignature);
        if (analysisNamespaceDeleteButton) analysisNamespaceDeleteButton.addEventListener('click', deleteSelectedAnalysisCacheNamespaces);
        if (integrityDiagnosticsButton) integrityDiagnosticsButton.addEventListener('click', exportIntegrityDiagnostics);
        if (integrityAuditButton) integrityAuditButton.addEventListener('click', runIntegrityAudit);
        if (integrityRetryButton) integrityRetryButton.addEventListener('click', retryFailedIntegrityAssets);
        if (integrityClearButton) integrityClearButton.addEventListener('click', clearIntegrityAuditHistory);
        if (repairButton) repairButton.addEventListener('click', repairOfflineShell);
        return root;
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
        const sw = serviceWorker.getStatus ? serviceWorker.getStatus() : null;
        const session = global.AIShortsSessionContinuity && global.AIShortsSessionContinuity.getStatus ? global.AIShortsSessionContinuity.getStatus() : null;
        const engine = global.AIShortsEngineKernel && global.AIShortsEngineKernel.getHealthReport ? global.AIShortsEngineKernel.getHealthReport() : null;
        const usageMetric = byId('storageUsageMetric');
        const localMetric = byId('storageLocalMetric');
        const swMetric = byId('storageSwMetric');
        const sessionMetric = byId('storageSessionMetric');
        const analysisMetric = byId('analysisCacheMetric');
        const summary = byId('storageHealthSummary');
        const ratioPercent = snapshot.quota ? Math.round((snapshot.ratio || 0) * 100) : 0;
        if (usageMetric) usageMetric.textContent = snapshot.quota ? `${formatBytes(snapshot.usage)} / ${formatBytes(snapshot.quota)} · ${ratioPercent}%` : formatBytes(snapshot.usage || snapshot.localStorageBytes || 0);
        if (localMetric) localMetric.textContent = `${formatBytes(snapshot.localStorageBytes || 0)} · 캐시 ${snapshot.cacheCount || 0}개`;
        if (swMetric) swMetric.textContent = serviceWorkerText(sw);
        if (sessionMetric) sessionMetric.textContent = sessionText(session);
        if (analysisMetric) analysisMetric.textContent = analysisCacheText(engine && engine.cache);
        const level = snapshot.level || 'unknown';
        root.dataset.level = level;
        if (summary) {
            if (level === 'critical') summary.textContent = '저장 공간이 거의 찼습니다. 오래된 백업과 캐시를 정리하세요.';
            else if (level === 'warning') summary.textContent = '저장 공간 사용량이 높습니다. 내보내기 전에 여유 공간을 확인하세요.';
            else if (sw && sw.update && sw.update.state === 'error') summary.textContent = `오프라인 업데이트 확인 실패 · ${sw.update.lastError || '네트워크를 확인하세요.'}`;
            else if (sw && sw.repair && sw.repair.state === 'error') summary.textContent = sw.repair.lastError || '오프라인 셸 일부를 복구하지 못했습니다.';
            else if (sw && sw.integrityAudit && sw.integrityAudit.state === 'error') summary.textContent = sw.integrityAudit.lastError || '오프라인 셸 표본 무결성 검사에 실패했습니다.';
            else if (sw && sw.installReport && sw.installReport.rollbackPreserved && sw.installReport.rollbackPreserved.length) summary.textContent = '새 오프라인 셸 검증이 실패해 이전 정상 캐시를 보존했습니다.';
            else if (sw && sw.installReport && sw.installReport.integrity && (sw.installReport.integrity.missing.length || sw.installReport.integrity.invalid.length || sw.installReport.integrity.corrupted.length)) summary.textContent = `오프라인 셸 무결성 문제 ${sw.installReport.integrity.missing.length + sw.installReport.integrity.invalid.length + sw.installReport.integrity.corrupted.length}개를 감지했습니다.`;
            else if (sw && sw.installReport && sw.installReport.failed) summary.textContent = `오프라인 셸 일부 ${sw.installReport.failed}개를 캐시하지 못했지만 핵심 기능은 유지됩니다.`;
            else summary.textContent = '저장 공간, 세션 백업, 오프라인 셸이 정상 범위입니다.';
        }
        if (document.body) document.body.dataset.storageHealth = level;
    }
    async function refresh(options) {
        if (refreshPromise) return refreshPromise;
        const opts = options || {};
        build();
        refreshPromise = Promise.resolve(storage.estimate ? storage.estimate({ force: Boolean(opts.force) }) : storage.status && storage.status() || {}).then(async snapshot => {
            const engine = global.AIShortsEngineKernel || {};
            const cacheSnapshot = engine.refreshPersistentAnalysisCachePolicy ? await engine.refreshPersistentAnalysisCachePolicy() : null;
            await refreshAnalysisCacheEntries(cacheSnapshot);
            await refreshAnalysisCacheMaintenance(cacheSnapshot);
            if (serviceWorker.requestInstallReport) serviceWorker.requestInstallReport();
            render(snapshot);
            return snapshot;
        }).catch(error => {
            const summary = byId('storageHealthSummary');
            if (summary) summary.textContent = error && error.message || '저장소 상태를 확인하지 못했습니다.';
            return null;
        }).finally(() => { refreshPromise = null; });
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
        } finally {
            if (button) button.disabled = false;
        }
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
        } finally {
            if (button) button.disabled = false;
        }
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
        if (button) button.disabled = true;
        try {
            const engine = global.AIShortsEngineKernel || {};
            const before = engine.getHealthReport ? engine.getHealthReport().cache : null;
            const after = engine.clearAnalysisCache ? await engine.clearAnalysisCache() : null;
            await refreshAnalysisCacheDashboard();
            render();
            feedback(before && before.size ? `분석 캐시 ${before.size}개를 정리했습니다.` : '정리할 분석 캐시가 없습니다.', 'action');
            return after;
        } finally {
            if (button) button.disabled = false;
        }
    }
    async function repairOfflineShell() {
        const button = byId('storageHealthRepairBtn');
        if (button) button.disabled = true;
        try {
            if (!serviceWorker.repairCache) throw new Error('이 브라우저에서는 오프라인 셸 복구를 지원하지 않습니다.');
            const result = await serviceWorker.repairCache({ timeoutMs: 15000 });
            render();
            const report = result && result.report;
            const failed = report ? report.requiredMissing.length + report.repairFailed.length : 1;
            if (failed) throw new Error(`오프라인 셸 ${failed}개를 복구하지 못했습니다.`);
            feedback(report && report.repaired.length ? `오프라인 셸 ${report.repaired.length}개를 복구했습니다.` : '오프라인 셸 무결성이 정상입니다.', 'action');
            return result;
        } catch (error) {
            feedback(error && error.message || '오프라인 셸 복구에 실패했습니다.', 'error');
            return null;
        } finally {
            if (button) button.disabled = false;
        }
    }
    async function cleanup() {
        const button = byId('storageHealthCleanupBtn');
        if (button) button.disabled = true;
        try {
            const session = global.AIShortsSessionContinuity && global.AIShortsSessionContinuity.getStatus ? global.AIShortsSessionContinuity.getStatus() : {};
            const result = storage.cleanup ? await storage.cleanup({
                reason: 'storage-health-panel',
                currentSessionKey: session.storageKey,
                preserveKeys: session.storageKey ? [session.storageKey] : [],
                maxRemovals: 2
            }) : null;
            render(result && result.snapshot);
            const removed = (result && result.local && result.local.removedCount || 0) + (result && result.caches && result.caches.removedCount || 0);
            feedback(removed ? `오래된 저장소 ${removed}개를 정리했습니다.` : '정리할 오래된 저장소가 없습니다.', 'action');
        } catch (error) {
            feedback(error && error.message || '저장소 정리에 실패했습니다.', 'error');
        } finally {
            if (button) button.disabled = false;
        }
    }
    function install() {
        build();
        refresh({ force: true, source: 'install' });
        ['ai-shorts-service-worker-status', 'ai-shorts-session-saved', 'ai-shorts-session-migrated', 'ai-shorts-session-backup-recovered', 'ai-shorts-session-recovery-history', 'ai-shorts-storage-status'].forEach(name => {
            document.addEventListener(name, event => render(name === 'ai-shorts-storage-status' && event.detail || null));
        });
    }
    global.AIShortsStorageHealthPanel = Object.freeze({ build, render, refresh, cleanup, exportAnalysisDiagnostics, exportIntegrityDiagnostics, refreshAnalysisCacheEntries, refreshAnalysisCacheMaintenance, refreshAnalysisCacheDashboard, deleteSelectedAnalysisCacheEntry, deleteSelectedAnalysisCacheNamespaces, invalidateSelectedAnalysisCache, invalidateSelectedAnalysisCacheSignature, cleanupAnalysisCache, runIntegrityAudit, retryFailedIntegrityAssets, clearIntegrityAuditHistory, repairOfflineShell, formatBytes });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
    else install();
})(window);
