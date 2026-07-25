#!/usr/bin/env python3
"""Chromium audit for local vision model-pack benchmark, recommendation, and rollback."""
from __future__ import annotations

import asyncio
import datetime as dt
import json
from pathlib import Path

from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]
VERSION = json.loads((ROOT / 'package.json').read_text(encoding='utf-8'))['version']
OUTPUT = ROOT / 'qa' / f'runtime-vision-model-pack-performance-v{VERSION}.json'
MANAGER = (ROOT / 'src/vision/vision-model-pack-manager.js').read_text(encoding='utf-8').replace('</script>', '<\\/script>')
PANEL = (ROOT / 'src/ui/vision-model-pack-panel.js').read_text(encoding='utf-8').replace('</script>', '<\\/script>')
CSS = (ROOT / 'assets/css/smart-reframe.css').read_text(encoding='utf-8')

FAKE_MODULE = r'''
export const FilesetResolver = { async forVisionTasks(root) { return { root }; } };
export const FaceDetector = {
  async createFromOptions(_fileset, options) {
    const modelPath = String(options?.baseOptions?.modelAssetPath || '');
    if (globalThis.__failVisionPackId && modelPath.includes(globalThis.__failVisionPackId)) throw new Error('synthetic delegate startup failure');
    const gpu = options?.baseOptions?.delegate === 'GPU';
    return {
      detectForVideo() {
        const duration = gpu ? 2 : 7;
        const end = performance.now() + duration;
        while (performance.now() < end) {}
        return { detections: [] };
      },
      close() { globalThis.__visionPerfClosed = (globalThis.__visionPerfClosed || 0) + 1; }
    };
  }
};
'''


def html() -> str:
    return f'''<!doctype html><html lang="ko"><head><meta charset="utf-8"><base href="https://studio.test/"><style>{CSS}</style></head><body>
<details id="visionModelPackPanel" class="vision-model-pack-panel" open><summary>브라우저 얼굴 감지 모델</summary><div class="vision-model-pack-body">
<div class="vision-model-pack-status"><strong id="visionPackStatus"></strong><small id="visionPackDetail"></small></div>
<div class="vision-model-pack-controls"><label><span>팩</span><select id="visionPackSelect"><option value=""></option></select></label><label><span>실행</span><select id="visionPackBackend"><option value="auto">자동</option><option value="gpu">GPU</option><option value="cpu">CPU</option></select></label></div>
<div class="vision-model-pack-actions"><button id="visionPackInstallBtn"></button><input id="visionPackFolderInput" type="file" multiple hidden><button id="visionPackActivateBtn"></button><button id="visionPackDeactivateBtn" hidden></button><button id="visionPackVerifyBtn"></button><button id="visionPackBenchmarkBtn">측정</button><button id="visionPackRollbackBtn" hidden>복구</button><button id="visionPackRemoveBtn"></button></div>
<div class="vision-model-pack-diagnostics"><strong id="visionPackRecommendation" data-backend="auto"></strong><small id="visionPackBenchmarkDetail"></small></div><progress id="visionPackProgress" max="100" value="0" hidden></progress></div></details>
<script>
const values = new Map(); Object.defineProperty(window,'localStorage',{{value:{{getItem:k=>values.has(k)?values.get(k):null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)}}}});
const digest=async(_algorithm,data)=>{{const bytes=new Uint8Array(data);const words=new Uint32Array([2166136261,2246822507,3266489917,668265263,374761393,1274126177,2654435761,1597334677]);for(let i=0;i<bytes.length;i+=1)for(let j=0;j<words.length;j+=1)words[j]=Math.imul(words[j]^(bytes[i]+i+j),16777619+j*2);return words.buffer;}};
try{{Object.defineProperty(window.crypto,'subtle',{{configurable:true,value:{{digest}}}})}}catch(_){{Object.defineProperty(window,'crypto',{{configurable:true,value:{{subtle:{{digest}}}}}})}}
const stores=new Map(); const normalize=k=>{{const u=new URL(typeof k==='string'?k:k.url,document.baseURI);u.search='';return u.toString();}};
Object.defineProperty(window,'caches',{{value:{{async open(n){{if(!stores.has(n))stores.set(n,new Map());const s=stores.get(n);return{{async put(k,r){{s.set(normalize(k),r.clone())}},async match(k){{const r=s.get(normalize(k));return r?r.clone():undefined}},async delete(k){{return s.delete(normalize(k))}}}}}}}}}});
Object.defineProperty(navigator,'serviceWorker',{{value:{{controller:{{state:'activated'}}}}}});
window.AIShortsRuntimeConfig={{VISION_MODEL_PACK_BENCHMARK_ITERATIONS:4}}; window.AIShortsFeedbackUX={{toast(){{}}}}; window.AIShortsSmartReframe={{registerDetectorProvider(){{}}}};
</script><script>{MANAGER}</script><script>{PANEL}</script></body></html>'''


async def run() -> dict:
    page_errors=[]; console_errors=[]; external=[]
    async with async_playwright() as p:
        browser=await p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
        page=await browser.new_page(viewport={'width':1100,'height':850})
        page.on('pageerror', lambda e: page_errors.append(str(e)))
        page.on('console', lambda m: console_errors.append(m.text) if m.type=='error' else None)
        page.on('request', lambda r: external.append(r.url) if not r.url.startswith('https://studio.test/') else None)
        async def route(route):
            if 'vision_bundle.mjs' in route.request.url:
                await route.fulfill(status=200, headers={'Content-Type':'text/javascript','Access-Control-Allow-Origin':'*'}, body=FAKE_MODULE)
            else:
                await route.fulfill(status=404, body='not found')
        await page.route('https://studio.test/**', route)
        await page.set_content(html(), wait_until='load')
        await page.wait_for_function('() => Boolean(window.AIShortsVisionModelPacks && window.AIShortsVisionModelPackPanel)')
        result=await page.evaluate('''async () => {
          const api=AIShortsVisionModelPacks;
          const runtime=['vision_wasm_internal.js','vision_wasm_internal.wasm','vision_wasm_module_internal.js','vision_wasm_module_internal.wasm','vision_wasm_nosimd_internal.js','vision_wasm_nosimd_internal.wasm'];
          const makeFiles=(seed,model)=>[new File(['export const x=1'], 'vision_bundle.mjs'),...runtime.map(n=>new File([seed+n],n)),new File([seed+model],model)];
          const oldPack=await api.installFromFiles(makeFiles('old','face_detector.task'),{label:'이전 모델'});
          const runtimeModule=await import(api.assetUrl(oldPack.id,'vision_bundle.mjs')+'?audit=benchmark');
          const bench=await api.benchmarkPack(oldPack.id,{backends:['gpu','cpu'],iterations:4,warmup:1,runtimeModule});
          await new Promise(r=>setTimeout(r,50));
          const uiAfterBench={recommendation:document.querySelector('#visionPackRecommendation').textContent.trim(),backend:document.querySelector('#visionPackRecommendation').dataset.backend,detail:document.querySelector('#visionPackBenchmarkDetail').textContent.trim()};
          await api.activatePack(oldPack.id,{backend:'cpu'});
          const newPack=await api.installFromFiles(makeFiles('new','blaze_face.task'),{label:'새 모델'});
          globalThis.__failVisionPackId=newPack.id;
          const recovered=await api.activatePack(newPack.id,{backend:'gpu'});
          await new Promise(r=>setTimeout(r,50));
          const afterAuto={recovered,active:api.snapshot().runtime,rollback:api.snapshot().rollback,buttonHidden:document.querySelector('#visionPackRollbackBtn').hidden};
          globalThis.__failVisionPackId='';
          await api.activatePack(newPack.id,{backend:'gpu'});
          const manual=await api.rollbackToPrevious();
          await new Promise(r=>setTimeout(r,50));
          return {oldPack,newPack,bench,uiAfterBench,afterAuto,manual,final:api.snapshot(),closed:globalThis.__visionPerfClosed||0};
        }''')
        await browser.close()
    checks={
      'gpuAndCpuBenchmarked': len(result['bench']['results'])==2 and all(x['status']=='passed' for x in result['bench']['results']),
      'gpuRecommended': result['bench']['recommendation']['backend']=='gpu',
      'recommendationRendered': result['uiAfterBench']['backend']=='gpu' and 'GPU' in result['uiAfterBench']['recommendation'] and 'ms' in result['uiAfterBench']['detail'],
      'automaticRollback': result['afterAuto']['recovered']['recovered'] is True and result['afterAuto']['active']['packId']==result['oldPack']['id'],
      'rollbackButtonVisible': result['afterAuto']['buttonHidden'] is False,
      'manualRollback': result['manual']['packId']==result['oldPack']['id'] and result['manual']['recovered'] is True,
      'undoTargetPreserved': result['final']['rollback']['packId']==result['newPack']['id'],
      'detectorsClosed': result['closed'] >= 3,
      'noExternalRequests': not external,
      'noPageErrors': not page_errors,
      'noConsoleErrors': not console_errors,
    }
    return {'version':VERSION,'generatedAt':dt.datetime.now(dt.timezone.utc).isoformat(),'passed':all(checks.values()),'checks':checks,'result':result,'pageErrors':page_errors,'consoleErrors':console_errors,'externalRequests':external}


async def main():
    report=await run(); OUTPUT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8'); print(OUTPUT); print(json.dumps(report['checks'],ensure_ascii=False,indent=2));
    if not report['passed']: raise SystemExit(1)

if __name__=='__main__': asyncio.run(main())
