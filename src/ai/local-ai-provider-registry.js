// AI Shorts Studio v1.6.9 - localhost-only open-source AI provider gateway with model pinning
'use strict';

(function exposeLocalAIProviderRegistry(global) {
    const config = global.AIShortsRuntimeConfig || {};
    const storageManager = global.AIShortsStorageManager || {};
    const SETTINGS_KEY = config.LOCAL_AI_SETTINGS_KEY || 'ai-shorts-local-ai-v1';
    const historyLimit = Math.max(5, Math.min(100, Number(config.LOCAL_AI_HISTORY_LIMIT || 20)));
    const maxResponseBytes = Math.max(64 * 1024, Math.min(16 * 1024 * 1024, Number(config.LOCAL_AI_MAX_RESPONSE_BYTES || 2 * 1024 * 1024)));
    const maxPromptChars = Math.max(1000, Math.min(100000, Number(config.LOCAL_AI_MAX_PROMPT_CHARS || 24000)));
    const maxSchemaChars = Math.max(1000, Math.min(50000, Number(config.LOCAL_AI_MAX_SCHEMA_CHARS || 12000)));
    const statuses = new Map();
    const history = [];

    const PROVIDERS = Object.freeze({
        ollama: Object.freeze({ id: 'ollama', label: 'Ollama', defaultEndpoint: 'http://127.0.0.1:11434', capabilities: Object.freeze(['creative']), transport: 'ollama' }),
        llamacpp: Object.freeze({ id: 'llamacpp', label: 'llama.cpp server', defaultEndpoint: 'http://127.0.0.1:8080', capabilities: Object.freeze(['creative']), transport: 'openai' }),
        whispercpp: Object.freeze({ id: 'whispercpp', label: 'whisper.cpp server', defaultEndpoint: 'http://127.0.0.1:8081', capabilities: Object.freeze(['speech']), transport: 'whispercpp' }),
        openailocal: Object.freeze({ id: 'openailocal', label: 'Local OpenAI-compatible', defaultEndpoint: 'http://127.0.0.1:8080', capabilities: Object.freeze(['creative', 'speech']), transport: 'openai' })
    });

    function safeText(value, maxLength) {
        return String(value == null ? '' : value).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, maxLength || 240);
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

    function defaultSettings() {
        const endpoints = {};
        Object.values(PROVIDERS).forEach(provider => { endpoints[provider.id] = provider.defaultEndpoint; });
        return {
            creativeProviderId: 'ollama',
            speechProviderId: 'whispercpp',
            endpoints,
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
        const pins = {};
        const sourcePins = input.modelPins && typeof input.modelPins === 'object' ? input.modelPins : {};
        Object.keys(sourcePins).slice(0, 40).forEach(key => {
            const digest = normalizeDigest(sourcePins[key]);
            if (digest) pins[safeText(key, 240)] = digest;
        });
        return {
            creativeProviderId: PROVIDERS[input.creativeProviderId] && PROVIDERS[input.creativeProviderId].capabilities.includes('creative') ? input.creativeProviderId : defaults.creativeProviderId,
            speechProviderId: PROVIDERS[input.speechProviderId] && PROVIDERS[input.speechProviderId].capabilities.includes('speech') ? input.speechProviderId : defaults.speechProviderId,
            endpoints,
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

    function configure(patch) {
        const next = Object.assign({}, settings, patch || {});
        next.endpoints = Object.assign({}, settings.endpoints, patch && patch.endpoints || {});
        next.modelPins = Object.assign({}, settings.modelPins, patch && patch.modelPins || {});
        return saveSettings(next);
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

    function joinEndpoint(endpoint, path) {
        return new URL(String(path || '').replace(/^\/+/, ''), `${endpoint.replace(/\/$/, '')}/`).toString();
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
            const error = new Error('로컬 AI 응답 시간이 초과되었습니다.');
            error.name = 'TimeoutError';
            error.code = 'LOCAL_AI_TIMEOUT';
            controller.abort(error);
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

    function responseSizeError() {
        const error = new Error('로컬 AI 응답이 허용 크기를 초과했습니다.');
        error.code = 'LOCAL_AI_RESPONSE_TOO_LARGE';
        return error;
    }

    async function readTextLimited(response, limit) {
        const declared = Number(response.headers && response.headers.get && response.headers.get('content-length'));
        if (declared && declared > limit) throw responseSizeError();
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
        const timeoutMs = safeNumber(opts.timeoutMs, Number(config.LOCAL_AI_REQUEST_TIMEOUT_MS || 120000), 500, 30 * 60 * 1000);
        const combined = combineSignal(opts.signal, timeoutMs);
        const url = joinEndpoint(endpoint, path);
        try {
            const response = await global.fetch(url, Object.assign({ cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer', signal: combined.signal }, init || {}));
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
                aborted.name = 'AbortError';
                throw aborted;
            }
            const wrapped = new Error(error && error.message ? error.message : '로컬 AI 서버에 연결하지 못했습니다.');
            wrapped.code = 'LOCAL_AI_UNREACHABLE';
            throw wrapped;
        } finally { combined.cleanup(); }
    }

    function responseError(result, fallback) {
        const data = result && result.data;
        const detail = data && typeof data === 'object' && (data.error && (data.error.message || data.error) || data.message) || '';
        return new Error(safeText(detail || fallback || `로컬 AI 요청 실패 (${result && result.response && result.response.status || 0})`, 500));
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
            size: Math.max(0, Number(source.size) || 0),
            digest: normalizeDigest(source.digest),
            family: safeText(source.details && (source.details.family || source.details.format) || source.owned_by, 80),
            parameterSize: safeText(source.details && source.details.parameter_size, 80),
            quantization: safeText(source.details && source.details.quantization_level, 80)
        });
    }

    function statusValue(providerId, state, extra) {
        const item = provider(providerId);
        const endpoint = endpointFor(providerId, extra && extra.endpoint);
        const value = Object.freeze(Object.assign({
            providerId: item.id,
            label: item.label,
            state,
            endpointToken: hashToken(endpoint),
            checkedAt: new Date().toISOString(),
            latencyMs: 0,
            capabilities: item.capabilities.slice(),
            models: [],
            error: ''
        }, extra || {}, { endpoint: undefined }));
        statuses.set(item.id, value);
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
            at: new Date().toISOString()
        });
        history.unshift(item);
        if (history.length > historyLimit) history.splice(historyLimit);
    }

    async function probe(providerId, options) {
        const item = provider(providerId);
        const endpoint = endpointFor(providerId, options && options.endpoint);
        const started = Date.now();
        statusValue(providerId, 'checking', { endpoint, checkedAt: new Date().toISOString() });
        try {
            let result;
            let models = [];
            if (item.id === 'ollama') {
                result = await request(endpoint, '/api/tags', { method: 'GET', headers: { Accept: 'application/json' } }, { signal: options && options.signal, timeoutMs: options && options.timeoutMs || config.LOCAL_AI_PROBE_TIMEOUT_MS || 5000 });
                if (!result.response.ok) throw responseError(result, 'Ollama 모델 목록을 읽지 못했습니다.');
                models = Array.isArray(result.data && result.data.models) ? result.data.models.map(normalizeModel).filter(model => model.id) : [];
            } else if (item.id === 'llamacpp' || item.id === 'openailocal') {
                result = await request(endpoint, '/v1/models', { method: 'GET', headers: { Accept: 'application/json' } }, { signal: options && options.signal, timeoutMs: options && options.timeoutMs || config.LOCAL_AI_PROBE_TIMEOUT_MS || 5000 });
                if (!result.response.ok) throw responseError(result, 'OpenAI 호환 모델 목록을 읽지 못했습니다.');
                models = Array.isArray(result.data && result.data.data) ? result.data.data.map(normalizeModel).filter(model => model.id) : [];
            } else {
                result = await request(endpoint, '/', { method: 'GET', headers: { Accept: 'application/json,text/html;q=0.8,*/*;q=0.1' } }, { signal: options && options.signal, timeoutMs: options && options.timeoutMs || config.LOCAL_AI_PROBE_TIMEOUT_MS || 5000, maxBytes: 256 * 1024 });
                if (!result.response.ok && result.response.status !== 404) throw responseError(result, 'whisper.cpp 서버 상태를 확인하지 못했습니다.');
            }
            const latencyMs = Date.now() - started;
            const value = statusValue(providerId, 'ready', { endpoint, latencyMs, models });
            remember({ type: 'probe', providerId, capability: item.capabilities.join(','), ok: true, elapsedMs: latencyMs });
            return value;
        } catch (error) {
            const latencyMs = Date.now() - started;
            statusValue(providerId, 'error', { endpoint, latencyMs, error: safeText(error.message, 240) });
            remember({ type: 'probe', providerId, capability: item.capabilities.join(','), ok: false, elapsedMs: latencyMs, error: error.message });
            throw error;
        }
    }

    function modelPinKey(providerId, modelId) { return `${safeText(providerId, 40)}:${safeText(modelId, 160)}`; }

    function pinModel(providerId, modelId, digest) {
        const normalized = normalizeDigest(digest);
        if (!normalized) throw new Error('이 제공자는 검증 가능한 모델 digest를 제공하지 않습니다.');
        const pins = Object.assign({}, settings.modelPins, { [modelPinKey(providerId, modelId)]: normalized });
        configure({ modelPins: pins });
        return normalized;
    }

    function unpinModel(providerId, modelId) {
        const pins = Object.assign({}, settings.modelPins);
        const key = modelPinKey(providerId, modelId);
        const existed = Object.prototype.hasOwnProperty.call(pins, key);
        delete pins[key];
        configure({ modelPins: pins });
        return existed;
    }

    function getModelPin(providerId, modelId) { return settings.modelPins[modelPinKey(providerId, modelId)] || ''; }

    function currentModel(providerId, modelId) {
        const status = statuses.get(providerId);
        return status && Array.isArray(status.models) ? status.models.find(model => model.id === modelId || model.name === modelId) || null : null;
    }

    function verifyModelPin(providerId, modelId) {
        const expected = getModelPin(providerId, modelId);
        const model = currentModel(providerId, modelId);
        const actual = normalizeDigest(model && model.digest);
        if (!expected) return Object.freeze({ state: actual ? 'unpinned' : 'unsupported', expected: '', actual });
        if (!actual) return Object.freeze({ state: 'unverified', expected, actual: '' });
        return Object.freeze({ state: expected === actual ? 'verified' : 'mismatch', expected, actual });
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
        if (schema && JSON.stringify(schema).length > maxSchemaChars) throw new Error('구조화 출력 스키마가 너무 큽니다.');
        return { prompt, system, model, schema };
    }

    async function generateStructured(providerId, input) {
        const item = provider(providerId);
        if (!item.capabilities.includes('creative')) throw new Error('선택한 제공자는 카피 생성을 지원하지 않습니다.');
        const endpoint = endpointFor(providerId, input && input.endpoint);
        const normalized = assertCreativeInput(input);
        const pin = verifyModelPin(providerId, normalized.model);
        if (pin.state === 'mismatch') throw new Error('고정한 모델 digest와 현재 모델이 다릅니다. 연결을 다시 확인하고 명시적으로 재고정하세요.');
        const started = Date.now();
        let result;
        if (item.transport === 'ollama') {
            result = await request(endpoint, '/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ model: normalized.model, prompt: normalized.prompt, system: normalized.system, stream: false, format: normalized.schema || 'json', options: { temperature: safeNumber(input && input.temperature, 0.25, 0, 2), num_predict: safeNumber(input && input.maxTokens, 600, 64, 4096) } })
            }, { signal: input && input.signal, timeoutMs: input && input.timeoutMs });
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
            result = await request(endpoint, '/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(strictBody) }, { signal: input && input.signal, timeoutMs: input && input.timeoutMs });
            if (!result.response.ok && result.response.status === 400 && normalized.schema) {
                result = await request(endpoint, '/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(Object.assign({}, baseBody, { response_format: { type: 'json_object' } })) }, { signal: input && input.signal, timeoutMs: input && input.timeoutMs });
            }
            if (!result.response.ok) throw responseError(result, 'OpenAI 호환 생성 요청에 실패했습니다.');
        }
        const content = item.transport === 'ollama' ? result.data && result.data.response : result.data && result.data.choices && result.data.choices[0] && result.data.choices[0].message && result.data.choices[0].message.content;
        const output = parseStructuredContent(content);
        if (!output || Array.isArray(output) || typeof output !== 'object') throw new Error('로컬 AI 구조화 출력 형식이 올바르지 않습니다.');
        const elapsedMs = Date.now() - started;
        remember({ type: 'generate', providerId, capability: 'creative', modelToken: hashToken(normalized.model), ok: true, elapsedMs });
        return Object.freeze({ output, providerId, model: normalized.model, modelToken: hashToken(normalized.model), elapsedMs, pin: verifyModelPin(providerId, normalized.model) });
    }

    function parseTimestamp(value) {
        if (Number.isFinite(Number(value))) return Math.max(0, Number(value));
        const text = String(value || '').trim().replace(',', '.');
        const parts = text.split(':').map(Number);
        if (!parts.length || parts.some(part => !Number.isFinite(part))) return 0;
        if (parts.length === 3) return Math.max(0, parts[0] * 3600 + parts[1] * 60 + parts[2]);
        if (parts.length === 2) return Math.max(0, parts[0] * 60 + parts[1]);
        return Math.max(0, parts[0]);
    }

    function normalizeSegments(data) {
        const source = Array.isArray(data && data.segments) ? data.segments : Array.isArray(data && data.transcription) ? data.transcription : [];
        return source.slice(0, Number(config.MAX_CAPTION_CUES || 5000)).map((segment, index) => {
            const timestamps = segment && segment.timestamps || {};
            const offsets = segment && segment.offsets || {};
            let start = parseTimestamp(segment && (segment.start != null ? segment.start : timestamps.from));
            let end = parseTimestamp(segment && (segment.end != null ? segment.end : timestamps.to));
            if (!start && Number.isFinite(Number(offsets.from))) start = Math.max(0, Number(offsets.from) / 1000);
            if (!end && Number.isFinite(Number(offsets.to))) end = Math.max(start, Number(offsets.to) / 1000);
            if (end <= start) end = start + 2.5;
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
        const item = provider(providerId);
        if (!item.capabilities.includes('speech')) throw new Error('선택한 제공자는 음성 전사를 지원하지 않습니다.');
        if (!file || typeof file.size !== 'number') throw new Error('전사할 미디어 파일이 없습니다.');
        const maxBytes = Math.max(1024 * 1024, Number(config.LOCAL_AI_MAX_TRANSCRIPTION_BYTES || 512 * 1024 * 1024));
        if (file.size > maxBytes) throw new Error(`로컬 전사 파일은 ${Math.round(maxBytes / 1024 / 1024)}MB 이하만 지원합니다.`);
        const endpoint = endpointFor(providerId, input && input.endpoint);
        const language = safeText(input && input.language, 12);
        const model = safeText(input && input.model || settings.speechModel || 'whisper', 160);
        const started = Date.now();
        let result;
        if (item.id === 'whispercpp') {
            const form = new FormData();
            form.append('file', file, safeText(file.name || 'media', 180));
            form.append('response_format', 'json');
            form.append('temperature', '0.0');
            if (language && language !== 'auto') form.append('language', language);
            result = await request(endpoint, '/inference', { method: 'POST', body: form, headers: { Accept: 'application/json' } }, { signal: input && input.signal, timeoutMs: input && input.timeoutMs || 15 * 60 * 1000, maxBytes: 8 * 1024 * 1024 });
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
            result = await request(endpoint, '/v1/audio/transcriptions', { method: 'POST', body: form, headers: { Accept: 'application/json' } }, { signal: input && input.signal, timeoutMs: input && input.timeoutMs || 15 * 60 * 1000, maxBytes: 8 * 1024 * 1024 });
            if (!result.response.ok) throw responseError(result, '로컬 음성 전사 요청에 실패했습니다.');
        }
        const data = result.data && typeof result.data === 'object' ? result.data : { text: result.text };
        const segments = normalizeSegments(data);
        const text = safeText(data.text || segments.map(segment => segment.text).join(' '), Number(config.MAX_CAPTION_TEXT_CHARS || 1000000));
        if (!text && !segments.length) throw new Error('로컬 전사 결과에 텍스트가 없습니다.');
        const elapsedMs = Date.now() - started;
        remember({ type: 'transcribe', providerId, capability: 'speech', modelToken: hashToken(model), ok: true, elapsedMs });
        return Object.freeze({ text, segments: Object.freeze(segments), srt: segments.length ? segmentsToSrt(segments) : '', language: safeText(data.language || data.detected_language || language || 'auto', 20), elapsedMs, providerId, modelToken: hashToken(model) });
    }

    function listProviders(capability) {
        return Object.values(PROVIDERS).filter(item => !capability || item.capabilities.includes(capability)).map(item => Object.freeze({ id: item.id, label: item.label, defaultEndpoint: item.defaultEndpoint, capabilities: item.capabilities.slice() }));
    }

    function snapshot() {
        return Object.freeze({
            providers: Object.freeze(Object.fromEntries(Object.keys(PROVIDERS).map(id => [id, statuses.get(id) || Object.freeze({ providerId: id, state: 'idle', endpointToken: hashToken(endpointFor(id)), checkedAt: '', latencyMs: 0, capabilities: PROVIDERS[id].capabilities.slice(), models: [], error: '' })]))),
            settings: Object.freeze({ creativeProviderId: settings.creativeProviderId, speechProviderId: settings.speechProviderId, creativeModelToken: hashToken(settings.creativeModel), speechModelToken: hashToken(settings.speechModel), language: settings.language, includeCaptions: settings.includeCaptions, autoApplyTranscript: settings.autoApplyTranscript, pinnedModelCount: Object.keys(settings.modelPins).length }),
            history: Object.freeze(history.slice()),
            policy: Object.freeze({ loopbackOnly: !config.LOCAL_AI_ALLOW_REMOTE_ENDPOINTS, credentials: 'omit', maxResponseBytes, maxPromptChars })
        });
    }

    global.AIShortsLocalAIProviders = Object.freeze({
        listProviders, getSettings, configure, normalizeEndpoint, isLoopbackHostname, endpointFor,
        probe, generateStructured, transcribe, pinModel, unpinModel, getModelPin, verifyModelPin,
        hashToken, snapshot, segmentsToSrt
    });
})(window);
