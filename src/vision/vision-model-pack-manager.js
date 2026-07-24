// AI Shorts Studio v1.6.9 - local browser vision model-pack installer, integrity verifier, and runtime activator
'use strict';

(function exposeVisionModelPackManager(global) {
    const doc = global.document;
    const config = global.AIShortsRuntimeConfig || {};
    const CACHE_NAME = String(config.VISION_MODEL_PACK_CACHE_NAME || 'ai-shorts-vision-model-packs-v1');
    const STORE_KEY = String(config.VISION_MODEL_PACK_STORE_KEY || 'ai-shorts-vision-model-packs-v1');
    const ACTIVE_KEY = String(config.VISION_MODEL_PACK_ACTIVE_KEY || 'ai-shorts-vision-model-pack-active-v1');
    const MAX_PACKS = Math.max(1, Math.min(8, Number(config.VISION_MODEL_PACK_MAX_PACKS || 3)));
    const MAX_FILES = Math.max(8, Math.min(32, Number(config.VISION_MODEL_PACK_MAX_FILES || 16)));
    const MAX_TOTAL_BYTES = Math.max(8 * 1024 * 1024, Math.min(256 * 1024 * 1024, Number(config.VISION_MODEL_PACK_MAX_BYTES || 64 * 1024 * 1024)));
    const MAX_FILE_BYTES = Math.max(4 * 1024 * 1024, Math.min(128 * 1024 * 1024, Number(config.VISION_MODEL_PACK_MAX_FILE_BYTES || 48 * 1024 * 1024)));
    const PATH_SEGMENT = '__ai_shorts_vision_pack__';
    const REQUIRED_RUNTIME_FILES = Object.freeze([
        'vision_bundle.mjs',
        'vision_wasm_internal.js',
        'vision_wasm_internal.wasm',
        'vision_wasm_module_internal.js',
        'vision_wasm_module_internal.wasm',
        'vision_wasm_nosimd_internal.js',
        'vision_wasm_nosimd_internal.wasm'
    ]);
    const MODEL_PATTERN = /(?:face|blaze).*\.(?:task|tflite)$/i;
    const runtimeState = {
        packId: '',
        backend: '',
        detector: null,
        provider: null,
        module: null,
        activating: null,
        lastError: ''
    };

    function nowIso() { return new Date().toISOString(); }

    function safeText(value, maxLength) {
        return String(value == null ? '' : value).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, maxLength || 160);
    }

    function clone(value) {
        return value == null ? value : JSON.parse(JSON.stringify(value));
    }

    function formatBytes(bytes) {
        const value = Math.max(0, Number(bytes) || 0);
        if (value < 1024) return `${Math.round(value)}B`;
        if (value < 1024 * 1024) return `${(value / 1024).toFixed(value < 10240 ? 1 : 0)}KB`;
        return `${(value / (1024 * 1024)).toFixed(value < 10 * 1024 * 1024 ? 1 : 0)}MB`;
    }

    function readJson(key, fallback) {
        try {
            const text = global.localStorage && global.localStorage.getItem(key);
            return text ? JSON.parse(text) : fallback;
        } catch (_) { return fallback; }
    }

    function writeJson(key, value) {
        try {
            if (!global.localStorage) return;
            global.localStorage.setItem(key, JSON.stringify(value));
        } catch (_) { /* storage unavailable */ }
    }

    function sanitizeFileRecord(value) {
        const input = value && typeof value === 'object' ? value : {};
        return {
            name: safeText(input.name, 180),
            path: safeText(input.path, 260),
            role: ['runtime', 'wasm', 'model', 'metadata'].includes(input.role) ? input.role : 'metadata',
            bytes: Math.max(0, Number(input.bytes) || 0),
            sha256: /^[a-f0-9]{64}$/i.test(String(input.sha256 || '')) ? String(input.sha256).toLowerCase() : '',
            contentType: safeText(input.contentType, 100)
        };
    }

    function sanitizePack(value) {
        const input = value && typeof value === 'object' ? value : {};
        const files = (Array.isArray(input.files) ? input.files : []).slice(0, MAX_FILES).map(sanitizeFileRecord).filter(item => item.name && item.path && item.sha256);
        return {
            id: /^vision-[a-f0-9]{16}$/i.test(String(input.id || '')) ? String(input.id).toLowerCase() : '',
            label: safeText(input.label || 'MediaPipe 얼굴 감지', 80),
            provider: 'mediapipe-tasks-vision',
            runtimeVersion: safeText(input.runtimeVersion || '', 40),
            installedAt: safeText(input.installedAt || '', 40),
            verifiedAt: safeText(input.verifiedAt || '', 40),
            verification: ['verified', 'failed', 'unverified'].includes(input.verification) ? input.verification : 'unverified',
            totalBytes: Math.max(0, Number(input.totalBytes) || files.reduce((sum, item) => sum + item.bytes, 0)),
            files,
            modelPath: safeText(input.modelPath || '', 260),
            runtimePath: safeText(input.runtimePath || 'vision_bundle.mjs', 260)
        };
    }

    function readStore() {
        const raw = readJson(STORE_KEY, { packs: [] });
        const packs = (raw && Array.isArray(raw.packs) ? raw.packs : []).map(sanitizePack).filter(pack => pack.id && pack.files.length);
        return { packs: packs.slice(0, MAX_PACKS) };
    }

    function saveStore(store) {
        const packs = (store && Array.isArray(store.packs) ? store.packs : []).map(sanitizePack).filter(pack => pack.id && pack.files.length).slice(0, MAX_PACKS);
        writeJson(STORE_KEY, { version: 1, packs });
        return packs;
    }

    function readActive() {
        const value = readJson(ACTIVE_KEY, null);
        if (!value || !/^vision-[a-f0-9]{16}$/i.test(String(value.packId || ''))) return { packId: '', backend: 'auto' };
        return { packId: String(value.packId).toLowerCase(), backend: normalizeBackend(value.backend) };
    }

    function saveActive(packId, backend) {
        const next = { packId: String(packId || ''), backend: normalizeBackend(backend), updatedAt: nowIso() };
        writeJson(ACTIVE_KEY, next);
        return next;
    }

    function normalizeBackend(value) {
        const key = String(value || 'auto').toLowerCase();
        return ['auto', 'gpu', 'cpu'].includes(key) ? key : 'auto';
    }

    function baseUrl() {
        const reference = doc && doc.baseURI || global.location && global.location.href || 'http://localhost/';
        return new URL(`${PATH_SEGMENT}/`, reference);
    }

    function assetUrl(packId, relativePath) {
        const id = String(packId || '').toLowerCase();
        if (!/^vision-[a-f0-9]{16}$/.test(id)) throw new Error('비전 모델 팩 식별자가 올바르지 않습니다.');
        const clean = String(relativePath || '').replace(/^\/+/, '');
        if (!clean || clean.includes('..') || clean.includes('\\') || /[?#]/.test(clean)) throw new Error('비전 모델 팩 자산 경로가 올바르지 않습니다.');
        return new URL(`${encodeURIComponent(id)}/${clean}`, baseUrl()).toString();
    }

    function wasmRootUrl(packId) {
        return assetUrl(packId, 'wasm/placeholder').replace(/placeholder$/, '');
    }

    function cryptoReady() {
        return Boolean(global.crypto && global.crypto.subtle && typeof global.crypto.subtle.digest === 'function');
    }

    function cacheReady() {
        return Boolean(global.caches && typeof global.caches.open === 'function');
    }

    async function sha256(buffer) {
        if (!cryptoReady()) throw new Error('이 브라우저는 SHA-256 무결성 검사를 지원하지 않습니다.');
        const digest = await global.crypto.subtle.digest('SHA-256', buffer);
        return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    }

    function contentTypeFor(name) {
        const lower = String(name || '').toLowerCase();
        if (lower.endsWith('.mjs') || lower.endsWith('.js')) return 'text/javascript; charset=utf-8';
        if (lower.endsWith('.wasm')) return 'application/wasm';
        if (lower.endsWith('.json')) return 'application/json; charset=utf-8';
        if (lower.endsWith('.task') || lower.endsWith('.tflite')) return 'application/octet-stream';
        return 'application/octet-stream';
    }

    function basename(file) {
        const path = String(file && (file.webkitRelativePath || file.name) || '').replace(/\\/g, '/');
        return path.split('/').filter(Boolean).pop() || '';
    }

    function fileRole(name) {
        if (name === 'vision_bundle.mjs') return 'runtime';
        if (/^vision_wasm_.*\.(?:js|wasm)$/i.test(name)) return 'wasm';
        if (/\.(?:task|tflite)$/i.test(name)) return 'model';
        if (name === 'package.json') return 'metadata';
        return '';
    }

    function storedPath(name, role) {
        if (role === 'wasm') return `wasm/${name}`;
        if (role === 'model') return `models/${name}`;
        return name;
    }

    function selectInputFiles(fileList) {
        const source = Array.from(fileList || []);
        if (!source.length) throw new Error('설치할 모델 팩 파일을 선택해 주세요.');
        const selected = new Map();
        source.forEach(file => {
            const name = basename(file);
            const role = fileRole(name);
            if (!role) return;
            if (selected.has(name)) throw new Error(`같은 이름의 파일이 중복되었습니다: ${name}`);
            selected.set(name, file);
        });
        REQUIRED_RUNTIME_FILES.forEach(name => {
            if (!selected.has(name)) throw new Error(`필수 런타임 파일이 없습니다: ${name}`);
        });
        const modelNames = Array.from(selected.keys()).filter(name => fileRole(name) === 'model');
        const preferred = modelNames.find(name => MODEL_PATTERN.test(name));
        if (!preferred) throw new Error('MediaPipe 얼굴 감지 모델(.task 또는 .tflite)이 필요합니다.');
        const allowed = REQUIRED_RUNTIME_FILES.concat(preferred, selected.has('package.json') ? ['package.json'] : []);
        const files = allowed.map(name => ({ name, file: selected.get(name), role: fileRole(name) }));
        if (files.length > MAX_FILES) throw new Error(`모델 팩은 최대 ${MAX_FILES}개 파일까지 설치할 수 있습니다.`);
        const totalBytes = files.reduce((sum, item) => sum + Math.max(0, Number(item.file && item.file.size) || 0), 0);
        if (files.some(item => Number(item.file && item.file.size) > MAX_FILE_BYTES)) throw new Error(`단일 파일은 ${formatBytes(MAX_FILE_BYTES)}를 넘을 수 없습니다.`);
        if (totalBytes <= 0 || totalBytes > MAX_TOTAL_BYTES) throw new Error(`모델 팩 전체 크기는 ${formatBytes(MAX_TOTAL_BYTES)} 이하여야 합니다.`);
        return { files, modelName: preferred, totalBytes, ignoredCount: Math.max(0, source.length - files.length) };
    }

    async function readRuntimeVersion(file) {
        if (!file || typeof file.text !== 'function') return '';
        try {
            const data = JSON.parse(await file.text());
            return safeText(data && data.version || '', 40);
        } catch (_) { return ''; }
    }

    function dispatchChange(detail) {
        if (!doc || typeof doc.dispatchEvent !== 'function' || typeof global.CustomEvent !== 'function') return;
        doc.dispatchEvent(new global.CustomEvent('ai-shorts-vision-pack-change', { detail: clone(detail || snapshot()) }));
    }

    function findPack(packId) {
        const id = String(packId || '').toLowerCase();
        return readStore().packs.find(item => item.id === id) || null;
    }

    async function cacheDeletePack(pack) {
        if (!pack || !cacheReady()) return 0;
        const cache = await global.caches.open(CACHE_NAME);
        let removed = 0;
        for (const file of pack.files) {
            if (await cache.delete(assetUrl(pack.id, file.path), { ignoreSearch: true })) removed += 1;
        }
        return removed;
    }

    async function makeRoomForPack(nextId) {
        const store = readStore();
        if (store.packs.some(pack => pack.id === nextId) || store.packs.length < MAX_PACKS) return store;
        const active = readActive().packId;
        const candidate = store.packs.slice().reverse().find(pack => pack.id !== active);
        if (!candidate) throw new Error(`설치 가능한 모델 팩은 최대 ${MAX_PACKS}개입니다. 기존 팩을 먼저 삭제해 주세요.`);
        await cacheDeletePack(candidate);
        store.packs = store.packs.filter(pack => pack.id !== candidate.id);
        saveStore(store);
        return store;
    }

    async function installFromFiles(fileList, options) {
        if (!cacheReady()) throw new Error('이 브라우저는 모델 팩 저장소를 지원하지 않습니다.');
        const opts = options || {};
        const progress = typeof opts.onProgress === 'function' ? opts.onProgress : null;
        const selection = selectInputFiles(fileList);
        const buffers = [];
        let completedBytes = 0;
        for (let index = 0; index < selection.files.length; index += 1) {
            const item = selection.files[index];
            const buffer = await item.file.arrayBuffer();
            const hash = await sha256(buffer);
            completedBytes += buffer.byteLength;
            buffers.push({
                name: item.name,
                path: storedPath(item.name, item.role),
                role: item.role,
                bytes: buffer.byteLength,
                sha256: hash,
                contentType: contentTypeFor(item.name),
                buffer
            });
            if (progress) progress(Math.round((completedBytes / selection.totalBytes) * 58), `무결성 확인 중 · ${index + 1}/${selection.files.length}`);
        }
        const identity = await sha256(new TextEncoder().encode(buffers.map(item => `${item.path}:${item.sha256}`).sort().join('|')));
        const packId = `vision-${identity.slice(0, 16)}`;
        const store = await makeRoomForPack(packId);
        const existing = store.packs.find(pack => pack.id === packId);
        if (existing) await cacheDeletePack(existing);
        const cache = await global.caches.open(CACHE_NAME);
        for (let index = 0; index < buffers.length; index += 1) {
            const item = buffers[index];
            const response = new Response(item.buffer.slice(0), {
                status: 200,
                headers: {
                    'Content-Type': item.contentType,
                    'Content-Length': String(item.bytes),
                    'Cache-Control': 'public, max-age=31536000, immutable',
                    'X-AI-Shorts-SHA256': item.sha256,
                    'X-Content-Type-Options': 'nosniff'
                }
            });
            await cache.put(assetUrl(packId, item.path), response);
            if (progress) progress(60 + Math.round(((index + 1) / buffers.length) * 35), `로컬 저장 중 · ${index + 1}/${buffers.length}`);
        }
        const packageFile = selection.files.find(item => item.name === 'package.json');
        const pack = sanitizePack({
            id: packId,
            label: safeText(opts.label || 'MediaPipe 얼굴 감지', 80),
            runtimeVersion: await readRuntimeVersion(packageFile && packageFile.file),
            installedAt: nowIso(),
            verifiedAt: nowIso(),
            verification: 'verified',
            totalBytes: selection.totalBytes,
            files: buffers,
            modelPath: storedPath(selection.modelName, 'model'),
            runtimePath: 'vision_bundle.mjs'
        });
        const nextStore = readStore();
        nextStore.packs = [pack].concat(nextStore.packs.filter(item => item.id !== pack.id)).slice(0, MAX_PACKS);
        saveStore(nextStore);
        if (progress) progress(100, '모델 팩 설치 완료');
        dispatchChange({ type: 'installed', pack: publicPack(pack), ignoredCount: selection.ignoredCount });
        return publicPack(pack);
    }

    async function verifyPack(packId, options) {
        const opts = options || {};
        const progress = typeof opts.onProgress === 'function' ? opts.onProgress : null;
        const pack = findPack(packId);
        if (!pack) throw new Error('설치된 모델 팩을 찾을 수 없습니다.');
        if (!cacheReady()) throw new Error('모델 팩 저장소를 사용할 수 없습니다.');
        const cache = await global.caches.open(CACHE_NAME);
        const failures = [];
        let verifiedBytes = 0;
        for (let index = 0; index < pack.files.length; index += 1) {
            const file = pack.files[index];
            const response = await cache.match(assetUrl(pack.id, file.path), { ignoreSearch: true });
            if (!response) failures.push({ path: file.path, reason: 'missing' });
            else {
                const actual = await sha256(await response.arrayBuffer());
                if (actual !== file.sha256) failures.push({ path: file.path, reason: 'checksum' });
            }
            verifiedBytes += file.bytes;
            if (progress) progress(Math.round((verifiedBytes / Math.max(1, pack.totalBytes)) * 100), `무결성 검사 중 · ${index + 1}/${pack.files.length}`);
        }
        const store = readStore();
        const index = store.packs.findIndex(item => item.id === pack.id);
        if (index >= 0) {
            store.packs[index].verification = failures.length ? 'failed' : 'verified';
            store.packs[index].verifiedAt = nowIso();
            saveStore(store);
        }
        if (failures.length) {
            if (runtimeState.packId === pack.id) await deactivate();
            runtimeState.lastError = '모델 팩 무결성 검사에 실패했습니다.';
            dispatchChange({ type: 'verification-failed', packId: pack.id, failures: failures.length });
            return { ok: false, packId: pack.id, failures: failures.map(item => ({ role: pack.files.find(file => file.path === item.path)?.role || 'asset', reason: item.reason })) };
        }
        dispatchChange({ type: 'verified', packId: pack.id });
        return { ok: true, packId: pack.id, failures: [] };
    }

    function webgl2Available() {
        if (!doc || typeof doc.createElement !== 'function') return false;
        try {
            const canvas = doc.createElement('canvas');
            return Boolean(canvas.getContext && canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true }));
        } catch (_) { return false; }
    }

    function probeCapabilities() {
        return Object.freeze({
            cacheStorage: cacheReady(),
            sha256: cryptoReady(),
            webAssembly: typeof global.WebAssembly === 'object',
            serviceWorkerControlled: Boolean(global.navigator && global.navigator.serviceWorker && global.navigator.serviceWorker.controller),
            gpuDelegate: webgl2Available(),
            webGPU: Boolean(global.navigator && global.navigator.gpu),
            maxPackBytes: MAX_TOTAL_BYTES,
            maxPacks: MAX_PACKS
        });
    }

    async function importRuntime(url) {
        return import(url);
    }

    async function createDetector(pack, backend, options) {
        const opts = options || {};
        const runtimeUrl = `${assetUrl(pack.id, pack.runtimePath)}?sha=${encodeURIComponent(pack.files.find(item => item.path === pack.runtimePath)?.sha256.slice(0, 16) || '')}`;
        const runtime = opts.runtimeModule || await importRuntime(runtimeUrl);
        if (!runtime || !runtime.FilesetResolver || !runtime.FaceDetector) throw new Error('선택한 런타임에서 MediaPipe Face Detector API를 찾을 수 없습니다.');
        const fileset = await runtime.FilesetResolver.forVisionTasks(wasmRootUrl(pack.id));
        const requested = normalizeBackend(backend);
        const candidates = requested === 'auto' ? (webgl2Available() ? ['gpu', 'cpu'] : ['cpu']) : [requested];
        let lastError = null;
        for (const candidate of candidates) {
            try {
                const detector = await runtime.FaceDetector.createFromOptions(fileset, {
                    baseOptions: {
                        modelAssetPath: assetUrl(pack.id, pack.modelPath),
                        delegate: candidate === 'gpu' ? 'GPU' : 'CPU'
                    },
                    runningMode: 'VIDEO',
                    minDetectionConfidence: 0.45,
                    minSuppressionThreshold: 0.3
                });
                if (!detector || typeof detector.detectForVideo !== 'function') throw new Error('얼굴 감지 런타임이 올바른 detector를 반환하지 않았습니다.');
                return { detector, runtime, backend: candidate };
            } catch (error) { lastError = error; }
        }
        throw lastError || new Error('얼굴 감지 런타임을 시작하지 못했습니다.');
    }

    function providerFromDetector(detector, packId, backend) {
        return {
            name: `mediapipe-face-detector-${backend}`,
            packId,
            backend,
            detect(frame, meta) {
                const timestampMs = Math.max(0, Math.round((Number(meta && meta.time) || 0) * 1000));
                return detector.detectForVideo(frame, timestampMs);
            },
            close() {
                if (detector && typeof detector.close === 'function') detector.close();
            }
        };
    }

    function serviceWorkerRequired(options) {
        if (options && options.runtimeModule) return false;
        return !(global.navigator && global.navigator.serviceWorker && global.navigator.serviceWorker.controller);
    }

    async function activatePack(packId, options) {
        const opts = options || {};
        const id = String(packId || '').toLowerCase();
        const backend = normalizeBackend(opts.backend || readActive().backend);
        if (runtimeState.packId === id && runtimeState.provider && (backend === 'auto' || runtimeState.backend === backend)) return publicRuntimeState();
        if (runtimeState.activating) return runtimeState.activating;
        runtimeState.activating = (async () => {
            const pack = findPack(id);
            if (!pack) throw new Error('활성화할 모델 팩이 설치되어 있지 않습니다.');
            if (serviceWorkerRequired(opts)) throw new Error('모델 팩 설치 후 앱을 한 번 새로고침해야 사용할 수 있습니다.');
            const verification = await verifyPack(pack.id, opts);
            if (!verification.ok) throw new Error('모델 팩 무결성이 손상되어 활성화하지 않았습니다. 다시 설치해 주세요.');
            await deactivate({ preserveSelection: true });
            const created = await createDetector(pack, backend, opts);
            runtimeState.packId = pack.id;
            runtimeState.backend = created.backend;
            runtimeState.detector = created.detector;
            runtimeState.module = created.runtime;
            runtimeState.provider = providerFromDetector(created.detector, pack.id, created.backend);
            runtimeState.lastError = '';
            const engine = global.AIShortsSmartReframe;
            if (engine && typeof engine.registerDetectorProvider === 'function') engine.registerDetectorProvider(runtimeState.provider);
            saveActive(pack.id, backend);
            dispatchChange({ type: 'activated', runtime: publicRuntimeState() });
            return publicRuntimeState();
        })().catch(error => {
            runtimeState.lastError = safeText(error && error.message || error, 240);
            dispatchChange({ type: 'activation-failed', packId: id, message: runtimeState.lastError });
            throw error;
        }).finally(() => { runtimeState.activating = null; });
        return runtimeState.activating;
    }

    async function ensureActiveProvider() {
        if (runtimeState.provider) return runtimeState.provider;
        const selected = readActive();
        if (!selected.packId) return null;
        try {
            await activatePack(selected.packId, { backend: selected.backend });
            return runtimeState.provider;
        } catch (_) { return null; }
    }

    async function deactivate(options) {
        const opts = options || {};
        const provider = runtimeState.provider;
        runtimeState.packId = '';
        runtimeState.backend = '';
        runtimeState.detector = null;
        runtimeState.provider = null;
        runtimeState.module = null;
        if (provider && typeof provider.close === 'function') {
            try { provider.close(); } catch (_) { /* ignored */ }
        }
        const engine = global.AIShortsSmartReframe;
        if (engine && typeof engine.registerDetectorProvider === 'function') {
            try { engine.registerDetectorProvider(null); } catch (_) { /* ignored */ }
        }
        if (!opts.preserveSelection) saveActive('', 'auto');
        dispatchChange({ type: 'deactivated' });
        return publicRuntimeState();
    }

    async function removePack(packId) {
        const id = String(packId || '').toLowerCase();
        const pack = findPack(id);
        if (!pack) return { removed: false, files: 0 };
        if (runtimeState.packId === id || readActive().packId === id) await deactivate();
        const files = await cacheDeletePack(pack);
        const store = readStore();
        store.packs = store.packs.filter(item => item.id !== id);
        saveStore(store);
        dispatchChange({ type: 'removed', packId: id, files });
        return { removed: true, files };
    }

    function publicPack(pack) {
        if (!pack) return null;
        return Object.freeze({
            id: pack.id,
            label: pack.label,
            provider: pack.provider,
            runtimeVersion: pack.runtimeVersion,
            installedAt: pack.installedAt,
            verifiedAt: pack.verifiedAt,
            verification: pack.verification,
            totalBytes: pack.totalBytes,
            sizeLabel: formatBytes(pack.totalBytes),
            fileCount: pack.files.length,
            modelDigest: pack.files.find(item => item.path === pack.modelPath)?.sha256.slice(0, 16) || ''
        });
    }

    function listPacks() {
        return Object.freeze(readStore().packs.map(publicPack));
    }

    function publicRuntimeState() {
        return Object.freeze({
            active: Boolean(runtimeState.provider && runtimeState.packId),
            packId: runtimeState.packId,
            backend: runtimeState.backend,
            lastError: runtimeState.lastError
        });
    }

    function snapshot() {
        const selected = readActive();
        return Object.freeze({
            packs: listPacks(),
            selected: Object.freeze(selected),
            runtime: publicRuntimeState(),
            capabilities: probeCapabilities(),
            policy: Object.freeze({ localFilesOnly: true, remoteDownload: false, integrity: 'sha256', cacheName: CACHE_NAME, maxFiles: MAX_FILES })
        });
    }

    global.AIShortsVisionModelPacks = Object.freeze({
        installFromFiles,
        verifyPack,
        activatePack,
        ensureActiveProvider,
        deactivate,
        removePack,
        listPacks,
        findPack: id => publicPack(findPack(id)),
        probeCapabilities,
        snapshot,
        assetUrl,
        _test: Object.freeze({ selectInputFiles, normalizeBackend, contentTypeFor, storedPath, sha256, PATH_SEGMENT, CACHE_NAME, REQUIRED_RUNTIME_FILES })
    });
})(window);
