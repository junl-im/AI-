// AI Shorts Studio v1.6.40 - named endpoint profiles with isolated model, pin, and probe state
'use strict';

(function exposeLocalAIProviderRegistry(global) {
    const config = global.AIShortsRuntimeConfig || {};
    const storageManager = global.AIShortsStorageManager || {};
    const SETTINGS_KEY = config.LOCAL_AI_SETTINGS_KEY || 'ai-shorts-local-ai-v1';
    const historyLimit = Math.round(safeNumber(config.LOCAL_AI_HISTORY_LIMIT, 20, 5, 100));
    const requestTimeoutMs = safeNumber(config.LOCAL_AI_REQUEST_TIMEOUT_MS, 120000, 500, 30 * 60 * 1000);
    const maxResponseBytes = Math.round(safeNumber(config.LOCAL_AI_MAX_RESPONSE_BYTES, 2 * 1024 * 1024, 64 * 1024, 16 * 1024 * 1024));
    const maxPromptChars = Math.round(safeNumber(config.LOCAL_AI_MAX_PROMPT_CHARS, 24000, 1000, 100000));
    const maxSchemaChars = Math.round(safeNumber(config.LOCAL_AI_MAX_SCHEMA_CHARS, 12000, 1000, 50000));
    const maxTranscriptionBytes = Math.round(safeNumber(config.LOCAL_AI_MAX_TRANSCRIPTION_BYTES, 512 * 1024 * 1024, 1024 * 1024, 2 * 1024 * 1024 * 1024));
    const maxCaptionCues = Math.round(safeNumber(config.MAX_CAPTION_CUES, 5000, 1, 50000));
    const maxCaptionTextChars = Math.round(safeNumber(config.MAX_CAPTION_TEXT_CHARS, 1000000, 1000, 5000000));
    const endpointProfileLimit = Math.round(safeNumber(config.LOCAL_AI_ENDPOINT_PROFILE_LIMIT, 8, 1, 20));
    const endpointProfileModelLimit = Math.round(safeNumber(config.LOCAL_AI_ENDPOINT_PROFILE_MODEL_LIMIT, 40, 1, 100));
    const statuses = new Map();
    const latestStatusKeys = new Map();
    const probeSequences = new Map();
    const probeControllers = new Map();
    const history = [];

    const PROVIDERS = Object.freeze({
        ollama: Object.freeze({ id: 'ollama', label: 'Ollama', defaultEndpoint: 'http://127.0.0.1:11434', capabilities: Object.freeze(['creative']), transport: 'ollama' }),
        llamacpp: Object.freeze({ id: 'llamacpp', label: 'llama.cpp server', defaultEndpoint: 'http://127.0.0.1:8080', capabilities: Object.freeze(['creative']), transport: 'openai' }),
        whispercpp: Object.freeze({ id: 'whispercpp', label: 'whisper.cpp server', defaultEndpoint: 'http://127.0.0.1:8081', capabilities: Object.freeze(['speech']), transport: 'whispercpp' }),
        openailocal: Object.freeze({ id: 'openailocal', label: 'Local OpenAI-compatible', defaultEndpoint: 'http://127.0.0.1:8080', capabilities: Object.freeze(['creative', 'speech']), transport: 'openai' })
    });

    function safeText(value, maxLength) {
        const numericLimit = Number(maxLength);
        const limit = Number.isFinite(numericLimit) && numericLimit > 0
            ? Math.max(1, Math.min(16 * 1024 * 1024, Math.floor(numericLimit)))
            : 240;
        return String(value == null ? '' : value).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, limit);
    }

    function safeNumber(value, fallback, min, max) {
        const number = Number(value);
        if (!Number.isFinite(number)) return fallback;
        return Math.max(min, Math.min(max, number));
    }

    function hashToken(value) {
        const text = String(value || '');
        let a = 2166136261;
        let b = 2246822507;
        for (let index = 0; index < text.length; index += 1) {
            const code = text.charCodeAt(index);
            a ^= code;
            a = Math.imul(a, 16777619);
            b ^= code + index;
            b = Math.imul(b, 3266489917);
        }
        return `${(a >>> 0).toString(16).padStart(8, '0')}${(b >>> 0).toString(16).padStart(8, '0')}`;
    }

    function isLoopbackHostname(hostname) {
        const host = String(hostname || '').toLowerCase().replace(/^\[|\]$/g, '');
        if (host === 'localhost' || host.endsWith('.localhost') || host === '::1') return true;
        if (/^127(?:\.\d{1,3}){3}$/.test(host)) return host.split('.').every(part => Number(part) >= 0 && Number(part) <= 255);
        return false;
    }

    function normalizeEndpoint(value, fallback) {
        const raw = safeText(value || fallback || '', 500);
        let url;
        try { url = new URL(raw); } catch (_) { throw new Error('로컬 AI 주소 형식이 올바르지 않습니다.'); }
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error('로컬 AI 주소는 http 또는 https만 사용할 수 있습니다.');
        if (url.username || url.password) throw new Error('주소에 계정 정보나 토큰을 넣을 수 없습니다.');
        if (!config.LOCAL_AI_ALLOW_REMOTE_ENDPOINTS && !isLoopbackHostname(url.hostname)) throw new Error('개인정보 보호를 위해 localhost·127.0.0.1·::1 주소만 허용합니다.');
        url.hash = '';
        url.search = '';
        url.pathname = url.pathname.replace(/\/+$/, '') || '/';
        return url.toString().replace(/\/$/, '');
    }

    function defaultProfileId(providerId) {
        return `default-${safeText(providerId, 40).toLowerCase().replace(/[^a-z0-9_-]+/g, '-')}`;
    }

    function defaultProfileName(item) {
        return `${item.label} 기본`;
    }

    function sanitizeProfileId(value, providerId, endpoint, name) {
        const candidate = safeText(value, 64).toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
        if (/^[a-z0-9][a-z0-9_-]{0,63}$/.test(candidate)) return candidate;
        return `profile-${hashToken(`${providerId}|${endpoint}|${name}`)}`;
    }

    function sanitizeProfileProbe(value) {
        const source = value && typeof value === 'object' ? value : {};
        const state = ['idle', 'ready', 'error'].includes(source.state) ? source.state : 'idle';
        return {
            state,
            checkedAt: safeText(source.checkedAt, 80),
            latencyMs: Math.round(safeNumber(source.latencyMs, 0, 0, 30 * 60 * 1000)),
            error: state === 'error' ? safeText(source.error, 240) : '',
            errorCode: state === 'error' ? safeText(source.errorCode, 80) : '',
            recovery: state === 'error' ? safeText(source.recovery, 240) : ''
        };
    }

    function sanitizeEndpointProfile(providerId, value, fallbackEndpoint, fallbackName) {
        const item = provider(providerId);
        const source = value && typeof value === 'object' ? value : {};
        const endpoint = normalizeEndpoint(source.endpoint || fallbackEndpoint, item.defaultEndpoint);
        const name = safeText(source.name || fallbackName || defaultProfileName(item), 60) || defaultProfileName(item);
        const models = [];
        const seenModels = new Set();
        (Array.isArray(source.models) ? source.models : []).slice(0, endpointProfileModelLimit).forEach(raw => {
            const model = normalizeModel(raw);
            if (!model.id || seenModels.has(model.id)) return;
            seenModels.add(model.id);
            models.push(model);
        });
        return {
            id: sanitizeProfileId(source.id, item.id, endpoint, name),
            name,
            endpoint,
            creativeModel: safeText(source.creativeModel, 160),
            speechModel: safeText(source.speechModel, 160),
            models,
            lastProbe: sanitizeProfileProbe(source.lastProbe)
        };
    }

    function defaultEndpointProfile(item, endpoint) {
        return sanitizeEndpointProfile(item.id, {
            id: defaultProfileId(item.id),
            name: defaultProfileName(item),
            endpoint: endpoint || item.defaultEndpoint,
            creativeModel: '',
            speechModel: item.capabilities.includes('speech') ? 'whisper' : ''
        }, endpoint || item.defaultEndpoint, defaultProfileName(item));
    }

    function defaultSettings() {
        const endpoints = {};
        const endpointProfiles = {};
        const activeEndpointProfileIds = {};
        Object.values(PROVIDERS).forEach(item => {
            endpoints[item.id] = item.defaultEndpoint;
            const profile = defaultEndpointProfile(item, item.defaultEndpoint);
            endpointProfiles[item.id] = [profile];
            activeEndpointProfileIds[item.id] = profile.id;
        });
        return {
            creativeProviderId: 'ollama',
            speechProviderId: 'whispercpp',
            endpoints,
            endpointProfiles,
            activeEndpointProfileIds,
            creativeModel: '',
            speechModel: 'whisper',
            language: 'auto',
            includeCaptions: true,
            autoApplyTranscript: false,
            modelPins: {}
        };
    }

    function sanitizeSettings(value) {
        const defaults = defaultSettings();
        const input = value && typeof value === 'object' ? value : {};
        const endpoints = {};
        Object.values(PROVIDERS).forEach(provider => {
            try { endpoints[provider.id] = normalizeEndpoint(input.endpoints && input.endpoints[provider.id], provider.defaultEndpoint); }
            catch (_) { endpoints[provider.id] = provider.defaultEndpoint; }
        });
        const endpointProfiles = {};
        const activeEndpointProfileIds = {};
        Object.values(PROVIDERS).forEach(item => {
            const rawProfiles = input.endpointProfiles && Array.isArray(input.endpointProfiles[item.id])
                ? input.endpointProfiles[item.id]
                : [];
            const profiles = [];
            const seenIds = new Set();
            const seenEndpoints = new Set();
            rawProfiles.slice(0, endpointProfileLimit).forEach(raw => {
                try {
                    const profile = sanitizeEndpointProfile(item.id, raw, endpoints[item.id], defaultProfileName(item));
                    const endpointToken = hashToken(profile.endpoint);
                    if (seenIds.has(profile.id) || seenEndpoints.has(endpointToken)) return;
                    seenIds.add(profile.id);
                    seenEndpoints.add(endpointToken);
                    profiles.push(profile);
                } catch (_) { /* invalid saved profile */ }
            });
            if (!profiles.length) profiles.push(defaultEndpointProfile(item, endpoints[item.id]));
            endpointProfiles[item.id] = profiles;
            const requestedId = safeText(input.activeEndpointProfileIds && input.activeEndpointProfileIds[item.id], 64);
            const requested = profiles.find(profile => profile.id === requestedId);
            const matching = profiles.find(profile => profile.endpoint === endpoints[item.id]);
            activeEndpointProfileIds[item.id] = requested && requested.endpoint === endpoints[item.id]
                ? requested.id
                : matching ? matching.id : '';
        });
        const pins = {};
        const sourcePins = input.modelPins && typeof input.modelPins === 'object' ? input.modelPins : {};
        Object.keys(sourcePins).slice(0, 40).forEach(key => {
            const digest = normalizeDigest(sourcePins[key]);
            if (!digest) return;
            const rawKey = safeText(key, 240);
            if (rawKey.startsWith('v2|')) {
                const parts = rawKey.split('|');
                const providerId = parts[1] || '';
                const endpointToken = parts[2] || '';
                const modelId = parts.slice(3).join('|');
                if (PROVIDERS[providerId] && /^[a-f0-9]{16}$/.test(endpointToken) && modelId) pins[rawKey] = digest;
                return;
            }
            const separator = rawKey.indexOf(':');
            const providerId = separator > 0 ? rawKey.slice(0, separator) : '';
            const modelId = separator > 0 ? rawKey.slice(separator + 1) : '';
            if (!PROVIDERS[providerId] || !modelId) return;
            pins[scopedModelPinKey(providerId, modelId, endpoints[providerId])] = digest;
        });
        return {
            creativeProviderId: PROVIDERS[input.creativeProviderId] && PROVIDERS[input.creativeProviderId].capabilities.includes('creative') ? input.creativeProviderId : defaults.creativeProviderId,
            speechProviderId: PROVIDERS[input.speechProviderId] && PROVIDERS[input.speechProviderId].capabilities.includes('speech') ? input.speechProviderId : defaults.speechProviderId,
            endpoints,
            endpointProfiles,
            activeEndpointProfileIds,
            creativeModel: safeText(input.creativeModel, 160),
            speechModel: safeText(input.speechModel || defaults.speechModel, 160),
            language: ['auto', 'ko', 'en', 'ja', 'zh'].includes(input.language) ? input.language : defaults.language,
            includeCaptions: typeof input.includeCaptions === 'boolean' ? input.includeCaptions : defaults.includeCaptions,
            autoApplyTranscript: typeof input.autoApplyTranscript === 'boolean' ? input.autoApplyTranscript : defaults.autoApplyTranscript,
            modelPins: pins
        };
    }

    function loadSettings() {
        try {
            const raw = storageManager.safeGet ? storageManager.safeGet(SETTINGS_KEY, '') : global.localStorage && global.localStorage.getItem(SETTINGS_KEY);
            return sanitizeSettings(raw ? JSON.parse(raw) : null);
        } catch (_) { return sanitizeSettings(null); }
    }

    let settings = loadSettings();

    function saveSettings(next) {
        settings = sanitizeSettings(next || settings);
        try {
            const text = JSON.stringify(settings);
            if (storageManager.safeSet) storageManager.safeSet(SETTINGS_KEY, text, { maxCleanupRemovals: 1 });
            else if (global.localStorage) global.localStorage.setItem(SETTINGS_KEY, text);
        } catch (_) { /* best effort */ }
        return getSettings();
    }

    function getSettings() { return JSON.parse(JSON.stringify(settings)); }

    function probeSupersededError(message) {
        const error = new Error(message || '새 연결 확인이 시작되어 이전 요청을 중단했습니다.');
        error.name = 'AbortError';
        error.code = 'LOCAL_AI_PROBE_SUPERSEDED';
        return error;
    }

    function abortProviderProbe(providerId, message) {
        const controller = probeControllers.get(providerId);
        if (!controller || controller.signal.aborted) return false;
        controller.abort(probeSupersededError(message));
        return true;
    }

    function configure(patch) {
        const input = patch && typeof patch === 'object' ? patch : {};
        const previousEndpoints = Object.assign({}, settings.endpoints);
        const next = Object.assign({}, settings, input);
        next.endpoints = Object.assign({}, settings.endpoints, input.endpoints || {});
        next.endpointProfiles = Object.prototype.hasOwnProperty.call(input, 'endpointProfiles')
            ? Object.assign({}, input.endpointProfiles && typeof input.endpointProfiles === 'object' ? input.endpointProfiles : {})
            : Object.assign({}, settings.endpointProfiles);
        next.activeEndpointProfileIds = Object.assign({}, settings.activeEndpointProfileIds, input.activeEndpointProfileIds || {});
        next.modelPins = Object.prototype.hasOwnProperty.call(input, 'modelPins')
            ? Object.assign({}, input.modelPins && typeof input.modelPins === 'object' ? input.modelPins : {})
            : Object.assign({}, settings.modelPins);
        Object.keys(PROVIDERS).forEach(providerId => {
            if (!input.endpoints || !Object.prototype.hasOwnProperty.call(input.endpoints, providerId)) return;
            if (input.activeEndpointProfileIds && Object.prototype.hasOwnProperty.call(input.activeEndpointProfileIds, providerId)) return;
            const normalized = normalizeEndpoint(input.endpoints[providerId], PROVIDERS[providerId].defaultEndpoint);
            const matching = (settings.endpointProfiles[providerId] || []).find(profile => profile.endpoint === normalized);
            next.activeEndpointProfileIds[providerId] = matching ? matching.id : '';
        });
        const saved = saveSettings(next);
        Object.keys(PROVIDERS).forEach(providerId => {
            if (previousEndpoints[providerId] === settings.endpoints[providerId]) return;
            probeSequences.set(providerId, (probeSequences.get(providerId) || 0) + 1);
            abortProviderProbe(providerId, '로컬 AI 주소가 변경되어 이전 연결 확인을 중단했습니다.');
            latestStatusKeys.delete(providerId);
            Array.from(statuses.keys()).forEach(key => { if (key.startsWith(`${providerId}|`)) statuses.delete(key); });
        });
        return saved;
    }

    function provider(providerId) {
        const item = PROVIDERS[String(providerId || '')];
        if (!item) throw new Error('지원하지 않는 로컬 AI 제공자입니다.');
        return item;
    }

    function endpointFor(providerId, override) {
        const item = provider(providerId);
        return normalizeEndpoint(override || settings.endpoints[item.id], item.defaultEndpoint);
    }

    function statusKey(providerId, endpointOverride) {
        const item = provider(providerId);
        return `${item.id}|${hashToken(endpointFor(item.id, endpointOverride))}`;
    }

    function getProviderStatus(providerId, endpointOverride) {
        return statuses.get(statusKey(providerId, endpointOverride)) || idleStatus(providerId, endpointOverride);
    }

    function cloneProfile(profile, activeId) {
        const endpointToken = hashToken(profile.endpoint);
        const pinPrefix = `v2|${safeText(profile.providerId || '', 40)}|${endpointToken}|`;
        return {
            id: profile.id,
            name: profile.name,
            endpoint: profile.endpoint,
            endpointToken,
            creativeModel: profile.creativeModel,
            speechModel: profile.speechModel,
            models: (profile.models || []).map(model => Object.assign({}, model)),
            lastProbe: Object.assign({}, profile.lastProbe),
            active: profile.id === activeId,
            pinCount: Object.keys(settings.modelPins).filter(key => key.startsWith(pinPrefix)).length
        };
    }

    function listEndpointProfiles(providerId) {
        const item = provider(providerId);
        const activeId = settings.activeEndpointProfileIds[item.id] || '';
        return (settings.endpointProfiles[item.id] || []).map(profile => cloneProfile(Object.assign({ providerId: item.id }, profile), activeId));
    }

    function getEndpointProfile(providerId, profileId) {
        const item = provider(providerId);
        const profile = (settings.endpointProfiles[item.id] || []).find(entry => entry.id === safeText(profileId, 64));
        return profile ? cloneProfile(Object.assign({ providerId: item.id }, profile), settings.activeEndpointProfileIds[item.id] || '') : null;
    }

    function saveEndpointProfile(providerId, value) {
        const item = provider(providerId);
        const source = value && typeof value === 'object' ? value : {};
        const currentProfiles = (settings.endpointProfiles[item.id] || []).map(profile => Object.assign({}, profile));
        const requestedId = safeText(source.id, 64);
        const existingIndex = requestedId ? currentProfiles.findIndex(profile => profile.id === requestedId) : -1;
        const existing = existingIndex >= 0 ? currentProfiles[existingIndex] : null;
        const merged = Object.assign({}, existing || {}, source, {
            id: requestedId || '',
            endpoint: source.endpoint || existing && existing.endpoint || settings.endpoints[item.id],
            name: source.name || existing && existing.name || ''
        });
        if (!merged.name) throw new Error('endpoint 프로필 이름을 입력하세요.');
        const profile = sanitizeEndpointProfile(item.id, merged, settings.endpoints[item.id], defaultProfileName(item));
        const duplicate = currentProfiles.find((entry, index) => index !== existingIndex && entry.endpoint === profile.endpoint);
        if (duplicate) throw new Error('같은 제공자에 동일한 localhost 주소 프로필이 이미 있습니다.');
        if (existingIndex >= 0) currentProfiles[existingIndex] = profile;
        else {
            if (currentProfiles.length >= endpointProfileLimit) throw new Error(`제공자별 endpoint 프로필은 최대 ${endpointProfileLimit}개까지 저장할 수 있습니다.`);
            currentProfiles.push(profile);
        }
        const endpointProfiles = Object.assign({}, settings.endpointProfiles, { [item.id]: currentProfiles });
        const activeEndpointProfileIds = Object.assign({}, settings.activeEndpointProfileIds, { [item.id]: profile.id });
        const endpoints = Object.assign({}, settings.endpoints, { [item.id]: profile.endpoint });
        const patch = { endpointProfiles, activeEndpointProfileIds, endpoints };
        if (item.capabilities.includes('creative')) patch.creativeModel = profile.creativeModel;
        if (item.capabilities.includes('speech')) patch.speechModel = profile.speechModel || 'whisper';
        configure(patch);
        return getEndpointProfile(item.id, profile.id);
    }

    function activateEndpointProfile(providerId, profileId) {
        const item = provider(providerId);
        const profile = (settings.endpointProfiles[item.id] || []).find(entry => entry.id === safeText(profileId, 64));
        if (!profile) throw new Error('선택한 endpoint 프로필을 찾을 수 없습니다.');
        const patch = {
            endpoints: Object.assign({}, settings.endpoints, { [item.id]: profile.endpoint }),
            activeEndpointProfileIds: Object.assign({}, settings.activeEndpointProfileIds, { [item.id]: profile.id })
        };
        if (item.capabilities.includes('creative')) patch.creativeModel = profile.creativeModel;
        if (item.capabilities.includes('speech')) patch.speechModel = profile.speechModel || 'whisper';
        const saved = configure(patch);
        return Object.freeze({ settings: saved, profile: getEndpointProfile(item.id, profile.id), status: getProviderStatus(item.id, profile.endpoint) });
    }

    function removeEndpointProfile(providerId, profileId) {
        const item = provider(providerId);
        const currentProfiles = (settings.endpointProfiles[item.id] || []).map(profile => Object.assign({}, profile));
        if (currentProfiles.length <= 1) throw new Error('제공자별 endpoint 프로필은 최소 1개를 유지해야 합니다.');
        const index = currentProfiles.findIndex(profile => profile.id === safeText(profileId, 64));
        if (index < 0) return false;
        const removed = currentProfiles[index];
        currentProfiles.splice(index, 1);
        const wasActive = settings.activeEndpointProfileIds[item.id] === removed.id;
        const replacement = wasActive ? currentProfiles[0] : currentProfiles.find(profile => profile.id === settings.activeEndpointProfileIds[item.id]) || currentProfiles[0];
        const endpointProfiles = Object.assign({}, settings.endpointProfiles, { [item.id]: currentProfiles });
        const activeEndpointProfileIds = Object.assign({}, settings.activeEndpointProfileIds, { [item.id]: replacement.id });
        const endpoints = Object.assign({}, settings.endpoints, { [item.id]: replacement.endpoint });
        const endpointToken = hashToken(removed.endpoint);
        const pinPrefix = `v2|${item.id}|${endpointToken}|`;
        const modelPins = Object.fromEntries(Object.entries(settings.modelPins).filter(([key]) => !key.startsWith(pinPrefix)));
        const patch = { endpointProfiles, activeEndpointProfileIds, endpoints, modelPins };
        if (item.capabilities.includes('creative')) patch.creativeModel = replacement.creativeModel;
        if (item.capabilities.includes('speech')) patch.speechModel = replacement.speechModel || 'whisper';
        configure(patch);
        statuses.delete(statusKey(item.id, removed.endpoint));
        return true;
    }

    function rememberProfileProbe(providerId, endpoint, status) {
        const item = provider(providerId);
        let matched = false;
        const profiles = (settings.endpointProfiles[item.id] || []).map(profile => {
            if (profile.endpoint !== endpoint) return Object.assign({}, profile);
            matched = true;
            return Object.assign({}, profile, {
                models: status.state === 'ready' ? (status.models || []).slice(0, endpointProfileModelLimit).map(model => Object.assign({}, model)) : (profile.models || []).slice(),
                lastProbe: sanitizeProfileProbe(status)
            });
        });
        if (!matched) return;
        saveSettings(Object.assign({}, settings, { endpointProfiles: Object.assign({}, settings.endpointProfiles, { [item.id]: profiles }) }));
    }

    function joinEndpoint(endpoint, path) {
        return new URL(String(path || '').replace(/^\/+/, ''), `${endpoint.replace(/\/$/, '')}/`).toString();
    }

    function localTimeoutError(message) {
        const error = new Error(message || '로컬 AI 응답 시간이 초과되었습니다.');
        error.name = 'TimeoutError';
        error.code = 'LOCAL_AI_TIMEOUT';
        return error;
    }

    function createTimeoutBudget(value, fallback) {
        const totalMs = safeNumber(value, fallback, 500, 30 * 60 * 1000);
        const deadline = Date.now() + totalMs;
        return Object.freeze({
            totalMs,
            remaining() {
                const remainingMs = deadline - Date.now();
                if (remainingMs < 500) throw localTimeoutError();
                return Math.min(totalMs, remainingMs);
            }
        });
    }

    function combineSignal(externalSignal, timeoutMs) {
        const controller = new AbortController();
        let timer = 0;
        let timedOut = false;
        const abort = () => controller.abort(externalSignal && externalSignal.reason || new DOMException('작업이 취소되었습니다.', 'AbortError'));
        if (externalSignal) {
            if (externalSignal.aborted) abort();
            else externalSignal.addEventListener('abort', abort, { once: true });
        }
        timer = global.setTimeout(() => {
            timedOut = true;
            controller.abort(localTimeoutError());
        }, Math.max(500, timeoutMs));
        return {
            signal: controller.signal,
            didTimeout: () => timedOut,
            cleanup() {
                global.clearTimeout(timer);
                if (externalSignal) externalSignal.removeEventListener('abort', abort);
            }
        };
    }

    function recoveryFor(error) {
        const code = safeText(error && error.code, 80);
        const status = Math.round(safeNumber(error && error.status, 0, 0, 999));
        if (code === 'LOCAL_AI_REDIRECT_BLOCKED') return 'redirect가 아닌 최종 localhost API 주소를 직접 입력하세요.';
        if (code === 'LOCAL_AI_TIMEOUT' || code === 'LOCAL_AI_JOB_TIMEOUT') return '모델 로딩 상태와 서버 처리 시간을 확인한 뒤 다시 시도하세요.';
        if (code === 'LOCAL_AI_RESPONSE_TOO_LARGE') return '서버의 출력 길이·토큰 수를 줄인 뒤 다시 시도하세요.';
        if (code === 'LOCAL_AI_MODEL_RECHECK_REQUIRED' || code === 'LOCAL_AI_MODEL_PIN_MISMATCH') return '현재 주소에서 연결 확인을 다시 실행하고 모델 digest를 확인하세요.';
        if (status === 401 || status === 403) return '인증 없는 localhost API인지와 서버 접근 정책을 확인하세요.';
        if (status === 404 || status === 405) return '서버 종류와 API 기본 경로가 맞는지 확인하세요.';
        if (status === 413) return '미디어 또는 요청 크기를 줄인 뒤 다시 시도하세요.';
        if (status === 429) return '서버 작업이 끝난 뒤 잠시 후 다시 시도하세요.';
        if (status >= 500) return '로컬 모델 로딩 상태와 서버 로그를 확인하세요.';
        if (code === 'LOCAL_AI_UNREACHABLE') return '서버 실행 여부, localhost 주소, CORS·TLS 설정을 확인하세요.';
        return '';
    }

    function responseSizeError() {
        const error = new Error('로컬 AI 응답이 허용 크기를 초과했습니다.');
        error.code = 'LOCAL_AI_RESPONSE_TOO_LARGE';
        error.recovery = recoveryFor(error);
        return error;
    }

    async function readTextLimited(response, limit) {
        const declared = Number(response.headers && response.headers.get && response.headers.get('content-length'));
        if (Number.isFinite(declared) && declared > limit) {
            try {
                if (response.body && typeof response.body.cancel === 'function') await response.body.cancel();
            } catch (_) { /* best effort transport release */ }
            throw responseSizeError();
        }
        if (!response.body || typeof response.body.getReader !== 'function') {
            const text = await response.text();
            if (new Blob([text]).size > limit) throw responseSizeError();
            return text;
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let bytes = 0;
        let text = '';
        while (true) {
            const part = await reader.read();
            if (part.done) break;
            bytes += part.value.byteLength;
            if (bytes > limit) {
                try { await reader.cancel(); } catch (_) { /* ignored */ }
                throw responseSizeError();
            }
            text += decoder.decode(part.value, { stream: true });
        }
        return text + decoder.decode();
    }

    async function request(endpoint, path, init, options) {
        const opts = options || {};
        const timeoutMs = safeNumber(opts.timeoutMs, requestTimeoutMs, 500, 30 * 60 * 1000);
        const combined = combineSignal(opts.signal, timeoutMs);
        const url = joinEndpoint(endpoint, path);
        try {
            const requestInit = Object.assign({}, init || {}, {
                cache: 'no-store',
                credentials: 'omit',
                referrerPolicy: 'no-referrer',
                redirect: 'error',
                signal: combined.signal
            });
            const response = await global.fetch(url, requestInit);
            const text = opts.skipBody ? '' : await readTextLimited(response, safeNumber(opts.maxBytes, maxResponseBytes, 1024, 32 * 1024 * 1024));
            let data = null;
            if (text) {
                try { data = JSON.parse(text); } catch (_) { data = text; }
            }
            return { response, data, text, url };
        } catch (error) {
            if (error && error.code === 'LOCAL_AI_RESPONSE_TOO_LARGE') throw error;
            if (combined.signal.aborted) {
                const reason = combined.signal.reason;
                if (combined.didTimeout() || reason && (reason.name === 'TimeoutError' || reason.code === 'LOCAL_AI_TIMEOUT' || reason.code === 'LOCAL_AI_JOB_TIMEOUT')) {
                    const timeout = new Error(reason && reason.message || '로컬 AI 응답 시간이 초과되었습니다.');
                    timeout.name = 'TimeoutError';
                    timeout.code = reason && reason.code || 'LOCAL_AI_TIMEOUT';
                    throw timeout;
                }
                const aborted = new Error(reason && reason.message || error && error.message || '로컬 AI 작업이 취소되었습니다.');
                aborted.name = reason && reason.name || 'AbortError';
                if (reason && reason.code) aborted.code = safeText(reason.code, 80);
                if (reason && reason.recovery) aborted.recovery = safeText(reason.recovery, 240);
                if (reason && Number.isFinite(Number(reason.status))) aborted.status = Math.round(Number(reason.status));
                if (reason) aborted.cause = reason;
                throw aborted;
            }
            const transportDetail = [error && error.message, error && error.cause && error.cause.message].filter(Boolean).join(' ');
            const redirectBlocked = /redirect/i.test(transportDetail);
            const wrapped = new Error(redirectBlocked
                ? '로컬 AI 서버가 다른 주소로 redirect하여 요청을 차단했습니다.'
                : '로컬 AI 서버에 연결하지 못했습니다.');
            wrapped.code = redirectBlocked ? 'LOCAL_AI_REDIRECT_BLOCKED' : 'LOCAL_AI_UNREACHABLE';
            wrapped.recovery = recoveryFor(wrapped);
            if (error) wrapped.cause = error;
            throw wrapped;
        } finally { combined.cleanup(); }
    }

    function responseError(result, fallback) {
        const data = result && result.data;
        const detail = data && typeof data === 'object' && (data.error && (data.error.message || data.error) || data.message) || '';
        const status = Math.round(safeNumber(result && result.response && result.response.status, 0, 0, 999));
        const error = new Error(safeText(detail || fallback || `로컬 AI 요청 실패 (${status})`, 500));
        error.status = status;
        error.code = status ? `LOCAL_AI_HTTP_${status}` : 'LOCAL_AI_HTTP_ERROR';
        error.recovery = recoveryFor(error);
        return error;
    }

    function normalizeDigest(value) {
        const text = safeText(value, 180).toLowerCase().replace(/^sha256:/, '');
        return /^[a-f0-9]{16,128}$/.test(text) ? text : '';
    }

    function normalizeModel(item) {
        const source = item && typeof item === 'object' ? item : {};
        const id = safeText(source.model || source.name || source.id, 160);
        return Object.freeze({
            id,
            name: safeText(source.name || source.model || source.id, 160),
            size: Math.round(safeNumber(source.size, 0, 0, Number.MAX_SAFE_INTEGER)),
            digest: normalizeDigest(source.digest),
            family: safeText(source.details && (source.details.family || source.details.format) || source.owned_by, 80),
            parameterSize: safeText(source.details && source.details.parameter_size, 80),
            quantization: safeText(source.details && source.details.quantization_level, 80)
        });
    }

    function createStatusValue(providerId, state, extra) {
        const item = provider(providerId);
        const source = extra && typeof extra === 'object' ? extra : {};
        const endpoint = endpointFor(providerId, source.endpoint);
        const models = Object.freeze((Array.isArray(source.models) ? source.models : []).slice());
        return Object.freeze({
            providerId: item.id,
            label: item.label,
            state: ['idle', 'checking', 'ready', 'error'].includes(state) ? state : 'error',
            endpointToken: hashToken(endpoint),
            checkedAt: safeText(source.checkedAt || new Date().toISOString(), 80),
            latencyMs: Math.round(safeNumber(source.latencyMs, 0, 0, 30 * 60 * 1000)),
            capabilities: Object.freeze(item.capabilities.slice()),
            models,
            error: safeText(source.error, 240),
            errorCode: safeText(source.errorCode, 80),
            recovery: safeText(source.recovery, 240)
        });
    }

    function statusValue(providerId, state, extra) {
        const value = createStatusValue(providerId, state, extra);
        const key = statusKey(value.providerId, extra && extra.endpoint);
        statuses.set(key, value);
        latestStatusKeys.set(value.providerId, key);
        return value;
    }

    function remember(event) {
        const item = Object.freeze({
            type: safeText(event && event.type, 60),
            providerId: safeText(event && event.providerId, 40),
            capability: safeText(event && event.capability, 40),
            modelToken: safeText(event && event.modelToken, 40),
            ok: Boolean(event && event.ok),
            elapsedMs: Math.max(0, Number(event && event.elapsedMs) || 0),
            error: safeText(event && event.error, 240),
            errorCode: safeText(event && event.errorCode, 80),
            at: new Date().toISOString()
        });
        history.unshift(item);
        if (history.length > historyLimit) history.splice(historyLimit);
    }

    async function probe(providerId, options) {
        const item = provider(providerId);
        const endpoint = endpointFor(providerId, options && options.endpoint);
        const started = Date.now();
        const probeSequence = (probeSequences.get(item.id) || 0) + 1;
        probeSequences.set(item.id, probeSequence);
        abortProviderProbe(item.id);
        const probeController = new AbortController();
        probeControllers.set(item.id, probeController);
        const externalSignal = options && options.signal;
        const forwardAbort = () => probeController.abort(externalSignal && externalSignal.reason || new DOMException('작업이 취소되었습니다.', 'AbortError'));
        if (externalSignal) {
            if (externalSignal.aborted) forwardAbort();
            else externalSignal.addEventListener('abort', forwardAbort, { once: true });
        }
        const isCurrentProbe = () => probeSequences.get(item.id) === probeSequence && probeControllers.get(item.id) === probeController;
        const timeoutMs = options && options.timeoutMs != null ? options.timeoutMs : config.LOCAL_AI_PROBE_TIMEOUT_MS || 5000;
        statusValue(providerId, 'checking', { endpoint, checkedAt: new Date().toISOString() });
        try {
            let result;
            let models = [];
            if (item.id === 'ollama') {
                result = await request(endpoint, '/api/tags', { method: 'GET', headers: { Accept: 'application/json' } }, { signal: probeController.signal, timeoutMs });
                if (!result.response.ok) throw responseError(result, 'Ollama 모델 목록을 읽지 못했습니다.');
                models = Array.isArray(result.data && result.data.models) ? result.data.models.map(normalizeModel).filter(model => model.id) : [];
            } else if (item.id === 'llamacpp' || item.id === 'openailocal') {
                result = await request(endpoint, '/v1/models', { method: 'GET', headers: { Accept: 'application/json' } }, { signal: probeController.signal, timeoutMs });
                if (!result.response.ok) throw responseError(result, 'OpenAI 호환 모델 목록을 읽지 못했습니다.');
                models = Array.isArray(result.data && result.data.data) ? result.data.data.map(normalizeModel).filter(model => model.id) : [];
            } else {
                result = await request(endpoint, '/', { method: 'GET', headers: { Accept: 'application/json,text/html;q=0.8,*/*;q=0.1' } }, { signal: probeController.signal, timeoutMs, maxBytes: 256 * 1024 });
                if (!result.response.ok && result.response.status !== 404) throw responseError(result, 'whisper.cpp 서버 상태를 확인하지 못했습니다.');
            }
            if (!isCurrentProbe()) throw probeSupersededError();
            const latencyMs = Date.now() - started;
            const value = createStatusValue(providerId, 'ready', { endpoint, latencyMs, models });
            const key = statusKey(item.id, endpoint);
            statuses.set(key, value);
            latestStatusKeys.set(item.id, key);
            rememberProfileProbe(item.id, endpoint, value);
            remember({ type: 'probe', providerId, capability: item.capabilities.join(','), ok: true, elapsedMs: latencyMs });
            return value;
        } catch (error) {
            const latencyMs = Date.now() - started;
            if (error && error.code === 'LOCAL_AI_PROBE_SUPERSEDED') throw error;
            if (isCurrentProbe()) {
                const failedStatus = createStatusValue(providerId, 'error', {
                    endpoint,
                    latencyMs,
                    error: safeText(error.message, 240),
                    errorCode: safeText(error.code, 80),
                    recovery: safeText(error.recovery || recoveryFor(error), 240)
                });
                const key = statusKey(item.id, endpoint);
                statuses.set(key, failedStatus);
                latestStatusKeys.set(item.id, key);
                rememberProfileProbe(item.id, endpoint, failedStatus);
                remember({ type: 'probe', providerId, capability: item.capabilities.join(','), ok: false, elapsedMs: latencyMs, error: error.message, errorCode: error.code });
            }
            throw error;
        } finally {
            if (externalSignal) externalSignal.removeEventListener('abort', forwardAbort);
            if (probeControllers.get(item.id) === probeController) probeControllers.delete(item.id);
        }
    }

    function scopedModelPinKey(providerId, modelId, endpointOverride) {
        const item = provider(providerId);
        const endpoint = normalizeEndpoint(endpointOverride || settings && settings.endpoints && settings.endpoints[item.id], item.defaultEndpoint);
        return `v2|${safeText(item.id, 40)}|${hashToken(endpoint)}|${safeText(modelId, 160)}`;
    }

    function pinModel(providerId, modelId, digest, endpointOverride) {
        const normalized = normalizeDigest(digest);
        if (!normalized) throw new Error('이 제공자는 검증 가능한 모델 digest를 제공하지 않습니다.');
        const pins = Object.assign({}, settings.modelPins, { [scopedModelPinKey(providerId, modelId, endpointOverride)]: normalized });
        configure({ modelPins: pins });
        return normalized;
    }

    function unpinModel(providerId, modelId, endpointOverride) {
        const pins = Object.assign({}, settings.modelPins);
        const key = scopedModelPinKey(providerId, modelId, endpointOverride);
        const existed = Object.prototype.hasOwnProperty.call(pins, key);
        delete pins[key];
        configure({ modelPins: pins });
        return existed;
    }

    function getModelPin(providerId, modelId, endpointOverride) {
        return settings.modelPins[scopedModelPinKey(providerId, modelId, endpointOverride)] || '';
    }

    function hasOtherEndpointPin(providerId, modelId, endpointOverride) {
        const currentKey = scopedModelPinKey(providerId, modelId, endpointOverride);
        const prefix = `v2|${safeText(providerId, 40)}|`;
        const suffix = `|${safeText(modelId, 160)}`;
        return Object.keys(settings.modelPins).some(key => key !== currentKey && key.startsWith(prefix) && key.endsWith(suffix));
    }

    function currentModel(providerId, modelId, endpointOverride) {
        const status = statuses.get(statusKey(providerId, endpointOverride));
        const expectedEndpointToken = hashToken(endpointFor(providerId, endpointOverride));
        if (!status || status.state !== 'ready' || status.endpointToken !== expectedEndpointToken) return null;
        return Array.isArray(status.models) ? status.models.find(model => model.id === modelId || model.name === modelId) || null : null;
    }

    function verifyModelPin(providerId, modelId, endpointOverride) {
        const expected = getModelPin(providerId, modelId, endpointOverride);
        const status = statuses.get(statusKey(providerId, endpointOverride));
        const expectedEndpointToken = hashToken(endpointFor(providerId, endpointOverride));
        const endpointCurrent = Boolean(status && status.state === 'ready' && status.endpointToken === expectedEndpointToken);
        const model = endpointCurrent ? currentModel(providerId, modelId, endpointOverride) : null;
        const actual = normalizeDigest(model && model.digest);
        if (!expected) {
            if (actual) return Object.freeze({ state: 'unpinned', expected: '', actual });
            if (endpointCurrent) return Object.freeze({ state: 'unsupported', expected: '', actual: '' });
            return Object.freeze({ state: hasOtherEndpointPin(providerId, modelId, endpointOverride) ? 'stale' : 'unchecked', expected: '', actual: '' });
        }
        if (!endpointCurrent) return Object.freeze({ state: 'stale', expected, actual: '' });
        if (!actual) return Object.freeze({ state: 'unverified', expected, actual: '' });
        return Object.freeze({ state: expected === actual ? 'verified' : 'mismatch', expected, actual });
    }

    function modelIntegrityError(pin) {
        const error = new Error(pin.state === 'mismatch'
            ? '고정한 모델 digest와 현재 모델이 다릅니다. 연결을 다시 확인하고 명시적으로 재고정하세요.'
            : pin.state === 'stale'
                ? '로컬 AI 주소가 변경되어 고정 모델을 다시 확인해야 합니다. 연결 확인 후 생성하세요.'
                : '고정한 모델 digest를 현재 서버에서 확인할 수 없습니다. 연결 확인 후 다시 시도하세요.');
        error.code = pin.state === 'mismatch' ? 'LOCAL_AI_MODEL_PIN_MISMATCH' : 'LOCAL_AI_MODEL_RECHECK_REQUIRED';
        error.recovery = recoveryFor(error);
        return error;
    }

    function parseStructuredContent(value) {
        if (value && typeof value === 'object') return value;
        let text = safeText(value, maxResponseBytes);
        text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
        try { return JSON.parse(text); } catch (_) { /* extract object below */ }
        const first = text.indexOf('{');
        const last = text.lastIndexOf('}');
        if (first >= 0 && last > first) {
            try { return JSON.parse(text.slice(first, last + 1)); } catch (_) { /* ignored */ }
        }
        throw new Error('로컬 AI가 유효한 JSON 객체를 반환하지 않았습니다.');
    }

    function assertCreativeInput(input) {
        const prompt = safeText(input && input.prompt, maxPromptChars);
        const system = safeText(input && input.system, 12000);
        const model = safeText(input && input.model, 160);
        const schema = input && input.schema && typeof input.schema === 'object' ? input.schema : null;
        if (!prompt) throw new Error('AI 카피 생성을 위한 입력이 없습니다.');
        if (!model) throw new Error('사용할 로컬 모델을 선택하세요.');
        if (schema) {
            let schemaText = '';
            try { schemaText = JSON.stringify(schema); }
            catch (_) { throw new Error('구조화 출력 스키마는 순환 참조 없이 JSON으로 직렬화할 수 있어야 합니다.'); }
            if (schemaText.length > maxSchemaChars) throw new Error('구조화 출력 스키마가 너무 큽니다.');
        }
        return { prompt, system, model, schema };
    }

    async function generateStructured(providerId, input) {
        const started = Date.now();
        let modelToken = '';
        try {
            const item = provider(providerId);
            if (!item.capabilities.includes('creative')) throw new Error('선택한 제공자는 카피 생성을 지원하지 않습니다.');
            const endpoint = endpointFor(providerId, input && input.endpoint);
            const normalized = assertCreativeInput(input);
            modelToken = hashToken(normalized.model);
            const pin = verifyModelPin(providerId, normalized.model, endpoint);
            if (['mismatch', 'stale', 'unverified'].includes(pin.state)) throw modelIntegrityError(pin);
            const timeoutBudget = createTimeoutBudget(input && input.timeoutMs, requestTimeoutMs);
            let result;
            if (item.transport === 'ollama') {
                result = await request(endpoint, '/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                    body: JSON.stringify({ model: normalized.model, prompt: normalized.prompt, system: normalized.system, stream: false, format: normalized.schema || 'json', options: { temperature: safeNumber(input && input.temperature, 0.25, 0, 2), num_predict: safeNumber(input && input.maxTokens, 600, 64, 4096) } })
                }, { signal: input && input.signal, timeoutMs: timeoutBudget.remaining() });
                if (!result.response.ok) throw responseError(result, 'Ollama 생성 요청에 실패했습니다.');
            } else {
                const schemaName = safeText(input && input.schemaName || 'shorts_output', 60).replace(/[^a-zA-Z0-9_-]/g, '_') || 'shorts_output';
                const baseBody = {
                    model: normalized.model,
                    messages: [{ role: 'system', content: normalized.system }, { role: 'user', content: normalized.prompt }],
                    stream: false,
                    temperature: safeNumber(input && input.temperature, 0.25, 0, 2),
                    max_tokens: safeNumber(input && input.maxTokens, 600, 64, 4096)
                };
                const schemaFormat = item.id === 'llamacpp'
                    ? { type: 'json_schema', schema: normalized.schema }
                    : { type: 'json_schema', json_schema: { name: schemaName, strict: true, schema: normalized.schema } };
                const strictBody = Object.assign({}, baseBody, normalized.schema ? { response_format: schemaFormat } : { response_format: { type: 'json_object' } });
                result = await request(endpoint, '/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(strictBody) }, { signal: input && input.signal, timeoutMs: timeoutBudget.remaining() });
                if (!result.response.ok && result.response.status === 400 && normalized.schema) {
                    result = await request(endpoint, '/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(Object.assign({}, baseBody, { response_format: { type: 'json_object' } })) }, { signal: input && input.signal, timeoutMs: timeoutBudget.remaining() });
                }
                if (!result.response.ok) throw responseError(result, 'OpenAI 호환 생성 요청에 실패했습니다.');
            }
            const content = item.transport === 'ollama' ? result.data && result.data.response : result.data && result.data.choices && result.data.choices[0] && result.data.choices[0].message && result.data.choices[0].message.content;
            const output = parseStructuredContent(content);
            if (!output || Array.isArray(output) || typeof output !== 'object') throw new Error('로컬 AI 구조화 출력 형식이 올바르지 않습니다.');
            const elapsedMs = Date.now() - started;
            remember({ type: 'generate', providerId, capability: 'creative', modelToken, ok: true, elapsedMs });
            return Object.freeze({ output, providerId, model: normalized.model, modelToken, elapsedMs, pin: verifyModelPin(providerId, normalized.model, endpoint) });
        } catch (error) {
            remember({ type: 'generate', providerId, capability: 'creative', modelToken, ok: false, elapsedMs: Date.now() - started, error: error && error.message, errorCode: error && error.code });
            throw error;
        }
    }

    function parseTimestamp(value) {
        if (value == null) return null;
        const text = String(value).trim().replace(',', '.');
        if (!text) return null;
        if (!text.includes(':')) {
            const numeric = Number(text);
            return Number.isFinite(numeric) ? Math.max(0, numeric) : null;
        }
        const parts = text.split(':').map(Number);
        if (!parts.length || parts.length > 3 || parts.some(part => !Number.isFinite(part))) return null;
        if (parts.length === 3) return Math.max(0, parts[0] * 3600 + parts[1] * 60 + parts[2]);
        if (parts.length === 2) return Math.max(0, parts[0] * 60 + parts[1]);
        return Math.max(0, parts[0]);
    }

    function normalizeSegments(data) {
        const source = Array.isArray(data && data.segments) ? data.segments : Array.isArray(data && data.transcription) ? data.transcription : [];
        return source.slice(0, maxCaptionCues).map((segment, index) => {
            const timestamps = segment && segment.timestamps || {};
            const offsets = segment && segment.offsets || {};
            let start = parseTimestamp(segment && (segment.start != null ? segment.start : timestamps.from));
            let end = parseTimestamp(segment && (segment.end != null ? segment.end : timestamps.to));
            if (start == null && Number.isFinite(Number(offsets.from))) start = Math.max(0, Number(offsets.from) / 1000);
            if (start == null) start = 0;
            if (end == null && Number.isFinite(Number(offsets.to))) end = Math.max(start, Number(offsets.to) / 1000);
            if (end == null || end <= start) end = start + 2.5;
            return Object.freeze({ index: index + 1, start, end, text: safeText(segment && segment.text, 1000), speaker: safeText(segment && (segment.speaker || segment.speaker_id || segment.speakerLabel), 40) });
        }).filter(segment => segment.text);
    }

    function formatSrtTime(seconds) {
        const totalMs = Math.max(0, Math.round((Number(seconds) || 0) * 1000));
        const hours = Math.floor(totalMs / 3600000);
        const minutes = Math.floor((totalMs % 3600000) / 60000);
        const secs = Math.floor((totalMs % 60000) / 1000);
        const millis = totalMs % 1000;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
    }

    function segmentsToSrt(segments) {
        return segments.map((segment, index) => `${index + 1}\n${formatSrtTime(segment.start)} --> ${formatSrtTime(segment.end)}\n${segment.text}`).join('\n\n');
    }

    async function transcribe(providerId, file, input) {
        const started = Date.now();
        let modelToken = '';
        try {
            const item = provider(providerId);
            if (!item.capabilities.includes('speech')) throw new Error('선택한 제공자는 음성 전사를 지원하지 않습니다.');
            if (!file || typeof file.size !== 'number' || !Number.isFinite(file.size) || file.size < 0) throw new Error('전사할 미디어 파일이 없습니다.');
            if (file.size > maxTranscriptionBytes) throw new Error(`로컬 전사 파일은 ${Math.round(maxTranscriptionBytes / 1024 / 1024)}MB 이하만 지원합니다.`);
            const endpoint = endpointFor(providerId, input && input.endpoint);
            const language = safeText(input && input.language, 12);
            const model = safeText(input && input.model || settings.speechModel || 'whisper', 160);
            modelToken = hashToken(model);
            const timeoutBudget = createTimeoutBudget(input && input.timeoutMs, 15 * 60 * 1000);
            let result;
            if (item.id === 'whispercpp') {
                const form = new FormData();
                form.append('file', file, safeText(file.name || 'media', 180));
                form.append('response_format', 'json');
                form.append('temperature', '0.0');
                if (language && language !== 'auto') form.append('language', language);
                result = await request(endpoint, '/inference', { method: 'POST', body: form, headers: { Accept: 'application/json' } }, { signal: input && input.signal, timeoutMs: timeoutBudget.remaining(), maxBytes: 8 * 1024 * 1024 });
                if (!result.response.ok && [404, 405].includes(result.response.status)) result = null;
                else if (!result.response.ok) throw responseError(result, 'whisper.cpp 전사 요청에 실패했습니다.');
            }
            if (!result) {
                const form = new FormData();
                form.append('file', file, safeText(file.name || 'media', 180));
                form.append('model', model || 'whisper');
                form.append('response_format', 'verbose_json');
                form.append('timestamp_granularities[]', 'segment');
                if (language && language !== 'auto') form.append('language', language);
                result = await request(endpoint, '/v1/audio/transcriptions', { method: 'POST', body: form, headers: { Accept: 'application/json' } }, { signal: input && input.signal, timeoutMs: timeoutBudget.remaining(), maxBytes: 8 * 1024 * 1024 });
                if (!result.response.ok) throw responseError(result, '로컬 음성 전사 요청에 실패했습니다.');
            }
            const data = result.data && typeof result.data === 'object' ? result.data : { text: result.text };
            const segments = normalizeSegments(data);
            const text = safeText(data.text || segments.map(segment => segment.text).join(' '), maxCaptionTextChars);
            if (!text && !segments.length) throw new Error('로컬 전사 결과에 텍스트가 없습니다.');
            const elapsedMs = Date.now() - started;
            remember({ type: 'transcribe', providerId, capability: 'speech', modelToken, ok: true, elapsedMs });
            return Object.freeze({ text, segments: Object.freeze(segments), srt: segments.length ? segmentsToSrt(segments) : '', language: safeText(data.language || data.detected_language || language || 'auto', 20), elapsedMs, providerId, modelToken });
        } catch (error) {
            remember({ type: 'transcribe', providerId, capability: 'speech', modelToken, ok: false, elapsedMs: Date.now() - started, error: error && error.message, errorCode: error && error.code });
            throw error;
        }
    }

    function listProviders(capability) {
        return Object.values(PROVIDERS).filter(item => !capability || item.capabilities.includes(capability)).map(item => Object.freeze({ id: item.id, label: item.label, defaultEndpoint: item.defaultEndpoint, capabilities: Object.freeze(item.capabilities.slice()) }));
    }

    function idleStatus(providerId, endpointOverride) {
        const item = provider(providerId);
        return Object.freeze({
            providerId: item.id,
            label: item.label,
            state: 'idle',
            endpointToken: hashToken(endpointFor(item.id, endpointOverride)),
            checkedAt: '',
            latencyMs: 0,
            capabilities: Object.freeze(item.capabilities.slice()),
            models: Object.freeze([]),
            error: '',
            errorCode: '',
            recovery: ''
        });
    }

    function snapshot() {
        return Object.freeze({
            providers: Object.freeze(Object.fromEntries(Object.keys(PROVIDERS).map(id => {
                const latest = latestStatusKeys.get(id);
                return [id, latest && statuses.get(latest) || getProviderStatus(id, settings.endpoints[id])];
            }))),
            settings: Object.freeze({ creativeProviderId: settings.creativeProviderId, speechProviderId: settings.speechProviderId, creativeModelToken: hashToken(settings.creativeModel), speechModelToken: hashToken(settings.speechModel), language: settings.language, includeCaptions: settings.includeCaptions, autoApplyTranscript: settings.autoApplyTranscript, pinnedModelCount: Object.keys(settings.modelPins).length, endpointProfileCount: Object.values(settings.endpointProfiles).reduce((sum, profiles) => sum + profiles.length, 0), activeEndpointProfileTokens: Object.freeze(Object.fromEntries(Object.entries(settings.activeEndpointProfileIds).map(([id, value]) => [id, value ? hashToken(value) : '']))) }),
            history: Object.freeze(history.slice()),
            policy: Object.freeze({
                loopbackOnly: !config.LOCAL_AI_ALLOW_REMOTE_ENDPOINTS,
                credentials: 'omit',
                referrerPolicy: 'no-referrer',
                redirects: 'blocked',
                requestTimeoutMs,
                maxResponseBytes,
                maxPromptChars,
                maxSchemaChars,
                maxTranscriptionBytes,
                maxCaptionCues,
                maxCaptionTextChars,
                modelPinScope: 'endpoint',
                endpointProfileLimit,
                endpointProfileModelLimit
            })
        });
    }

    global.AIShortsLocalAIProviders = Object.freeze({
        listProviders, getSettings, configure, normalizeEndpoint, isLoopbackHostname, endpointFor,
        listEndpointProfiles, getEndpointProfile, saveEndpointProfile, activateEndpointProfile, removeEndpointProfile, getProviderStatus,
        probe, generateStructured, transcribe, pinModel, unpinModel, getModelPin, verifyModelPin,
        hashToken, snapshot, segmentsToSrt
    });
})(window);
