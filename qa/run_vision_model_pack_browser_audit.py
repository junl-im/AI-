#!/usr/bin/env python3
"""Chromium audit for local vision model-pack install, integrity, activation, corruption guard, and removal."""
from __future__ import annotations

import asyncio
import datetime as dt
import json
from pathlib import Path

from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]
VERSION = json.loads((ROOT / 'package.json').read_text(encoding='utf-8'))['version']
OUTPUT = ROOT / 'qa' / f'runtime-vision-model-pack-browser-v{VERSION}.json'
MANAGER = (ROOT / 'src/vision/vision-model-pack-manager.js').read_text(encoding='utf-8').replace('</script>', '<\\/script>')
ENGINE = (ROOT / 'src/vision/smart-reframe-engine.js').read_text(encoding='utf-8').replace('</script>', '<\\/script>')
PANEL = (ROOT / 'src/ui/vision-model-pack-panel.js').read_text(encoding='utf-8').replace('</script>', '<\\/script>')
CSS = (ROOT / 'assets/css/smart-reframe.css').read_text(encoding='utf-8')

FAKE_MODULE = r'''
export const FilesetResolver = {
    async forVisionTasks(root) {
        globalThis.__visionAuditWasmRoot = root;
        return { root };
    }
};
export const FaceDetector = {
    async createFromOptions(fileset, options) {
        globalThis.__visionAuditOptions = options;
        return {
            detectForVideo(frame, timestamp) {
                return { detections: [{ boundingBox: { originX: 12, originY: 8, width: 40, height: 52 }, categories: [{ score: 0.97 }] }], timestamp };
            },
            close() { globalThis.__visionAuditClosed = (globalThis.__visionAuditClosed || 0) + 1; }
        };
    }
};
'''


def build_html() -> str:
    return f'''<!doctype html><html lang="ko"><head><meta charset="utf-8"><base href="https://studio.test/"><meta name="viewport" content="width=device-width,initial-scale=1"><style>:root{{--muted:#94a3b8}}body{{background:#090b12;color:#e2e8f0;font-family:system-ui,sans-serif}}button,select{{font:inherit}}{CSS}</style></head><body>
<div id="smartReframePanel" class="smart-reframe-panel">
  <details id="visionModelPackPanel" class="vision-model-pack-panel">
    <summary>브라우저 얼굴 감지 모델</summary>
    <div class="vision-model-pack-body">
      <div class="vision-model-pack-status"><strong id="visionPackStatus">미설치 · 모션 추적 사용</strong><small id="visionPackDetail"></small></div>
      <div class="vision-model-pack-controls">
        <label class="smart-reframe-field"><span>설치된 모델 팩</span><select id="visionPackSelect"><option value="">설치된 모델 팩 없음</option></select></label>
        <label class="smart-reframe-field"><span>실행 방식</span><select id="visionPackBackend" disabled><option value="auto">자동</option><option value="gpu">GPU</option><option value="cpu">WASM CPU</option></select></label>
      </div>
      <div class="vision-model-pack-actions">
        <button id="visionPackInstallBtn" type="button">모델 팩 폴더 선택</button><input id="visionPackFolderInput" type="file" multiple hidden>
        <button id="visionPackActivateBtn" type="button" disabled>얼굴 추적 사용</button><button id="visionPackDeactivateBtn" type="button" hidden disabled>얼굴 추적 끄기</button>
        <button id="visionPackVerifyBtn" type="button" disabled>무결성 검사</button><button id="visionPackRemoveBtn" type="button" disabled>로컬 삭제</button>
      </div>
      <progress id="visionPackProgress" max="100" value="0" hidden></progress>
    </div>
  </details>
</div>
<script>
(() => {{
  const localValues = new Map();
  try {{ Object.defineProperty(window, 'localStorage', {{ configurable: true, value: {{ getItem(key) {{ return localValues.has(key) ? localValues.get(key) : null; }}, setItem(key, value) {{ localValues.set(key, String(value)); }}, removeItem(key) {{ localValues.delete(key); }} }} }}); }} catch (_) {{}}
  const stores = new Map();
  const normalize = key => {{ const url = new URL(typeof key === 'string' ? key : key.url, document.baseURI); url.search = ''; return url.toString(); }};
  Object.defineProperty(window, 'caches', {{ configurable: true, value: {{
    async open(name) {{
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return {{
        async put(key, response) {{ store.set(normalize(key), response.clone()); }},
        async match(key) {{ const value = store.get(normalize(key)); return value ? value.clone() : undefined; }},
        async delete(key) {{ return store.delete(normalize(key)); }}
      }};
    }}
  }} }});
  const digest = async (_algorithm, data) => {{
    const bytes = new Uint8Array(data);
    const words = new Uint32Array([2166136261,2246822507,3266489917,668265263,374761393,1274126177,2654435761,1597334677]);
    for (let i = 0; i < bytes.length; i += 1) {{
      for (let j = 0; j < words.length; j += 1) {{ words[j] = Math.imul(words[j] ^ (bytes[i] + i + j), 16777619 + j * 2); }}
    }}
    return words.buffer;
  }};
  try {{ Object.defineProperty(window.crypto, 'subtle', {{ configurable: true, value: {{ digest }} }}); }} catch (_) {{ Object.defineProperty(window, 'crypto', {{ configurable: true, value: {{ subtle: {{ digest }} }} }}); }}
  try {{ Object.defineProperty(navigator, 'serviceWorker', {{ configurable: true, value: {{ controller: {{ state: 'activated' }} }} }}); }} catch (_) {{}}
}})();
window.AIShortsRuntimeConfig={{VISION_MODEL_PACK_MAX_PACKS:3,VISION_MODEL_PACK_MAX_FILES:16,VISION_MODEL_PACK_MAX_BYTES:67108864,VISION_MODEL_PACK_MAX_FILE_BYTES:50331648}};window.AIShortsFeedbackUX={{toast(){{}}}};
</script>
<script>{MANAGER}</script><script>{ENGINE}</script><script>{PANEL}</script>
</body></html>'''


async def run_audit() -> dict:
    page_errors: list[str] = []
    console_errors: list[str] = []
    external_requests: list[str] = []
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
        context = await browser.new_context(viewport={'width': 1280, 'height': 960})
        page = await context.new_page()
        page.on('pageerror', lambda error: page_errors.append(str(error)))
        page.on('console', lambda message: console_errors.append(message.text) if message.type == 'error' else None)
        page.on('request', lambda request: external_requests.append(request.url) if not request.url.startswith('https://studio.test/') else None)

        async def route_handler(route):
            url = route.request.url
            if '/__ai_shorts_vision_pack__/' in url and 'vision_bundle.mjs' in url:
                await route.fulfill(status=200, headers={'Content-Type': 'text/javascript; charset=utf-8', 'Access-Control-Allow-Origin': '*'}, body=FAKE_MODULE)
            else:
                await route.fulfill(status=404, headers={'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*'}, body='not found')

        await page.route('https://studio.test/**', route_handler)
        await page.set_content(build_html(), wait_until='load', timeout=30000)
        await page.wait_for_function("() => Boolean(window.AIShortsVisionModelPacks && window.AIShortsSmartReframe && document.querySelector('#visionModelPackPanel'))", timeout=30000)
        initial = await page.evaluate("""() => ({
            controlled: Boolean(navigator.serviceWorker && navigator.serviceWorker.controller),
            packs: AIShortsVisionModelPacks.listPacks().length,
            active: AIShortsVisionModelPacks.snapshot().runtime.active,
            panelOpen: document.querySelector('#visionModelPackPanel').open,
            status: document.querySelector('#visionPackStatus').textContent.trim()
        })""")
        installed = await page.evaluate("""async () => {
            const moduleSource = 'export const placeholder = true;';
            const names = [
                'vision_wasm_internal.js', 'vision_wasm_internal.wasm',
                'vision_wasm_module_internal.js', 'vision_wasm_module_internal.wasm',
                'vision_wasm_nosimd_internal.js', 'vision_wasm_nosimd_internal.wasm'
            ];
            const files = [
                new File([moduleSource], 'vision_bundle.mjs', { type: 'text/javascript' }),
                ...names.map(name => new File([name.endsWith('.wasm') ? new Uint8Array([0,97,115,109,1,0,0,0]) : 'self.Module = self.Module || {};'], name, { type: name.endsWith('.wasm') ? 'application/wasm' : 'text/javascript' })),
                new File([new Uint8Array([1,2,3,4,5,6,7,8])], 'blaze_face_short_range.tflite', { type: 'application/octet-stream' }),
                new File([JSON.stringify({ name: '@mediapipe/tasks-vision', version: 'audit-1.0.0' })], 'package.json', { type: 'application/json' })
            ];
            const pack = await AIShortsVisionModelPacks.installFromFiles(files, { label: '감사 얼굴 감지' });
            await new Promise(resolve => setTimeout(resolve, 50));
            return {
                pack,
                packs: AIShortsVisionModelPacks.listPacks().length,
                selectValue: document.querySelector('#visionPackSelect').value,
                status: document.querySelector('#visionPackStatus').textContent.trim(),
                policy: AIShortsVisionModelPacks.snapshot().policy
            };
        }""")
        verified = await page.evaluate("""async (packId) => {
            const verification = await AIShortsVisionModelPacks.verifyPack(packId);
            return { verification, pack: AIShortsVisionModelPacks.findPack(packId) };
        }""", installed['pack']['id'])
        activated = await page.evaluate("""async (packId) => {
            const runtime = await AIShortsVisionModelPacks.activatePack(packId, { backend: 'cpu' });
            const provider = await AIShortsVisionModelPacks.ensureActiveProvider();
            const result = await provider.detect(document.createElement('canvas'), { time: 1.25 });
            await new Promise(resolve => setTimeout(resolve, 50));
            return {
                runtime,
                detections: result?.detections?.length || 0,
                delegate: globalThis.__visionAuditOptions?.baseOptions?.delegate || '',
                modelPath: globalThis.__visionAuditOptions?.baseOptions?.modelAssetPath || '',
                wasmRoot: globalThis.__visionAuditWasmRoot || '',
                status: document.querySelector('#visionPackStatus').textContent.trim(),
                activateHidden: document.querySelector('#visionPackActivateBtn').hidden,
                deactivateHidden: document.querySelector('#visionPackDeactivateBtn').hidden
            };
        }""", installed['pack']['id'])
        corrupted = await page.evaluate("""async (packId) => {
            const api = AIShortsVisionModelPacks;
            const cache = await caches.open(api._test.CACHE_NAME);
            const modelUrl = api.assetUrl(packId, 'models/blaze_face_short_range.tflite');
            await cache.put(modelUrl, new Response(new Uint8Array([9,9,9]), { headers: { 'Content-Type': 'application/octet-stream' } }));
            const verification = await api.verifyPack(packId);
            await new Promise(resolve => setTimeout(resolve, 50));
            return {
                verification,
                active: api.snapshot().runtime.active,
                packVerification: api.findPack(packId)?.verification || '',
                status: document.querySelector('#visionPackStatus').textContent.trim(),
                closed: globalThis.__visionAuditClosed || 0
            };
        }""", installed['pack']['id'])
        removed = await page.evaluate("""async (packId) => {
            const result = await AIShortsVisionModelPacks.removePack(packId);
            await new Promise(resolve => setTimeout(resolve, 50));
            return {
                result,
                packs: AIShortsVisionModelPacks.listPacks().length,
                status: document.querySelector('#visionPackStatus').textContent.trim(),
                selection: document.querySelector('#visionPackSelect').value
            };
        }""", installed['pack']['id'])
        await browser.close()

    checks = {
        'serviceWorkerControlContractPresent': initial['controlled'] is True,
        'startsWithoutPackOrActivation': initial['packs'] == 0 and initial['active'] is False and initial['panelOpen'] is False,
        'packInstallsAndRenders': installed['packs'] == 1 and installed['selectValue'] == installed['pack']['id'] and installed['pack']['fileCount'] == 9,
        'localOnlyPolicyVisible': installed['policy']['localFilesOnly'] is True and installed['policy']['remoteDownload'] is False,
        'sha256VerificationPasses': verified['verification']['ok'] is True and verified['pack']['verification'] == 'verified',
        'cachedModuleActivatesCpuDetector': activated['runtime']['active'] is True and activated['runtime']['backend'] == 'cpu' and activated['detections'] == 1 and activated['delegate'] == 'CPU',
        'syntheticModelAndWasmUrlsUsed': '/__ai_shorts_vision_pack__/' in activated['modelPath'] and '/__ai_shorts_vision_pack__/' in activated['wasmRoot'],
        'activeUiStateUpdates': '사용 중' in activated['status'] and activated['activateHidden'] is True and activated['deactivateHidden'] is False,
        'corruptionBlocksAndDeactivates': corrupted['verification']['ok'] is False and corrupted['active'] is False and corrupted['packVerification'] == 'failed' and corrupted['closed'] >= 1,
        'localRemovalClearsPack': removed['result']['removed'] is True and removed['packs'] == 0 and removed['selection'] == '',
        'noExternalRequests': not external_requests,
        'noPageErrors': not page_errors,
        'noConsoleErrors': not console_errors,
    }
    return {
        'version': VERSION,
        'generatedAt': dt.datetime.now(dt.timezone.utc).isoformat(),
        'harness': 'secure-origin route harness with Cache Storage, synthetic runtime module, install/verify/activate/corrupt/remove lifecycle; service-worker bridge is independently VM-audited',
        'initial': initial,
        'installed': installed,
        'verified': verified,
        'activated': activated,
        'corrupted': corrupted,
        'removed': removed,
        'checks': checks,
        'passed': all(checks.values()),
        'pageErrors': page_errors,
        'consoleErrors': console_errors,
        'externalRequests': external_requests,
    }


async def main() -> None:
    report = await run_audit()
    OUTPUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(OUTPUT)
    print(json.dumps(report['checks'], ensure_ascii=False, indent=2))
    if not report['passed']:
        raise SystemExit(1)


if __name__ == '__main__':
    asyncio.run(main())
