#!/usr/bin/env python3
"""Chromium responsive/runtime audit for AI Shorts Studio v1.4.0."""
import asyncio
import json
import re
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'qa' / 'runtime-browser-audit-v1.4.0.json'

INSTRUMENT = r'''<script>
window.__aiAudit={errors:[],rejections:[],consoleErrors:[],raf:0,mutations:0};
window.addEventListener('error',e=>window.__aiAudit.errors.push(String(e.message||e.error||'error')));
window.addEventListener('unhandledrejection',e=>window.__aiAudit.rejections.push(String(e.reason&&e.reason.message||e.reason||'rejection')));
const __raf=window.requestAnimationFrame.bind(window);
window.requestAnimationFrame=function(cb){window.__aiAudit.raf+=1;return __raf(cb);};
const __MO=window.MutationObserver;
window.MutationObserver=class extends __MO{constructor(cb){super((records,obs)=>{window.__aiAudit.mutations+=1;cb(records,obs);});}};
</script>'''


def build_inline_html():
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    html = re.sub(r'<meta[^>]+Content-Security-Policy[^>]*>', '', html, flags=re.I)
    html = html.replace('<head>', '<head>' + INSTRUMENT, 1)

    def inline_css(match):
        rel = match.group(1).split('?', 1)[0]
        path = ROOT / rel
        return f'<style data-source="{rel}">{path.read_text(encoding="utf-8")}</style>' if path.exists() else ''

    def inline_js(match):
        rel = match.group(1).split('?', 1)[0]
        if rel.endswith('staged-ui-loader.js'):
            return ''
        path = ROOT / rel
        content = path.read_text(encoding='utf-8').replace('</script>', '<\\/script>')
        return f'<script data-source="{rel}">{content}</script>' if path.exists() else ''

    html = re.sub(r'<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"[^>]*/?>', inline_css, html)
    html = re.sub(r'<script[^>]+src="([^"]+)"[^>]*></script>', inline_js, html)
    staged = [
        'src/ui/ux-controls.js', 'src/ui/hyperconnect-flow.js', 'src/ui/flow-polish.js',
        'src/ui/flow-hotfix.js', 'src/ui/flow-integrity.js', 'src/ui/flow-doctor.js',
        'src/ui/flow-quality-gate.js', 'src/ui/workspace-comfort.js', 'src/ui/session-continuity.js',
        'src/ui/range-drag-controls.js', 'src/ui/handoff-coach.js', 'src/ui/save-readiness.js',
        'src/ui/render-quality-planner.js', 'src/ui/candidate-preview-pro.js',
        'src/ui/candidate-pin-board.js', 'src/ui/export-finish-center.js'
    ]
    scripts = ''.join(
        '<script data-source="{0}">{1}</script>'.format(
            rel, (ROOT / rel).read_text(encoding='utf-8').replace('</script>', '<\\/script>')
        ) for rel in staged
    )
    return html.replace('</head>', scripts + '</head>')


async def rect(page, selector):
    return await page.eval_on_selector(selector, "el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}}")


async def collect_stage(page):
    return await page.evaluate("""() => {
      const panel=document.querySelector('[data-flow-panel].is-stage-current');
      return panel ? {
        panel: panel.getAttribute('data-flow-panel'),
        stageKey: panel.dataset.stageKey || '',
        current: panel.classList.contains('is-stage-current'),
        landing: panel.classList.contains('is-stage-landing'),
        rail: Boolean(panel.querySelector(':scope > .stage-neon-rail')),
        chip: panel.querySelector(':scope > .stage-progress-chip')?.textContent?.trim() || ''
      } : null;
    }""")


async def audit_mode(browser, mode, viewport):
    context = await browser.new_context(viewport=viewport)
    page = await context.new_page()
    console_errors = []
    page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)
    await page.set_content(build_inline_html(), wait_until='load', timeout=30000)
    await page.wait_for_timeout(1600)
    first = await page.evaluate("() => ({...window.__aiAudit, consoleErrors: []})")
    first['consoleErrors'] = list(console_errors)
    await page.wait_for_timeout(1200)
    final_audit = await page.evaluate("() => ({...window.__aiAudit, consoleErrors: []})")
    final_audit['consoleErrors'] = list(console_errors)

    tabs = await page.evaluate("""() => [...document.querySelectorAll('[data-flow-tab]')].map(el=>{
      const r=el.getBoundingClientRect(); const cs=getComputedStyle(el);
      return {tab:el.getAttribute('data-flow-tab'),visible:cs.display!=='none'&&cs.visibility!=='hidden'&&r.width>0&&r.height>0,priority:el.dataset.mobilePriority||'',rect:{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
    })""")
    mobile_menu = await page.evaluate("""() => ({
      controller:document.body.dataset.mobileMenuController||'',
      mode:document.body.dataset.mobileMenuMode||'',
      guide:document.querySelector('#mobileDockGuideText')?.textContent?.trim()||'',
      toggleVisible:Boolean(document.querySelector('#mobileDockMenuToggle')&&getComputedStyle(document.querySelector('#mobileDockMenuToggle')).display!=='none'),
      expanded:document.querySelector('#mobileDockMenuToggle')?.getAttribute('aria-expanded')||'false'
    })""")
    expanded_tabs = []
    if mode == 'mobile':
        await page.click('#mobileDockMenuToggle')
        await page.wait_for_timeout(80)
        expanded_tabs = await page.evaluate("""() => [...document.querySelectorAll('[data-flow-tab]')].map(el=>{const r=el.getBoundingClientRect();const cs=getComputedStyle(el);return {tab:el.dataset.flowTab,visible:cs.display!=='none'&&cs.visibility!=='hidden'&&r.width>0&&r.height>0};})""")
    initial_stage = await collect_stage(page)
    await page.evaluate("() => AIShortsFlowDirectorFinal.setActive('recommend',{force:true,source:'runtime-audit'})")
    await page.wait_for_timeout(80)
    landing = await collect_stage(page)
    await page.wait_for_timeout(1000)
    stage = await collect_stage(page)

    dock_rect = await rect(page, '#bottomDock')
    dock_sizes = await page.evaluate("() => {const el=document.querySelector('.bottom-dock-tabs');return {scrollWidth:el.scrollWidth,clientWidth:el.clientWidth}}")
    workspace = await page.evaluate("""() => {
      const t=document.querySelector('#workspaceLayoutToolbar'); const ds=[...document.querySelectorAll('[data-workspace-divider]')];
      const cs=t?getComputedStyle(t):null;
      return {mode:document.body.dataset.workspaceMode||AIShortsWorkspaceLayout?.getMode?.()||'balanced',ready:document.body.dataset.workspaceLayout||'',toolbarVisible:Boolean(t&&cs.display!=='none'&&t.getBoundingClientRect().width>0),dividerVisible:ds.map(d=>getComputedStyle(d).display!=='none'&&d.getBoundingClientRect().width>0),weights:AIShortsWorkspaceLayout?.getWeights?.()||{},toolbar:t?(()=>{const r=t.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}})():null};
    }""")

    workspace_tests = {}
    if mode == 'desktop':
        before = await page.evaluate("() => JSON.stringify(AIShortsWorkspaceLayout.getWeights())")
        await page.focus('[data-workspace-divider="left"]')
        await page.keyboard.press('ArrowRight')
        after = await page.evaluate("() => JSON.stringify(AIShortsWorkspaceLayout.getWeights())")
        workspace_tests['keyboardResizeChanged'] = before != after
        workspace_tests['savedLayoutStorageAccessible'] = await page.evaluate("""() => {try{localStorage.setItem('__audit','1');localStorage.removeItem('__audit');return true;}catch(e){return false;}}""")
        await page.evaluate("() => AIShortsWorkspaceLayout.setMode('preview',{navigate:false})")
        await page.wait_for_timeout(120)
        workspace_tests['preview'] = await page.evaluate("""() => {const p=document.querySelector('[data-flow-panel~="preview"]');const r=p.getBoundingClientRect();return {mode:AIShortsWorkspaceLayout.getMode(),visible:getComputedStyle(p).display!=='none'&&r.width>0,width:r.width,height:r.height};}""")
        await page.evaluate("() => AIShortsWorkspaceLayout.setMode('waveform',{navigate:false})")
        await page.wait_for_timeout(120)
        workspace_tests['waveform'] = await page.evaluate("""() => {const p=document.querySelector('[data-flow-panel~="waveform"]');const r=p.getBoundingClientRect();return {mode:AIShortsWorkspaceLayout.getMode(),visible:getComputedStyle(p).display!=='none'&&r.width>0,width:r.width,height:r.height};}""")
        await page.evaluate("() => AIShortsWorkspaceLayout.setMode('balanced',{navigate:false})")
    else:
        workspace_tests['mobileControlsHidden'] = not workspace['toolbarVisible'] and not any(workspace['dividerVisible'])

    result = await page.evaluate("""() => ({
      ready:document.readyState,bodyBuild:document.body.dataset.build||'',activeFlow:document.body.dataset.activeFlowTab||'',navigationFocus:document.body.dataset.navigationFocus||'',
      operations:AIShortsOperationCoordinator.snapshot(),runtimeHealth:AIShortsRuntimeHealth.collect(),
      viewport:{width:innerWidth,height:innerHeight},bodyScrollWidth:document.body.scrollWidth,htmlScrollWidth:document.documentElement.scrollWidth
    })""")
    result.update({
        'stage': stage or initial_stage,
        'landing': landing,
        'audit': final_audit,
        'auditAtFirstSample': first,
        'dock': dock_rect,
        'dockScrollWidth': dock_sizes['scrollWidth'],
        'dockClientWidth': dock_sizes['clientWidth'],
        'tabs': tabs,
        'expandedTabs': expanded_tabs,
        'mobileMenu': mobile_menu,
        'workspace': workspace,
        'workspaceTests': workspace_tests,
    })
    await context.close()
    return result


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
        report = {
            'version': '1.4.0',
            'desktop': await audit_mode(browser, 'desktop', {'width': 1366, 'height': 768}),
            'mobile': await audit_mode(browser, 'mobile', {'width': 390, 'height': 844}),
        }
        await browser.close()
    OUTPUT.write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(OUTPUT)

if __name__ == '__main__':
    asyncio.run(main())
