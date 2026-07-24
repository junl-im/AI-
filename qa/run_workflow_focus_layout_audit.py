#!/usr/bin/env python3
"""Browser audit for v1.6.3 stage-aware workspace focus and measured dock clearance."""
import asyncio
import importlib.util
import json
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]
VERSION = json.loads((ROOT / 'package.json').read_text(encoding='utf-8'))['version']
OUTPUT = ROOT / 'qa' / f'runtime-workflow-focus-layout-v{VERSION}.json'


def build_html():
    spec = importlib.util.spec_from_file_location('runtime_browser_audit', ROOT / 'qa' / 'run_browser_audit.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.build_inline_html()


async def desktop_audit(browser):
    page = await browser.new_page(viewport={'width': 1440, 'height': 1000})
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    await page.set_content(build_html(), wait_until='load', timeout=30000)
    await page.wait_for_timeout(1200)

    initial = await page.evaluate('''() => {
      const visible = [...document.querySelectorAll('[data-flow-panel]')].filter(el => getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().height > 0);
      const dock = document.querySelector('#bottomDock').getBoundingClientRect();
      const root = getComputedStyle(document.documentElement);
      return {
        state: AIShortsWorkflowFocusLayout.getState(),
        active: document.body.dataset.activeFlowTab,
        visible: visible.map(el => ({ panel: el.dataset.flowPanel, priority: el.dataset.workflowPriority, height: Math.round(el.getBoundingClientRect().height) })),
        badge: document.querySelector('#workflowFocusBadge').textContent.trim(),
        status: document.querySelector('#workspaceLayoutStatus').textContent.trim(),
        dockHeight: Math.round(dock.height),
        dockVariable: parseFloat(root.getPropertyValue('--hyperflow-dock-height')),
        clearance: parseFloat(root.getPropertyValue('--workflow-dock-clearance')),
        overflow: document.documentElement.scrollWidth - innerWidth,
        auxiliary: {
          utility: getComputedStyle(document.querySelector('.project-copy-hub')).display,
          ai: getComputedStyle(document.querySelector('#localAIStudio')).display
        }
      };
    }''')

    await page.evaluate("AIShortsFlowDirectorFinal.setActive('preview',{force:true,source:'workflow-focus-audit'})")
    await page.wait_for_timeout(60)
    preview = await page.evaluate('''() => ({
      active: document.body.dataset.activeFlowTab,
      areas: getComputedStyle(document.querySelector('#studioGrid')).gridTemplateAreas,
      visible: [...document.querySelectorAll('[data-flow-panel]')].filter(el => getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().height > 0).map(el => ({panel:el.dataset.flowPanel,priority:el.dataset.workflowPriority,height:Math.round(el.getBoundingClientRect().height),supportButton:getComputedStyle(el.querySelector('.workflow-panel-open')).display})),
      overflow: document.documentElement.scrollWidth-innerWidth
    })''')

    support_navigation = await page.evaluate("""async () => {
      document.querySelector('[data-flow-panel="candidates"] > .workflow-panel-open').click();
      await Promise.resolve();
      await Promise.resolve();
      return {active:document.body.dataset.activeFlowTab, primary:document.querySelector('[data-flow-panel].is-workflow-primary')?.dataset.flowPanel||''};
    }""")

    await page.click('#workflowFocusToggle')
    await page.wait_for_timeout(60)
    full = await page.evaluate('''() => ({
      state:AIShortsWorkflowFocusLayout.getState(),
      effective:document.body.dataset.workflowFocusEffective,
      visibleCount:[...document.querySelectorAll('[data-flow-panel]')].filter(el=>getComputedStyle(el).display!=='none').length,
      status:document.querySelector('#workspaceLayoutStatus').textContent.trim(),
      utility:getComputedStyle(document.querySelector('.project-copy-hub')).display,
      ai:getComputedStyle(document.querySelector('#localAIStudio')).display
    })''')

    await page.click('#workflowFocusToggle')
    await page.wait_for_timeout(30)
    await page.evaluate("AIShortsWorkspaceLayout.setMode('preview',{persist:false,navigate:false})")
    await page.wait_for_timeout(60)
    explicit_mode = await page.evaluate('''() => ({state:AIShortsWorkflowFocusLayout.getState(),effective:document.body.dataset.workflowFocusEffective,togglePaused:document.querySelector('#workflowFocusToggle').classList.contains('is-paused')})''')

    await page.evaluate('''() => {
      AIShortsWorkspaceLayout.setMode('balanced',{persist:false,navigate:false});
      const state=AIShortsAppState.state;
      state.file={name:'sample.mp4'};
      state.recommendations=[];
      state.exportInfo=null;
      AIShortsUxControls.sync();
    }''')
    await page.wait_for_timeout(60)
    phase_analyze = await page.evaluate("() => document.body.dataset.workflowPhase")
    await page.evaluate('''() => { const state=AIShortsAppState.state; state.recommendations=[{id:'r1'}]; AIShortsUxControls.sync(); }''')
    await page.wait_for_timeout(60)
    phase_edit = await page.evaluate("() => document.body.dataset.workflowPhase")
    await page.evaluate('''() => { const state=AIShortsAppState.state; state.exportInfo={filename:'out.webm'}; AIShortsUxControls.sync(); }''')
    await page.wait_for_timeout(60)
    phase_export = await page.evaluate("() => document.body.dataset.workflowPhase")

    await page.close()
    return {
        'initial': initial,
        'preview': preview,
        'supportNavigation': support_navigation,
        'full': full,
        'explicitMode': explicit_mode,
        'phases': [phase_analyze, phase_edit, phase_export],
        'errors': errors,
    }


async def mobile_audit(browser):
    page = await browser.new_page(viewport={'width': 390, 'height': 844})
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    await page.set_content(build_html(), wait_until='load', timeout=30000)
    await page.wait_for_timeout(1200)
    result = await page.evaluate('''() => ({
      state:AIShortsWorkflowFocusLayout.getState(),
      effective:document.body.dataset.workflowFocusEffective,
      toggleDisplay:getComputedStyle(document.querySelector('#workflowFocusToggle')).display,
      badgeDisplay:getComputedStyle(document.querySelector('#workflowFocusBadge')).display,
      active:document.body.dataset.activeFlowTab,
      visible:[...document.querySelectorAll('[data-flow-panel]')].filter(el=>getComputedStyle(el).display!=='none'&&el.getBoundingClientRect().height>0).map(el=>el.dataset.flowPanel),
      overflow:document.documentElement.scrollWidth-innerWidth,
      dockHeight:Math.round(document.querySelector('#bottomDock').getBoundingClientRect().height),
      dockVariable:parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hyperflow-dock-height'))
    })''')
    await page.close()
    return {'result': result, 'errors': errors}


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
        desktop = await desktop_audit(browser)
        mobile = await mobile_audit(browser)
        await browser.close()
    OUTPUT.write_text(json.dumps({'version': VERSION, 'desktop': desktop, 'mobile': mobile}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(OUTPUT)


if __name__ == '__main__':
    asyncio.run(main())
