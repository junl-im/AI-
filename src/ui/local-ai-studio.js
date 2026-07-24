// AI Shorts Studio v1.6.2 - local AI connection, creative copy, transcription, and model integrity UI
'use strict';

(function exposeLocalAIStudio(global) {
    const providers = global.AIShortsLocalAIProviders || {};
    const jobs = global.AIShortsAIJobCoordinator || {};
    const store = global.AIShortsAppState || {};
    const state = store.state || {};
    const els = {};
    let lastCreativeResult = null;
    let lastTranscriptResult = null;
    let unsubscribe = null;

    function byId(id) { return document.getElementById(id); }

    function safeText(value, maxLength) {
        return String(value == null ? '' : value).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, maxLength || 500);
    }

    function toast(message, kind) {
        const root = byId('toast');
        if (!root) return;
        if (global.AIShortsFeedbackUX && global.AIShortsFeedbackUX.setToastKind) global.AIShortsFeedbackUX.setToastKind(root, kind || 'action');
        root.textContent = message;
        root.classList.add('toast-visible');
        global.clearTimeout(root._localAiTimer);
        root._localAiTimer = global.setTimeout(() => root.classList.remove('toast-visible'), 3200);
    }

    function formatBytes(value) {
        const bytes = Math.max(0, Number(value) || 0);
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
        return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
    }

    function formatElapsed(value) {
        const ms = Math.max(0, Number(value) || 0);
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(ms < 10000 ? 1 : 0)}초`;
    }

    function providerOptions(capability) {
        return providers.listProviders ? providers.listProviders(capability) : [];
    }

    function selectedProvider(capability) {
        const select = capability === 'creative' ? els.creativeProviderSelect : els.speechProviderSelect;
        return select && select.value || '';
    }

    function endpointInput(capability) { return capability === 'creative' ? els.creativeEndpointInput : els.speechEndpointInput; }

    function applyProviderEndpoint(capability, providerId) {
        const settings = providers.getSettings ? providers.getSettings() : { endpoints: {} };
        const input = endpointInput(capability);
        if (input) input.value = settings.endpoints && settings.endpoints[providerId] || '';
    }

    function populateProviderSelect(select, capability, selected) {
        if (!select) return;
        const items = providerOptions(capability);
        select.replaceChildren(...items.map(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = item.label;
            option.selected = item.id === selected;
            return option;
        }));
    }

    function statusLabel(status) {
        if (!status || status.state === 'idle') return '연결 확인 전';
        if (status.state === 'checking') return '연결 확인 중';
        if (status.state === 'ready') return `연결됨 · ${formatElapsed(status.latencyMs)}`;
        return `연결 실패 · ${safeText(status.error, 100)}`;
    }

    function renderProviderStatus(capability, status) {
        const target = capability === 'creative' ? els.creativeProviderStatus : els.speechProviderStatus;
        if (!target) return;
        target.textContent = statusLabel(status);
        target.dataset.state = status && status.state || 'idle';
    }

    function renderModels(status, preferred) {
        const select = els.creativeModelSelect;
        if (!select) return;
        const models = status && Array.isArray(status.models) ? status.models : [];
        if (!models.length) {
            const option = document.createElement('option');
            option.value = preferred || '';
            option.textContent = preferred ? `${preferred} · 직접 입력` : '연결 후 모델 선택';
            select.replaceChildren(option);
            select.disabled = !preferred;
            renderPinStatus();
            return;
        }
        select.replaceChildren(...models.map(model => {
            const option = document.createElement('option');
            option.value = model.id;
            const details = [model.parameterSize, model.quantization].filter(Boolean).join(' · ');
            option.textContent = `${model.name || model.id}${details ? ` · ${details}` : ''}${model.size ? ` · ${formatBytes(model.size)}` : ''}`;
            option.dataset.digest = model.digest || '';
            return option;
        }));
        const wanted = models.some(model => model.id === preferred) ? preferred : models[0].id;
        select.value = wanted;
        select.disabled = false;
        providers.configure({ creativeModel: wanted });
        renderPinStatus();
    }

    function currentModelDigest() {
        const option = els.creativeModelSelect && els.creativeModelSelect.selectedOptions && els.creativeModelSelect.selectedOptions[0];
        return option && option.dataset.digest || '';
    }

    function renderPinStatus() {
        const providerId = selectedProvider('creative');
        const model = els.creativeModelSelect && els.creativeModelSelect.value || '';
        const pin = providers.verifyModelPin ? providers.verifyModelPin(providerId, model) : { state: 'unsupported' };
        if (els.modelPinStatus) {
            const labels = {
                verified: '모델 digest 일치 · 안전',
                mismatch: '모델 digest 변경 감지 · 생성 차단',
                unpinned: '검증 가능한 digest · 아직 고정 안 함',
                unverified: '고정값은 있으나 현재 digest 확인 불가',
                unsupported: '이 제공자는 digest를 노출하지 않음'
            };
            els.modelPinStatus.textContent = labels[pin.state] || '모델 무결성 확인 전';
            els.modelPinStatus.dataset.state = pin.state || 'unsupported';
        }
        if (els.modelPinBtn) {
            els.modelPinBtn.disabled = !model || !currentModelDigest();
            els.modelPinBtn.textContent = pin.state === 'verified' ? '모델 고정 해제' : pin.state === 'mismatch' ? '현재 모델로 재고정' : '모델 digest 고정';
        }
    }

    function configureFromUI(capability) {
        const providerId = selectedProvider(capability);
        const input = endpointInput(capability);
        const endpoint = input && input.value || '';
        const current = providers.getSettings ? providers.getSettings() : { endpoints: {} };
        const patch = { endpoints: Object.assign({}, current.endpoints, { [providerId]: endpoint }) };
        if (capability === 'creative') patch.creativeProviderId = providerId;
        else patch.speechProviderId = providerId;
        return providers.configure(patch);
    }

    async function probeProvider(capability) {
        const providerId = selectedProvider(capability);
        let settings;
        try { settings = configureFromUI(capability); }
        catch (error) { toast(error.message, 'error'); return null; }
        const endpoint = settings.endpoints[providerId];
        const promise = jobs.submit ? jobs.submit(`local-ai-${capability}-probe`, async context => {
            context.report(15, 'localhost 정책 확인');
            const status = await providers.probe(providerId, { endpoint, signal: context.signal });
            context.report(90, '모델·기능 확인');
            return status;
        }, { timeoutMs: 15000, meta: { providerId, capability, source: 'local-ai-studio' } }) : providers.probe(providerId, { endpoint });
        try {
            const status = await promise;
            renderProviderStatus(capability, status);
            if (capability === 'creative') renderModels(status, settings.creativeModel);
            toast(`${status.label || providerId} 연결을 확인했습니다.`, 'success');
            return status;
        } catch (error) {
            renderProviderStatus(capability, { state: 'error', error: error.message });
            toast(error.message || '로컬 AI 연결 확인에 실패했습니다.', 'error');
            return null;
        }
    }

    function selectedRecommendation() {
        const list = Array.isArray(state.recommendations) ? state.recommendations : [];
        return list.find(item => item.id === state.selectedRecommendationId) || list[0] || null;
    }

    function captionContext(candidate) {
        if (!els.includeCaptionsToggle || !els.includeCaptionsToggle.checked) return '';
        const captions = Array.isArray(state.captions) ? state.captions : [];
        if (!captions.length) return '';
        const start = Number(candidate && candidate.start) || 0;
        const end = Number(candidate && candidate.end) || Number.MAX_SAFE_INTEGER;
        return captions.filter(cue => Number(cue.end) >= start && Number(cue.start) <= end).slice(0, 80).map(cue => safeText(cue.text, 500)).join(' ').slice(0, 12000);
    }

    function buildCreativeContext() {
        const candidate = selectedRecommendation();
        const reasons = candidate && Array.isArray(candidate.reasons) ? candidate.reasons.slice(0, 5).map(item => safeText(item, 200)) : [];
        return {
            language: 'ko',
            platform: safeText(state.settings && state.settings.platform || 'youtube', 20),
            style: safeText(state.settings && state.settings.style || 'balanced', 20),
            candidate: candidate ? {
                start: Number(candidate.start) || 0,
                end: Number(candidate.end) || 0,
                duration: Number(candidate.duration) || 0,
                score: Number(candidate.score) || 0,
                reasons
            } : null,
            transcript: captionContext(candidate),
            currentTitle: safeText(els.titleInput && els.titleInput.value || '', 120),
            currentHashtags: safeText(els.hashtagInput && els.hashtagInput.value || '', 500)
        };
    }

    const CREATIVE_SCHEMA = Object.freeze({
        type: 'object',
        additionalProperties: false,
        required: ['title', 'hook', 'description', 'hashtags', 'reason'],
        properties: {
            title: { type: 'string', maxLength: 95 },
            hook: { type: 'string', maxLength: 60 },
            description: { type: 'string', maxLength: 500 },
            hashtags: { type: 'array', maxItems: 12, items: { type: 'string', maxLength: 40 } },
            reason: { type: 'string', maxLength: 300 }
        }
    });

    function normalizeHashtag(value) {
        const text = safeText(value, 40).replace(/\s+/g, '');
        if (!text) return '';
        return text.startsWith('#') ? text : `#${text}`;
    }

    function normalizeCreativeOutput(value) {
        const source = value && typeof value === 'object' ? value : {};
        const rawTags = Array.isArray(source.hashtags) ? source.hashtags : String(source.hashtags || '').split(/[\s,]+/);
        return Object.freeze({
            title: safeText(source.title, 95),
            hook: safeText(source.hook, 60),
            description: safeText(source.description, 500),
            hashtags: Array.from(new Set(rawTags.map(normalizeHashtag).filter(Boolean))).slice(0, 12),
            reason: safeText(source.reason, 300)
        });
    }

    function renderCreativeResult(result) {
        if (!els.creativeResult) return;
        if (!result) {
            els.creativeResult.hidden = true;
            if (els.applyCreativeBtn) els.applyCreativeBtn.disabled = true;
            return;
        }
        if (els.aiTitleResult) els.aiTitleResult.textContent = result.title || '제목 없음';
        if (els.aiHookResult) els.aiHookResult.textContent = result.hook || '후킹 문구 없음';
        if (els.aiDescriptionResult) els.aiDescriptionResult.textContent = result.description || '설명 없음';
        if (els.aiHashtagResult) els.aiHashtagResult.textContent = result.hashtags.join(' ') || '해시태그 없음';
        if (els.aiReasonResult) els.aiReasonResult.textContent = result.reason || '추천 근거 없음';
        els.creativeResult.hidden = false;
        if (els.applyCreativeBtn) els.applyCreativeBtn.disabled = !result.title;
    }

    async function generateCreativeCopy() {
        const providerId = selectedProvider('creative');
        const model = els.creativeModelSelect && els.creativeModelSelect.value || '';
        if (!model) { toast('연결 확인 후 사용할 모델을 선택하세요.', 'warning'); return null; }
        let settings;
        try {
            settings = configureFromUI('creative');
            settings = providers.configure({ creativeModel: model, includeCaptions: Boolean(els.includeCaptionsToggle && els.includeCaptionsToggle.checked) });
        } catch (error) { toast(error.message, 'error'); return null; }
        const context = buildCreativeContext();
        const prompt = `다음 로컬 영상 분석 정보를 바탕으로 한국어 쇼츠 카피를 작성하세요. 사실로 제공되지 않은 인물명, 사건, 제품명은 만들지 마세요. transcript가 비어 있으면 장면 정보만 사용하세요. JSON 스키마를 정확히 지키세요.\n\n${JSON.stringify(context)}`;
        try {
            const result = await jobs.submit('local-ai-creative', async job => {
                job.report(10, '구조화 요청 준비');
                const response = await providers.generateStructured(providerId, {
                    endpoint: settings.endpoints[providerId],
                    model,
                    system: '당신은 짧고 정확한 한국어 쇼츠 카피 편집자입니다. 과장된 사실을 만들지 않고, 출력은 요청한 JSON 객체 하나만 반환합니다.',
                    prompt,
                    schema: CREATIVE_SCHEMA,
                    schemaName: 'ai_shorts_copy',
                    signal: job.signal,
                    temperature: 0.25,
                    maxTokens: 700
                });
                job.report(92, '결과 검증');
                return response;
            }, { timeoutMs: 5 * 60 * 1000, meta: { providerId, capability: 'creative', modelToken: providers.hashToken(model), source: 'local-ai-studio' } });
            lastCreativeResult = normalizeCreativeOutput(result.output);
            renderCreativeResult(lastCreativeResult);
            toast(`로컬 AI 카피를 만들었습니다 · ${formatElapsed(result.elapsedMs)}`, 'success');
            if (store.addDiagnostic) store.addDiagnostic({ type: 'local-ai-creative-complete', providerId, modelToken: result.modelToken, elapsedMs: result.elapsedMs });
            return lastCreativeResult;
        } catch (error) {
            if (error && error.name !== 'AbortError') toast(error.message || '로컬 AI 카피 생성에 실패했습니다.', 'error');
            return null;
        }
    }

    function applyCreativeResult() {
        if (!lastCreativeResult) return false;
        if (els.titleInput) {
            els.titleInput.value = lastCreativeResult.title;
            els.titleInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (els.hashtagInput) {
            els.hashtagInput.value = lastCreativeResult.hashtags.join(' ');
            els.hashtagInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (els.aiCopyMemo) els.aiCopyMemo.value = [lastCreativeResult.hook, lastCreativeResult.description].filter(Boolean).join('\n');
        toast('AI 제목과 해시태그를 작업실에 적용했습니다.', 'action');
        return true;
    }

    async function toggleModelPin() {
        const providerId = selectedProvider('creative');
        const model = els.creativeModelSelect && els.creativeModelSelect.value || '';
        if (!model) return;
        const pin = providers.verifyModelPin(providerId, model);
        try {
            if (pin.state === 'verified') providers.unpinModel(providerId, model);
            else providers.pinModel(providerId, model, currentModelDigest());
            renderPinStatus();
            toast(pin.state === 'verified' ? '모델 digest 고정을 해제했습니다.' : '현재 모델 digest를 고정했습니다.', 'action');
        } catch (error) { toast(error.message, 'warning'); }
    }

    function renderTranscriptResult(result) {
        if (!els.transcriptResult) return;
        if (!result) {
            els.transcriptResult.hidden = true;
            if (els.applyTranscriptBtn) els.applyTranscriptBtn.disabled = true;
            return;
        }
        if (els.transcriptMeta) els.transcriptMeta.textContent = `${result.segments.length ? `${result.segments.length}구간` : '일반 텍스트'} · 언어 ${result.language || 'auto'} · ${formatElapsed(result.elapsedMs)}`;
        if (els.transcriptPreview) els.transcriptPreview.value = (result.srt || result.text || '').slice(0, 1000000);
        els.transcriptResult.hidden = false;
        if (els.applyTranscriptBtn) els.applyTranscriptBtn.disabled = !(result.srt || result.text);
    }

    async function transcribeCurrentMedia() {
        if (!state.file) { toast('먼저 미디어 파일을 불러오세요.', 'warning'); return null; }
        const providerId = selectedProvider('speech');
        let settings;
        try {
            settings = configureFromUI('speech');
            settings = providers.configure({ language: els.speechLanguageSelect && els.speechLanguageSelect.value || 'auto', speechModel: els.speechModelInput && els.speechModelInput.value || 'whisper', autoApplyTranscript: Boolean(els.autoApplyTranscriptToggle && els.autoApplyTranscriptToggle.checked) });
        } catch (error) { toast(error.message, 'error'); return null; }
        try {
            const result = await jobs.submit('local-ai-transcription', async job => {
                job.report(5, `로컬 서버로 전송 준비 · ${formatBytes(state.file.size)}`);
                const response = await providers.transcribe(providerId, state.file, {
                    endpoint: settings.endpoints[providerId],
                    model: settings.speechModel,
                    language: settings.language,
                    signal: job.signal,
                    timeoutMs: 15 * 60 * 1000
                });
                job.report(94, '자막 구간 변환');
                return response;
            }, { timeoutMs: 16 * 60 * 1000, meta: { providerId, capability: 'speech', modelToken: providers.hashToken(settings.speechModel), fileBytes: state.file.size, language: settings.language, source: 'local-ai-studio' } });
            lastTranscriptResult = result;
            renderTranscriptResult(result);
            if (settings.autoApplyTranscript) applyTranscriptResult();
            toast(`로컬 음성 전사를 완료했습니다 · ${formatElapsed(result.elapsedMs)}`, 'success');
            if (store.addDiagnostic) store.addDiagnostic({ type: 'local-ai-transcription-complete', providerId, modelToken: result.modelToken, segments: result.segments.length, elapsedMs: result.elapsedMs });
            return result;
        } catch (error) {
            if (error && error.name !== 'AbortError') toast(error.message || '로컬 음성 전사에 실패했습니다.', 'error');
            return null;
        }
    }

    function applyTranscriptResult() {
        if (!lastTranscriptResult) return false;
        const target = byId('captionTextInput');
        const apply = byId('applyCaptionBtn');
        if (!target) return false;
        target.value = lastTranscriptResult.srt || lastTranscriptResult.text || '';
        target.dispatchEvent(new Event('input', { bubbles: true }));
        if (apply) apply.click();
        toast('전사 결과를 자막 트랙에 적용했습니다.', 'action');
        return true;
    }

    function cancelActiveJob() {
        if (jobs.cancelActive && jobs.cancelActive('사용자가 로컬 AI 작업을 취소했습니다.')) toast('로컬 AI 작업 취소를 요청했습니다.', 'warning');
    }

    function renderJobs(snapshot) {
        const active = snapshot && snapshot.active;
        if (els.aiJobStatus) {
            els.aiJobStatus.textContent = active ? `${active.kind} · ${active.progress}% · ${active.message}` : snapshot && snapshot.queued && snapshot.queued.length ? `대기 ${snapshot.queued.length}개` : '대기 중';
            els.aiJobStatus.dataset.state = active ? 'running' : 'idle';
        }
        if (els.aiJobProgress) els.aiJobProgress.style.width = `${active ? active.progress : 0}%`;
        if (els.aiJobCancelBtn) els.aiJobCancelBtn.disabled = !active;
        const busy = Boolean(active);
        [els.creativeProbeBtn, els.speechProbeBtn, els.generateCreativeBtn, els.transcribeBtn].forEach(button => { if (button) button.disabled = busy; });
        if (els.aiJobHistory) {
            const source = snapshot && Array.isArray(snapshot.history) && snapshot.history.length ? snapshot.history.slice(0, 6) : [];
            if (!source.length) {
                const row = document.createElement('li');
                row.textContent = '로컬 AI 작업 이력이 없습니다.';
                els.aiJobHistory.replaceChildren(row);
            } else {
                els.aiJobHistory.replaceChildren(...source.map(item => {
                    const row = document.createElement('li');
                    row.textContent = `${item.kind} · ${item.state === 'completed' ? '완료' : item.state === 'cancelled' ? '취소' : '실패'} · ${formatElapsed(item.elapsedMs)}${item.error ? ` · ${safeText(item.error, 80)}` : ''}`;
                    return row;
                }));
            }
        }
    }

    function bindEvents() {
        if (els.creativeProviderSelect) els.creativeProviderSelect.addEventListener('change', () => { applyProviderEndpoint('creative', selectedProvider('creative')); renderModels(null, ''); });
        if (els.speechProviderSelect) els.speechProviderSelect.addEventListener('change', () => applyProviderEndpoint('speech', selectedProvider('speech')));
        if (els.creativeProbeBtn) els.creativeProbeBtn.addEventListener('click', () => probeProvider('creative'));
        if (els.speechProbeBtn) els.speechProbeBtn.addEventListener('click', () => probeProvider('speech'));
        if (els.creativeModelSelect) els.creativeModelSelect.addEventListener('change', () => { providers.configure({ creativeModel: els.creativeModelSelect.value }); renderPinStatus(); });
        if (els.modelPinBtn) els.modelPinBtn.addEventListener('click', toggleModelPin);
        if (els.generateCreativeBtn) els.generateCreativeBtn.addEventListener('click', generateCreativeCopy);
        if (els.applyCreativeBtn) els.applyCreativeBtn.addEventListener('click', applyCreativeResult);
        if (els.transcribeBtn) els.transcribeBtn.addEventListener('click', transcribeCurrentMedia);
        if (els.applyTranscriptBtn) els.applyTranscriptBtn.addEventListener('click', applyTranscriptResult);
        if (els.aiJobCancelBtn) els.aiJobCancelBtn.addEventListener('click', cancelActiveJob);
        if (els.includeCaptionsToggle) els.includeCaptionsToggle.addEventListener('change', () => providers.configure({ includeCaptions: els.includeCaptionsToggle.checked }));
        if (els.autoApplyTranscriptToggle) els.autoApplyTranscriptToggle.addEventListener('change', () => providers.configure({ autoApplyTranscript: els.autoApplyTranscriptToggle.checked }));
        if (els.speechLanguageSelect) els.speechLanguageSelect.addEventListener('change', () => providers.configure({ language: els.speechLanguageSelect.value }));
        if (els.speechModelInput) els.speechModelInput.addEventListener('change', () => providers.configure({ speechModel: els.speechModelInput.value }));
    }

    function initElements() {
        [
            'creativeProviderSelect', 'creativeEndpointInput', 'creativeProbeBtn', 'creativeProviderStatus',
            'creativeModelSelect', 'modelPinBtn', 'modelPinStatus', 'includeCaptionsToggle', 'generateCreativeBtn',
            'creativeResult', 'aiTitleResult', 'aiHookResult', 'aiDescriptionResult', 'aiHashtagResult', 'aiReasonResult',
            'applyCreativeBtn', 'aiCopyMemo', 'speechProviderSelect', 'speechEndpointInput', 'speechProbeBtn',
            'speechProviderStatus', 'speechModelInput', 'speechLanguageSelect', 'autoApplyTranscriptToggle',
            'transcribeBtn', 'transcriptResult', 'transcriptMeta', 'transcriptPreview', 'applyTranscriptBtn',
            'aiJobStatus', 'aiJobProgress', 'aiJobCancelBtn', 'aiJobHistory', 'titleInput', 'hashtagInput'
        ].forEach(id => { els[id] = byId(id); });
    }

    function init() {
        if (!providers.listProviders || !jobs.subscribe || !byId('localAIStudio')) return;
        initElements();
        const settings = providers.getSettings();
        populateProviderSelect(els.creativeProviderSelect, 'creative', settings.creativeProviderId);
        populateProviderSelect(els.speechProviderSelect, 'speech', settings.speechProviderId);
        applyProviderEndpoint('creative', settings.creativeProviderId);
        applyProviderEndpoint('speech', settings.speechProviderId);
        if (els.speechModelInput) els.speechModelInput.value = settings.speechModel || 'whisper';
        if (els.speechLanguageSelect) els.speechLanguageSelect.value = settings.language || 'auto';
        if (els.includeCaptionsToggle) els.includeCaptionsToggle.checked = settings.includeCaptions !== false;
        if (els.autoApplyTranscriptToggle) els.autoApplyTranscriptToggle.checked = Boolean(settings.autoApplyTranscript);
        renderModels(null, settings.creativeModel);
        renderCreativeResult(null);
        renderTranscriptResult(null);
        bindEvents();
        unsubscribe = jobs.subscribe(renderJobs);
        global.addEventListener('beforeunload', () => { if (unsubscribe) unsubscribe(); }, { once: true });
        document.body.dataset.localAiPolicy = 'loopback-only';
    }

    global.AIShortsLocalAIStudio = Object.freeze({ init, probeProvider, generateCreativeCopy, transcribeCurrentMedia, applyCreativeResult, applyTranscriptResult, cancelActiveJob });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})(window);
