#!/usr/bin/env python3
"""Dedicated browser audit for the v1.6.2 user-safe storage diagnostics gate."""
import asyncio
import json
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]
VERSION = json.loads((ROOT / 'package.json').read_text(encoding='utf-8'))['version']
OUTPUT = ROOT / 'qa' / f'runtime-storage-health-browser-v{VERSION}.json'

CSS = (ROOT / 'assets/css/storage-health-panel.css').read_text(encoding='utf-8')
PANEL = (ROOT / 'src/ui/storage-health-panel.js').read_text(encoding='utf-8').replace('</script>', '<\\/script>')

MOCKS = r'''
window.__storageSnapshot={usage:8.5*1024*1024,quota:10*1024*1024,ratio:.85,level:'normal',localStorageBytes:190*1024,cacheCount:1};
window.__clearCalls=0;
window.__cleanupCalls=0;
window.__policyRefreshCalls=0;
window.__attentionEvents=0;
document.addEventListener('ai-shorts-storage-attention',()=>{window.__attentionEvents+=1;});
window.AIShortsRuntimeConfig={SESSION_SCHEMA_VERSION:4,ANALYSIS_CACHE_CONTRACT_VERSION:3,SW_INTEGRITY_AUDIT_SAMPLE_SIZE:12};
window.AIShortsFeedbackUX={toast(){}};
window.AIShortsStorageManager={
  estimate:async()=>{await new Promise(resolve=>setTimeout(resolve,120));return {...window.__storageSnapshot};},
  status:()=>({...window.__storageSnapshot}),
  cleanup:async()=>{window.__cleanupCalls+=1;return {snapshot:{...window.__storageSnapshot},local:{removedCount:1},caches:{removedCount:0}};}
};
window.AIShortsSessionContinuity={getStatus:()=>({schemaVersion:4,backupCount:2,backupLimit:3,storageKey:'current-session',compressedBackupCount:1,backupSavingsPercent:40})};
const normalReport={requiredMissing:[],repaired:[],repairFailed:[],rollbackPreserved:[],failed:0,contentVerified:true,integrity:{missing:[],invalid:[],corrupted:[],hashVerified:123,healthy:123}};
window.AIShortsServiceWorkerRegistration={
  getStatus:()=>({supported:true,registered:true,controlled:true,installReport:normalReport,update:{state:'idle'},repair:{state:'idle'},integrityAudit:{state:'idle'}}),
  requestInstallReport(){},
  repairCache:async()=>({report:normalReport}),
  requestIntegrityAudit:async()=>({report:{periodicIntegrity:{checked:12,failed:0,repaired:0}}}),
  retryFailedIntegrityAssets:async()=>({repaired:0,failed:0}),
  clearIntegrityAuditHistory:async()=>({clearedHistory:0}),
  exportIntegrityDiagnostics:()=>({saved:true,historyCount:0})
};
const snapshot={
 entries:[{token:'entry-token',bytes:2048,tier:'balanced',contractVersion:'3',lastAccessAt:'2026-07-24T00:00:00Z'}],
 namespaceStatus:{current:{count:1,bytes:2048},legacy:[{token:'legacy-token',count:1,bytes:1024,contractVersions:['2'],lastAccessAt:'2026-07-23T00:00:00Z'}],legacyNamespaceCount:1,legacyItems:1,legacyBytes:1024},
 maintenanceHistory:[{operation:'automatic-prune',removed:1,bytes:512,at:'2026-07-24T00:00:00Z'}],
 optionSignatures:{groups:[{token:'signature-token',count:1,bytes:2048}]},
 storageTrend:[{at:'2026-07-24T00:00:00Z',totalItems:2,totalBytes:3072,currentBytes:2048,legacyBytes:1024}]
};
window.AIShortsEngineKernel={
 getHealthReport:()=>({cache:{size:1,limit:4,hitRate:50,fingerprint:{lastMode:'sampled',lastMs:5},persistent:{enabled:true,size:1,effectiveMaxItems:8,quotaLevel:'normal',legacyNamespaceCount:1,legacyItems:1}}}),
 refreshPersistentAnalysisCachePolicy:async()=>{window.__policyRefreshCalls+=1;return snapshot;},
 getPersistentAnalysisCacheMaintenanceSnapshot:async()=>snapshot,
 listPersistentAnalysisCacheEntries:async()=>snapshot.entries,
 getPersistentAnalysisCacheNamespaceStatus:async()=>snapshot.namespaceStatus,
 getAnalysisCacheMaintenanceHistory:()=>snapshot.maintenanceHistory,
 exportAnalysisCacheDiagnostics:()=>({saved:true,eventCount:1}),
 clearAnalysisCache:async()=>{window.__clearCalls+=1;return {size:0};},
 invalidateAnalysisCache:async()=>({removed:1,bytes:2048}),
 deletePersistentAnalysisCacheEntries:async()=>({removed:1,bytes:2048}),
 deletePersistentAnalysisCacheNamespaces:async()=>({removed:1,removedNamespaces:1,bytes:1024})
};
'''

BASE_STYLE = r'''
:root{--line:#334155;--panel:#111827;--panel-strong:#111827;--surface:#0f172a;--text:#e2e8f0;--muted:#94a3b8;--accent-2:#60a5fa;color-scheme:dark}
*{box-sizing:border-box}body{margin:0;min-height:100vh;background:#090b12;color:var(--text);font-family:system-ui,sans-serif}.start-command-panel{height:80px;margin:20px;border:1px solid var(--line);border-radius:18px}.studio-grid{min-height:1400px;margin:20px;border:1px solid rgba(51,65,85,.35);border-radius:18px}button,select{font:inherit}button{border:1px solid var(--line);border-radius:10px;padding:8px 12px;background:#182235;color:var(--text)}
'''


def build_html():
    return f'''<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>{BASE_STYLE}\n{CSS}</style></head><body><div class="app-shell"><div class="start-command-panel"></div><main id="studioGrid" class="studio-grid"></main></div><script>{MOCKS}</script><script>{PANEL}</script></body></html>'''


async def run_mode(browser, name, viewport):
    context = await browser.new_context(viewport=viewport)
    page = await context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    await page.set_content(build_html(), wait_until='load', timeout=30000)
    await page.wait_for_selector('#storageHealthPanel', state='visible', timeout=10000)
    initial = await page.evaluate('''() => {
      const root=document.querySelector('#storageHealthPanel');
      const advanced=document.querySelector('#storageAdvancedDialog');
      const auto=document.querySelector('#storageHealthAutoRepairBtn');
      const r=root.getBoundingClientRect();
      return {text:root.innerText,height:r.height,width:r.width,top:r.top,advancedHidden:advanced.hidden,autoRepairHidden:auto.hidden,atPageEnd:root.parentElement.classList.contains('app-shell')&&root.previousElementSibling&&root.previousElementSibling.id==='studioGrid',overflow:document.documentElement.scrollWidth-innerWidth};
    }''')

    await page.click('#storageAdvancedOpenBtn')
    await page.wait_for_selector('#storageAdvancedDialog', state='visible', timeout=10000)
    await page.wait_for_function('window.__policyRefreshCalls === 1', timeout=10000)
    await page.wait_for_function("document.querySelector('#storageHealthStatusPill').textContent === '정상'", timeout=10000)

    advanced = await page.evaluate('''() => {
      const dialog=document.querySelector('#storageAdvancedDialog');
      const panel=dialog.querySelector('.storage-diagnostics-panel');
      const r=panel.getBoundingClientRect();
      return {hidden:dialog.hidden,width:r.width,height:r.height,bodyLocked:document.body.classList.contains('storage-diagnostics-open'),technical:Boolean(document.querySelector('#analysisCacheNamespaceSelect')&&document.querySelector('#analysisCacheSignatureSelect')&&document.querySelector('#storageIntegrityAuditBtn')),policyRefreshCalls:window.__policyRefreshCalls,overflow:document.documentElement.scrollWidth-innerWidth};
    }''')

    await page.evaluate("document.querySelector('.storage-diagnostics-disclosure').open = true")
    await page.click('#analysisCacheCleanupBtn')
    confirmation_before_cancel = await page.evaluate('''() => ({visible:!document.querySelector('#storageConfirmDialog').hidden,clearCalls:window.__clearCalls,safety:document.querySelector('.storage-confirm-safety').innerText})''')
    await page.click('#storageConfirmCancelBtn')
    confirmation_after_cancel = await page.evaluate('''() => ({hidden:document.querySelector('#storageConfirmDialog').hidden,clearCalls:window.__clearCalls})''')

    await page.click('#analysisCacheCleanupBtn')
    await page.click('#storageConfirmAcceptBtn')
    await page.wait_for_function('window.__clearCalls === 1', timeout=10000)
    confirmation_after_accept = await page.evaluate('''() => ({hidden:document.querySelector('#storageConfirmDialog').hidden,clearCalls:window.__clearCalls})''')

    await page.keyboard.press('Escape')
    closed = await page.evaluate('''() => ({advancedHidden:document.querySelector('#storageAdvancedDialog').hidden,bodyLocked:document.body.classList.contains('storage-diagnostics-open')})''')

    await page.evaluate('window.scrollTo(0,0)')
    warning = await page.evaluate('''() => { window.__storageSnapshot={usage:9.5*1024*1024,quota:10*1024*1024,ratio:.95,level:'critical',localStorageBytes:190*1024,cacheCount:1}; AIShortsStorageHealthPanel.render(window.__storageSnapshot); const b=document.querySelector('#storageHealthAutoRepairBtn'); return {hidden:b.hidden,label:b.textContent,title:document.querySelector('#storageHealthTitle').textContent}; }''')
    await page.wait_for_function("document.querySelector('#storageHealthPanel').dataset.attention === 'true' && window.__attentionEvents === 1 && window.scrollY > 0", timeout=10000)
    navigation = await page.evaluate('''() => ({scrollY:window.scrollY,attention:document.querySelector('#storageHealthPanel').dataset.attention,events:window.__attentionEvents,focused:document.activeElement&&document.activeElement.id==='storageHealthPanel'})''')
    await context.close()
    return {
        'name': name,
        'viewport': viewport,
        'initial': initial,
        'advanced': advanced,
        'confirmationBeforeCancel': confirmation_before_cancel,
        'confirmationAfterCancel': confirmation_after_cancel,
        'confirmationAfterAccept': confirmation_after_accept,
        'warning': warning,
        'navigation': navigation,
        'closed': closed,
        'errors': errors,
    }


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
        desktop = await run_mode(browser, 'desktop', {'width': 1366, 'height': 768})
        mobile = await run_mode(browser, 'mobile', {'width': 390, 'height': 844})
        await browser.close()
    report = {'version': VERSION, 'desktop': desktop, 'mobile': mobile}
    OUTPUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(OUTPUT)


if __name__ == '__main__':
    asyncio.run(main())
