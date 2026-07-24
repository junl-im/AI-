// AI Shorts Studio v1.5.29 - schema-v4 bounded and compatibility-preserving project helpers
'use strict';

(function exposeProjectService(global) {
    const captionService = global.AIShortsCaptionService || {};
    const utils = global.AIShortsCoreUtils || {};
    const config = global.AIShortsRuntimeConfig || {};
    const CURRENT_SCHEMA_VERSION = Math.max(4, Number(config.SESSION_SCHEMA_VERSION || 4));
    const MAX_PROJECT_TEXT_CHARS = Math.max(1024, Number(config.MAX_PROJECT_TEXT_CHARS || 2_500_000));
    const MAX_RECOMMENDATIONS = Math.max(1, Number(config.MAX_PROJECT_RECOMMENDATIONS || 24));
    const MAX_CAPTIONS = Math.max(1, Number(config.MAX_PROJECT_CAPTIONS || 5000));
    const MAX_MEDIA_SECONDS = Math.max(60, Number(config.MAX_PROJECT_MEDIA_SECONDS || 24 * 60 * 60));

    function isPlainObject(value) {
        if (!value || Object.prototype.toString.call(value) !== '[object Object]') return false;
        const prototype = Object.getPrototypeOf(value);
        return prototype === Object.prototype || prototype === null;
    }

    function safeText(value, maxLength) {
        return String(value == null ? '' : value).replace(/\u0000/g, '').slice(0, Math.max(0, Number(maxLength) || 0));
    }

    function finiteNumber(value, fallback, min, max) {
        const number = Number(value);
        if (!Number.isFinite(number)) return fallback;
        return Math.max(min, Math.min(max, number));
    }

    function safeBoolean(value, fallback) {
        return typeof value === 'boolean' ? value : Boolean(fallback);
    }

    function sanitizeInterval(value, fallbackDuration, minimumDuration) {
        const minDuration = Math.max(0.001, Number(minimumDuration) || 0.001);
        const start = Number(value && value.start);
        const duration = Math.max(minDuration, Number(value && value.duration) || Number(fallbackDuration) || minDuration);
        const requestedEnd = Number.isFinite(Number(value && value.end)) ? Number(value.end) : (Number.isFinite(start) ? start : 0) + duration;
        if (utils.normalizeMediaRange) return utils.normalizeMediaRange(start, requestedEnd, MAX_MEDIA_SECONDS, minDuration);
        const safeStart = finiteNumber(start, 0, 0, Math.max(0, MAX_MEDIA_SECONDS - minDuration));
        return { start: safeStart, end: Math.min(MAX_MEDIA_SECONDS, Math.max(safeStart + minDuration, requestedEnd)) };
    }

    function sanitizeStringList(value, limit, maxLength) {
        if (!Array.isArray(value)) return [];
        return value.slice(0, limit).map(item => safeText(item, maxLength)).filter(Boolean);
    }

    function sanitizeStats(value) {
        if (!isPlainObject(value)) return {};
        const output = {};
        ['energy', 'peak', 'transient', 'silence', 'ramp', 'motion', 'calm', 'score'].forEach(key => {
            if (Number.isFinite(Number(value[key]))) output[key] = finiteNumber(value[key], 0, 0, 1);
        });
        return output;
    }

    function sanitizeCutInfo(value) {
        if (!isPlainObject(value)) return {};
        const output = {};
        ['startType', 'endType', 'note'].forEach(key => {
            if (value[key] != null) output[key] = safeText(value[key], 160);
        });
        ['startDistance', 'endDistance', 'padding'].forEach(key => {
            if (Number.isFinite(Number(value[key]))) output[key] = finiteNumber(value[key], 0, 0, MAX_MEDIA_SECONDS);
        });
        return output;
    }

    function sanitizeRecommendation(value, index) {
        if (!isPlainObject(value)) return null;
        const { start, end } = sanitizeInterval(value, 0.1, 0.1);
        const id = safeText(value.id, 120).replace(/[\u0000-\u001f\u007f]/g, '').trim() || `imported-${index + 1}`;
        return {
            id,
            start: Number(start.toFixed(3)),
            end: Number(end.toFixed(3)),
            duration: Number((end - start).toFixed(3)),
            scoreRaw: finiteNumber(value.scoreRaw, finiteNumber(value.score, 0, 0, 100) / 100, 0, 1),
            score: Math.round(finiteNumber(value.score, 0, 0, 100)),
            rank: Math.max(1, Math.round(finiteNumber(value.rank, index + 1, 1, MAX_RECOMMENDATIONS))),
            title: safeText(value.title, 240) || `불러온 후보 ${index + 1}`,
            rangeText: safeText(value.rangeText, 120),
            reasons: sanitizeStringList(value.reasons, 6, 360),
            stats: sanitizeStats(value.stats),
            cutInfo: sanitizeCutInfo(value.cutInfo),
            autoTrimmed: safeBoolean(value.autoTrimmed, false)
        };
    }

    function sanitizeCaption(value) {
        if (!isPlainObject(value)) return null;
        const { start, end } = sanitizeInterval(value, 2, 0.05);
        const text = safeText(value.text, 2000);
        if (!text) return null;
        return { start: Number(start.toFixed(3)), end: Number(end.toFixed(3)), text };
    }

    function sanitizeNestedOptions(value, allowedKeys) {
        const input = isPlainObject(value) ? value : {};
        const output = {};
        allowedKeys.forEach(key => {
            const item = input[key];
            if (typeof item === 'boolean') output[key] = item;
            else if (typeof item === 'number' && Number.isFinite(item)) output[key] = item;
            else if (typeof item === 'string') output[key] = safeText(item, 500);
        });
        return output;
    }

    function pickEnum(value, allowed) {
        const text = String(value == null ? '' : value);
        return allowed.includes(text) ? text : '';
    }

    function sanitizeSettings(value) {
        const input = isPlainObject(value) ? value : {};
        const output = {};
        const enums = {
            duration: ['auto', '15', '30', '45', '60', '90', '180'],
            style: ['balanced', 'impact', 'emotional', 'motion'],
            cropMode: ['center', 'top', 'bottom', 'blur-fit'],
            platform: ['youtube', 'reels', 'tiktok'],
            captionStyle: ['bold', 'box', 'clean'],
            thumbnailTemplate: ['neon', 'clean', 'cinematic', 'headline'],
            renderPreset: ['fast', 'balanced', 'high']
        };
        Object.keys(enums).forEach(key => {
            const selected = pickEnum(input[key], enums[key]);
            if (selected) output[key] = selected;
        });
        if (Number.isFinite(Number(input.captionOffset))) output.captionOffset = finiteNumber(input.captionOffset, 0, -3600, 3600);
        if (isPlainObject(input.captionOptions)) output.captionOptions = sanitizeNestedOptions(input.captionOptions, ['preset', 'position', 'size', 'color', 'accent', 'maxLines', 'boxOpacity', 'shadow', 'highlightWords', 'uppercase', 'autoBreak']);
        if (isPlainObject(input.qualityOptions)) output.qualityOptions = sanitizeNestedOptions(input.qualityOptions, ['brightness', 'contrast', 'saturation', 'vignette', 'fadeIn', 'fadeOut', 'introText', 'outroText', 'introDuration', 'outroDuration', 'watermarkText', 'watermarkPosition', 'safeGuide']);
        if (isPlainObject(input.autoCutOptions)) output.autoCutOptions = sanitizeNestedOptions(input.autoCutOptions, ['silenceThreshold', 'beatSensitivity', 'motionSensitivity', 'handlePadding', 'maxSnapDistance']);
        if (isPlainObject(input.feedbackOptions)) output.feedbackOptions = sanitizeNestedOptions(input.feedbackOptions, ['haptics', 'toastKinds']);
        if (isPlainObject(input.engineOptions)) output.engineOptions = sanitizeNestedOptions(input.engineOptions, ['modular', 'performanceMode', 'qualityGate']);
        return output;
    }

    function sanitizeFileMeta(value) {
        if (!isPlainObject(value)) return null;
        return {
            name: safeText(value.name, 500),
            size: Math.round(finiteNumber(value.size, 0, 0, Number.MAX_SAFE_INTEGER)),
            type: safeText(value.type, 160),
            duration: finiteNumber(value.duration, 0, 0, MAX_MEDIA_SECONDS)
        };
    }

    function sanitizeSelectedRange(value) {
        if (!isPlainObject(value)) return null;
        const { start, end } = sanitizeInterval(value, 0.1, 0.1);
        return {
            start: Number(start.toFixed(3)),
            end: Number(end.toFixed(3)),
            duration: Number((end - start).toFixed(3)),
            score: Math.round(finiteNumber(value.score, 0, 0, 100))
        };
    }

    function sanitizeProjectSnapshot(project) {
        if (!isPlainObject(project)) throw new Error('프로젝트 데이터 형식이 올바르지 않습니다.');
        const schemaVersion = Math.round(finiteNumber(project.schemaVersion, 0, 0, Number.MAX_SAFE_INTEGER));
        if (schemaVersion < 1 || schemaVersion > CURRENT_SCHEMA_VERSION) {
            throw new Error(schemaVersion > CURRENT_SCHEMA_VERSION ? '더 최신 버전에서 만든 프로젝트입니다. 프로그램을 업데이트해주세요.' : '지원하지 않는 프로젝트 버전입니다.');
        }
        const recommendations = (Array.isArray(project.recommendations) ? project.recommendations : [])
            .slice(0, MAX_RECOMMENDATIONS)
            .map(sanitizeRecommendation)
            .filter(Boolean);
        const seenRecommendationIds = new Set();
        recommendations.forEach((item, index) => {
            const base = item.id || `imported-${index + 1}`;
            let next = base;
            let suffix = 2;
            while (seenRecommendationIds.has(next)) {
                next = `${base.slice(0, 108)}-${suffix}`;
                suffix += 1;
            }
            item.id = next;
            seenRecommendationIds.add(next);
        });
        const captions = (Array.isArray(project.captions) ? project.captions : [])
            .slice(0, MAX_CAPTIONS)
            .map(sanitizeCaption)
            .filter(Boolean);
        const requestedId = safeText(project.selectedRecommendationId, 120);
        const selectedRecommendationId = recommendations.some(item => item.id === requestedId) ? requestedId : (recommendations[0] && recommendations[0].id || '');
        const selected = recommendations.find(item => item.id === selectedRecommendationId) || null;
        const copy = isPlainObject(project.copy) ? project.copy : {};
        const session = isPlainObject(project.session) ? project.session : {};
        return {
            app: 'AI Shorts Studio',
            schemaVersion: CURRENT_SCHEMA_VERSION,
            createdAt: safeText(project.createdAt, 80),
            savedAt: safeText(project.savedAt, 80),
            note: safeText(project.note, 1000),
            fileMeta: sanitizeFileMeta(project.fileMeta),
            fileName: safeText(project.fileName, 500),
            fileKind: safeText(project.fileKind, 32),
            settings: sanitizeSettings(project.settings),
            selectedRecommendationId,
            selectedRange: selected ? { start: selected.start, end: selected.end, duration: selected.duration, score: selected.score } : sanitizeSelectedRange(project.selectedRange),
            recommendations,
            captions,
            captionText: safeText(project.captionText, 1_000_000),
            copy: { title: safeText(copy.title, 500), hashtags: safeText(copy.hashtags, 3000) },
            session: {
                version: safeText(session.version, 40),
                schemaVersion: CURRENT_SCHEMA_VERSION,
                sourceSchemaVersion: Math.round(finiteNumber(session.sourceSchemaVersion || schemaVersion, schemaVersion, 1, CURRENT_SCHEMA_VERSION)),
                migratedAt: safeText(session.migratedAt, 80),
                fileKey: safeText(session.fileKey, 700),
                hasMediaInMemory: safeBoolean(session.hasMediaInMemory, false),
                recommendationCount: recommendations.length,
                captionCount: captions.length,
                selected: selectedRecommendationId
            }
        };
    }

    function createProjectSnapshot(state, title, hashtags) {
        const fileMeta = state && state.fileMeta ? Object.assign({}, state.fileMeta) : null;
        return sanitizeProjectSnapshot({
            app: 'AI Shorts Studio',
            schemaVersion: CURRENT_SCHEMA_VERSION,
            createdAt: new Date().toISOString(),
            note: '원본 미디어 파일은 포함되지 않습니다. 같은 파일을 다시 불러온 뒤 이 프로젝트 JSON을 적용하세요.',
            fileMeta,
            fileName: state && state.file ? state.file.name : fileMeta && fileMeta.name || '',
            fileKind: state && state.fileKind || '',
            settings: Object.assign({}, state && state.settings || {}),
            selectedRecommendationId: state && state.selectedRecommendationId || '',
            selectedRange: state && state.selectedRange ? Object.assign({}, state.selectedRange) : null,
            recommendations: (state && state.recommendations || []).map(item => Object.assign({}, item)),
            captions: (state && state.captions || []).map(cue => Object.assign({}, cue)),
            captionText: captionService.serializeCaptions ? captionService.serializeCaptions(state && state.captions || []) : '',
            copy: { title: String(title || ''), hashtags: String(hashtags || '') }
        });
    }

    function parseProjectText(text) {
        const source = String(text || '');
        if (!source.trim()) throw new Error('프로젝트 파일이 비어 있습니다.');
        if (source.length > MAX_PROJECT_TEXT_CHARS) throw new Error('프로젝트 파일이 너무 큽니다. 후보·자막 수를 줄여 다시 저장해주세요.');
        const parsed = JSON.parse(source);
        if (!parsed || parsed.app !== 'AI Shorts Studio') throw new Error('AI 쇼츠 스튜디오 프로젝트 파일이 아닙니다.');
        return sanitizeProjectSnapshot(parsed);
    }

    function applyProjectSnapshot(state, project) {
        if (!state || !project) return false;
        const safe = sanitizeProjectSnapshot(project);
        const currentSettings = isPlainObject(state.settings) ? state.settings : {};
        const importedSettings = isPlainObject(safe.settings) ? safe.settings : {};
        state.settings = Object.assign({}, currentSettings, importedSettings);
        ['captionOptions', 'qualityOptions', 'autoCutOptions', 'feedbackOptions', 'engineOptions'].forEach(key => {
            if (!isPlainObject(importedSettings[key])) return;
            state.settings[key] = Object.assign({}, isPlainObject(currentSettings[key]) ? currentSettings[key] : {}, importedSettings[key]);
        });
        state.recommendations = safe.recommendations.map(item => Object.assign({}, item));
        state.captions = safe.captions.map(cue => Object.assign({}, cue));
        state.selectedRecommendationId = safe.selectedRecommendationId;
        state.selectedRange = safe.selectedRange ? Object.assign({}, safe.selectedRange) : null;
        return true;
    }

    global.AIShortsProjectService = Object.freeze({
        CURRENT_SCHEMA_VERSION,
        createProjectSnapshot,
        parseProjectText,
        sanitizeProjectSnapshot,
        applyProjectSnapshot
    });
})(window);
