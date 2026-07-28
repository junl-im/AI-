// AI Shorts Studio v1.6.23 - configurable timing retention, searchable history, and support diagnostics
'use strict';

(function installAnalysisController(global) {
    function requireFunction(value, name) {
        if (typeof value !== 'function') throw new Error(`Analysis controller requires ${name}`);
        return value;
    }

    function createAnalysisController(dependencies) {
        const deps = dependencies || {};
        const state = deps.state || {};
        const config = deps.config || {};
        const store = deps.store || {};
        const elements = deps.elements || {};
        const audioExtractor = deps.audioExtractor || {};
        const motionAnalyzer = deps.motionAnalyzer || {};
        const engineKernel = deps.engineKernel || {};
        const operationCoordinator = deps.operationCoordinator || {};
        const downloadService = deps.downloadService || global.AIShortsDownloadService || {};
        function resolveStorage() {
            if (deps.storage) return deps.storage;
            try {
                return global.localStorage || null;
            } catch (error) {
                if (store && typeof store.addDiagnostic === 'function') {
                    store.addDiagnostic({
                        type: 'analysis-timing-storage-unavailable',
                        message: String(error && error.message || error || 'storage unavailable')
                    });
                }
                return null;
            }
        }
        const storage = resolveStorage();
        const getActiveMediaElement = requireFunction(deps.getActiveMediaElement, 'getActiveMediaElement');
        const activateFlowTab = requireFunction(deps.activateFlowTab, 'activateFlowTab');
        const updateButtons = requireFunction(deps.updateButtons, 'updateButtons');
        const setProgress = requireFunction(deps.setProgress, 'setProgress');
        const toast = requireFunction(deps.toast, 'toast');
        const ensureMotionSmartReframe = requireFunction(deps.ensureMotionSmartReframe, 'ensureMotionSmartReframe');
        const getAutoCutOptions = requireFunction(deps.getAutoCutOptions, 'getAutoCutOptions');
        const buildAutoCutTimeline = requireFunction(deps.buildAutoCutTimeline, 'buildAutoCutTimeline');
        const createRecommendations = requireFunction(deps.createRecommendations, 'createRecommendations');
        const createFallbackAudioAnalysis = requireFunction(deps.createFallbackAudioAnalysis, 'createFallbackAudioAnalysis');
        const beginOperation = requireFunction(deps.beginOperation, 'beginOperation');
        const assertOperation = requireFunction(deps.assertOperation, 'assertOperation');
        const finishOperation = requireFunction(deps.finishOperation, 'finishOperation');
        const isAbortError = requireFunction(deps.isAbortError, 'isAbortError');

        let activeToken = null;
        let activePromise = null;
        let disposed = false;
        let lastTimingReport = null;
        const timingHistoryKey = String(config.ANALYSIS_TIMING_HISTORY_KEY || 'ai-shorts-analysis-timing-history-v1');
        const timingHistoryDefaultLimit = Math.max(2, Math.min(30, Number(config.ANALYSIS_TIMING_HISTORY_LIMIT) || 12));
        const timingHistoryPolicyKey = String(config.ANALYSIS_TIMING_HISTORY_POLICY_KEY || 'ai-shorts-analysis-timing-history-policy-v1');
        const timingHistoryDefaultDays = Math.max(1, Math.min(365, Number(config.ANALYSIS_TIMING_HISTORY_RETENTION_DAYS) || 90));
        const timingHistorySchema = 'ai-shorts-analysis-timing-history';
        const timingHistorySchemaVersion = Math.max(2, Number(config.ANALYSIS_TIMING_HISTORY_SCHEMA_VERSION) || 2);
        const timingDiagnosticsSchema = 'ai-shorts-analysis-timing-diagnostics';
        const timingDiagnosticsSchemaVersion = Math.max(2, Number(config.ANALYSIS_DIAGNOSTICS_SCHEMA_VERSION) || 2);
        let historyFilter = '';
        let historyStatusFilter = 'all';
        const selectedHistoryIds = new Set();

        const timingLabels = Object.freeze({
            prepare: '작업 준비',
            metadata: '미디어 길이 확인',
            budget: '메모리 예산 계산',
            engine: '모듈형 엔진 분석',
            audio: '오디오 특징 분석',
            motion: '영상 움직임 분석',
            cuts: '자동 컷 계산',
            recommendations: '추천 후보 생성',
            finalize: '결과 정리'
        });

        function nowMs() {
            return global.performance && typeof global.performance.now === 'function' ? global.performance.now() : Date.now();
        }

        function safeText(value, limit) {
            return String(value == null ? '' : value).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, limit || 180);
        }

        function mediaIdentity(input) {
            const file = input && input.file || {};
            const meta = input && input.meta || {};
            const raw = [file.name || '', Number(file.size) || 0, Number(file.lastModified) || 0, file.type || '', Number(meta.duration) || 0].join('|');
            let hash = 2166136261;
            for (let index = 0; index < raw.length; index += 1) {
                hash ^= raw.charCodeAt(index);
                hash = Math.imul(hash, 16777619);
            }
            return Object.freeze({
                key: `media-${(hash >>> 0).toString(16).padStart(8, '0')}`,
                size: Math.max(0, Number(file.size) || 0),
                lastModified: Math.max(0, Number(file.lastModified) || 0),
                type: safeText(file.type || '', 80),
                duration: Math.max(0, Number(meta.duration) || 0)
            });
        }

        function safeTimingStage(value) {
            const input = value && typeof value === 'object' ? value : {};
            return Object.freeze({
                key: safeText(input.key || '', 40),
                label: safeText(input.label || input.key || '', 80),
                durationMs: Math.max(0, Number(input.durationMs) || 0),
                detail: safeText(input.detail || '', 120)
            });
        }

        function timingRecordId(input) {
            const raw = [input && input.mediaKey || '', input && input.completedAt || '', input && input.source || '', Number(input && input.totalMs) || 0].join('|');
            let hash = 2166136261;
            for (let index = 0; index < raw.length; index += 1) {
                hash ^= raw.charCodeAt(index);
                hash = Math.imul(hash, 16777619);
            }
            return `timing-${(hash >>> 0).toString(16).padStart(8, '0')}`;
        }

        function normalizeTimingHistoryPolicy(value) {
            const input = value && typeof value === 'object' ? value : {};
            return Object.freeze({
                schema: 'ai-shorts-analysis-timing-history-policy',
                schemaVersion: 1,
                maxItems: Math.max(2, Math.min(30, Math.round(Number(input.maxItems) || timingHistoryDefaultLimit))),
                retentionDays: Math.max(1, Math.min(365, Math.round(Number(input.retentionDays) || timingHistoryDefaultDays))),
                updatedAt: safeText(input.updatedAt || new Date().toISOString(), 40)
            });
        }

        function readTimingHistoryPolicy() {
            try {
                if (!storage || typeof storage.getItem !== 'function') return normalizeTimingHistoryPolicy({});
                const raw = storage.getItem(timingHistoryPolicyKey);
                return normalizeTimingHistoryPolicy(raw ? JSON.parse(raw) : {});
            } catch (_) { return normalizeTimingHistoryPolicy({}); }
        }

        function writeTimingHistoryPolicy(value) {
            const policy = normalizeTimingHistoryPolicy(Object.assign({}, value || {}, { updatedAt: new Date().toISOString() }));
            try {
                if (storage && typeof storage.setItem === 'function') storage.setItem(timingHistoryPolicyKey, JSON.stringify(policy));
            } catch (_) { /* optional local preference */ }
            state.analysisTimingHistoryPolicy = policy;
            return policy;
        }

        function applyTimingHistoryPolicy(history, policyValue) {
            const policy = normalizeTimingHistoryPolicy(policyValue || readTimingHistoryPolicy());
            const cutoff = Date.now() - (policy.retentionDays * 24 * 60 * 60 * 1000);
            return (Array.isArray(history) ? history : [])
                .map(safeTimingRecord)
                .filter(item => item.mediaKey && item.completedAt)
                .filter(item => {
                    const completed = new Date(item.completedAt).getTime();
                    return !Number.isFinite(completed) || completed >= cutoff;
                })
                .sort((a, b) => String(b.completedAt).localeCompare(String(a.completedAt)))
                .slice(0, policy.maxItems);
        }

        function safeTimingRecord(value) {
            const input = value && typeof value === 'object' ? value : {};
            const media = input.media && typeof input.media === 'object' ? input.media : {};
            const stages = (Array.isArray(input.stages) ? input.stages : []).map(safeTimingStage).filter(stage => stage.key).slice(0, 20);
            const bottleneck = input.bottleneck && typeof input.bottleneck === 'object' ? safeTimingStage(input.bottleneck) : null;
            const base = {
                version: 3,
                status: ['completed', 'failed', 'cancelled'].includes(input.status) ? input.status : 'failed',
                mediaKey: /^media-[a-f0-9]{8}$/i.test(String(input.mediaKey || '')) ? String(input.mediaKey).toLowerCase() : '',
                media: Object.freeze({
                    size: Math.max(0, Number(media.size) || 0),
                    lastModified: Math.max(0, Number(media.lastModified) || 0),
                    type: safeText(media.type || '', 80),
                    duration: Math.max(0, Number(media.duration) || 0)
                }),
                source: safeText(input.source || 'manual', 80),
                startedAt: safeText(input.startedAt || '', 40),
                completedAt: safeText(input.completedAt || '', 40),
                totalMs: Math.max(0, Number(input.totalMs) || 0),
                bottleneck,
                bottleneckRatio: Math.max(0, Math.min(1, Number(input.bottleneckRatio) || 0)),
                error: safeText(input.error || '', 180),
                stages: Object.freeze(stages)
            };
            base.id = /^timing-[a-f0-9]{8}$/i.test(String(input.id || '')) ? String(input.id).toLowerCase() : timingRecordId(base);
            return Object.freeze(base);
        }

        function migrateTimingHistoryEnvelope(value) {
            const input = Array.isArray(value) ? { version: 0, history: value } : value && typeof value === 'object' ? value : {};
            const sourceVersion = Math.max(0, Number(input.schemaVersion != null ? input.schemaVersion : input.version) || 0);
            const history = applyTimingHistoryPolicy(Array.isArray(input.history) ? input.history : [], readTimingHistoryPolicy());
            return Object.freeze({
                schema: timingHistorySchema,
                schemaVersion: timingHistorySchemaVersion,
                migratedFrom: sourceVersion && sourceVersion < timingHistorySchemaVersion ? sourceVersion : null,
                appVersion: safeText(input.appVersion || config.APP_VERSION || 'dev', 40),
                updatedAt: safeText(input.updatedAt || new Date().toISOString(), 40),
                history: Object.freeze(history)
            });
        }

        function readTimingHistoryEnvelope() {
            try {
                if (!storage || typeof storage.getItem !== 'function') return migrateTimingHistoryEnvelope({ history: [] });
                const rawText = storage.getItem(timingHistoryKey);
                const envelope = migrateTimingHistoryEnvelope(rawText ? JSON.parse(rawText) : { history: [] });
                if (envelope.migratedFrom !== null) writeTimingHistory(envelope.history);
                return envelope;
            } catch (_) { return migrateTimingHistoryEnvelope({ history: [] }); }
        }

        function readTimingHistory() {
            return readTimingHistoryEnvelope().history.slice();
        }

        function writeTimingHistory(history) {
            const safe = applyTimingHistoryPolicy(history, readTimingHistoryPolicy());
            const envelope = {
                schema: timingHistorySchema,
                schemaVersion: timingHistorySchemaVersion,
                appVersion: safeText(config.APP_VERSION || 'dev', 40),
                updatedAt: new Date().toISOString(),
                history: safe
            };
            try {
                if (storage && typeof storage.setItem === 'function') storage.setItem(timingHistoryKey, JSON.stringify(envelope));
            } catch (_) { /* local timing history is optional */ }
            state.analysisTimingHistory = Object.freeze(safe.slice());
            return safe;
        }

        function timingDirection(deltaPercent) {
            if (deltaPercent <= -5) return 'improved';
            if (deltaPercent >= 5) return 'regressed';
            return 'stable';
        }

        function buildTimingComparison(report, history) {
            const candidates = (Array.isArray(history) ? history : []).filter(item => item && item.status === 'completed' && item.totalMs > 0);
            const sameMedia = candidates.find(item => item.mediaKey && item.mediaKey === report.mediaKey) || null;
            const previous = sameMedia || candidates[0] || null;
            if (!previous) return null;
            const previousStages = new Map(previous.stages.map(stage => [stage.key, stage]));
            const stages = report.stages.map(stage => {
                const before = previousStages.get(stage.key) || null;
                const deltaMs = before ? stage.durationMs - before.durationMs : 0;
                const deltaPercent = before && before.durationMs > 0 ? (deltaMs / before.durationMs) * 100 : 0;
                return Object.freeze({
                    key: stage.key,
                    currentMs: stage.durationMs,
                    previousMs: before ? before.durationMs : 0,
                    deltaMs: Number(deltaMs.toFixed(1)),
                    deltaPercent: Number(deltaPercent.toFixed(1)),
                    direction: before ? timingDirection(deltaPercent) : 'new'
                });
            });
            const totalDeltaMs = report.totalMs - previous.totalMs;
            const totalDeltaPercent = previous.totalMs > 0 ? (totalDeltaMs / previous.totalMs) * 100 : 0;
            return Object.freeze({
                basis: sameMedia ? 'same-media' : 'recent',
                previousAt: previous.completedAt,
                previousTotalMs: previous.totalMs,
                totalDeltaMs: Number(totalDeltaMs.toFixed(1)),
                totalDeltaPercent: Number(totalDeltaPercent.toFixed(1)),
                direction: timingDirection(totalDeltaPercent),
                previousBottleneck: previous.bottleneck ? Object.freeze(Object.assign({}, previous.bottleneck)) : null,
                bottleneckChanged: Boolean(previous.bottleneck && report.bottleneck && previous.bottleneck.key !== report.bottleneck.key),
                stages: Object.freeze(stages)
            });
        }

        function createTimingSession(input, options) {
            const media = mediaIdentity(input);
            return {
                startedAt: nowMs(),
                wallStartedAt: new Date().toISOString(),
                fileName: input && input.file && input.file.name || '',
                mediaKey: media.key,
                media,
                source: options && options.source || 'manual',
                stages: [],
                active: Object.create(null),
                status: 'running'
            };
        }

        function beginTimingStage(session, key, label) {
            if (!session || !key) return;
            endTimingStage(session, key);
            session.active[key] = { key, label: label || timingLabels[key] || key, startedAt: nowMs() };
        }

        function endTimingStage(session, key, detail) {
            if (!session || !key || !session.active[key]) return null;
            const active = session.active[key];
            delete session.active[key];
            const durationMs = Math.max(0, nowMs() - active.startedAt);
            const stage = Object.freeze({
                key,
                label: active.label,
                durationMs: Number(durationMs.toFixed(1)),
                detail: String(detail || '')
            });
            session.stages.push(stage);
            return stage;
        }

        function closeOpenTimingStages(session) {
            if (!session) return;
            Object.keys(session.active).forEach(key => endTimingStage(session, key));
        }

        function formatTimingMs(value) {
            const ms = Math.max(0, Number(value) || 0);
            return ms >= 1000 ? `${(ms / 1000).toFixed(ms >= 10000 ? 1 : 2)}초` : `${Math.round(ms)}ms`;
        }

        function timingDeltaLabel(change) {
            if (!change || change.direction === 'new') return '신규';
            if (change.direction === 'stable') return '변화 적음';
            const percent = Math.abs(Number(change.deltaPercent != null ? change.deltaPercent : change.totalDeltaPercent) || 0).toFixed(1);
            return change.direction === 'improved' ? `${percent}% 단축` : `${percent}% 증가`;
        }

        function renderTimingReport(report) {
            if (!report) return;
            if (elements.analysisTimingPanel) elements.analysisTimingPanel.hidden = false;
            if (elements.analysisTimingSummary) {
                const bottleneck = report.bottleneck;
                elements.analysisTimingSummary.textContent = bottleneck
                    ? `총 ${formatTimingMs(report.totalMs)} · 병목 ${bottleneck.label} ${formatTimingMs(bottleneck.durationMs)}`
                    : `총 ${formatTimingMs(report.totalMs)}`;
                elements.analysisTimingSummary.dataset.status = report.status;
            }
            if (elements.analysisTimingDetail) {
                const measured = report.stages.length;
                const risk = report.bottleneckRatio >= 0.7 ? '한 단계 집중도가 높음' : report.bottleneckRatio >= 0.45 ? '주요 단계 확인 필요' : '단계 분산 양호';
                elements.analysisTimingDetail.textContent = `${measured}개 단계 측정 · ${risk} · ${report.status === 'completed' ? '완료' : report.status === 'cancelled' ? '취소' : '실패'}`;
            }
            if (elements.analysisTimingComparison) {
                const comparison = report.comparison;
                if (!comparison) {
                    elements.analysisTimingComparison.textContent = '비교 가능한 이전 분석 기록이 없습니다.';
                    elements.analysisTimingComparison.dataset.direction = 'none';
                } else {
                    const basis = comparison.basis === 'same-media' ? '동일 원본 직전 분석' : '최근 분석';
                    const change = timingDeltaLabel(comparison);
                    const bottleneck = comparison.bottleneckChanged && comparison.previousBottleneck && report.bottleneck
                        ? ` · 병목 ${comparison.previousBottleneck.label} → ${report.bottleneck.label}` : '';
                    elements.analysisTimingComparison.textContent = `${basis} 대비 ${change}${bottleneck}`;
                    elements.analysisTimingComparison.dataset.direction = comparison.direction;
                }
            }
            if (elements.analysisTimingExportBtn) elements.analysisTimingExportBtn.disabled = !report;
            if (elements.analysisTimingList) {
                elements.analysisTimingList.textContent = '';
                report.stages.forEach(stage => {
                    const row = global.document && global.document.createElement ? global.document.createElement('li') : null;
                    if (!row) return;
                    row.dataset.stage = stage.key;
                    row.dataset.bottleneck = report.bottleneck && report.bottleneck.key === stage.key ? 'true' : 'false';
                    const label = global.document.createElement('span');
                    const metrics = global.document.createElement('span');
                    const value = global.document.createElement('strong');
                    const delta = global.document.createElement('em');
                    const comparisonStage = report.comparison && report.comparison.stages.find(item => item.key === stage.key) || null;
                    label.textContent = stage.label;
                    metrics.className = 'analysis-timing-value';
                    value.textContent = formatTimingMs(stage.durationMs);
                    delta.textContent = comparisonStage ? timingDeltaLabel(comparisonStage) : '';
                    delta.dataset.direction = comparisonStage ? comparisonStage.direction : 'none';
                    metrics.append(value, delta);
                    row.append(label, metrics);
                    elements.analysisTimingList.appendChild(row);
                });
            }
        }

        function formatHistoryDate(value) {
            const date = new Date(value || 0);
            if (!Number.isFinite(date.getTime())) return '시간 미상';
            try { return date.toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }); }
            catch (_) { return date.toISOString().slice(0, 16).replace('T', ' '); }
        }

        function historyStatusLabel(status) {
            if (status === 'completed') return '완료';
            if (status === 'cancelled') return '취소';
            return '실패';
        }

        function historyMatches(record, query, status) {
            if (!record) return false;
            if (status && status !== 'all' && record.status !== status) return false;
            const needle = safeText(query || '', 100).toLowerCase();
            if (!needle) return true;
            const haystack = [record.id, record.mediaKey, record.source, record.status, record.completedAt, record.media && record.media.type, record.bottleneck && record.bottleneck.key, record.bottleneck && record.bottleneck.label].join(' ').toLowerCase();
            return haystack.includes(needle);
        }

        function filteredTimingHistory(query, status) {
            return readTimingHistory().filter(record => historyMatches(record, query == null ? historyFilter : query, status == null ? historyStatusFilter : status));
        }

        function renderTimingHistory() {
            const history = readTimingHistory();
            const filtered = filteredTimingHistory();
            if (history.length && elements.analysisTimingPanel) elements.analysisTimingPanel.hidden = false;
            if (elements.analysisTimingHistoryCount) elements.analysisTimingHistoryCount.textContent = `${filtered.length}/${history.length}건`;
            if (elements.analysisTimingHistoryClearBtn) elements.analysisTimingHistoryClearBtn.disabled = history.length === 0;
            if (elements.analysisTimingHistorySelectedExportBtn) {
                elements.analysisTimingHistorySelectedExportBtn.disabled = selectedHistoryIds.size === 0;
                elements.analysisTimingHistorySelectedExportBtn.textContent = selectedHistoryIds.size ? `선택 ${selectedHistoryIds.size}건 내보내기` : '선택 이력 내보내기';
            }
            const policy = readTimingHistoryPolicy();
            if (elements.analysisTimingHistoryRetentionDays) elements.analysisTimingHistoryRetentionDays.value = String(policy.retentionDays);
            if (elements.analysisTimingHistoryMaxItems) elements.analysisTimingHistoryMaxItems.value = String(policy.maxItems);
            if (elements.analysisTimingHistoryPolicyStatus) elements.analysisTimingHistoryPolicyStatus.textContent = `${policy.retentionDays}일 · 최대 ${policy.maxItems}건 · 오래된 기록 자동 정리`;
            if (elements.analysisTimingHistoryEmpty) {
                elements.analysisTimingHistoryEmpty.hidden = filtered.length > 0;
                elements.analysisTimingHistoryEmpty.textContent = history.length ? '검색 조건에 맞는 분석 이력이 없습니다.' : '저장된 분석 이력이 없습니다.';
            }
            if (!elements.analysisTimingHistoryList) return filtered;
            elements.analysisTimingHistoryList.textContent = '';
            filtered.forEach(record => {
                const row = global.document && global.document.createElement ? global.document.createElement('li') : null;
                if (!row) return;
                row.dataset.historyId = record.id;
                row.dataset.status = record.status;
                const select = global.document.createElement('input');
                select.type = 'checkbox';
                select.className = 'analysis-history-select';
                select.dataset.historySelect = record.id;
                select.checked = selectedHistoryIds.has(record.id);
                select.setAttribute('aria-label', `${formatHistoryDate(record.completedAt)} 분석 이력 선택`);
                const body = global.document.createElement('div');
                const title = global.document.createElement('strong');
                const detail = global.document.createElement('small');
                const remove = global.document.createElement('button');
                title.textContent = `${formatHistoryDate(record.completedAt)} · ${formatTimingMs(record.totalMs)} · ${historyStatusLabel(record.status)}`;
                const bottleneck = record.bottleneck ? `${record.bottleneck.label} ${formatTimingMs(record.bottleneck.durationMs)}` : '병목 없음';
                detail.textContent = `${record.mediaKey} · ${safeText(record.source || 'manual', 36)} · ${bottleneck}`;
                remove.type = 'button';
                remove.className = 'mini-action analysis-history-delete';
                remove.dataset.historyDelete = record.id;
                remove.setAttribute('aria-label', `${formatHistoryDate(record.completedAt)} 분석 이력 삭제`);
                remove.textContent = '삭제';
                body.append(title, detail);
                row.append(select, body, remove);
                elements.analysisTimingHistoryList.appendChild(row);
            });
            return filtered;
        }

        function setTimingHistoryFilter(query, status) {
            historyFilter = safeText(query || '', 100);
            historyStatusFilter = ['all', 'completed', 'failed', 'cancelled'].includes(status) ? status : historyStatusFilter;
            return renderTimingHistory();
        }

        function setTimingHistorySelection(id, selected) {
            const key = safeText(id || '', 40);
            if (!key) return 0;
            const exists = readTimingHistory().some(record => record.id === key);
            if (!exists) return selectedHistoryIds.size;
            if (selected) selectedHistoryIds.add(key);
            else selectedHistoryIds.delete(key);
            renderTimingHistory();
            return selectedHistoryIds.size;
        }

        function exportSelectedTimingHistory() {
            const history = readTimingHistory().filter(record => selectedHistoryIds.has(record.id));
            const payload = normalizeTimingDiagnostics({
                appVersion: safeText(config.APP_VERSION || 'dev', 40),
                generatedAt: new Date().toISOString(),
                current: null,
                history
            });
            const stamp = payload.generatedAt.replace(/[:.]/g, '-');
            const filename = `ai-shorts-analysis-timing-selected-${stamp}.json`;
            if (!history.length || !downloadService || typeof downloadService.saveBlob !== 'function' || typeof global.Blob !== 'function') return Object.freeze({ saved: false, filename, historyCount: history.length, payload });
            downloadService.saveBlob(new global.Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), filename);
            diagnostic({ type: 'analysis-timing-selected-export', historyCount: history.length });
            return Object.freeze({ saved: true, filename, historyCount: history.length, payload });
        }

        function deleteTimingHistoryEntry(id) {
            const key = String(id || '').toLowerCase();
            if (!/^timing-[a-f0-9]{8}$/.test(key)) return false;
            const history = readTimingHistory();
            const next = history.filter(record => record.id !== key);
            selectedHistoryIds.delete(key);
            if (next.length === history.length) return false;
            writeTimingHistory(next);
            if (lastTimingReport && timingRecordId(lastTimingReport) === key) {
                lastTimingReport = null;
                state.analysisTiming = null;
            }
            renderTimingHistory();
            diagnostic({ type: 'analysis-timing-history-delete', historyId: key, remaining: next.length });
            return true;
        }

        function clearTimingHistory() {
            const count = readTimingHistory().length;
            selectedHistoryIds.clear();
            if (!count) return 0;
            writeTimingHistory([]);
            renderTimingHistory();
            diagnostic({ type: 'analysis-timing-history-clear', removed: count });
            return count;
        }

        function updateTimingHistoryPolicy(value) {
            const before = readTimingHistory();
            const policy = writeTimingHistoryPolicy(value);
            const next = writeTimingHistory(before);
            renderTimingHistory();
            diagnostic({ type: 'analysis-timing-history-policy', retentionDays: policy.retentionDays, maxItems: policy.maxItems, removed: Math.max(0, before.length - next.length) });
            return Object.freeze({ policy, removed: Math.max(0, before.length - next.length), remaining: next.length });
        }

        function completeTimingSession(session, status, error) {
            if (!session || session.completedAt) return lastTimingReport;
            closeOpenTimingStages(session);
            const totalMs = Math.max(0, nowMs() - session.startedAt);
            const stages = session.stages.slice();
            const bottleneck = stages.reduce((best, stage) => !best || stage.durationMs > best.durationMs ? stage : best, null);
            const history = readTimingHistory();
            const baseReport = {
                version: 2,
                status: status || 'completed',
                fileName: session.fileName,
                mediaKey: session.mediaKey,
                media: session.media,
                source: session.source,
                startedAt: session.wallStartedAt,
                completedAt: new Date().toISOString(),
                totalMs: Number(totalMs.toFixed(1)),
                bottleneck: bottleneck ? Object.freeze(Object.assign({}, bottleneck)) : null,
                bottleneckRatio: bottleneck && totalMs > 0 ? Number((bottleneck.durationMs / totalMs).toFixed(3)) : 0,
                error: error ? String(error.message || error) : '',
                stages: Object.freeze(stages.map(stage => Object.freeze(Object.assign({}, stage))))
            };
            const report = Object.freeze(Object.assign(baseReport, { comparison: buildTimingComparison(baseReport, history) }));
            session.completedAt = report.completedAt;
            session.status = report.status;
            lastTimingReport = report;
            state.analysisTiming = report;
            writeTimingHistory([safeTimingRecord(report)].concat(history));
            renderTimingReport(report);
            renderTimingHistory();
            diagnostic({ type: 'analysis-timing', status: report.status, totalMs: report.totalMs, bottleneck: report.bottleneck && report.bottleneck.key || '', bottleneckMs: report.bottleneck && report.bottleneck.durationMs || 0, stageCount: report.stages.length, comparisonDirection: report.comparison && report.comparison.direction || 'none' });
            if (global.document) global.document.dispatchEvent(new CustomEvent('ai-shorts-analysis-timing', { detail: report }));
            return report;
        }

        function diagnostic(detail) {
            if (store.addDiagnostic) store.addDiagnostic(detail);
        }

        function waitForActiveMediaMetadata(token) {
            const media = getActiveMediaElement();
            if (!media) return Promise.resolve(0);
            const known = Number(media.duration) || Number(state.fileMeta && state.fileMeta.duration) || 0;
            if (known > 0 && Number.isFinite(known)) return Promise.resolve(known);
            const timeoutMs = Number(config.MEDIA_METADATA_WAIT_MS || 5000);
            return new Promise(resolve => {
                let timer = 0;
                let settled = false;
                const signal = token && token.signal || null;
                function cleanup() {
                    media.removeEventListener('loadedmetadata', finish);
                    media.removeEventListener('durationchange', finish);
                    media.removeEventListener('error', finish);
                    if (signal) signal.removeEventListener('abort', finish);
                    if (timer) global.clearTimeout(timer);
                }
                function finish() {
                    if (settled) return;
                    settled = true;
                    cleanup();
                    const duration = Number(media.duration) || 0;
                    if (duration > 0 && Number.isFinite(duration) && state.fileMeta) state.fileMeta.duration = duration;
                    resolve(duration);
                }
                media.addEventListener('loadedmetadata', finish, { once: true });
                media.addEventListener('durationchange', finish, { once: true });
                media.addEventListener('error', finish, { once: true });
                if (signal) signal.addEventListener('abort', finish, { once: true });
                timer = global.setTimeout(finish, timeoutMs);
            });
        }

        function reportLongMediaBudget(budget, inputMeta) {
            if (!budget) return;
            if (budget.longMedia) {
                setProgress(4, `${budget.label} · 분석 메모리 약 ${budget.estimatedAnalysisMemoryMb || 0}MB`);
                diagnostic({
                    type: 'long-media-budget',
                    duration: inputMeta.duration,
                    sizeMb: budget.sizeMb,
                    sampleRate: budget.analysisSampleRate,
                    estimatedMemoryMb: budget.estimatedAnalysisMemoryMb,
                    estimatedDecodeMemoryMb: budget.estimatedDecodeMemoryMb,
                    memoryRisk: budget.memoryRisk
                });
            }
            if (budget.hardBlock) {
                throw new Error(`이 파일은 브라우저 디코딩 예상 메모리가 약 ${budget.estimatedDecodeMemoryMb || 0}MB로 너무 큽니다. MP3·AAC로 변환하거나 파일을 나눠 다시 열어주세요.`);
            }
            if (budget.memoryRisk === 'high') {
                setProgress(4, `긴 파일 메모리 주의 · 디코딩 예상 약 ${budget.estimatedDecodeMemoryMb || 0}MB`);
                toast('긴 파일을 안전 모드로 분석합니다. 다른 무거운 탭을 닫으면 더 안정적입니다.', 'warning');
                if (elements.importStatus && !elements.importStatus.textContent.includes('메모리 주의')) elements.importStatus.textContent += ' · 메모리 주의';
                diagnostic({ type: 'decode-memory-warning', estimatedDecodeMemoryMb: budget.estimatedDecodeMemoryMb, sizeMb: budget.sizeMb, duration: budget.duration });
            }
        }

        async function analyzeWithKernel(input, token, reportProgress, timing) {
            const inputMeta = input.meta;
            beginTimingStage(timing, 'budget');
            const budget = engineKernel.createBudget ? engineKernel.createBudget(inputMeta, config) : null;
            reportLongMediaBudget(budget, inputMeta);
            endTimingStage(timing, 'budget', budget && budget.tier || 'default');
            beginTimingStage(timing, 'engine');
            const result = await engineKernel.analyzeMedia({
                file: input.file,
                fileKind: input.kind,
                fileUrl: input.url,
                fileMeta: inputMeta,
                config,
                budget,
                signal: token && token.signal || null,
                onProgress: reportProgress,
                onWarning: message => {
                    if (token && operationCoordinator.isCurrent && !operationCoordinator.isCurrent(token)) return;
                    toast(message, 'warning');
                    diagnostic({ type: 'engine-warning', message });
                },
                getAutoCutOptions
            });
            endTimingStage(timing, 'engine', result && result.engine && result.engine.mode || 'modular');
            assertOperation(token, '새 원본이 열려 이전 분석 결과를 폐기했습니다.');
            state.audioBuffer = result.audioBuffer;
            state.channelData = result.channelData;
            state.audioAnalysis = result.audioAnalysis;
            state.motionAnalysis = result.motionAnalysis;
            ensureMotionSmartReframe();
            state.autoCuts = result.autoCuts;
            state.waveformBins = result.waveformBins || [];
            state.fileMeta = Object.assign({}, state.fileMeta || {}, result.fileMeta || {});
            state.engineMeta = result.engine || { version: String(config.APP_VERSION || 'dev').replace(/^v/i, '') };
            if (engineKernel.auditRuntime) state.engineMeta.stability = engineKernel.auditRuntime(state);
            diagnostic({ type: 'engine-analysis', version: state.engineMeta.version, mode: state.engineMeta.mode, budget: state.engineMeta.budget && state.engineMeta.budget.tier });
        }

        async function analyzeWithFallback(input, token, reportProgress, timing) {
            let audioResult = null;
            beginTimingStage(timing, 'audio');
            try {
                audioResult = await audioExtractor.analyzeFileAudio(input.file, reportProgress, token && token.signal || null, {
                    maxSeconds: Number(config.MAX_ANALYSIS_SECONDS || 1800),
                    targetSampleRate: 8000,
                    retainDecoded: false,
                    retainChannelData: false
                });
                assertOperation(token);
            } catch (audioError) {
                if (isAbortError(audioError)) throw audioError;
                if (input.kind !== 'video') throw audioError;
                toast('비디오 오디오 디코딩이 제한되어 움직임 중심으로 분석합니다.');
                diagnostic({ type: 'audio-decode-fallback', message: audioError && audioError.message || String(audioError || '') });
            } finally {
                endTimingStage(timing, 'audio', audioResult ? 'decoded' : 'fallback');
            }
            if (audioResult) {
                state.audioBuffer = audioResult.decoded;
                state.channelData = audioResult.channelData;
                state.audioAnalysis = audioResult.analysis;
                state.waveformBins = audioResult.waveformBins;
                if (state.fileMeta) state.fileMeta.duration = Number(audioResult.analysis && audioResult.analysis.duration) || state.fileMeta.duration;
            } else {
                const media = getActiveMediaElement();
                state.audioAnalysis = createFallbackAudioAnalysis(Number(state.fileMeta && state.fileMeta.duration) || Number(media && media.duration) || 30);
                state.waveformBins = new Array(160).fill(0).map((_, index) => 0.18 + Math.sin(index * 0.29) * 0.08);
            }
            if (input.kind === 'video' && motionAnalyzer.analyzeVideoMotion) {
                beginTimingStage(timing, 'motion');
                state.motionAnalysis = await motionAnalyzer.analyzeVideoMotion(input.url, reportProgress, token && token.signal || null, { maxSamples: 120 });
                endTimingStage(timing, 'motion', `${state.motionAnalysis && state.motionAnalysis.samples && state.motionAnalysis.samples.length || 0} samples`);
                ensureMotionSmartReframe();
                assertOperation(token);
                if (state.fileMeta) state.fileMeta.duration = state.fileMeta.duration || state.motionAnalysis.duration;
            }
            setProgress(90, '자동 컷 포인트 계산 중');
            beginTimingStage(timing, 'cuts');
            buildAutoCutTimeline();
            endTimingStage(timing, 'cuts');
        }

        async function run(options) {
            const analysisOptions = Object.assign({ autoGenerate: false }, options || {});
            if (disposed || !state.file) return false;
            const input = {
                file: state.file,
                kind: state.fileKind,
                url: state.fileUrl,
                meta: Object.assign({}, state.fileMeta || {})
            };
            const timing = createTimingSession(input, analysisOptions);
            beginTimingStage(timing, 'prepare');
            const token = beginOperation('analysis', { fileName: input.file.name, source: analysisOptions.source || 'manual' });
            activeToken = token;
            state.isAnalyzing = true;
            activateFlowTab('recommend', { reveal: true, force: true, source: analysisOptions.source || 'analysis-start' });
            state.recommendations = [];
            state.selectedRecommendationId = '';
            updateButtons();
            setProgress(3, '분석 시작');
            endTimingStage(timing, 'prepare');
            let finalStatus = 'failed';
            let finalError = null;
            const reportProgress = (percent, message) => {
                if (token && operationCoordinator.isCurrent && !operationCoordinator.isCurrent(token)) return;
                setProgress(percent, message);
            };
            try {
                setProgress(2, '미디어 길이 확인 중');
                beginTimingStage(timing, 'metadata');
                await waitForActiveMediaMetadata(token);
                endTimingStage(timing, 'metadata');
                assertOperation(token);
                input.meta = Object.assign({}, state.fileMeta || {});
                if (engineKernel.analyzeMedia) await analyzeWithKernel(input, token, reportProgress, timing);
                else await analyzeWithFallback(input, token, reportProgress, timing);
                assertOperation(token);
                if (analysisOptions.autoGenerate) {
                    setProgress(92, '모듈형 추천 엔진 계산 중');
                    beginTimingStage(timing, 'recommendations');
                    createRecommendations({ autoSelect: false });
                    endTimingStage(timing, 'recommendations');
                    setProgress(100, '추천 완료');
                    toast('쇼츠 추천 구간을 만들었습니다.', 'success');
                    activateFlowTab('candidates', { reveal: true });
                } else {
                    setProgress(100, '분석 완료 · 추천 탭으로 이동');
                    toast('자동 분석 완료 · 추천 탭에서 후보를 생성하세요.', 'success');
                    activateFlowTab('recommend', { reveal: true });
                }
                finishOperation(token, 'analysis-complete');
                finalStatus = 'completed';
                return true;
            } catch (error) {
                finalError = error;
                if (isAbortError(error)) {
                    finalStatus = 'cancelled';
                    setProgress(0, '분석 취소됨');
                    toast('자동 분석을 취소했습니다. 다음 작업 버튼에서 다시 시작할 수 있습니다.', 'warning');
                    diagnostic({ type: 'analysis-cancelled', message: error && error.message || '' });
                } else {
                    finalStatus = 'failed';
                    setProgress(0, '분석 실패');
                    toast(error && error.message || '분석에 실패했습니다.', 'error');
                    diagnostic({ type: 'analysis-error', message: error && error.message || String(error || '') });
                }
                return false;
            } finally {
                beginTimingStage(timing, 'finalize');
                const current = !token || !operationCoordinator.isCurrent || operationCoordinator.isCurrent(token);
                const operationState = operationCoordinator.snapshot ? operationCoordinator.snapshot() : null;
                const newerAnalysisActive = Boolean(operationState && operationState.active && operationState.active.some(item => item.channel === 'analysis' && (!token || item.id !== token.id)));
                if (current) finishOperation(token, 'analysis-finalized');
                if (activeToken === token) activeToken = null;
                if (state.file === input.file && !newerAnalysisActive) {
                    state.isAnalyzing = false;
                    updateButtons();
                }
                endTimingStage(timing, 'finalize');
                completeTimingSession(timing, finalStatus, finalError);
            }
        }

        function analyzeCurrentFile(options) {
            if (disposed || !state.file) return Promise.resolve(false);
            if (activePromise) return activePromise;
            activePromise = run(options).finally(() => { activePromise = null; });
            return activePromise;
        }

        function cancel(reason) {
            if (disposed || !state.isAnalyzing) return false;
            const cancelled = operationCoordinator.cancel && operationCoordinator.cancel('analysis', reason || '사용자가 자동 분석을 취소했습니다.');
            if (!cancelled) return false;
            if (elements.analysisCancelBtn) {
                elements.analysisCancelBtn.disabled = true;
                elements.analysisCancelBtn.textContent = '중단 중';
                elements.analysisCancelBtn.dataset.cancelRequested = 'true';
            }
            setProgress(0, '분석 취소 요청');
            toast('자동 분석을 안전하게 중단하고 있습니다.', 'warning');
            diagnostic({ type: 'analysis-cancel-request', fileName: state.file && state.file.name || '' });
            if (global.document) global.document.dispatchEvent(new CustomEvent('ai-shorts-experience-sync'));
            return true;
        }

        function normalizeTimingDiagnostics(value) {
            const input = value && typeof value === 'object' ? value : {};
            const sourceVersion = Math.max(1, Number(input.schemaVersion || input.version) || 1);
            const history = applyTimingHistoryPolicy(Array.isArray(input.history) ? input.history : [], readTimingHistoryPolicy());
            const current = input.current && typeof input.current === 'object' ? safeTimingRecord(input.current) : null;
            return Object.freeze({
                schema: timingDiagnosticsSchema,
                schemaVersion: timingDiagnosticsSchemaVersion,
                migratedFrom: sourceVersion < timingDiagnosticsSchemaVersion ? sourceVersion : null,
                exportType: 'analysis-timing-diagnostics',
                version: 2,
                appVersion: safeText(input.appVersion || config.APP_VERSION || 'dev', 40),
                generatedAt: safeText(input.generatedAt || new Date().toISOString(), 40),
                privacy: Object.freeze({ includesFilePaths: false, historyIncludesFileNames: false, mediaIdentity: 'bounded non-reversible local token' }),
                current,
                history: Object.freeze(history)
            });
        }

        function createTimingDiagnostics() {
            return normalizeTimingDiagnostics({
                schema: timingDiagnosticsSchema,
                schemaVersion: timingDiagnosticsSchemaVersion,
                exportType: 'analysis-timing-diagnostics',
                version: 2,
                appVersion: safeText(config.APP_VERSION || 'dev', 40),
                generatedAt: new Date().toISOString(),
                current: lastTimingReport,
                history: readTimingHistory()
            });
        }

        function exportTimingDiagnostics() {
            const payload = createTimingDiagnostics();
            const stamp = payload.generatedAt.replace(/[:.]/g, '-');
            const filename = `ai-shorts-analysis-timing-diagnostics-${stamp}.json`;
            if (!downloadService || typeof downloadService.saveBlob !== 'function' || typeof global.Blob !== 'function') return Object.freeze({ saved: false, filename, payload });
            const blob = new global.Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
            downloadService.saveBlob(blob, filename);
            diagnostic({ type: 'analysis-timing-export', fileName: filename, historyCount: payload.history.length });
            return Object.freeze({ saved: true, filename, historyCount: payload.history.length, payload });
        }

        function dispose() {
            if (disposed) return false;
            cancel('분석 컨트롤러 종료');
            disposed = true;
            return true;
        }

        function snapshot() {
            return Object.freeze({
                disposed,
                active: Boolean(activePromise || activeToken || state.isAnalyzing),
                operationActive: Boolean(activeToken),
                fileName: state.file && state.file.name || '',
                timing: lastTimingReport,
                historyCount: readTimingHistory().length,
                historyPolicy: readTimingHistoryPolicy()
            });
        }

        renderTimingHistory();
        return Object.freeze({
            analyzeCurrentFile, cancel, dispose, snapshot, waitForActiveMediaMetadata,
            getTimingReport: () => lastTimingReport,
            getTimingHistory: readTimingHistory,
            getFilteredTimingHistory: filteredTimingHistory,
            setTimingHistoryFilter,
            setTimingHistorySelection,
            exportSelectedTimingHistory,
            deleteTimingHistoryEntry,
            clearTimingHistory,
            getTimingHistoryPolicy: readTimingHistoryPolicy,
            updateTimingHistoryPolicy,
            renderTimingHistory,
            createTimingDiagnostics,
            normalizeTimingDiagnostics,
            exportTimingDiagnostics,
            _test: Object.freeze({ safeTimingRecord, buildTimingComparison, mediaIdentity, timingDirection, timingRecordId, migrateTimingHistoryEnvelope, historyMatches, normalizeTimingHistoryPolicy, applyTimingHistoryPolicy })
        });
    }

    global.AIShortsAnalysisController = Object.freeze({ createAnalysisController });
})(window);
