#!/usr/bin/env python3
"""Real Chromium audit for direct preview crop gestures and keyframe persistence."""
from __future__ import annotations
import asyncio
import datetime as dt
import json
import tempfile
from pathlib import Path
from playwright.async_api import async_playwright
from run_media_e2e import ROOT, build_inline_html, make_media

VERSION = json.loads((ROOT / 'package.json').read_text(encoding='utf-8'))['version']
OUTPUT = ROOT / 'qa' / f'runtime-direct-crop-browser-v{VERSION}.json'

async def run(media: Path) -> dict:
    page_errors: list[str] = []
    console_errors: list[str] = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox', '--autoplay-policy=no-user-gesture-required'])
        page = await browser.new_page(viewport={'width': 1440, 'height': 1100})
        page.on('pageerror', lambda error: page_errors.append(str(error)))
        page.on('console', lambda message: console_errors.append(message.text) if message.type == 'error' else None)
        await page.set_content(build_inline_html(), wait_until='load', timeout=30000)
        await page.set_input_files('#fileInput', str(media))
        await page.wait_for_function("() => Boolean(AIShortsAppState.state.motionAnalysis) && !AIShortsAppState.state.isAnalyzing", timeout=60000)
        await page.select_option('#cropModeSelect', 'smart')
        await page.dispatch_event('#cropModeSelect', 'change')
        await page.wait_for_function("() => Boolean(AIShortsAppState.state.smartReframe) && Boolean(window.AIShortsDirectCropEditor)", timeout=15000)
        await page.evaluate("""() => {
            if (window.AIShortsFlowDirectorFinal?.setActive) window.AIShortsFlowDirectorFinal.setActive('preview', { force: true, source: 'direct-crop-audit' });
            const video = document.querySelector('#sourceVideo');
            video.currentTime = 4;
            video.dispatchEvent(new Event('seeked'));
        }""")
        await page.locator('#directCropPanel').scroll_into_view_if_needed()
        await page.wait_for_function("() => !document.querySelector('#directCropPanel').hidden && !document.querySelector('#directCropToggleBtn').disabled", timeout=10000)
        before = await page.evaluate("""() => {
            const focus = AIShortsSmartReframe.getFocusAt(AIShortsAppState.state.smartReframe, 4);
            return { x: focus.x, y: focus.y, zoom: focus.zoom || 1.08, count: AIShortsAppState.state.smartReframe.keyframes.length };
        }""")
        await page.click('#directCropToggleBtn')
        canvas = page.locator('#previewCanvas')
        box = await canvas.bounding_box()
        if not box:
            raise RuntimeError('preview canvas is not measurable')
        start_x = box['x'] + box['width'] * 0.55
        start_y = box['y'] + box['height'] * 0.48
        await page.mouse.move(start_x, start_y)
        await page.mouse.down()
        await page.mouse.move(start_x - 42, start_y + 24, steps=8)
        await page.mouse.up()
        await page.wait_for_function("() => AIShortsAppState.state.smartReframe?.keyframes?.length === 1", timeout=10000)
        after_drag = await page.evaluate("""() => {
            const key = AIShortsAppState.state.smartReframe.keyframes[0];
            return { x: key.x, y: key.y, zoom: key.zoom, active: document.querySelector('#directCropOverlay').dataset.active, line: document.querySelector('#directCropPathLine').getAttribute('points') || '' };
        }""")
        await page.mouse.move(start_x, start_y)
        await page.mouse.wheel(0, -180)
        await page.wait_for_timeout(520)
        after_wheel = await page.evaluate("""() => {
            const key = AIShortsAppState.state.smartReframe.keyframes[0];
            return { x: key.x, y: key.y, zoom: key.zoom };
        }""")
        await canvas.focus()
        await page.keyboard.press('ArrowRight')
        await page.keyboard.press('Enter')
        await page.wait_for_timeout(120)
        after_key = await page.evaluate("""() => {
            const key = AIShortsAppState.state.smartReframe.keyframes[0];
            return { x: key.x, y: key.y, zoom: key.zoom, detail: document.querySelector('#directCropDetail').textContent.trim() };
        }""")
        undo_enabled = await page.locator('#directCropUndoBtn').is_enabled()
        await page.click('#directCropUndoBtn')
        await page.wait_for_timeout(150)
        after_undo = await page.evaluate("""() => {
            const key = AIShortsAppState.state.smartReframe.keyframes[0];
            return { x: key.x, y: key.y, zoom: key.zoom, persisted: AIShortsAppState.state.smartReframeEdits.keyframes.length };
        }""")
        await page.keyboard.press('Escape')
        ended = await page.evaluate("""() => ({
            active: document.querySelector('#directCropOverlay').dataset.active,
            pressed: document.querySelector('#directCropToggleBtn').getAttribute('aria-pressed'),
            panelOverflow: document.querySelector('#directCropPanel').scrollWidth - document.querySelector('#directCropPanel').clientWidth,
            bodyOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
        })""")
        await browser.close()

    checks = {
        'dragCreatesKeyframe': before['count'] == 0 and after_drag['x'] > before['x'] and after_drag['y'] < before['y'] and after_drag['active'] == 'true',
        'wheelUpdatesZoom': after_wheel['zoom'] > after_drag['zoom'],
        'keyboardNudgeWorks': after_key['x'] > after_wheel['x'],
        'pathVisible': bool(after_drag['line']) and '크롭 경로 1개' in after_key['detail'],
        'undoWorks': undo_enabled and abs(after_undo['x'] - before['x']) < 0.02 and abs(after_undo['y'] - before['y']) < 0.02 and after_undo['persisted'] == 1,
        'escapeClosesEditor': ended['active'] == 'false' and ended['pressed'] == 'false',
        'noHorizontalOverflow': ended['panelOverflow'] <= 1 and ended['bodyOverflow'] <= 1,
        'noRuntimeErrors': not page_errors and not console_errors
    }
    return {
        'version': VERSION,
        'generatedAt': dt.datetime.now(dt.timezone.utc).isoformat(),
        'harness': 'real MP4 import, smart crop, pointer drag, wheel zoom, keyboard nudge, automatic keyframe save, path visualization, undo, and escape exit',
        'before': before,
        'afterDrag': after_drag,
        'afterWheel': after_wheel,
        'afterKeyboard': after_key,
        'afterUndo': after_undo,
        'ended': ended,
        'checks': checks,
        'passed': all(checks.values()),
        'pageErrors': page_errors,
        'consoleErrors': console_errors
    }

async def main() -> None:
    with tempfile.TemporaryDirectory(prefix='ai-shorts-direct-crop-') as tmp:
        _, media, _ = make_media(Path(tmp), {'video'})
        report = await run(media)
    OUTPUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(OUTPUT)
    print(json.dumps(report['checks'], ensure_ascii=False, indent=2))
    if not report['passed']:
        raise SystemExit(1)

if __name__ == '__main__':
    asyncio.run(main())
