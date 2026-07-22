#!/usr/bin/env python3
"""Audit interactive CSS states using the exact stylesheet order from index.html."""
import argparse
import asyncio
import json
import re
from pathlib import Path
from playwright.async_api import async_playwright

PROPS = [
    'color', 'backgroundColor', 'backgroundImage',
    'borderTopColor', 'borderTopStyle', 'borderTopWidth',
    'opacity', 'outlineColor', 'outlineStyle', 'outlineWidth', 'outlineOffset',
    'boxShadow', 'transform'
]

FIXTURE = '''
<div id="interactionFixture">
  <button id="beforeFocusButton" type="button">before</button>
  <button id="focusButton" type="button">focus button</button>
  <button id="beforeFocusLabel" type="button">before</button>
  <label id="focusLabel" class="btn-secondary" tabindex="0" for="fixtureFile">focus label</label>
  <input id="fixtureFile" type="file" hidden>
  <button id="beforeInput" type="button">before</button>
  <input id="fixtureInput" type="text" value="input">
  <button id="beforeSelect" type="button">before</button>
  <select id="fixtureSelect"><option>one</option></select>
  <button id="beforeTextarea" type="button">before</button>
  <textarea id="fixtureTextarea">text</textarea>
  <button id="hoverSecondary" class="btn-secondary" type="button">secondary</button>
  <button id="hoverMini" class="mini-action" type="button">mini</button>
  <label id="hoverLabel" class="btn-secondary" for="fixtureFile">label</label>
  <button id="disabledButton" class="btn-secondary mini-action" type="button" disabled>disabled</button>
  <button id="beforeUpload" type="button">before</button>
  <label id="uploadTile" class="upload-tile" tabindex="0" for="fixtureFile">upload</label>
  <button id="beforeDock" type="button">before</button>
  <button id="dockTab" class="bottom-dock-tab" type="button"><span>icon</span><b>dock</b></button>
  <div id="recommendation" class="recommendation-card" tabindex="0">recommendation</div>
</div>
'''

FIXTURE_STYLE = '''
<style>
html,body{min-height:100%;}
#interactionFixture{position:fixed;left:18px;top:18px;z-index:2147483647;display:grid;grid-template-columns:repeat(4,minmax(110px,1fr));gap:8px;width:min(720px,calc(100vw - 36px));padding:12px;}
#interactionFixture>*{min-width:0;min-height:38px;transition:none !important;animation:none !important;}
#interactionFixture textarea{min-height:48px;}
</style>
'''


def build_html(root: Path) -> str:
    index = (root / 'index.html').read_text(encoding='utf-8')
    hrefs = re.findall(r'<link[^>]+rel=["\']stylesheet["\'][^>]+href=["\']([^"\']+)["\'][^>]*>', index, flags=re.I)
    styles = []
    for href in hrefs:
        rel = href.split('?', 1)[0]
        path = root / rel
        if path.exists():
            styles.append(f'<style data-source="{rel}">{path.read_text(encoding="utf-8")}</style>')
    return '<!doctype html><html><head><meta charset="utf-8">' + FIXTURE_STYLE + ''.join(styles) + '</head><body data-ui="hyperflow-tabs" data-active-flow-tab="file" data-desktop-layout="prime">' + FIXTURE + '</body></html>'


async def computed(page, selector: str):
    return await page.eval_on_selector(selector, """(el, props) => {
      const cs=getComputedStyle(el); const out={};
      for(const prop of props) out[prop]=cs[prop];
      return out;
    }""", PROPS)


async def keyboard_focus(page, before: str, target: str):
    await page.evaluate("sel => document.querySelector(sel).focus()", before)
    await page.keyboard.press('Tab')
    await page.wait_for_timeout(25)
    focused = await page.evaluate("sel => document.activeElement === document.querySelector(sel)", target)
    if not focused:
        raise RuntimeError(f'keyboard focus failed for {target}')
    return await computed(page, target)


async def hover_state(page, selector: str):
    await page.mouse.move(1000, 760)
    await page.locator(selector).hover(force=True)
    await page.wait_for_timeout(25)
    return await computed(page, selector)


async def active_state(page, selector: str):
    loc = page.locator(selector)
    await loc.hover(force=True)
    box = await loc.bounding_box()
    if not box:
        raise RuntimeError(f'no box for {selector}')
    await page.mouse.move(box['x'] + box['width']/2, box['y'] + box['height']/2)
    await page.mouse.down()
    await page.wait_for_timeout(25)
    value = await computed(page, selector)
    await page.mouse.up()
    return value


async def audit(root: Path):
    version = __import__('json').loads((root / 'package.json').read_text(encoding='utf-8'))['version']
    result = {'version': version, 'root': root.name, 'modes': {}}
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
        for mode, viewport in [('desktop', {'width': 1440, 'height': 1000}), ('mobile', {'width': 390, 'height': 844})]:
            page = await browser.new_page(viewport=viewport)
            errors = []
            page.on('pageerror', lambda exc: errors.append(str(exc)))
            await page.set_content(build_html(root), wait_until='load')
            await page.wait_for_timeout(80)
            states = {}
            states['focusButton'] = await keyboard_focus(page, '#beforeFocusButton', '#focusButton')
            states['focusLabel'] = await keyboard_focus(page, '#beforeFocusLabel', '#focusLabel')
            states['focusInput'] = await keyboard_focus(page, '#beforeInput', '#fixtureInput')
            states['focusSelect'] = await keyboard_focus(page, '#beforeSelect', '#fixtureSelect')
            states['focusTextarea'] = await keyboard_focus(page, '#beforeTextarea', '#fixtureTextarea')
            states['hoverSecondary'] = await hover_state(page, '#hoverSecondary')
            states['hoverMini'] = await hover_state(page, '#hoverMini')
            states['hoverLabel'] = await hover_state(page, '#hoverLabel')
            states['disabledButton'] = await computed(page, '#disabledButton')
            states['hoverUpload'] = await hover_state(page, '#uploadTile')
            states['focusUpload'] = await keyboard_focus(page, '#beforeUpload', '#uploadTile')
            states['dockEnabled'] = await computed(page, '#dockTab')
            states['hoverDock'] = await hover_state(page, '#dockTab')
            states['focusDock'] = await keyboard_focus(page, '#beforeDock', '#dockTab')
            states['activeDock'] = await active_state(page, '#dockTab')
            states['hoverRecommendation'] = await hover_state(page, '#recommendation')
            states['activeRecommendation'] = await active_state(page, '#recommendation')
            result['modes'][mode] = {'errors': errors, 'states': states}
            await page.close()
        await browser.close()
    return result


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    root = args.root.resolve()
    version = json.loads((root / 'package.json').read_text(encoding='utf-8'))['version']
    output = args.output or root / 'qa' / f'runtime-interaction-state-v{version}.json'
    data = await audit(root)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(data, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'output': str(output), 'modes': list(data['modes']), 'stateCount': sum(len(v['states']) for v in data['modes'].values()), 'errors': sum(len(v['errors']) for v in data['modes'].values())}, indent=2))

if __name__ == '__main__':
    asyncio.run(main())
