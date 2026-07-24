// AI Shorts Studio v1.6.9 - portable protected backups, notes, and selectable recovery
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
    const PROTECTED_BACKUP_KEY = `${STORAGE_KEY}-protected`;
    const PROTECTED_BACKUP_META_KEY = `${PROTECTED_BACKUP_KEY}-meta`;
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
    let selectedRestoreSource = STORAGE_KEY;
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
    function sanitizeProtectedMeta(value) {
        const source = value && typeof value === 'object' ? value : {};
        return Object.freeze({
            name: String(source.name || '중요 백업').trim().slice(0, 60) || '중요 백업',
            note: String(source.note || '').trim().slice(0, 240),
            createdAt: String(source.createdAt || nowIso()),
            source: String(source.source || '')
        });
    }
    function readProtectedMeta() {
        const parsed = safeParse(readKey(PROTECTED_BACKUP_META_KEY));
        return sanitizeProtectedMeta(parsed || {});
    }
    function writeProtectedMeta(value) {
        const meta = sanitizeProtectedMeta(value);
        const result = writeKey(PROTECTED_BACKUP_META_KEY, JSON.stringify(meta), { cleanup: false, preserveKeys: [STORAGE_KEY, PROTECTED_BACKUP_KEY, PROTECTED_BACKUP_META_KEY, ...BACKUP_KEYS] });
        return Object.freeze({ ok: Boolean(result && result.ok), meta, quota: Boolean(result && result.quota) });
    }

    function listAvailableSnapshots() {
        const protectedMeta = readProtectedMeta();
        const sources = [{ key: STORAGE_KEY, kind: 'primary' }, { key: PROTECTED_BACKUP_KEY, kind: 'protected' }, ...BACKUP_KEYS.map((key, index) => ({ key, kind: 'backup', index: index + 1 }))];
        return sources.map(source => {
            const raw = readKey(source.key);
            if (!raw) return null;
            try {
                const result = parseSnapshotText(raw, source.key);
                const snapshot = result.snapshot;
                return Object.freeze({
                    key: source.key,
                    kind: source.kind,
                    index: source.index || 0,
                    valid: true,
                    savedAt: snapshot.savedAt || snapshot.createdAt || '',
                    fileName: snapshot.fileName || snapshot.fileMeta && snapshot.fileMeta.name || '',
                    recommendationCount: Array.isArray(snapshot.recommendations) ? snapshot.recommendations.length : 0,
                    captionCount: Array.isArray(snapshot.captions) ? snapshot.captions.length : 0,
                    hasSelectedRange: Boolean(snapshot.selectedRange),
                    selectedRecommendationId: snapshot.selectedRecommendationId || '',
                    protected: source.kind === 'protected',
                    protectedName: source.kind === 'protected' ? protectedMeta.name : '',
                    protectedNote: source.kind === 'protected' ? protectedMeta.note : '',
                    compressed: Boolean(result.compressed),
                    storedChars: Number(result.storedChars) || raw.length,
                    rawChars: Number(result.rawChars) || raw.length,
                    savingsRatio: Number(result.savingsRatio) || 0,
                    schemaVersion: Number(snapshot.schemaVersion) || CURRENT_SCHEMA_VERSION,
                    error: ''
                });
            } catch (error) {
                return Object.freeze({ key: source.key, kind: source.kind, index: source.index || 0, valid: false, savedAt: '', fileName: '', recommendationCount: 0, captionCount: 0, hasSelectedRange: false, selectedRecommendationId: '', protected: source.kind === 'protected', protectedName: source.kind === 'protected' ? protectedMeta.name : '', protectedNote: source.kind === 'protected' ? protectedMeta.note : '', compressed: raw.startsWith('AISSB1:'), storedChars: raw.length, rawChars: 0, savingsRatio: 0, schemaVersion: 0, error: error && error.message || '손상된 백업' });
            }
        }).filter(Boolean);
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
        for (const key of [PROTECTED_BACKUP_KEY, ...BACKUP_KEYS]) {
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
        [STORAGE_KEY, PROTECTED_BACKUP_KEY, PROTECTED_BACKUP_META_KEY, ...BACKUP_KEYS].forEach(removeKey);
        appendRecoveryHistory('session-records-cleared', { backupCapacity: BACKUP_MAX_COUNT });
        invalidSnapshotReason = '';
        invalidSnapshotReported = false;
        lastLoadedSource = '';
        lastMigrationFrom = 0;
        lastSavedAt = '';
        selectedRestoreSource = STORAGE_KEY;
        if (document.body) document.body.dataset.sessionContinuity = 'none';
        updatePanel(null, 'clear');
        emit('ai-shorts-session-cleared', { backupCount: BACKUP_MAX_COUNT });
    }
    function protectSelectedSnapshot() {
        const sourceKey = String(selectedRestoreSource || STORAGE_KEY);
        if (sourceKey === PROTECTED_BACKUP_KEY) {
            removeKey(PROTECTED_BACKUP_KEY);
            removeKey(PROTECTED_BACKUP_META_KEY);
            appendRecoveryHistory('protected-backup-removed', { source: PROTECTED_BACKUP_KEY });
            selectedRestoreSource = STORAGE_KEY;
            notify('중요 백업 보호를 해제했습니다.', 'action');
            updatePanel(null, 'sync');
            return Object.freeze({ protected: false, source: PROTECTED_BACKUP_KEY });
        }
        const raw = readKey(sourceKey);
        if (!raw) { notify('보호할 세션 기록이 없습니다.', 'warning'); return Object.freeze({ protected: false, source: sourceKey }); }
        try { parseSnapshotText(raw, sourceKey); }
        catch (error) { notify('손상된 세션 기록은 보호할 수 없습니다.', 'error'); return Object.freeze({ protected: false, source: sourceKey, error: error && error.message || 'invalid' }); }
        const result = writeKey(PROTECTED_BACKUP_KEY, raw, { cleanup: false, preserveKeys: [STORAGE_KEY, PROTECTED_BACKUP_KEY, PROTECTED_BACKUP_META_KEY, ...BACKUP_KEYS] });
        if (!result.ok) { notify('중요 백업을 저장하지 못했습니다.', result.quota ? 'warning' : 'error'); return Object.freeze({ protected: false, source: sourceKey }); }
        const existingMeta = readProtectedMeta();
        writeProtectedMeta({ name: existingMeta.name || '중요 백업', note: existingMeta.note || '', createdAt: nowIso(), source: sourceKey });
        selectedRestoreSource = PROTECTED_BACKUP_KEY;
        appendRecoveryHistory('protected-backup-created', { source: sourceKey, protectedSource: PROTECTED_BACKUP_KEY });
        emit('ai-shorts-session-protected-backup', { source: sourceKey });
        notify('선택한 시점을 중요 백업으로 보호했습니다.', 'export');
        updatePanel(null, 'sync');
        return Object.freeze({ protected: true, source: sourceKey });
    }

    function editProtectedBackupNote() {
        const raw = readKey(PROTECTED_BACKUP_KEY);
        if (!raw) { notify('메모를 작성할 중요 백업이 없습니다.', 'warning'); return null; }
        const current = readProtectedMeta();
        if (typeof global.prompt !== 'function') return current;
        const name = global.prompt('중요 백업 이름', current.name);
        if (name == null) return current;
        const note = global.prompt('중요 백업 메모 (선택)', current.note);
        if (note == null) return current;
        const result = writeProtectedMeta({ name, note, createdAt: current.createdAt, source: current.source });
        if (!result.ok) { notify('중요 백업 메모를 저장하지 못했습니다.', result.quota ? 'warning' : 'error'); return null; }
        appendRecoveryHistory('protected-backup-note-updated', { source: PROTECTED_BACKUP_KEY, name: result.meta.name, noteLength: result.meta.note.length });
        notify('중요 백업 이름과 메모를 저장했습니다.', 'action');
        updatePanel(null, 'sync');
        return result.meta;
    }

    function exportProtectedBackup() {
        const raw = readKey(PROTECTED_BACKUP_KEY);
        if (!raw) { notify('내보낼 중요 백업이 없습니다.', 'warning'); return null; }
        try { parseSnapshotText(raw, PROTECTED_BACKUP_KEY); }
        catch (error) { notify('손상된 중요 백업은 내보낼 수 없습니다.', 'error'); return null; }
        const meta = readProtectedMeta();
        const payload = {
            app: 'AI Shorts Studio',
            exportType: 'protected-session-backup',
            formatVersion: 1,
            appVersion: config.APP_VERSION || 'dev',
            exportedAt: nowIso(),
            meta,
            storedSnapshot: raw
        };
        const filename = recoveryFilename('ai-shorts-important-backup');
        const saved = saveRecoveryBlob(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), filename);
        if (!saved) { notify('중요 백업 파일을 저장하지 못했습니다.', 'error'); return null; }
        appendRecoveryHistory('protected-backup-exported', { source: PROTECTED_BACKUP_KEY, fileName: filename, storedChars: raw.length });
        notify('중요 백업을 별도 파일로 저장했습니다.', 'export');
        return Object.freeze({ saved: true, filename, storedChars: raw.length, meta });
    }

    async function importProtectedBackupFile(file) {
        if (!file || typeof file.text !== 'function') throw new Error('가져올 중요 백업 파일을 선택하세요.');
        if (Number(file.size) > Math.max(3 * 1024 * 1024, MAX_SNAPSHOT_CHARS * 4)) throw new Error('중요 백업 파일이 허용 크기를 초과했습니다.');
        const text = await file.text();
        const payload = safeParse(text);
        if (!payload || payload.app !== 'AI Shorts Studio' || payload.exportType !== 'protected-session-backup' || Number(payload.formatVersion) !== 1 || typeof payload.storedSnapshot !== 'string') throw new Error('AI Shorts Studio 중요 백업 파일이 아닙니다.');
        parseSnapshotText(payload.storedSnapshot, 'imported-protected-backup');
        const write = writeKey(PROTECTED_BACKUP_KEY, payload.storedSnapshot, { cleanup: false, preserveKeys: [STORAGE_KEY, PROTECTED_BACKUP_KEY, PROTECTED_BACKUP_META_KEY, ...BACKUP_KEYS] });
        if (!write.ok) throw new Error(write.quota ? '저장 공간이 부족해 중요 백업을 가져오지 못했습니다.' : '중요 백업을 저장하지 못했습니다.');
        writeProtectedMeta(Object.assign({}, payload.meta || {}, { createdAt: payload.meta && payload.meta.createdAt || nowIso(), source: 'import' }));
        selectedRestoreSource = PROTECTED_BACKUP_KEY;
        appendRecoveryHistory('protected-backup-imported', { source: PROTECTED_BACKUP_KEY, fileName: String(file.name || '').slice(0, 120), storedChars: payload.storedSnapshot.length });
        emit('ai-shorts-session-protected-backup', { source: 'import' });
        notify('중요 백업을 가져왔습니다.', 'export');
        updatePanel(null, 'sync');
        return Object.freeze({ imported: true, storedChars: payload.storedSnapshot.length, meta: readProtectedMeta() });
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
        panel.innerHTML = '<div class="session-continuity-copy"><span class="session-continuity-icon studio-icon" data-icon="retry" aria-hidden="true"></span><div><strong id="sessionContinuityTitle">작업 세션 자동 저장 준비</strong><small id="sessionContinuityMeta">후보와 선택 구간이 생기면 자동으로 가볍게 저장합니다.</small><small id="sessionBackupPreview" class="session-backup-preview" hidden></small></div></div><div class="session-continuity-actions"><label id="sessionBackupPicker" class="session-backup-picker" hidden><span>복구 시점</span><select id="sessionBackupSelect" aria-label="복구할 세션 시점 선택"></select></label><button id="sessionRestoreBtn" class="primary" type="button">선택 기록 복구</button><button id="sessionProtectBtn" type="button" data-icon="pin">중요 백업 보호</button><button id="sessionProtectedExportBtn" type="button" data-icon="export">중요 백업 파일</button><button id="sessionProtectedImportBtn" type="button" data-icon="upload">중요 백업 가져오기</button><button id="sessionProtectedNoteBtn" type="button" data-icon="edit">중요 백업 메모</button><input id="sessionProtectedImportInput" type="file" accept="application/json,.json" hidden aria-label="중요 백업 파일 선택" /><button id="sessionSaveBtn" type="button">지금 저장</button><button id="sessionExportBtn" type="button" data-icon="diagnostics">기록 백업</button><button id="sessionDiagnosticsBtn" type="button" data-icon="diagnostics">복구 진단</button><button id="sessionClearBtn" type="button">기록 지우기</button></div>';
        startPanel.insertAdjacentElement('afterend', panel);
        const restore = byId('sessionRestoreBtn');
        const protect = byId('sessionProtectBtn');
        const protectedExport = byId('sessionProtectedExportBtn');
        const protectedImport = byId('sessionProtectedImportBtn');
        const protectedImportInput = byId('sessionProtectedImportInput');
        const protectedNote = byId('sessionProtectedNoteBtn');
        const save = byId('sessionSaveBtn');
        const exportButton = byId('sessionExportBtn');
        const diagnosticsButton = byId('sessionDiagnosticsBtn');
        const select = byId('sessionBackupSelect');
        const clear = byId('sessionClearBtn');
        if (select) select.addEventListener('change', () => { selectedRestoreSource = select.value || STORAGE_KEY; updatePanel(null, 'sync'); });
        if (restore) restore.addEventListener('click', () => restoreSnapshot(selectedRestoreSource));
        if (protect) protect.addEventListener('click', protectSelectedSnapshot);
        if (protectedExport) protectedExport.addEventListener('click', exportProtectedBackup);
        if (protectedImport && protectedImportInput) protectedImport.addEventListener('click', () => protectedImportInput.click());
        if (protectedImportInput) protectedImportInput.addEventListener('change', async () => {
            const file = protectedImportInput.files && protectedImportInput.files[0];
            try { if (file) await importProtectedBackupFile(file); } catch (error) { notify(error && error.message || '중요 백업 가져오기에 실패했습니다.', 'error'); }
            protectedImportInput.value = '';
        });
        if (protectedNote) protectedNote.addEventListener('click', editProtectedBackupNote);
        if (save) save.addEventListener('click', () => saveSnapshotNow('manual'));
        if (exportButton) exportButton.addEventListener('click', exportStoredSnapshot);
        if (diagnosticsButton) diagnosticsButton.addEventListener('click', exportRecoveryDiagnostics);
        if (clear) clear.addEventListener('click', clearSnapshot);
        return panel;
    }
    function snapshotOptionLabel(item) {
        const source = item.kind === 'primary' ? '최신 기본 기록' : item.kind === 'protected' ? (item.protectedName || '중요 보호 백업') : `백업 ${item.index}`;
        if (!item.valid) return `${source} · 손상됨`;
        const time = formatSavedAt(item.savedAt);
        const count = `후보 ${item.recommendationCount || 0}개`;
        const compression = item.compressed ? ` · 압축 ${Math.round((item.savingsRatio || 0) * 100)}%` : '';
        return `${source} · ${time} · ${count}${compression}`;
    }
    function updateBackupSelector(items) {
        const picker = byId('sessionBackupPicker');
        const select = byId('sessionBackupSelect');
        if (!picker || !select) return;
        const validItems = items.filter(item => item.valid && item.recommendationCount > 0);
        if (!validItems.some(item => item.key === selectedRestoreSource)) selectedRestoreSource = validItems[0] && validItems[0].key || STORAGE_KEY;
        select.replaceChildren(...items.map(item => {
            const option = document.createElement('option');
            option.value = item.key;
            option.textContent = snapshotOptionLabel(item);
            option.disabled = !item.valid || item.recommendationCount <= 0;
            option.selected = item.key === selectedRestoreSource;
            return option;
        }));
        picker.hidden = items.length < 2;
        select.disabled = validItems.length < 2;
    }

    function updatePanel(snapshot, reason) {
        ensurePanel();
        const stored = snapshot || loadSnapshot();
        const availableSnapshots = listAvailableSnapshots();
        updateBackupSelector(availableSnapshots);
        const selectedItem = availableSnapshots.find(item => item.key === selectedRestoreSource && item.valid) || availableSnapshots.find(item => item.valid) || null;
        const hasStoredRecord = Boolean(snapshot || availableSnapshots.length || readStoredSnapshotText());
        const invalidStoredRecord = hasStoredRecord && !stored;
        const title = byId('sessionContinuityTitle');
        const meta = byId('sessionContinuityMeta');
        const preview = byId('sessionBackupPreview');
        const restore = byId('sessionRestoreBtn');
        const protect = byId('sessionProtectBtn');
        const protectedExport = byId('sessionProtectedExportBtn');
        const protectedNote = byId('sessionProtectedNoteBtn');
        const save = byId('sessionSaveBtn');
        const exportButton = byId('sessionExportBtn');
        const clear = byId('sessionClearBtn');
        const canRestore = Boolean(selectedItem && selectedItem.recommendationCount > 0) || Boolean(stored && stored.app === 'AI Shorts Studio' && Array.isArray(stored.recommendations) && stored.recommendations.length);
        if (document.body) document.body.dataset.sessionContinuity = invalidStoredRecord ? 'invalid' : (canRestore ? 'available' : (hasWork() ? 'saved' : 'none'));
        if (title) title.textContent = invalidStoredRecord ? '자동 저장 기록을 복구할 수 없습니다' : (canRestore ? '이전 작업 세션이 있습니다' : '작업 세션 자동 저장');
        if (meta) {
            if (invalidStoredRecord) {
                meta.textContent = `${invalidSnapshotReason || '저장된 세션이 손상되었습니다.'} 필요하면 원문을 저장한 뒤 기록을 지워주세요.`;
            } else if (canRestore) {
                const selectedSnapshot = selectedItem || {};
                const count = selectedSnapshot.recommendationCount || stored && stored.recommendations && stored.recommendations.length || 0;
                const selected = selectedSnapshot.selectedRecommendationId || stored && stored.selectedRecommendationId ? ' · 선택 후보 있음' : '';
                const backupCount = availableSnapshots.filter(item => item.kind === 'backup').length;
                const timestamp = document.createElement('span');
                timestamp.className = 'session-continuity-timestamp';
                timestamp.textContent = formatSavedAt(selectedSnapshot.savedAt || stored && (stored.savedAt || stored.createdAt));
                meta.replaceChildren(document.createTextNode(`${selectedSnapshot.fileName || stored && stored.fileName || '이전 파일'} · 후보 ${count}개${selected} · 스키마 v${selectedSnapshot.schemaVersion || CURRENT_SCHEMA_VERSION} · 백업 ${backupCount}개 · `), timestamp);
            } else {
                meta.textContent = hasWork() ? '현재 작업 상태를 로컬에 보존하고 있습니다.' : '파일을 열고 후보를 만들면 자동으로 가볍게 저장합니다.';
            }
        }
        if (preview) {
            if (selectedItem && selectedItem.valid) {
                const sourceLabel = selectedItem.kind === 'protected' ? '보호됨' : selectedItem.kind === 'primary' ? '기본 기록' : `순환 백업 ${selectedItem.index}`;
                const protectedLabel = selectedItem.kind === 'protected' && selectedItem.protectedName ? ` · ${selectedItem.protectedName}` : '';
                const protectedNote = selectedItem.kind === 'protected' && selectedItem.protectedNote ? ` · 메모: ${selectedItem.protectedNote}` : '';
                preview.textContent = `${sourceLabel}${protectedLabel} · 후보 ${selectedItem.recommendationCount || 0}개 · 자막 ${selectedItem.captionCount || 0}개${selectedItem.hasSelectedRange ? ' · 선택 구간 있음' : ''} · ${selectedItem.compressed ? `압축 ${Math.round((selectedItem.savingsRatio || 0) * 100)}%` : '평문 저장'}${protectedNote}`;
                preview.hidden = false;
            } else preview.hidden = true;
        }
        if (restore) restore.disabled = !canRestore;
        if (protect) {
            protect.disabled = !selectedItem || !selectedItem.valid;
            protect.textContent = selectedItem && selectedItem.kind === 'protected' ? '중요 보호 해제' : '중요 백업 보호';
        }
        if (protectedExport) protectedExport.disabled = !availableSnapshots.some(item => item.kind === 'protected' && item.valid);
        if (protectedNote) protectedNote.disabled = !availableSnapshots.some(item => item.kind === 'protected' && item.valid);
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
    function restoreSnapshot(sourceKey) {
        const requestedSource = String(sourceKey || selectedRestoreSource || STORAGE_KEY);
        let snapshot = null;
        let restoredSource = requestedSource;
        try {
            if (requestedSource === STORAGE_KEY) {
                snapshot = loadSnapshot();
                restoredSource = lastLoadedSource || STORAGE_KEY;
            } else {
                const raw = readKey(requestedSource);
                if (!raw) throw new Error('선택한 백업 기록이 없습니다.');
                const parsed = parseSnapshotText(raw, requestedSource);
                snapshot = parsed.snapshot;
                lastLoadedSource = requestedSource;
                lastMigrationFrom = parsed.fromVersion < CURRENT_SCHEMA_VERSION ? parsed.fromVersion : lastMigrationFrom;
            }
        } catch (error) {
            appendRecoveryHistory('selected-backup-load-failed', { source: requestedSource, reason: error && error.message || 'unknown' });
            notify(error && error.message || '선택한 세션 기록을 읽지 못했습니다.', 'error');
            updatePanel(null, 'sync');
            return false;
        }
        if (!snapshot || !Array.isArray(snapshot.recommendations) || !snapshot.recommendations.length) return false;
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
            appendRecoveryHistory('session-restored', { source: restoredSource, recommendationCount: state.recommendations.length, selectedBackup: restoredSource !== STORAGE_KEY });
            notify('이전 후보와 선택 구간을 복구했습니다. 원본 파일이 필요하면 다시 열어주세요.', 'action', { duration: 3600 });
            scheduleSave('restore');
            selectedRestoreSource = restoredSource;
            updatePanel(snapshot, 'restore');
            return true;
        } catch (error) {
            if (store.addDiagnostic) store.addDiagnostic({ type: 'session-restore-error', message: error.message });
            appendRecoveryHistory('session-restore-failed', { reason: error && error.message || 'unknown' });
            notify('작업 세션 복구에 실패했습니다.', 'error');
            return false;
        }
    }
    function getStatus() {
        const backups = backupMetadata();
        const history = readRecoveryHistory();
        const availableSnapshots = listAvailableSnapshots();
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
            lastRecovery: history[0] || null,
            selectableSnapshotCount: availableSnapshots.filter(item => item.valid && item.recommendationCount > 0).length,
            selectedRestoreSource,
            protectedBackup: availableSnapshots.find(item => item.kind === 'protected') || null,
            protectedBackupCount: availableSnapshots.some(item => item.kind === 'protected' && item.valid) ? 1 : 0,
            protectedBackupMeta: readProtectedMeta(),
            availableSnapshots
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
    global.AIShortsSessionContinuity = Object.freeze({ saveSnapshotNow, restoreSnapshot, clearSnapshot, loadSnapshot, listAvailableSnapshots, exportStoredSnapshot, exportRecoveryDiagnostics, exportProtectedBackup, importProtectedBackupFile, editProtectedBackupNote, readRecoveryHistory, protectSelectedSnapshot, scheduleSave, getStatus, CURRENT_SCHEMA_VERSION, BACKUP_KEYS, PROTECTED_BACKUP_KEY, PROTECTED_BACKUP_META_KEY, RECOVERY_HISTORY_KEY });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
    else install();
})(window);
