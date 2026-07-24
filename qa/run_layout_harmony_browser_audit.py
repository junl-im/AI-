#!/usr/bin/env python3
"""Browser layout audit for v1.6.2 footer health placement and Local AI workflow alignment."""
import asyncio
import json
import re
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]
VERSION = json.loads((ROOT / 'package.json').read_text(encoding='utf-8'))['version']
OUTPUT = ROOT / 'qa' / f'runtime-layout-harmony-browser-v{VERSION}.json'


def build_html():
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    html = re.sub(r'<meta[^>]+Content-Security-Policy[^>]*>', '', html, flags=re.I)

    def inline_css(match):
        rel = match.group(1).split('?', 1)[0]
        path = ROOT / rel
        return f'<style data-source="{rel}">{path.read_text(encoding="utf-8")}</style>' if path.exists() else ''

    html = re.sub(r'<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"[^>]*/?>', inline_css, html)
    html = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.I | re.S)
    html = html.replace('</main>', '''</main>
<section id="storageHealthPanel" class="storage-health-panel" data-level="normal" data-issue="none" data-location="footer" aria-label="페이지 하단 저장 공간과 오프라인 사용 상태">
  <div class="storage-health-copy"><span class="storage-health-icon"></span><div><strong>오프라인 사용 준비 완료</strong><small>저장 공간과 자동 백업이 정상 범위입니다.</small></div></div>
  <div class="storage-health-user-state"><span class="storage-health-status-pill" data-state="healthy">정상</span><span class="storage-health-usage"><small>저장 공간</small><strong>15MB / 10.0GB · 0%</strong></span></div>
  <div class="storage-health-summary-actions"><button class="storage-advanced-open" type="button">고급 진단</button></div>
</section>''', 1)
    return html


async def visible_rect(page, selector):
    return await page.eval_on_selector(selector, """el => { const r=el.getBoundingClientRect(); const cs=getComputedStyle(el); return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height,display:cs.display,visibility:cs.visibility,visible:cs.display!=='none'&&cs.visibility!=='hidden'&&r.width>0&&r.height>0}; }""")


async def run_mode(browser, name, viewport):
    page = await browser.new_page(viewport=viewport)
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    await page.set_content(build_html(), wait_until='load', timeout=30000)
    await page.wait_for_timeout(250)

    grid = await visible_rect(page, '#studioGrid')
    ai_closed = await visible_rect(page, '#localAIStudio')
    utility = await visible_rect(page, '.project-copy-hub')
    import_panel = await visible_rect(page, '[data-flow-panel="file"]')
    storage = await visible_rect(page, '#storageHealthPanel')
    footer_relation = await page.evaluate("""() => { const storage=document.querySelector('#storageHealthPanel'); const main=document.querySelector('#studioGrid'); return {afterMain:Boolean(storage&&main&&storage.compareDocumentPosition(main)&Node.DOCUMENT_POSITION_PRECEDING), previousTag:storage?.previousElementSibling?.tagName||'', parentClass:storage?.parentElement?.className||''}; }""")
    collapsed = await page.evaluate("""() => ({open:document.querySelector('#localAIStudio').open, overflow:document.documentElement.scrollWidth-innerWidth, summaryText:document.querySelector('.local-ai-summary').innerText.trim()})""")

    await page.click('#localAIStudio > summary')
    await page.wait_for_timeout(80)
    ai_open = await visible_rect(page, '#localAIStudio')
    workbench = await visible_rect(page, '.local-ai-workbench')
    opened = await page.evaluate("""() => ({open:document.querySelector('#localAIStudio').open, overflow:document.documentElement.scrollWidth-innerWidth})""")

    focus_visibility = None
    if name == 'desktop':
        focus_visibility = await page.evaluate("""() => { const body=document.body; const panel=document.querySelector('#localAIStudio'); const visible=()=>{const r=panel.getBoundingClientRect();const cs=getComputedStyle(panel);return cs.display!=='none'&&r.width>0&&r.height>0}; body.dataset.workspaceView='preview'; const preview=visible(); body.dataset.workspaceView='waveform'; const waveform=visible(); delete body.dataset.workspaceView; return {preview,waveform}; }""")

    await page.close()
    return {
        'name': name,
        'viewport': viewport,
        'grid': grid,
        'utility': utility,
        'importPanel': import_panel,
        'aiClosed': ai_closed,
        'aiOpen': ai_open,
        'workbench': workbench,
        'storage': storage,
        'footerRelation': footer_relation,
        'collapsed': collapsed,
        'opened': opened,
        'focusVisibility': focus_visibility,
        'errors': errors,
    }


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
        desktop = await run_mode(browser, 'desktop', {'width': 1440, 'height': 1000})
        mobile = await run_mode(browser, 'mobile', {'width': 390, 'height': 844})
        await browser.close()
    OUTPUT.write_text(json.dumps({'version': VERSION, 'desktop': desktop, 'mobile': mobile}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(OUTPUT)


if __name__ == '__main__':
    asyncio.run(main())
