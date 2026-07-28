// AI Shorts Studio v1.6.23 - environment comparison, support summary reports, and privacy-safe diagnostics import
'use strict';

(function installSupportDiagnostics(global) {
    const BUNDLE_SCHEMA = 'ai-shorts-support-diagnostics-bundle';
    const BUNDLE_SCHEMA_VERSION = 1;
    const ANALYSIS_SCHEMA = 'ai-shorts-analysis-timing-diagnostics';
    const ANALYSIS_SCHEMA_VERSION = 2;
    const BENCHMARK_SCHEMA = 'ai-shorts-vision-benchmark-diagnostics';
    const BENCHMARK_SCHEMA_VERSION = 2;
    const DEFAULT_MAX_IMPORT_BYTES = 2 * 1024 * 1024;

    function safeText(value, limit) {
        return String(value == null ? '' : value).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, limit || 180);
    }

    function finite(value, fallback) {
        const number = Number(value);
        return Number.isFinite(number) ? number : (fallback || 0);
    }

    function safeArray(value, limit) {
        return Array.isArray(value) ? value.slice(0, Math.max(0, Number(limit) || 40)) : [];
    }

    function frozenArray(value) {
        return Object.freeze(value);
    }

    function sanitizeStage(value) {
        const input = value && typeof value === 'object' ? value : {};
        return Object.freeze({
            key: safeText(input.key || 'stage', 50),
            label: safeText(input.label || input.key || '단계', 80),
            durationMs: Math.max(0, finite(input.durationMs, 0))
        });
    }

    function sanitizeBottleneck(value) {
        if (!value || typeof value !== 'object') return null;
        return sanitizeStage(value);
    }

    function sanitizeTimingRecord(value) {
        const input = value && typeof value === 'object' ? value : {};
        const media = input.media && typeof input.media === 'object' ? input.media : {};
        return Object.freeze({
            id: safeText(input.id || '', 40),
            mediaKey: safeText(input.mediaKey || '', 80),
            status: safeText(input.status || 'completed', 20),
            source: safeText(input.source || '', 50),
            completedAt: safeText(input.completedAt || input.generatedAt || '', 40),
            totalMs: Math.max(0, finite(input.totalMs, 0)),
            bottleneckRatio: Math.max(0, Math.min(1, finite(input.bottleneckRatio, 0))),
            bottleneck: sanitizeBottleneck(input.bottleneck),
            media: Object.freeze({
                type: safeText(media.type || '', 60),
                duration: Math.max(0, finite(media.duration, 0)),
                size: Math.max(0, finite(media.size, 0))
            }),
            stages: frozenArray(safeArray(input.stages, 32).map(sanitizeStage))
        });
    }

    function normalizeAnalysisDiagnostics(value) {
        const input = value && typeof value === 'object' ? value : {};
        const schemaVersion = Math.max(1, Math.min(ANALYSIS_SCHEMA_VERSION, Number(input.schemaVersion || input.version) || 1));
        return Object.freeze({
            schema: ANALYSIS_SCHEMA,
            schemaVersion: ANALYSIS_SCHEMA_VERSION,
            migratedFrom: schemaVersion < ANALYSIS_SCHEMA_VERSION ? schemaVersion : null,
            exportType: 'analysis-timing-diagnostics',
            appVersion: safeText(input.appVersion || 'unknown', 40),
            generatedAt: safeText(input.generatedAt || new Date().toISOString(), 40),
            privacy: Object.freeze({ includesFilePaths: false, historyIncludesFileNames: false, mediaIdentity: 'bounded non-reversible local token' }),
            current: input.current && typeof input.current === 'object' ? sanitizeTimingRecord(input.current) : null,
            history: frozenArray(safeArray(input.history, 30).map(sanitizeTimingRecord))
        });
    }

    function sanitizePack(value) {
        const input = value && typeof value === 'object' ? value : {};
        return Object.freeze({
            id: safeText(input.id || '', 80),
            name: safeText(input.name || '', 100),
            version: safeText(input.version || '', 40),
            status: safeText(input.status || '', 30),
            fileCount: Math.max(0, finite(input.fileCount || input.files, 0)),
            totalBytes: Math.max(0, finite(input.totalBytes || input.bytes, 0))
        });
    }

    function sanitizeRecommendation(value) {
        const input = value && typeof value === 'object' ? value : {};
        return Object.freeze({
            backend: safeText(input.backend || 'auto', 20),
            confidence: safeText(input.confidence || 'low', 20),
            confidenceScore: Math.max(0, Math.min(100, finite(input.confidenceScore, 0))),
            automatic: input.automatic !== false,
            reason: safeText(input.reason || '', 160)
        });
    }

    function sanitizeBenchmarkEntry(value) {
        const input = value && typeof value === 'object' ? value : {};
        return Object.freeze({
            backend: safeText(input.backend || '', 20),
            status: safeText(input.status || '', 20),
            measuredAt: safeText(input.measuredAt || input.completedAt || '', 40),
            medianMs: Math.max(0, finite(input.medianMs, 0)),
            p95Ms: Math.max(0, finite(input.p95Ms, 0)),
            confidence: safeText(input.confidence || '', 20),
            confidenceScore: Math.max(0, Math.min(100, finite(input.confidenceScore, 0)))
        });
    }

    function sanitizePerformance(value) {
        const input = value && typeof value === 'object' ? value : {};
        return Object.freeze({
            historyCount: Math.max(0, finite(input.historyCount, safeArray(input.latest, 32).length)),
            latest: frozenArray(safeArray(input.latest, 32).map(sanitizeBenchmarkEntry)),
            recommendation: sanitizeRecommendation(input.recommendation)
        });
    }

    function sanitizePolicy(value) {
        const input = value && typeof value === 'object' ? value : {};
        return Object.freeze({
            automaticRecommendation: safeText(input.automaticRecommendation || 'confidence-gated', 50),
            lowConfidenceExcluded: input.lowConfidenceExcluded !== false,
            minimumConfidenceScore: Math.max(0, Math.min(100, finite(input.minimumConfidenceScore, 55)))
        });
    }

    function normalizeBenchmarkDiagnostics(value) {
        const input = value && typeof value === 'object' ? value : {};
        const schemaVersion = Math.max(1, Math.min(BENCHMARK_SCHEMA_VERSION, Number(input.schemaVersion || input.version) || 1));
        return Object.freeze({
            schema: BENCHMARK_SCHEMA,
            schemaVersion: BENCHMARK_SCHEMA_VERSION,
            migratedFrom: schemaVersion < BENCHMARK_SCHEMA_VERSION ? schemaVersion : null,
            exportType: 'vision-model-benchmark-diagnostics',
            appVersion: safeText(input.appVersion || 'unknown', 40),
            generatedAt: safeText(input.generatedAt || new Date().toISOString(), 40),
            pack: sanitizePack(input.pack),
            environmentKey: safeText(input.environmentKey || '', 160),
            policy: sanitizePolicy(input.policy),
            performance: sanitizePerformance(input.performance),
            privacy: Object.freeze({ localOnly: true, includesModelFiles: false, includesMedia: false })
        });
    }

    function safeRuntime(runtimeHealth) {
        const source = runtimeHealth && typeof runtimeHealth.collect === 'function' ? runtimeHealth.collect() : {};
        return Object.freeze({
            webAudio: Boolean(source.webAudio), worker: Boolean(source.worker), mediaRecorder: Boolean(source.mediaRecorder),
            canvasCaptureStream: Boolean(source.canvasCaptureStream), mediaCaptureStream: Boolean(source.mediaCaptureStream),
            serviceWorker: Boolean(source.serviceWorker), serviceWorkerControlled: Boolean(source.serviceWorkerControlled),
            secureContext: Boolean(source.secureContext), crossOriginIsolated: Boolean(source.crossOriginIsolated),
            hydrationReady: safeText(source.hydrationReady || 'core', 100), hydrationError: safeText(source.hydrationError || '', 100),
            runtimeErrors: Math.max(0, finite(source.runtimeErrors, 0))
        });
    }

    function safeOperations(operationCoordinator) {
        const snapshot = operationCoordinator && typeof operationCoordinator.snapshot === 'function' ? operationCoordinator.snapshot() : {};
        return Object.freeze({
            mediaSessionId: Math.max(0, finite(snapshot.mediaSessionId, 0)),
            active: frozenArray(safeArray(snapshot.active, 12).map(item => Object.freeze({
                channel: safeText(item && item.channel || '', 40), ageMs: Math.max(0, finite(item && item.ageMs, 0)),
                mediaSessionId: Math.max(0, finite(item && item.mediaSessionId, 0))
            })))
        });
    }

    function safeAppState(appState) {
        const state = appState && appState.state || appState || {};
        return Object.freeze({
            fileLoaded: Boolean(state.file), fileKind: safeText(state.fileKind || '', 20),
            duration: Math.max(0, finite(state.fileMeta && state.fileMeta.duration, 0)),
            recommendationCount: safeArray(state.recommendations, 100).length,
            captionCount: safeArray(state.captions, 6000).length,
            isAnalyzing: Boolean(state.isAnalyzing), isPreviewing: Boolean(state.isPreviewing), hasExportInfo: Boolean(state.exportInfo)
        });
    }

    function safeDiagnostics(appState, limit) {
        const state = appState && appState.state || appState || {};
        return frozenArray(safeArray(state.diagnostics, limit || 20).map(item => Object.freeze({
            at: safeText(item && item.at || '', 40), type: safeText(item && item.type || 'diagnostic', 80),
            status: safeText(item && item.status || item && item.state || '', 40),
            count: Math.max(0, finite(item && (item.count || item.stageCount || item.historyCount), 0))
        })));
    }

    function safeServiceWorker(serviceWorkerRegistration) {
        const status = serviceWorkerRegistration && typeof serviceWorkerRegistration.getStatus === 'function' ? serviceWorkerRegistration.getStatus() : {};
        return Object.freeze({
            supported: Boolean(status.supported), registered: Boolean(status.registered), controlled: Boolean(status.controlled),
            active: Boolean(status.active), waiting: Boolean(status.waiting), installing: Boolean(status.installing),
            updateState: safeText(status.update && status.update.state || status.updateState || '', 40),
            integrityState: safeText(status.integrityAudit && status.integrityAudit.state || '', 40),
            repairState: safeText(status.repair && status.repair.state || '', 40)
        });
    }

    function bundleEnvelope(input, additions) {
        const extra = additions || {};
        return Object.freeze({
            schema: BUNDLE_SCHEMA, schemaVersion: BUNDLE_SCHEMA_VERSION, exportType: BUNDLE_SCHEMA,
            appVersion: safeText(input && input.appVersion || 'unknown', 40),
            generatedAt: safeText(input && input.generatedAt || new Date().toISOString(), 40),
            privacy: Object.freeze({ includesFilePaths: false, includesFileNames: false, includesMediaBytes: false, includesModelFiles: false, localGenerationOnly: true }),
            app: extra.app || safeAppState({}), runtime: extra.runtime || safeRuntime({}), operations: extra.operations || safeOperations({}),
            serviceWorker: extra.serviceWorker || safeServiceWorker({}), analysis: extra.analysis || normalizeAnalysisDiagnostics({}),
            benchmarks: extra.benchmarks || frozenArray([]), diagnostics: extra.diagnostics || frozenArray([]),
            migratedFrom: extra.migratedFrom == null ? null : extra.migratedFrom
        });
    }

    function createBundle(options) {
        const opts = options || {};
        const config = opts.config || global.AIShortsRuntimeConfig || {};
        const analysisController = opts.analysisController || null;
        const visionManager = opts.visionManager || global.AIShortsVisionModelPacks || null;
        const generatedAt = new Date().toISOString();
        const analysisRaw = analysisController && typeof analysisController.createTimingDiagnostics === 'function' ? analysisController.createTimingDiagnostics() : {};
        const packs = visionManager && typeof visionManager.listPacks === 'function' ? visionManager.listPacks() : [];
        const benchmarks = packs.map(pack => visionManager && typeof visionManager.createBenchmarkDiagnostics === 'function'
            ? normalizeBenchmarkDiagnostics(visionManager.createBenchmarkDiagnostics(pack.id)) : null).filter(Boolean);
        return bundleEnvelope({ appVersion: config.APP_VERSION || 'dev', generatedAt }, {
            app: safeAppState(opts.appState || global.AIShortsAppState || {}), runtime: safeRuntime(opts.runtimeHealth || global.AIShortsRuntimeHealth || {}),
            operations: safeOperations(opts.operationCoordinator || global.AIShortsOperationCoordinator || {}),
            serviceWorker: safeServiceWorker(opts.serviceWorkerRegistration || global.AIShortsServiceWorkerRegistration || {}),
            analysis: normalizeAnalysisDiagnostics(analysisRaw), benchmarks: frozenArray(benchmarks),
            diagnostics: safeDiagnostics(opts.appState || global.AIShortsAppState || {}, Number(config.DIAGNOSTIC_HISTORY_LIMIT) || 20)
        });
    }

    function detectDocument(input) {
        if (!input || typeof input !== 'object' || Array.isArray(input)) return Object.freeze({ kind: 'invalid', schema: '', version: 0 });
        const schema = safeText(input.schema || '', 100);
        const exportType = safeText(input.exportType || '', 100);
        const version = Math.max(1, finite(input.schemaVersion || input.version, 1));
        if (schema === BUNDLE_SCHEMA || exportType === BUNDLE_SCHEMA) return Object.freeze({ kind: 'bundle', schema: BUNDLE_SCHEMA, version });
        if (schema === ANALYSIS_SCHEMA || exportType === 'analysis-timing-diagnostics') return Object.freeze({ kind: 'analysis', schema: ANALYSIS_SCHEMA, version });
        if (schema === BENCHMARK_SCHEMA || exportType === 'vision-model-benchmark-diagnostics') return Object.freeze({ kind: 'benchmark', schema: BENCHMARK_SCHEMA, version });
        return Object.freeze({ kind: 'unknown', schema: schema || exportType, version });
    }

    function normalizeBundle(value) {
        const input = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
        const detected = detectDocument(input);
        if (detected.kind === 'analysis') return bundleEnvelope(input, { analysis: normalizeAnalysisDiagnostics(input), migratedFrom: 'analysis-timing-diagnostics' });
        if (detected.kind === 'benchmark') return bundleEnvelope(input, { benchmarks: frozenArray([normalizeBenchmarkDiagnostics(input)]), migratedFrom: 'vision-model-benchmark-diagnostics' });
        const analysis = normalizeAnalysisDiagnostics(input.analysis || {});
        const benchmarks = frozenArray(safeArray(input.benchmarks, 8).map(normalizeBenchmarkDiagnostics));
        return bundleEnvelope(input, {
            app: safeAppState(input.app || {}), runtime: safeRuntime({ collect: () => input.runtime || {} }),
            operations: safeOperations({ snapshot: () => input.operations || {} }), serviceWorker: safeServiceWorker({ getStatus: () => input.serviceWorker || {} }),
            analysis, benchmarks, diagnostics: safeDiagnostics({ state: { diagnostics: input.diagnostics } }, 40),
            migratedFrom: input.schemaVersion && Number(input.schemaVersion) < BUNDLE_SCHEMA_VERSION ? Number(input.schemaVersion) : null
        });
    }

    function issue(code, message, action, severity) {
        return Object.freeze({ code: safeText(code, 60), message: safeText(message, 240), action: safeText(action, 240), severity: safeText(severity || 'error', 20) });
    }

    function invalidInspection(code, message, action, meta) {
        const extra = meta || {};
        return Object.freeze({
            valid: false, compatible: false, code, kind: extra.kind || 'invalid', schema: extra.schema || '', schemaVersion: extra.schemaVersion || 0,
            normalized: null, migrated: false, summary: Object.freeze({ analysisHistoryCount: 0, benchmarkCount: 0, runtimeErrorCount: 0, diagnosticCount: 0 }),
            issues: frozenArray([issue(code, message, action, 'error')]), warnings: frozenArray([]), file: extra.file || null
        });
    }

    function inspectBundle(value, options) {
        const opts = options || {};
        const detected = detectDocument(value);
        if (detected.kind === 'invalid') return invalidInspection('invalid-root', '진단 파일의 최상위 값이 JSON 객체가 아닙니다.', '앱에서 내보낸 JSON 파일을 다시 선택하세요.');
        if (detected.kind === 'unknown') return invalidInspection('unsupported-schema', `지원하지 않는 진단 형식입니다${detected.schema ? `: ${detected.schema}` : '.'}`, 'AI Shorts Studio에서 내보낸 지원·분석·성능 진단 JSON을 선택하세요.', detected);
        const currentVersion = detected.kind === 'bundle' ? BUNDLE_SCHEMA_VERSION : detected.kind === 'analysis' ? ANALYSIS_SCHEMA_VERSION : BENCHMARK_SCHEMA_VERSION;
        if (detected.version > currentVersion) return invalidInspection('future-schema', `이 파일은 더 새로운 schema version ${detected.version}을 사용합니다.`, '최신 AI Shorts Studio에서 열거나, 현재 앱을 업데이트한 뒤 다시 시도하세요.', { kind: detected.kind, schema: detected.schema, schemaVersion: detected.version });
        let normalized;
        try { normalized = normalizeBundle(value); }
        catch (_) { return invalidInspection('normalization-failed', '진단 데이터를 안전한 현재 형식으로 변환하지 못했습니다.', '원본 진단 파일을 다시 내보내거나 손상되지 않은 복사본을 사용하세요.', detected); }
        const warnings = [];
        const migrated = detected.kind !== 'bundle' || detected.version < currentVersion;
        if (migrated) warnings.push(issue('schema-migrated', `구버전 ${detected.kind} 진단을 현재 지원 Bundle 형식으로 변환했습니다.`, '미리보기 후 정규화본을 저장하면 다음 검사에서 바로 사용할 수 있습니다.', 'warning'));
        if (!normalized.analysis.history.length && !normalized.benchmarks.length) warnings.push(issue('limited-content', '분석 이력과 CPU/GPU 측정 기록이 비어 있습니다.', '런타임 상태 확인에는 사용할 수 있지만 성능 비교 정보는 제한됩니다.', 'warning'));
        const summary = Object.freeze({
            analysisHistoryCount: normalized.analysis.history.length,
            benchmarkCount: normalized.benchmarks.length,
            runtimeErrorCount: Math.max(0, finite(normalized.runtime.runtimeErrors, 0)),
            diagnosticCount: normalized.diagnostics.length,
            activeOperationCount: normalized.operations.active.length,
            appVersion: normalized.appVersion,
            generatedAt: normalized.generatedAt
        });
        return Object.freeze({
            valid: true, compatible: true, code: 'ok', kind: detected.kind, schema: detected.schema, schemaVersion: detected.version,
            normalized, migrated, summary, issues: frozenArray([]), warnings: frozenArray(warnings), file: opts.file || null
        });
    }

    function parseBundleText(text, options) {
        const opts = options || {};
        const source = String(text == null ? '' : text);
        const maxBytes = Math.max(1024, finite(opts.maxBytes, DEFAULT_MAX_IMPORT_BYTES));
        const estimatedBytes = typeof global.TextEncoder === 'function' ? new global.TextEncoder().encode(source).byteLength : source.length * 2;
        if (estimatedBytes > maxBytes) return invalidInspection('file-too-large', `진단 파일이 허용 크기 ${Math.round(maxBytes / 1024)}KiB를 초과합니다.`, '필요한 진단만 다시 내보내거나 파일 크기를 줄이세요.');
        if (!source.trim()) return invalidInspection('empty-file', '진단 파일이 비어 있습니다.', '내용이 있는 JSON 진단 파일을 선택하세요.');
        let value;
        try { value = JSON.parse(source); }
        catch (_) { return invalidInspection('invalid-json', 'JSON 문법이 손상되어 파일을 읽을 수 없습니다.', '텍스트 편집으로 수정하지 않은 원본 진단 파일을 다시 선택하세요.'); }
        return inspectBundle(value, opts);
    }

    function readFileText(file) {
        if (file && typeof file.text === 'function') return file.text();
        if (typeof global.FileReader === 'function') return new Promise((resolve, reject) => {
            const reader = new global.FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(reader.error || new Error('file-read-failed'));
            reader.readAsText(file);
        });
        return Promise.reject(new Error('file-read-unsupported'));
    }

    async function inspectFile(file, options) {
        const opts = options || {};
        const maxBytes = Math.max(1024, finite(opts.maxBytes, DEFAULT_MAX_IMPORT_BYTES));
        const fileMeta = file ? Object.freeze({ name: safeText(file.name || 'diagnostics.json', 120), size: Math.max(0, finite(file.size, 0)), type: safeText(file.type || '', 80) }) : null;
        if (!file) return invalidInspection('missing-file', '선택한 진단 파일이 없습니다.', 'JSON 파일을 다시 선택하세요.');
        if (fileMeta.size > maxBytes) return invalidInspection('file-too-large', `진단 파일이 허용 크기 ${Math.round(maxBytes / 1024)}KiB를 초과합니다.`, '필요한 진단만 다시 내보내거나 파일 크기를 줄이세요.', { file: fileMeta });
        let text;
        try { text = await readFileText(file); }
        catch (_) { return invalidInspection('file-read-failed', '브라우저가 진단 파일을 읽지 못했습니다.', '파일 권한과 저장 상태를 확인한 뒤 다시 선택하세요.', { file: fileMeta }); }
        const inspection = parseBundleText(text, { maxBytes, file: fileMeta });
        return Object.freeze(Object.assign({}, inspection, { file: fileMeta }));
    }


    function comparisonPriority(status, key) {
        if (status === 'warning') return key === 'runtime-errors' || key === 'service-worker-control' ? 'critical' : 'high';
        if (status === 'different') return key === 'app-version' ? 'high' : 'medium';
        if (status === 'info') return 'low';
        return 'none';
    }

    function comparisonItem(key, label, importedValue, currentValue, status, detail) {
        const safeStatus = ['match', 'different', 'warning', 'info'].includes(status) ? status : 'info';
        return Object.freeze({
            key: safeText(key, 60),
            label: safeText(label, 100),
            imported: safeText(importedValue, 140),
            current: safeText(currentValue, 140),
            status: safeStatus,
            priority: comparisonPriority(safeStatus, key),
            detail: safeText(detail || '', 220)
        });
    }

    function boolLabel(value) { return value ? '지원' : '미지원'; }

    function compareInspectionToCurrent(inspection, options) {
        if (!inspection || !inspection.compatible || !inspection.normalized) {
            return Object.freeze({ compatible: false, items: frozenArray([]), summary: Object.freeze({ matches: 0, differences: 0, warnings: 0 }) });
        }
        const imported = inspection.normalized;
        const current = createBundle(options || {});
        const items = [];
        items.push(comparisonItem(
            'app-version', '앱 버전', imported.appVersion || '미상', current.appVersion || '미상',
            imported.appVersion === current.appVersion ? 'match' : 'different',
            imported.appVersion === current.appVersion ? '같은 앱 버전입니다.' : '버전 차이로 일부 진단 항목의 의미가 달라질 수 있습니다.'
        ));
        const runtimeKeys = [
            ['webAudio', 'Web Audio'], ['worker', 'Web Worker'], ['mediaRecorder', 'MediaRecorder'],
            ['canvasCaptureStream', 'Canvas Capture'], ['mediaCaptureStream', 'Media Capture'],
            ['serviceWorker', 'Service Worker'], ['secureContext', '보안 컨텍스트'], ['crossOriginIsolated', '교차 출처 격리']
        ];
        runtimeKeys.forEach(([key, label]) => {
            const before = Boolean(imported.runtime && imported.runtime[key]);
            const now = Boolean(current.runtime && current.runtime[key]);
            items.push(comparisonItem(`runtime-${key}`, label, boolLabel(before), boolLabel(now), before === now ? 'match' : now ? 'different' : 'warning', now ? '현재 환경에서 사용할 수 있습니다.' : '현재 브라우저 환경에서는 사용할 수 없습니다.'));
        });
        const importedErrors = Math.max(0, finite(imported.runtime && imported.runtime.runtimeErrors, 0));
        const currentErrors = Math.max(0, finite(current.runtime && current.runtime.runtimeErrors, 0));
        items.push(comparisonItem('runtime-errors', '런타임 오류', `${importedErrors}건`, `${currentErrors}건`, currentErrors === importedErrors ? 'match' : currentErrors > importedErrors ? 'warning' : 'different', currentErrors ? '현재 세션의 런타임 오류를 먼저 확인하세요.' : '현재 세션에는 기록된 런타임 오류가 없습니다.'));
        items.push(comparisonItem('analysis-history', '분석 이력', `${imported.analysis.history.length}건`, `${current.analysis.history.length}건`, imported.analysis.history.length === current.analysis.history.length ? 'match' : 'info', '이력 건수 차이는 오류가 아니라 진단 범위 차이일 수 있습니다.'));
        items.push(comparisonItem('benchmarks', '벤치마크 팩', `${imported.benchmarks.length}개`, `${current.benchmarks.length}개`, imported.benchmarks.length === current.benchmarks.length ? 'match' : 'info', '설치된 모델 팩과 측정 시점에 따라 달라질 수 있습니다.'));
        const importedControlled = Boolean(imported.serviceWorker && imported.serviceWorker.controlled);
        const currentControlled = Boolean(current.serviceWorker && current.serviceWorker.controlled);
        items.push(comparisonItem('service-worker-control', '서비스워커 제어', importedControlled ? '제어 중' : '미제어', currentControlled ? '제어 중' : '미제어', importedControlled === currentControlled ? 'match' : currentControlled ? 'different' : 'warning', currentControlled ? '현재 페이지는 서비스워커가 제어하고 있습니다.' : '새로고침 또는 보안 컨텍스트 확인이 필요할 수 있습니다.'));
        const rank = Object.freeze({ critical: 0, high: 1, medium: 2, low: 3, none: 4 });
        items.sort((a, b) => rank[a.priority] - rank[b.priority] || String(a.label).localeCompare(String(b.label)));
        const matches = items.filter(item => item.status === 'match').length;
        const warnings = items.filter(item => item.status === 'warning').length;
        const differences = items.filter(item => item.status === 'different').length;
        return Object.freeze({
            compatible: true,
            importedAppVersion: imported.appVersion,
            currentAppVersion: current.appVersion,
            items: frozenArray(items),
            summary: Object.freeze({ matches, differences, warnings, total: items.length, critical: items.filter(item => item.priority === 'critical').length, high: items.filter(item => item.priority === 'high').length })
        });
    }

    function createSupportSummaryReport(inspection, options) {
        if (!inspection || !inspection.compatible || !inspection.normalized) return Object.freeze({ text: '', comparison: null, generatedAt: '' });
        const comparison = compareInspectionToCurrent(inspection, options || {});
        const generatedAt = new Date().toISOString();
        const imported = inspection.normalized;
        const lines = [
            '# AI Shorts Studio 지원 진단 요약', '',
            `- 생성 시각: ${generatedAt}`,
            `- 가져온 앱 버전: ${safeText(imported.appVersion || '미상', 40)}`,
            `- 현재 앱 버전: ${safeText(comparison.currentAppVersion || '미상', 40)}`,
            `- 분석 이력: ${imported.analysis.history.length}건`,
            `- 벤치마크 팩: ${imported.benchmarks.length}개`,
            `- 런타임 오류: ${Math.max(0, finite(imported.runtime.runtimeErrors, 0))}건`, '',
            '## 현재 환경 비교', ''
        ];
        comparison.items.forEach(item => {
            const mark = item.status === 'match' ? '일치' : item.status === 'warning' ? '주의' : item.status === 'different' ? '차이' : '정보';
            const priority = item.priority === 'critical' ? '즉시 확인' : item.priority === 'high' ? '높음' : item.priority === 'medium' ? '보통' : item.priority === 'low' ? '낮음' : '해당 없음';
            lines.push(`- [${mark}/${priority}] ${item.label}: 가져온 값 ${item.imported} / 현재 값 ${item.current}${item.detail ? ` — ${item.detail}` : ''}`);
        });
        const notices = [].concat(inspection.issues || [], inspection.warnings || []);
        lines.push('', '## 호환성 안내', '');
        if (!notices.length) lines.push('- 현재 앱에서 안전하게 읽을 수 있는 진단 파일입니다.');
        else notices.forEach(item => lines.push(`- ${safeText(item.message || '진단 안내', 240)}${item.action ? ` — ${safeText(item.action, 240)}` : ''}`));
        lines.push('', '## 개인정보 보호', '', '- 원본 파일명, 로컬 경로, 미디어 바이트, 모델 파일, URL origin은 포함하지 않습니다.', '- 가져온 진단은 현재 프로젝트나 설정에 자동 적용되지 않습니다.', '');
        return Object.freeze({ text: lines.join('\n'), comparison, generatedAt });
    }

    function saveJson(payload, filename, options) {
        const opts = options || {};
        const downloadService = opts.downloadService || global.AIShortsDownloadService || {};
        if (!downloadService || typeof downloadService.saveBlob !== 'function' || typeof global.Blob !== 'function') return false;
        downloadService.saveBlob(new global.Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), filename);
        return true;
    }


    function saveText(text, filename, options) {
        const opts = options || {};
        const downloadService = opts.downloadService || global.AIShortsDownloadService || {};
        if (!downloadService || typeof downloadService.saveBlob !== 'function' || typeof global.Blob !== 'function') return false;
        downloadService.saveBlob(new global.Blob([String(text || '')], { type: 'text/markdown;charset=utf-8' }), filename);
        return true;
    }

    function exportSupportSummaryReport(inspection, options) {
        const opts = options || {};
        const report = createSupportSummaryReport(inspection, opts);
        if (!report.text) return Object.freeze({ saved: false, filename: '', report });
        const stamp = report.generatedAt.replace(/[:.]/g, '-');
        const filename = `ai-shorts-support-summary-${stamp}.md`;
        const saved = saveText(report.text, filename, opts);
        const store = opts.appState || global.AIShortsAppState || {};
        if (saved && store && typeof store.addDiagnostic === 'function') store.addDiagnostic({ type: 'support-diagnostics-summary-export', comparisonCount: report.comparison && report.comparison.items.length || 0 });
        return Object.freeze({ saved, filename, report });
    }

    function exportBundle(options) {
        const opts = options || {};
        const payload = createBundle(opts);
        const stamp = payload.generatedAt.replace(/[:.]/g, '-');
        const filename = `ai-shorts-support-diagnostics-${stamp}.json`;
        const saved = saveJson(payload, filename, opts);
        const store = opts.appState || global.AIShortsAppState || {};
        if (saved && store && typeof store.addDiagnostic === 'function') store.addDiagnostic({ type: 'support-diagnostics-export', historyCount: payload.analysis.history.length, benchmarkCount: payload.benchmarks.length });
        return Object.freeze({ saved, filename, payload, historyCount: payload.analysis.history.length, benchmarkCount: payload.benchmarks.length });
    }

    function exportNormalizedInspection(inspection, options) {
        const opts = options || {};
        if (!inspection || !inspection.compatible || !inspection.normalized) return Object.freeze({ saved: false, filename: '', payload: null });
        const payload = inspection.normalized;
        const stamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `ai-shorts-support-diagnostics-normalized-${stamp}.json`;
        const saved = saveJson(payload, filename, opts);
        const store = opts.appState || global.AIShortsAppState || {};
        if (saved && store && typeof store.addDiagnostic === 'function') store.addDiagnostic({ type: 'support-diagnostics-normalized-export', historyCount: payload.analysis.history.length, benchmarkCount: payload.benchmarks.length });
        return Object.freeze({ saved, filename, payload });
    }

    global.AIShortsSupportDiagnostics = Object.freeze({
        createBundle, exportBundle, exportNormalizedInspection, exportSupportSummaryReport, createSupportSummaryReport, compareInspectionToCurrent, normalizeBundle, normalizeAnalysisDiagnostics, normalizeBenchmarkDiagnostics,
        inspectBundle, inspectFile, parseBundleText, detectDocument,
        SCHEMA: BUNDLE_SCHEMA, SCHEMA_VERSION: BUNDLE_SCHEMA_VERSION,
        ANALYSIS_SCHEMA, ANALYSIS_SCHEMA_VERSION, BENCHMARK_SCHEMA, BENCHMARK_SCHEMA_VERSION,
        DEFAULT_MAX_IMPORT_BYTES
    });
})(window);
