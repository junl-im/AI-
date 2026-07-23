// AI Shorts Studio v1.5.26 - storage, layered analysis cache, recovery, and scheduled integrity diagnostics
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
            '  <label class="storage-cache-entry-picker"><span>영구 캐시 항목</span><select id="analysisCacheEntrySelect" aria-label="삭제할 영구 분석 캐시 항목"><option value="">항목 없음</option></select></label>',
            '  <button id="analysisCacheEntryDeleteBtn" type="button" data-icon="close">선택 캐시 삭제</button>',
            '  <button id="analysisCacheCleanupBtn" type="button" data-icon="close">분석 캐시 전체 정리</button>',
            '  <button id="storageIntegrityAuditBtn" type="button" data-icon="diagnostics">셸 표본 검사</button>',
            '  <button id="storageIntegrityDiagnosticsBtn" type="button" data-icon="diagnostics">셸 감사 진단</button>',
            '  <button id="storageHealthRepairBtn" type="button" data-icon="retry">오프라인 셸 복구</button>',
            '  <button id="storageHealthCleanupBtn" type="button" data-icon="close">오래된 저장소 정리</button>',
            '</div>'
        ].join('');
        anchor.insertAdjacentElement('afterend', root);
        const refreshButton = byId('storageHealthRefreshBtn');
        const cleanupButton = byId('storageHealthCleanupBtn');
        const analysisDiagnosticsButton = byId('analysisCacheDiagnosticsBtn');
        const analysisCleanupButton = byId('analysisCacheCleanupBtn');
        const analysisEntryDeleteButton = byId('analysisCacheEntryDeleteBtn');
        const integrityDiagnosticsButton = byId('storageIntegrityDiagnosticsBtn');
        const integrityAuditButton = byId('storageIntegrityAuditBtn');
        const repairButton = byId('storageHealthRepairBtn');
        if (refreshButton) refreshButton.addEventListener('click', () => refresh({ force: true, source: 'manual' }));
        if (cleanupButton) cleanupButton.addEventListener('click', cleanup);
        if (analysisDiagnosticsButton) analysisDiagnosticsButton.addEventListener('click', exportAnalysisDiagnostics);
        if (analysisCleanupButton) analysisCleanupButton.addEventListener('click', cleanupAnalysisCache);
        if (analysisEntryDeleteButton) analysisEntryDeleteButton.addEventListener('click', deleteSelectedAnalysisCacheEntry);
        if (integrityDiagnosticsButton) integrityDiagnosticsButton.addEventListener('click', exportIntegrityDiagnostics);
        if (integrityAuditButton) integrityAuditButton.addEventListener('click', runIntegrityAudit);
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
        const persistentText = persistent.enabled ? ` · 영구 ${persistent.size || 0}/${persistent.effectiveMaxItems || persistent.maxItems || 0}${policy}` : (persistent.supported === false ? ' · 영구 미지원' : '');
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
            if (engine.refreshPersistentAnalysisCachePolicy) await engine.refreshPersistentAnalysisCachePolicy();
            await refreshAnalysisCacheEntries();
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
    async function refreshAnalysisCacheEntries() {
        const select = byId('analysisCacheEntrySelect');
        const button = byId('analysisCacheEntryDeleteBtn');
        if (!select) return [];
        const engine = global.AIShortsEngineKernel || {};
        const entries = engine.listPersistentAnalysisCacheEntries ? await engine.listPersistentAnalysisCacheEntries() : [];
        select.replaceChildren(...(entries.length ? entries : [{ token: '', bytes: 0, lastAccessAt: '' }]).map((entry, index) => {
            const option = document.createElement('option');
            option.value = entry.token || '';
            option.textContent = entry.token ? `${index + 1}. ${formatBytes(entry.bytes)} · ${entry.lastAccessAt ? new Date(entry.lastAccessAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '사용 시각 없음'}` : '항목 없음';
            option.disabled = !entry.token;
            return option;
        }));
        if (button) button.disabled = !entries.length;
        return entries;
    }
    async function deleteSelectedAnalysisCacheEntry() {
        const select = byId('analysisCacheEntrySelect');
        const button = byId('analysisCacheEntryDeleteBtn');
        const token = select && select.value || '';
        if (!token) { feedback('삭제할 영구 분석 캐시 항목이 없습니다.', 'warning'); return null; }
        if (button) button.disabled = true;
        try {
            const engine = global.AIShortsEngineKernel || {};
            const result = engine.deletePersistentAnalysisCacheEntry ? await engine.deletePersistentAnalysisCacheEntry(token) : null;
            await refreshAnalysisCacheEntries();
            render();
            if (!result || !result.removed) throw new Error('선택한 캐시 항목을 찾지 못했습니다.');
            feedback(`영구 분석 캐시 ${formatBytes(result.bytes || 0)}를 삭제했습니다.`, 'action');
            return result;
        } catch (error) {
            feedback(error && error.message || '선택 캐시 삭제에 실패했습니다.', 'error');
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

    async function cleanupAnalysisCache() {
        const button = byId('analysisCacheCleanupBtn');
        if (button) button.disabled = true;
        try {
            const engine = global.AIShortsEngineKernel || {};
            const before = engine.getHealthReport ? engine.getHealthReport().cache : null;
            const after = engine.clearAnalysisCache ? await engine.clearAnalysisCache() : null;
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
    global.AIShortsStorageHealthPanel = Object.freeze({ build, render, refresh, cleanup, exportAnalysisDiagnostics, exportIntegrityDiagnostics, refreshAnalysisCacheEntries, deleteSelectedAnalysisCacheEntry, cleanupAnalysisCache, runIntegrityAudit, repairOfflineShell, formatBytes });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
    else install();
})(window);
