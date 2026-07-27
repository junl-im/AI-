// AI Shorts Studio v1.6.13 - local vision model-pack benchmarks, device recommendations, and safe rollback
'use strict';

(function exposeVisionModelPackManager(global) {
    const doc = global.document;
    const config = global.AIShortsRuntimeConfig || {};
    const CACHE_NAME = String(config.VISION_MODEL_PACK_CACHE_NAME || 'ai-shorts-vision-model-packs-v1');
    const STORE_KEY = String(config.VISION_MODEL_PACK_STORE_KEY || 'ai-shorts-vision-model-packs-v1');
    const ACTIVE_KEY = String(config.VISION_MODEL_PACK_ACTIVE_KEY || 'ai-shorts-vision-model-pack-active-v1');
    const BENCHMARK_KEY = String(config.VISION_MODEL_PACK_BENCHMARK_KEY || 'ai-shorts-vision-model-pack-benchmarks-v1');
    const ROLLBACK_KEY = String(config.VISION_MODEL_PACK_ROLLBACK_KEY || 'ai-shorts-vision-model-pack-rollback-v1');
    const BENCHMARK_LIMIT = Math.max(4, Math.min(40, Number(config.VISION_MODEL_PACK_BENCHMARK_LIMIT || 16)));
    const BENCHMARK_ITERATIONS = Math.max(3, Math.min(30, Number(config.VISION_MODEL_PACK_BENCHMARK_ITERATIONS || 8)));
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
        lastError: '',
        lastRecovery: null
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

    function safeBenchmark(value) {
        const input = value && typeof value === 'object' ? value : {};
        const backend = normalizeBackend(input.backend);
        return {
            id: /^bench-[a-f0-9]{16}$/i.test(String(input.id || '')) ? String(input.id).toLowerCase() : '',
            packId: /^vision-[a-f0-9]{16}$/i.test(String(input.packId || '')) ? String(input.packId).toLowerCase() : '',
            backend: backend === 'auto' ? 'cpu' : backend,
            createdAt: safeText(input.createdAt || '', 40),
            iterations: Math.max(1, Math.min(100, Math.round(Number(input.iterations) || 1))),
            medianMs: Math.max(0, Number(input.medianMs) || 0),
            p95Ms: Math.max(0, Number(input.p95Ms) || 0),
            fps: Math.max(0, Number(input.fps) || 0),
            status: input.status === 'failed' ? 'failed' : 'passed',
            error: safeText(input.error || '', 180)
        };
    }

    function readBenchmarks() {
        const raw = readJson(BENCHMARK_KEY, { history: [] });
        return (raw && Array.isArray(raw.history) ? raw.history : []).map(safeBenchmark).filter(item => item.id && item.packId).slice(0, BENCHMARK_LIMIT);
    }

    function saveBenchmark(record) {
        const safe = safeBenchmark(record);
        if (!safe.id || !safe.packId) return null;
        const history = [safe].concat(readBenchmarks().filter(item => item.id !== safe.id)).slice(0, BENCHMARK_LIMIT);
        writeJson(BENCHMARK_KEY, { version: 1, history });
        return safe;
    }

    function readRollback() {
        const raw = readJson(ROLLBACK_KEY, null);
        if (!raw || !/^vision-[a-f0-9]{16}$/i.test(String(raw.packId || ''))) return null;
        return {
            packId: String(raw.packId).toLowerCase(),
            backend: normalizeBackend(raw.backend),
            createdAt: safeText(raw.createdAt || '', 40),
            reason: safeText(raw.reason || 'model-switch', 60)
        };
    }

    function saveRollback(packId, backend, reason) {
        const id = String(packId || '').toLowerCase();
        if (!/^vision-[a-f0-9]{16}$/.test(id) || !findPack(id)) return null;
        const next = { packId: id, backend: normalizeBackend(backend), createdAt: nowIso(), reason: safeText(reason || 'model-switch', 60) };
        writeJson(ROLLBACK_KEY, next);
        return next;
    }

    function clearRollback() {
        try { if (global.localStorage) global.localStorage.removeItem(ROLLBACK_KEY); } catch (_) { writeJson(ROLLBACK_KEY, null); }
    }

    function percentile(values, ratio) {
        const list = (Array.isArray(values) ? values : []).map(Number).filter(Number.isFinite).sort((a, b) => a - b);
        if (!list.length) return 0;
        const index = Math.min(list.length - 1, Math.max(0, Math.ceil((list.length - 1) * ratio)));
        return list[index];
    }

    function benchmarkRecommendation(results) {
        const passed = (Array.isArray(results) ? results : []).filter(item => item && item.status === 'passed' && item.medianMs > 0);
        const cpu = passed.find(item => item.backend === 'cpu');
        const gpu = passed.find(item => item.backend === 'gpu');
        if (gpu && !cpu) return { backend: 'gpu', reason: 'GPU 경로만 정상 완료됨', confidence: 'high' };
        if (cpu && !gpu) return { backend: 'cpu', reason: 'WASM CPU 경로만 정상 완료됨', confidence: 'high' };
        if (!cpu && !gpu) return { backend: 'auto', reason: '완료된 성능 측정이 없음', confidence: 'low' };
        const improvement = (cpu.medianMs - gpu.medianMs) / Math.max(0.001, cpu.medianMs);
        if (improvement >= 0.08) return { backend: 'gpu', reason: `GPU 중앙 처리 시간이 ${Math.round(improvement * 100)}% 짧음`, confidence: improvement >= 0.2 ? 'high' : 'medium' };
        if (improvement <= -0.08) return { backend: 'cpu', reason: `WASM CPU 중앙 처리 시간이 ${Math.round(Math.abs(improvement) * 100)}% 짧음`, confidence: improvement <= -0.2 ? 'high' : 'medium' };
        return { backend: 'cpu', reason: '성능 차이가 작아 호환성이 높은 WASM CPU 권장', confidence: 'medium' };
    }

    function performanceSummary(packId) {
        const id = String(packId || '').toLowerCase();
        const history = readBenchmarks().filter(item => item.packId === id);
        const latest = {};
        history.forEach(item => { if (!latest[item.backend]) latest[item.backend] = item; });
        const results = Object.values(latest);
        return Object.freeze({
            history: Object.freeze(history.map(item => Object.freeze(clone(item)))),
            latest: Object.freeze(results.map(item => Object.freeze(clone(item)))),
            recommendation: Object.freeze(benchmarkRecommendation(results))
        });
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

    function planRoomForPack(nextId) {
        const store = readStore();
        if (store.packs.some(pack => pack.id === nextId) || store.packs.length < MAX_PACKS) {
            return { store, evictionCandidate: null };
        }
        const active = readActive().packId;
        const candidate = store.packs.slice().reverse().find(pack => pack.id !== active);
        if (!candidate) throw new Error(`설치 가능한 모델 팩은 최대 ${MAX_PACKS}개입니다. 기존 팩을 먼저 삭제해 주세요.`);
        return { store, evictionCandidate: candidate };
    }

    async function deleteCachedFiles(packId, files) {
        if (!cacheReady()) return 0;
        const cache = await global.caches.open(CACHE_NAME);
        let removed = 0;
        for (const file of files || []) {
            try {
                if (await cache.delete(assetUrl(packId, file.path), { ignoreSearch: true })) removed += 1;
            } catch (_) { /* best-effort rollback cleanup */ }
        }
        return removed;
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
        const plan = planRoomForPack(packId);
        const existing = plan.store.packs.find(pack => pack.id === packId);
        const cache = await global.caches.open(CACHE_NAME);
        const written = [];
        try {
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
                written.push(item);
                if (progress) progress(60 + Math.round(((index + 1) / buffers.length) * 35), `로컬 저장 중 · ${index + 1}/${buffers.length}`);
            }
        } catch (error) {
            if (!existing) await deleteCachedFiles(packId, written);
            const reason = safeText(error && error.message || error, 180);
            throw new Error(`모델 팩 저장에 실패했습니다. 기존 모델 팩은 유지됩니다.${reason ? ` (${reason})` : ''}`);
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
        nextStore.packs = [pack].concat(nextStore.packs.filter(item => item.id !== pack.id && (!plan.evictionCandidate || item.id !== plan.evictionCandidate.id))).slice(0, MAX_PACKS);
        saveStore(nextStore);
        if (!findPack(pack.id)) {
            if (!existing) await deleteCachedFiles(packId, buffers);
            throw new Error('모델 팩 파일은 저장했지만 설치 정보를 보존하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.');
        }
        if (plan.evictionCandidate) {
            try { await cacheDeletePack(plan.evictionCandidate); } catch (_) { /* orphaned cache is harmless and can be reclaimed later */ }
        }
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

    function benchmarkFrame(options) {
        const opts = options || {};
        if (opts.frame) return opts.frame;
        if (!doc || typeof doc.createElement !== 'function') throw new Error('성능 측정용 프레임을 만들 수 없습니다.');
        const canvas = doc.createElement('canvas');
        canvas.width = Math.max(160, Math.min(640, Number(opts.width) || 320));
        canvas.height = Math.max(90, Math.min(360, Number(opts.height) || 180));
        const context = canvas.getContext && canvas.getContext('2d');
        if (context) {
            context.fillStyle = '#101827';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = '#dce8ff';
            context.fillRect(canvas.width * 0.34, canvas.height * 0.18, canvas.width * 0.32, canvas.height * 0.64);
        }
        return canvas;
    }

    async function benchmarkBackend(pack, backend, options) {
        const opts = options || {};
        const selected = normalizeBackend(backend);
        if (selected === 'auto') throw new Error('성능 측정 실행 방식은 GPU 또는 CPU여야 합니다.');
        const created = await createDetector(pack, selected, opts);
        const detector = created.detector;
        const frame = benchmarkFrame(opts);
        const iterations = Math.max(3, Math.min(30, Number(opts.iterations) || BENCHMARK_ITERATIONS));
        const warmup = Math.max(1, Math.min(6, Number(opts.warmup) || 2));
        const now = typeof opts.now === 'function' ? opts.now : () => global.performance && global.performance.now ? global.performance.now() : Date.now();
        const samples = [];
        try {
            for (let index = 0; index < warmup + iterations; index += 1) {
                const started = now();
                await Promise.resolve(detector.detectForVideo(frame, 1000 + index * 33));
                const elapsed = Math.max(0.001, Number(now()) - Number(started));
                if (index >= warmup) samples.push(elapsed);
                if (typeof opts.onProgress === 'function') opts.onProgress(Math.round(((index + 1) / (warmup + iterations)) * 100), `${selected === 'gpu' ? 'GPU' : 'WASM CPU'} 측정 중 · ${index + 1}/${warmup + iterations}`);
            }
        } finally {
            if (detector && typeof detector.close === 'function') {
                try { detector.close(); } catch (_) { /* ignored */ }
            }
        }
        const medianMs = percentile(samples, 0.5);
        const p95Ms = percentile(samples, 0.95);
        const seed = `${pack.id}:${selected}:${nowIso()}:${medianMs.toFixed(4)}`;
        const digest = await sha256(new TextEncoder().encode(seed));
        return saveBenchmark({
            id: `bench-${digest.slice(0, 16)}`,
            packId: pack.id,
            backend: selected,
            createdAt: nowIso(),
            iterations,
            medianMs: Number(medianMs.toFixed(3)),
            p95Ms: Number(p95Ms.toFixed(3)),
            fps: Number((1000 / Math.max(0.001, medianMs)).toFixed(2)),
            status: 'passed'
        });
    }

    async function benchmarkPack(packId, options) {
        const opts = options || {};
        const pack = findPack(packId);
        if (!pack) throw new Error('성능을 측정할 모델 팩이 설치되어 있지 않습니다.');
        const verification = await verifyPack(pack.id, opts);
        if (!verification.ok) throw new Error('손상된 모델 팩은 성능을 측정할 수 없습니다.');
        const requested = Array.isArray(opts.backends) ? opts.backends : ['gpu', 'cpu'];
        const capabilities = probeCapabilities();
        const backends = requested.map(normalizeBackend).filter((item, index, list) => item !== 'auto' && list.indexOf(item) === index).filter(item => item !== 'gpu' || capabilities.gpuDelegate || opts.runtimeModule);
        const results = [];
        for (const backend of backends) {
            try {
                results.push(await benchmarkBackend(pack, backend, opts));
            } catch (error) {
                const digest = await sha256(new TextEncoder().encode(`${pack.id}:${backend}:${nowIso()}:failed`));
                results.push(saveBenchmark({ id: `bench-${digest.slice(0, 16)}`, packId: pack.id, backend, createdAt: nowIso(), status: 'failed', error: error && error.message || error, iterations: 1 }));
            }
        }
        const recommendation = benchmarkRecommendation(results);
        dispatchChange({ type: 'benchmark-complete', packId: pack.id, results: clone(results), recommendation });
        return Object.freeze({ packId: pack.id, results: Object.freeze(results.map(item => Object.freeze(clone(item)))), recommendation: Object.freeze(recommendation) });
    }

    function commitRuntime(pack, created, requestedBackend) {
        runtimeState.packId = pack.id;
        runtimeState.backend = created.backend;
        runtimeState.detector = created.detector;
        runtimeState.module = created.runtime;
        runtimeState.provider = providerFromDetector(created.detector, pack.id, created.backend);
        runtimeState.lastError = '';
        const engine = global.AIShortsSmartReframe;
        if (engine && typeof engine.registerDetectorProvider === 'function') engine.registerDetectorProvider(runtimeState.provider);
        saveActive(pack.id, requestedBackend);
        return publicRuntimeState();
    }

    async function restoreRollbackCandidate(candidate, options) {
        const opts = options || {};
        const rollback = candidate || readRollback();
        if (!rollback) throw new Error('복구할 이전 모델 팩이 없습니다.');
        const pack = findPack(rollback.packId);
        if (!pack) { clearRollback(); throw new Error('이전 모델 팩이 삭제되어 복구할 수 없습니다.'); }
        const verification = await verifyPack(pack.id, opts);
        if (!verification.ok) throw new Error('이전 모델 팩도 손상되어 복구하지 않았습니다.');
        await deactivate({ preserveSelection: true });
        const created = await createDetector(pack, rollback.backend, opts);
        const state = commitRuntime(pack, created, rollback.backend);
        runtimeState.lastRecovery = { packId: pack.id, backend: state.backend, recoveredAt: nowIso(), reason: rollback.reason };
        dispatchChange({ type: 'rollback-complete', runtime: state, rollback: clone(runtimeState.lastRecovery) });
        return Object.freeze(Object.assign({}, state, { recovered: true, rollback: clone(runtimeState.lastRecovery) }));
    }

    async function rollbackToPrevious(options) {
        const opts = options || {};
        const candidate = readRollback();
        if (!candidate) throw new Error('복구할 이전 모델 팩이 없습니다.');
        const current = runtimeState.packId || readActive().packId;
        const currentBackend = runtimeState.backend || readActive().backend;
        const result = await restoreRollbackCandidate(candidate, opts);
        if (current && current !== result.packId && findPack(current)) saveRollback(current, currentBackend, 'rollback-undo');
        else clearRollback();
        return result;
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

    function activationRollbackCandidate(targetPackId, requestedBackend) {
        const selected = readActive();
        const runtimePackId = runtimeState.packId && runtimeState.provider ? runtimeState.packId : '';
        const currentPackId = runtimePackId || selected.packId;
        const currentBackend = runtimePackId ? runtimeState.backend : selected.backend;
        const targetBackend = normalizeBackend(requestedBackend);
        const backendChanges = currentPackId === targetPackId && targetBackend !== 'auto' && normalizeBackend(currentBackend) !== targetBackend;
        if (currentPackId && findPack(currentPackId) && (currentPackId !== targetPackId || backendChanges)) {
            const reason = currentPackId === targetPackId ? 'backend-switch' : 'model-switch';
            const candidate = {
                packId: currentPackId,
                backend: normalizeBackend(currentBackend),
                createdAt: nowIso(),
                reason
            };
            if (reason === 'model-switch') saveRollback(candidate.packId, candidate.backend, reason);
            return candidate;
        }
        return readRollback();
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
            const rollbackCandidate = activationRollbackCandidate(pack.id, backend);
            try {
                const verification = await verifyPack(pack.id, opts);
                if (!verification.ok) throw new Error('모델 팩 무결성이 손상되어 활성화하지 않았습니다. 다시 설치해 주세요.');
                await deactivate({ preserveSelection: true });
                const created = await createDetector(pack, backend, opts);
                runtimeState.lastRecovery = null;
                const state = commitRuntime(pack, created, backend);
                dispatchChange({ type: 'activated', runtime: state });
                return state;
            } catch (error) {
                const message = safeText(error && error.message || error, 240);
                runtimeState.lastError = message;
                if (opts.autoRollback !== false && rollbackCandidate) {
                    try {
                        const recovered = await restoreRollbackCandidate(rollbackCandidate, Object.assign({}, opts, { autoRollback: false }));
                        runtimeState.lastError = `새 모델 시작 실패 · 이전 모델로 자동 복구됨: ${message}`;
                        dispatchChange({ type: 'activation-rolled-back', failedPackId: id, message, runtime: recovered });
                        return Object.freeze(Object.assign({}, recovered, { activationError: message }));
                    } catch (rollbackError) {
                        runtimeState.lastError = `${message} · 이전 모델 복구도 실패: ${safeText(rollbackError && rollbackError.message || rollbackError, 180)}`;
                    }
                }
                dispatchChange({ type: 'activation-failed', packId: id, message: runtimeState.lastError });
                throw new Error(runtimeState.lastError);
            }
        })().finally(() => { runtimeState.activating = null; });
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
        if (readRollback() && readRollback().packId === id) clearRollback();
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
            lastError: runtimeState.lastError,
            lastRecovery: runtimeState.lastRecovery ? clone(runtimeState.lastRecovery) : null
        });
    }

    function snapshot() {
        const selected = readActive();
        return Object.freeze({
            packs: listPacks(),
            selected: Object.freeze(selected),
            runtime: publicRuntimeState(),
            capabilities: probeCapabilities(),
            rollback: Object.freeze(readRollback() || { packId: '', backend: 'auto', createdAt: '', reason: '' }),
            performance: Object.freeze(readStore().packs.reduce((output, pack) => { output[pack.id] = performanceSummary(pack.id); return output; }, {})),
            policy: Object.freeze({ localFilesOnly: true, remoteDownload: false, integrity: 'sha256', cacheName: CACHE_NAME, maxFiles: MAX_FILES })
        });
    }

    global.AIShortsVisionModelPacks = Object.freeze({
        installFromFiles,
        verifyPack,
        activatePack,
        benchmarkPack,
        performanceSummary,
        rollbackToPrevious,
        ensureActiveProvider,
        deactivate,
        removePack,
        listPacks,
        findPack: id => publicPack(findPack(id)),
        probeCapabilities,
        snapshot,
        assetUrl,
        _test: Object.freeze({ selectInputFiles, normalizeBackend, contentTypeFor, storedPath, sha256, safeBenchmark, benchmarkRecommendation, percentile, readRollback, saveRollback, activationRollbackCandidate, planRoomForPack, PATH_SEGMENT, CACHE_NAME, REQUIRED_RUNTIME_FILES, BENCHMARK_KEY, ROLLBACK_KEY })
    });
})(window);
