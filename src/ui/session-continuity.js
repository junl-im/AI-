// AI Shorts Studio v1.5.24 - compressed adaptive session backups with recovery history
'use strict';
(function bootSessionContinuity(global) {
    if (global.AIShortsSessionContinuity) return;
    const store = global.AIShortsAppState || {};
    const state = store.state || {};
    const projectService = global.AIShortsProjectService || {};
    const downloadService = global.AIShortsDownloadService || {};
    const storageManager = global.AIShortsStorageManager || {};
    const backupCodec = global.AIShortsSessionBackupCodec || {};
    const config = global.AIShortsRuntimeConfig || {};
    const STORAGE_KEY = 'ai-shorts-session-continuity-v112';
    const CURRENT_SCHEMA_VERSION = Math.max(3, Number(config.SESSION_SCHEMA_VERSION || projectService.CURRENT_SCHEMA_VERSION || 4));
    const BACKUP_MIN_COUNT = Math.max(1, Math.min(3, Number(config.SESSION_BACKUP_MIN_COUNT) || 1));
    const BACKUP_DEFAULT_COUNT = Math.max(BACKUP_MIN_COUNT, Math.min(4, Number(config.SESSION_BACKUP_COUNT) || 2));
    const BACKUP_MAX_COUNT = Math.max(BACKUP_DEFAULT_COUNT, Math.min(4, Number(config.SESSION_BACKUP_MAX_COUNT) || 3));
    const BACKUP_MAX_CHARS = Math.max(4096, Number(config.SESSION_BACKUP_MAX_CHARS) || 750000);
    const BACKUP_KEYS = Object.freeze(Array.from({ length: BACKUP_MAX_COUNT }, (_, index) => `${STORAGE_KEY}-backup-${index + 1}`));
    const RECOVERY_HISTORY_KEY = `${STORAGE_KEY}-recovery-history`;
    const RECOVERY_HISTORY_LIMIT = Math.max(5, Math.min(50, Number(config.SESSION_RECOVERY_HISTORY_LIMIT) || 20));
    const SAVE_DELAY = 900;
    let saveTimer = 0;
    let syncTimer = 0;
    let heartbeatTimer = 0;
    let invalidSnapshotReported = false;
    let invalidSnapshotReason = '';
    let lastLoadedSource = '';
    let lastMigrationFrom = 0;
    let lastSavedAt = '';
    let quotaNoticeAt = 0;
    let lastRecoveryEventKey = '';
    let lastRecoveryEventAt = 0;
    const MAX_SNAPSHOT_CHARS = Math.max(1024, Number(config.MAX_PROJECT_TEXT_CHARS || 2500000));

    function byId(id) { return document.getElementById(id); }
    function safeParse(text) { try { return JSON.parse(text); } catch (error) { return null; } }
    function nowIso() { return new Date().toISOString(); }
    function notify(message, kind, options) {
        const feedback = global.AIShortsFeedbackUX;
        return Boolean(feedback && typeof feedback.toast === 'function' && feedback.toast(message, kind, options));
    }
    function emit(name, detail) {
        try { document.dispatchEvent(new CustomEvent(name, { detail: detail || {} })); } catch (_) { /* optional */ }
    }
    function hasWork() {
        return Boolean(state.fileMeta || (state.recommendations && state.recommendations.length) || state.selectedRange || (state.captions && state.captions.length));
    }
    function fileKey(meta) {
        if (!meta) return '';
        return [meta.name || '', meta.size || 0, Math.round(Number(meta.duration) || 0)].join('|');
    }
    function currentCopy() {
        const title = byId('titleInput');
        const hashtags = byId('hashtagInput');
        return { title: title ? title.value : '', hashtags: hashtags ? hashtags.value : '' };
    }
    function readKey(key) {
        try {
            if (storageManager.safeGet) return storageManager.safeGet(key, '') || '';
            return localStorage.getItem(key) || '';
        } catch (error) {
            invalidSnapshotReason = error && error.message || '로컬 저장소를 읽을 수 없습니다.';
            return '';
        }
    }
    function writeKey(key, text, options) {
        if (storageManager.safeSet) return storageManager.safeSet(key, text, Object.assign({ currentSessionKey: STORAGE_KEY }, options || {}));
        try { localStorage.setItem(key, text); return { ok: true, quota: false }; }
        catch (error) { return { ok: false, quota: storageManager.isQuotaError ? storageManager.isQuotaError(error) : /quota/i.test(error && error.message || ''), error }; }
    }
    function removeKey(key) {
        if (storageManager.safeRemove) return storageManager.safeRemove(key);
        try { localStorage.removeItem(key); return true; } catch (_) { return false; }
    }
    function effectiveBackupLimit() {
        const status = storageManager.status ? storageManager.status() : {};
        const level = String(status && status.level || 'unknown');
        if (level === 'critical') return BACKUP_MIN_COUNT;
        if (level === 'warning') return Math.max(BACKUP_MIN_COUNT, Math.min(BACKUP_DEFAULT_COUNT, 2));
        if (level === 'ok') return BACKUP_MAX_COUNT;
        return BACKUP_DEFAULT_COUNT;
    }
    function decodeStoredText(value) {
        const stored = String(value || '');
        if (backupCodec && typeof backupCodec.decode === 'function') return backupCodec.decode(stored, { maxBytes: MAX_SNAPSHOT_CHARS * 4 });
        return Object.freeze({ text: stored, compressed: false, codec: 'plain', rawChars: stored.length, storedChars: stored.length, savingsRatio: 0, checksum: '' });
    }
    function encodeBackupText(raw) {
        if (backupCodec && typeof backupCodec.encode === 'function') return backupCodec.encode(raw, { maxChars: MAX_SNAPSHOT_CHARS, minimumSavingsRatio: 0.04 });
        return Object.freeze({ text: raw, compressed: false, codec: 'plain', rawChars: raw.length, storedChars: raw.length, savingsRatio: 0, checksum: '' });
    }
    function readRecoveryHistory() {
        const parsed = safeParse(readKey(RECOVERY_HISTORY_KEY));
        return Array.isArray(parsed) ? parsed.slice(0, RECOVERY_HISTORY_LIMIT) : [];
    }
    function appendRecoveryHistory(type, detail) {
        const now = Date.now();
        const safeDetail = Object.assign({}, detail || {});
        const eventKey = `${type}|${safeDetail.source || ''}|${safeDetail.reason || safeDetail.message || ''}`;
        if (eventKey === lastRecoveryEventKey && now - lastRecoveryEventAt < 5000) return null;
        lastRecoveryEventKey = eventKey;
        lastRecoveryEventAt = now;
        const entry = Object.freeze(Object.assign({ type: String(type || 'unknown'), at: nowIso(), appVersion: config.APP_VERSION || 'dev', schemaVersion: CURRENT_SCHEMA_VERSION }, safeDetail));
        const history = [entry, ...readRecoveryHistory()].slice(0, RECOVERY_HISTORY_LIMIT);
        writeKey(RECOVERY_HISTORY_KEY, JSON.stringify(history), { cleanup: false });
        emit('ai-shorts-session-recovery-history', { entry, count: history.length });
        return entry;
    }
    function backupMetadata() {
        let storedChars = 0;
        let rawChars = 0;
        let compressedCount = 0;
        let validCount = 0;
        const items = BACKUP_KEYS.map(key => {
            const value = readKey(key);
            if (!value) return null;
            let info = null;
            try {
                info = backupCodec && typeof backupCodec.inspect === 'function' ? backupCodec.inspect(value) : decodeStoredText(value);
                if (!info.valid && info.valid !== undefined) throw new Error(info.error || '백업 메타데이터 손상');
            } catch (error) { return { key, valid: false, compressed: value.startsWith('AISSB1:'), storedChars: value.length, rawChars: 0, error: error.message }; }
            storedChars += info.storedChars;
            rawChars += info.rawChars;
            if (info.compressed) compressedCount += 1;
            validCount += 1;
            return { key, valid: true, compressed: info.compressed, codec: info.codec, storedChars: info.storedChars, rawChars: info.rawChars, savingsRatio: info.savingsRatio, checksum: info.checksum };
        }).filter(Boolean);
        return Object.freeze({ items, count: items.length, validCount, compressedCount, storedChars, rawChars, savingsRatio: rawChars ? Math.max(0, 1 - storedChars / rawChars) : 0 });
    }
    function createSnapshot() {
        let base = null;
        if (projectService.createProjectSnapshot) {
            base = projectService.createProjectSnapshot(state, currentCopy().title, currentCopy().hashtags);
        } else {
            base = {
                app: 'AI Shorts Studio',
                schemaVersion: CURRENT_SCHEMA_VERSION,
                fileMeta: state.fileMeta || null,
                fileName: state.file && state.file.name || state.fileMeta && state.fileMeta.name || '',
                fileKind: state.fileKind || '',
                settings: state.settings || {},
                selectedRecommendationId: state.selectedRecommendationId || '',
                selectedRange: state.selectedRange || null,
                recommendations: state.recommendations || [],
                captions: state.captions || [],
                copy: currentCopy()
            };
        }
        base.schemaVersion = CURRENT_SCHEMA_VERSION;
        base.savedAt = nowIso();
        base.session = Object.assign({}, base.session || {}, {
            version: config.APP_VERSION || 'dev',
            schemaVersion: CURRENT_SCHEMA_VERSION,
            fileKey: fileKey(base.fileMeta),
            hasMediaInMemory: Boolean(state.file),
            recommendationCount: Array.isArray(base.recommendations) ? base.recommendations.length : 0,
            captionCount: Array.isArray(base.captions) ? base.captions.length : 0,
            selected: base.selectedRecommendationId || ''
        });
        return base;
    }
    function parseSnapshotText(raw, sourceKey) {
        if (!raw) return null;
        const decoded = decodeStoredText(raw);
        const text = decoded.text;
        if (text.length > MAX_SNAPSHOT_CHARS) throw new Error('저장된 세션이 허용 크기를 초과했습니다.');
        const parsed = projectService.parseProjectText ? projectService.parseProjectText(text) : safeParse(text);
        const source = safeParse(text);
        if (!source || source.app !== 'AI Shorts Studio' || !parsed) throw new Error('저장된 세션 JSON이 손상되었습니다.');
        const fromVersion = Math.max(1, Math.round(Number(source.schemaVersion) || 1));
        if (fromVersion > CURRENT_SCHEMA_VERSION) throw new Error('더 최신 버전에서 저장한 세션입니다. 프로그램을 업데이트해주세요.');
        if (!parsed) throw new Error('저장된 세션 JSON이 손상되었습니다.');
        parsed.schemaVersion = CURRENT_SCHEMA_VERSION;
        parsed.session = Object.assign({}, parsed.session || {}, {
            version: config.APP_VERSION || parsed.session && parsed.session.version || 'dev',
            schemaVersion: CURRENT_SCHEMA_VERSION,
            sourceSchemaVersion: fromVersion,
            migratedAt: fromVersion < CURRENT_SCHEMA_VERSION ? nowIso() : parsed.session && parsed.session.migratedAt || ''
        });
        return Object.freeze({ snapshot: parsed, fromVersion, migrated: fromVersion < CURRENT_SCHEMA_VERSION, sourceKey: sourceKey || STORAGE_KEY, compressed: decoded.compressed, storedChars: decoded.storedChars, rawChars: decoded.rawChars, savingsRatio: decoded.savingsRatio });
    }
    function persistMigratedSnapshot(result) {
        if (!result || !result.migrated) return;
        const text = JSON.stringify(result.snapshot);
        const write = writeKey(STORAGE_KEY, text, { preserveKeys: [STORAGE_KEY], maxCleanupRemovals: effectiveBackupLimit() });
        if (write.ok) {
            lastMigrationFrom = result.fromVersion;
            if (store.addDiagnostic) store.addDiagnostic({ type: 'session-schema-migrated', from: result.fromVersion, to: CURRENT_SCHEMA_VERSION, source: result.sourceKey });
            emit('ai-shorts-session-migrated', { from: result.fromVersion, to: CURRENT_SCHEMA_VERSION, source: result.sourceKey });
        }
    }
    function rotateBackups(previousRaw) {
        if (!previousRaw || previousRaw.length > BACKUP_MAX_CHARS) {
            if (previousRaw && store.addDiagnostic) store.addDiagnostic({ type: 'session-backup-skipped', reason: 'size', rawCharacterCount: previousRaw.length, maxCharacters: BACKUP_MAX_CHARS });
            return 0;
        }
        try { parseSnapshotText(previousRaw, STORAGE_KEY); }
        catch (_) { return 0; }
        const limit = effectiveBackupLimit();
        for (let index = BACKUP_KEYS.length - 1; index >= limit; index -= 1) removeKey(BACKUP_KEYS[index]);
        for (let index = limit - 1; index > 0; index -= 1) {
            const older = readKey(BACKUP_KEYS[index - 1]);
            if (!older || older.length > BACKUP_MAX_CHARS) removeKey(BACKUP_KEYS[index]);
            else writeKey(BACKUP_KEYS[index], older, { cleanup: false });
        }
        const encoded = encodeBackupText(previousRaw);
        const result = writeKey(BACKUP_KEYS[0], encoded.text, { cleanup: false });
        const meta = backupMetadata();
        if (result.ok && store.addDiagnostic) store.addDiagnostic({ type: 'session-backup-rotated', backupCount: meta.count, backupLimit: limit, compressed: encoded.compressed, rawCharacterCount: encoded.rawChars, storedCharacterCount: encoded.storedChars, savingsRatio: Number(encoded.savingsRatio.toFixed(4)) });
        return meta.count;
    }
    function readStoredSnapshotText() { return readKey(STORAGE_KEY); }
    function findValidBackup() {
        for (const key of BACKUP_KEYS) {
            const raw = readKey(key);
            if (!raw) continue;
            try { return Object.assign({ raw }, parseSnapshotText(raw, key)); }
            catch (_) { /* try older backup */ }
        }
        return null;
    }
    function loadSnapshot() {
        const raw = readStoredSnapshotText();
        if (!raw) {
            invalidSnapshotReason = '';
            invalidSnapshotReported = false;
            lastLoadedSource = '';
            return null;
        }
        try {
            const result = parseSnapshotText(raw, STORAGE_KEY);
            invalidSnapshotReason = '';
            invalidSnapshotReported = false;
            lastLoadedSource = STORAGE_KEY;
            lastSavedAt = result.snapshot.savedAt || result.snapshot.createdAt || lastSavedAt;
            persistMigratedSnapshot(result);
            return result.snapshot;
        } catch (error) {
            appendRecoveryHistory('primary-load-failed', { reason: error && error.message || 'unknown' });
            const backup = findValidBackup();
            if (backup) {
                const recoveredText = JSON.stringify(backup.snapshot);
                const write = writeKey(STORAGE_KEY, recoveredText, { preserveKeys: BACKUP_KEYS, maxCleanupRemovals: 0 });
                invalidSnapshotReason = '';
                invalidSnapshotReported = false;
                lastLoadedSource = backup.sourceKey;
                lastMigrationFrom = backup.fromVersion < CURRENT_SCHEMA_VERSION ? backup.fromVersion : lastMigrationFrom;
                lastSavedAt = backup.snapshot.savedAt || backup.snapshot.createdAt || lastSavedAt;
                if (store.addDiagnostic) store.addDiagnostic({ type: 'session-backup-recovered', source: backup.sourceKey, primaryRepaired: Boolean(write.ok), schemaVersion: CURRENT_SCHEMA_VERSION, compressed: Boolean(backup.compressed) });
                appendRecoveryHistory('backup-recovered', { source: backup.sourceKey, primaryRepaired: Boolean(write.ok), compressed: Boolean(backup.compressed), fromSchemaVersion: backup.fromVersion });
                emit('ai-shorts-session-backup-recovered', { source: backup.sourceKey, primaryRepaired: Boolean(write.ok) });
                return backup.snapshot;
            }
            invalidSnapshotReason = error && error.message || '저장된 세션을 복구할 수 없습니다.';
            appendRecoveryHistory('backup-recovery-failed', { reason: invalidSnapshotReason, backupCount: backupMetadata().count });
            if (!invalidSnapshotReported && store.addDiagnostic) {
                invalidSnapshotReported = true;
                store.addDiagnostic({ type: 'session-snapshot-invalid', message: invalidSnapshotReason });
            }
            return null;
        }
    }
    function saveSnapshotNow(reason) {
        if (!hasWork()) return false;
        try {
            const previousRaw = readStoredSnapshotText();
            const snapshot = createSnapshot();
            const text = JSON.stringify(snapshot);
            const result = writeKey(STORAGE_KEY, text, { preserveKeys: [STORAGE_KEY], maxCleanupRemovals: effectiveBackupLimit() });
            if (!result.ok) {
                const message = result.quota ? '브라우저 저장 공간이 부족해 자동 저장하지 못했습니다.' : '작업 세션을 저장하지 못했습니다.';
                if (Date.now() - quotaNoticeAt > 30000) { quotaNoticeAt = Date.now(); notify(message, result.quota ? 'warning' : 'error', { duration: 4200 }); }
                if (store.addDiagnostic) store.addDiagnostic({ type: result.quota ? 'session-save-quota' : 'session-save-error', message: result.error && result.error.message || message, rawCharacterCount: text.length });
                emit('ai-shorts-session-save-failed', { quota: Boolean(result.quota), rawCharacterCount: text.length });
                return false;
            }
            if (previousRaw && previousRaw !== text) rotateBackups(previousRaw);
            lastSavedAt = snapshot.savedAt;
            lastLoadedSource = STORAGE_KEY;
            invalidSnapshotReason = '';
            if (document.body) document.body.dataset.sessionContinuity = 'saved';
            updatePanel(snapshot, reason || 'autosave');
            emit('ai-shorts-session-saved', { reason: reason || 'autosave', savedAt: snapshot.savedAt, schemaVersion: CURRENT_SCHEMA_VERSION });
            if (storageManager.estimate) storageManager.estimate().catch(() => {});
            return true;
        } catch (error) {
            if (store.addDiagnostic) store.addDiagnostic({ type: 'session-save-error', message: error.message });
            return false;
        }
    }
    function scheduleSave(reason) {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => saveSnapshotNow(reason), SAVE_DELAY);
    }
    function clearSnapshot() {
        [STORAGE_KEY, ...BACKUP_KEYS].forEach(removeKey);
        appendRecoveryHistory('session-records-cleared', { backupCapacity: BACKUP_MAX_COUNT });
        invalidSnapshotReason = '';
        invalidSnapshotReported = false;
        lastLoadedSource = '';
        lastMigrationFrom = 0;
        lastSavedAt = '';
        if (document.body) document.body.dataset.sessionContinuity = 'none';
        updatePanel(null, 'clear');
        emit('ai-shorts-session-cleared', { backupCount: BACKUP_MAX_COUNT });
    }
    function recoveryFilename(prefix) {
        const stamp = nowIso().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z').replace('T', '-');
        return `${prefix || 'ai-shorts-session'}-${stamp}.json`;
    }
    function saveRecoveryBlob(blob, filename) {
        if (downloadService && typeof downloadService.saveBlob === 'function') {
            downloadService.saveBlob(blob, filename);
            return true;
        }
        if (!global.URL || typeof global.URL.createObjectURL !== 'function') return false;
        const url = global.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        anchor.rel = 'noopener';
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        global.setTimeout(() => { try { global.URL.revokeObjectURL(url); } catch (_) { /* no-op */ } }, Math.max(10000, Number(config.DOWNLOAD_URL_REVOKE_DELAY_MS) || 45000));
        return true;
    }
    function exportStoredSnapshot() {
        const raw = readStoredSnapshotText();
        if (!raw) {
            notify('내보낼 자동 저장 기록이 없습니다.', 'warning');
            return null;
        }
        const parsed = loadSnapshot();
        const valid = Boolean(parsed);
        const payloadText = valid ? raw : JSON.stringify({
            app: 'AI Shorts Studio',
            exportType: 'damaged-session-recovery',
            appVersion: config.APP_VERSION || 'dev',
            exportedAt: nowIso(),
            storageKey: STORAGE_KEY,
            reason: invalidSnapshotReason || '저장된 세션을 복구할 수 없습니다.',
            rawCharacterCount: raw.length,
            rawSnapshotText: raw
        }, null, 2);
        const filename = recoveryFilename(valid ? 'ai-shorts-session-backup' : 'ai-shorts-damaged-session');
        const saved = saveRecoveryBlob(new Blob([payloadText], { type: 'application/json' }), filename);
        if (!saved) {
            notify('이 브라우저에서는 세션 기록을 파일로 저장할 수 없습니다.', 'error');
            return null;
        }
        if (store.addDiagnostic) store.addDiagnostic({
            type: 'session-snapshot-export',
            valid,
            fileName: filename,
            rawCharacterCount: raw.length,
            reason: valid ? '' : invalidSnapshotReason
        });
        notify(valid ? '자동 저장 기록을 백업했습니다.' : '손상된 자동 저장 원문을 진단 파일로 저장했습니다.', 'export', { duration: 3600 });
        return Object.freeze({ valid, filename, rawCharacterCount: raw.length });
    }
    function exportRecoveryDiagnostics() {
        const history = readRecoveryHistory();
        const backups = backupMetadata();
        const payload = {
            app: 'AI Shorts Studio',
            exportType: 'session-recovery-diagnostics',
            appVersion: config.APP_VERSION || 'dev',
            exportedAt: nowIso(),
            status: getStatus(),
            backups: backups.items.map(item => ({ key: item.key, valid: item.valid, compressed: item.compressed, codec: item.codec || '', storedChars: item.storedChars, rawChars: item.rawChars, savingsRatio: Number((item.savingsRatio || 0).toFixed(4)), checksum: item.checksum || '', error: item.error || '' })),
            recoveryHistory: history
        };
        const filename = recoveryFilename('ai-shorts-session-recovery-diagnostics');
        const saved = saveRecoveryBlob(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), filename);
        if (!saved) { notify('이 브라우저에서는 복구 진단을 저장할 수 없습니다.', 'error'); return null; }
        if (store.addDiagnostic) store.addDiagnostic({ type: 'session-recovery-diagnostics-export', fileName: filename, historyCount: history.length, backupCount: backups.count });
        notify('세션 복구 진단 파일을 저장했습니다.', 'export', { duration: 3600 });
        return Object.freeze({ filename, historyCount: history.length, backupCount: backups.count });
    }
    function formatSavedAt(value) {
        if (!value) return '저장 시간 없음';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '저장 시간 없음';
        return date.toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    function ensurePanel() {
        let panel = byId('sessionContinuityPanel');
        if (panel) return panel;
        const startPanel = document.querySelector('.start-command-panel') || document.querySelector('.studio-hero');
        if (!startPanel) return null;
        panel = document.createElement('section');
        panel.id = 'sessionContinuityPanel';
        panel.className = 'session-continuity-panel';
        panel.setAttribute('aria-label', '작업 세션 복구');
        panel.innerHTML = '<div class="session-continuity-copy"><span class="session-continuity-icon studio-icon" data-icon="retry" aria-hidden="true"></span><div><strong id="sessionContinuityTitle">작업 세션 자동 저장 준비</strong><small id="sessionContinuityMeta">후보와 선택 구간이 생기면 자동으로 가볍게 저장합니다.</small></div></div><div class="session-continuity-actions"><button id="sessionRestoreBtn" class="primary" type="button">이전 작업 복구</button><button id="sessionSaveBtn" type="button">지금 저장</button><button id="sessionExportBtn" type="button" data-icon="diagnostics">기록 백업</button><button id="sessionDiagnosticsBtn" type="button" data-icon="diagnostics">복구 진단</button><button id="sessionClearBtn" type="button">기록 지우기</button></div>';
        startPanel.insertAdjacentElement('afterend', panel);
        const restore = byId('sessionRestoreBtn');
        const save = byId('sessionSaveBtn');
        const exportButton = byId('sessionExportBtn');
        const diagnosticsButton = byId('sessionDiagnosticsBtn');
        const clear = byId('sessionClearBtn');
        if (restore) restore.addEventListener('click', restoreSnapshot);
        if (save) save.addEventListener('click', () => saveSnapshotNow('manual'));
        if (exportButton) exportButton.addEventListener('click', exportStoredSnapshot);
        if (diagnosticsButton) diagnosticsButton.addEventListener('click', exportRecoveryDiagnostics);
        if (clear) clear.addEventListener('click', clearSnapshot);
        return panel;
    }
    function updatePanel(snapshot, reason) {
        ensurePanel();
        const stored = snapshot || loadSnapshot();
        const hasStoredRecord = Boolean(snapshot || readStoredSnapshotText());
        const invalidStoredRecord = hasStoredRecord && !stored;
        const title = byId('sessionContinuityTitle');
        const meta = byId('sessionContinuityMeta');
        const restore = byId('sessionRestoreBtn');
        const save = byId('sessionSaveBtn');
        const exportButton = byId('sessionExportBtn');
        const clear = byId('sessionClearBtn');
        const canRestore = Boolean(stored && stored.app === 'AI Shorts Studio' && Array.isArray(stored.recommendations) && stored.recommendations.length);
        if (document.body) document.body.dataset.sessionContinuity = invalidStoredRecord ? 'invalid' : (canRestore ? 'available' : (hasWork() ? 'saved' : 'none'));
        if (title) title.textContent = invalidStoredRecord ? '자동 저장 기록을 복구할 수 없습니다' : (canRestore ? '이전 작업 세션이 있습니다' : '작업 세션 자동 저장');
        if (meta) {
            if (invalidStoredRecord) {
                meta.textContent = `${invalidSnapshotReason || '저장된 세션이 손상되었습니다.'} 필요하면 원문을 저장한 뒤 기록을 지워주세요.`;
            } else if (canRestore) {
                const count = stored.recommendations.length;
                const selected = stored.selectedRecommendationId ? ' · 선택 후보 있음' : '';
                const backupCount = BACKUP_KEYS.filter(key => Boolean(readKey(key))).length;
                const timestamp = document.createElement('span');
                timestamp.className = 'session-continuity-timestamp';
                timestamp.textContent = formatSavedAt(stored.savedAt || stored.createdAt);
                meta.replaceChildren(document.createTextNode(`${stored.fileName || '이전 파일'} · 후보 ${count}개${selected} · 스키마 v${CURRENT_SCHEMA_VERSION} · 백업 ${backupCount}개 · `), timestamp);
            } else {
                meta.textContent = hasWork() ? '현재 작업 상태를 로컬에 보존하고 있습니다.' : '파일을 열고 후보를 만들면 자동으로 가볍게 저장합니다.';
            }
        }
        if (restore) restore.disabled = !canRestore;
        if (save) save.disabled = !hasWork();
        if (exportButton) {
            exportButton.disabled = !hasStoredRecord;
            exportButton.textContent = invalidStoredRecord ? '손상 기록 저장' : '기록 백업';
        }
        if (clear) clear.disabled = !hasStoredRecord;
        if (reason && reason !== 'sync') {
            if (reason === 'manual') notify('작업 세션을 저장했습니다.', 'export');
            if (reason === 'clear') notify('작업 세션 기록을 지웠습니다.', 'action');
        }
    }
    function restoreSnapshot() {
        const snapshot = loadSnapshot();
        if (!snapshot || !Array.isArray(snapshot.recommendations) || !snapshot.recommendations.length) return;
        try {
            if (projectService.applyProjectSnapshot) projectService.applyProjectSnapshot(state, snapshot);
            else {
                state.recommendations = snapshot.recommendations || [];
                state.selectedRecommendationId = snapshot.selectedRecommendationId || state.recommendations[0].id || '';
                state.selectedRange = snapshot.selectedRange || null;
                state.captions = snapshot.captions || [];
                state.settings = Object.assign({}, state.settings || {}, snapshot.settings || {});
            }
            if (snapshot.copy) {
                const title = byId('titleInput');
                const hashtags = byId('hashtagInput');
                if (title && snapshot.copy.title) title.value = snapshot.copy.title;
                if (hashtags && snapshot.copy.hashtags) hashtags.value = snapshot.copy.hashtags;
            }
            if (store.saveSettings) store.saveSettings();
            if (global.AIShortsStudioApp && global.AIShortsStudioApp.renderAll) global.AIShortsStudioApp.renderAll();
            const targetTab = state.selectedRecommendationId ? 'preview' : 'candidates';
            const tabs = global.AIShortsHyperFlowTabs;
            if (tabs && tabs.setActiveFlowTab) tabs.setActiveFlowTab(targetTab, { reveal: true, force: true });
            else if (global.AIShortsMotionStability && global.AIShortsMotionStability.reveal) global.AIShortsMotionStability.reveal(targetTab, { force: true });
            document.dispatchEvent(new CustomEvent('ai-shorts-session-restored', { detail: { targetTab, count: state.recommendations.length } }));
            appendRecoveryHistory('session-restored', { source: lastLoadedSource || STORAGE_KEY, recommendationCount: state.recommendations.length });
            notify('이전 후보와 선택 구간을 복구했습니다. 원본 파일이 필요하면 다시 열어주세요.', 'action', { duration: 3600 });
            scheduleSave('restore');
            updatePanel(snapshot, 'restore');
        } catch (error) {
            if (store.addDiagnostic) store.addDiagnostic({ type: 'session-restore-error', message: error.message });
            appendRecoveryHistory('session-restore-failed', { reason: error && error.message || 'unknown' });
            notify('작업 세션 복구에 실패했습니다.', 'error');
        }
    }
    function getStatus() {
        const backups = backupMetadata();
        const history = readRecoveryHistory();
        return Object.freeze({
            storageKey: STORAGE_KEY,
            schemaVersion: CURRENT_SCHEMA_VERSION,
            backupLimit: effectiveBackupLimit(),
            backupCapacity: BACKUP_MAX_COUNT,
            backupCount: backups.count,
            compressedBackupCount: backups.compressedCount,
            backupStoredChars: backups.storedChars,
            backupRawChars: backups.rawChars,
            backupSavingsPercent: Math.round(backups.savingsRatio * 100),
            hasPrimary: Boolean(readStoredSnapshotText()),
            invalid: Boolean(invalidSnapshotReason),
            invalidReason: invalidSnapshotReason,
            loadedSource: lastLoadedSource,
            lastMigrationFrom,
            lastSavedAt,
            recoveryHistoryCount: history.length,
            lastRecovery: history[0] || null
        });
    }
    function scheduleSync() {
        clearTimeout(syncTimer);
        syncTimer = setTimeout(() => updatePanel(null, 'sync'), 160);
    }
    function stopHeartbeat() {
        if (heartbeatTimer) global.clearInterval(heartbeatTimer);
        heartbeatTimer = 0;
    }
    function startHeartbeat() {
        stopHeartbeat();
        if (document.hidden) return;
        heartbeatTimer = global.setInterval(() => {
            if (document.hidden) return;
            if (hasWork()) saveSnapshotNow('interval');
            else scheduleSync();
        }, 30000);
    }
    function handleVisibilityChange() {
        if (document.hidden) {
            if (hasWork()) saveSnapshotNow('hidden');
            stopHeartbeat();
            return;
        }
        scheduleSync();
        startHeartbeat();
    }
    function install() {
        ensurePanel();
        updatePanel(null, 'sync');
        ['click', 'change', 'input'].forEach(type => document.addEventListener(type, event => {
            const target = event.target;
            if (!target || !target.closest) return;
            if (target.closest('.recommendation-card, [data-pin-toggle], [data-render-preset], #titleInput, #hashtagInput, #captionTextInput, [data-flow-tab], .caption-preset, .quality-panel, .caption-pro-panel')) {
                scheduleSave(type);
                scheduleSync();
            }
        }, true));
        ['ai-shorts-flow-sync', 'ai-shorts-render-preset-change', 'ai-shorts-pinned-candidates-change', 'ai-shorts-session-restored'].forEach(eventName => {
            document.addEventListener(eventName, () => { scheduleSave(eventName); scheduleSync(); });
        });
        window.addEventListener('beforeunload', () => saveSnapshotNow('beforeunload'));
        window.addEventListener('pagehide', () => { if (hasWork()) saveSnapshotNow('pagehide'); stopHeartbeat(); });
        document.addEventListener('visibilitychange', handleVisibilityChange);
        startHeartbeat();
    }
    global.AIShortsSessionContinuity = Object.freeze({ saveSnapshotNow, restoreSnapshot, clearSnapshot, loadSnapshot, exportStoredSnapshot, exportRecoveryDiagnostics, readRecoveryHistory, scheduleSave, getStatus, CURRENT_SCHEMA_VERSION, BACKUP_KEYS, RECOVERY_HISTORY_KEY });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
    else install();
})(window);
