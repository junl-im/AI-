#!/usr/bin/env python3
"""Real Chromium audit for crop keyframe timeline editing."""
from __future__ import annotations
import asyncio
import datetime as dt
import json
import tempfile
from pathlib import Path
from playwright.async_api import async_playwright
from run_media_e2e import ROOT, build_inline_html, make_media

VERSION = json.loads((ROOT / 'package.json').read_text(encoding='utf-8'))['version']
OUTPUT = ROOT / 'qa' / f'runtime-crop-keyframe-timeline-v{VERSION}.json'

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
        await page.wait_for_function("() => Boolean(AIShortsAppState.state.smartReframe) && Boolean(window.AIShortsCropKeyframeTimeline)", timeout=15000)
        await page.evaluate("""() => {
            if (window.AIShortsFlowDirectorFinal?.setActive) window.AIShortsFlowDirectorFinal.setActive('preview', { force: true, source: 'timeline-audit' });
            document.querySelector('#cropKeyframeTimelinePanel').open = true;
        }""")
        await page.locator('#directCropPanel').scroll_into_view_if_needed()
        await page.wait_for_function("() => !document.querySelector('#directCropPanel').hidden && !document.querySelector('#directCropSaveBtn').disabled", timeout=10000)
        for time in (2, 4, 6):
            await page.evaluate("""time => {
                const video = document.querySelector('#sourceVideo');
                video.currentTime = time;
                video.dispatchEvent(new Event('seeked'));
            }""", time)
            await page.wait_for_timeout(80)
            await page.click('#directCropSaveBtn')
            await page.wait_for_timeout(100)
        initial = await page.evaluate("""() => ({
            count: AIShortsAppState.state.smartReframe.keyframes.length,
            markers: document.querySelectorAll('.crop-keyframe-marker').length,
            panelHidden: document.querySelector('#cropKeyframeTimelinePanel').hidden,
            sceneTicks: document.querySelectorAll('.crop-keyframe-scene-cut').length
        })""")
        markers = page.locator('.crop-keyframe-marker')
        await markers.nth(0).click()
        await page.click('#cropKeyframeCopyBtn')
        await page.evaluate("""() => {
            const video = document.querySelector('#sourceVideo');
            video.currentTime = 8;
            video.dispatchEvent(new Event('seeked'));
        }""")
        await page.wait_for_timeout(100)
        await page.click('#cropKeyframePasteBtn')
        await page.wait_for_timeout(120)
        pasted = await page.evaluate("""() => ({
            count: AIShortsAppState.state.smartReframe.keyframes.length,
            atEight: AIShortsAppState.state.smartReframe.keyframes.some(item => Math.abs(item.time - 8) < 0.08),
            status: document.querySelector('#cropKeyframeTimelineStatus').textContent.trim()
        })""")
        markers = page.locator('.crop-keyframe-marker')
        last = markers.nth(await markers.count() - 1)
        marker_box = await last.bounding_box()
        track_box = await page.locator('#cropKeyframeTimeline').bounding_box()
        if not marker_box or not track_box:
            raise RuntimeError('timeline marker is not measurable')
        duration = await page.evaluate("() => Number(document.querySelector('#sourceVideo').duration) || 10")
        target_x = track_box['x'] + track_box['width'] * min(1, 6 / max(duration, 0.1))
        target_y = marker_box['y'] + marker_box['height'] / 2
        await page.mouse.move(marker_box['x'] + marker_box['width'] / 2, target_y)
        await page.mouse.down()
        await page.mouse.move(target_x, target_y, steps=12)
        await page.mouse.up()
        await page.wait_for_timeout(160)
        moved = await page.evaluate("""() => ({
            count: AIShortsAppState.state.smartReframe.keyframes.length,
            nearSix: AIShortsAppState.state.smartReframe.keyframes.filter(item => Math.abs(item.time - 6) < 0.14).length,
            persisted: AIShortsAppState.state.smartReframeEdits.keyframes.length
        })""")
        await page.locator('.crop-keyframe-marker').nth(0).click()
        await page.click('#cropKeyframeCopyBtn')
        await page.evaluate("""() => {
            AIShortsAppState.state.selectedRange = { start: 1, end: 5 };
            const video = document.querySelector('#sourceVideo');
            video.dispatchEvent(new Event('timeupdate'));
        }""")
        await page.wait_for_timeout(120)
        await page.evaluate("window.confirm = () => true")
        await page.click('#cropKeyframeRangeBtn')
        await page.wait_for_timeout(160)
        ranged = await page.evaluate("""() => {
            const keys = AIShortsAppState.state.smartReframe.keyframes;
            const inside = keys.filter(item => item.time >= 1 && item.time <= 5);
            return {
                start: inside.some(item => Math.abs(item.time - 1) < 0.08),
                end: inside.some(item => Math.abs(item.time - 5) < 0.08),
                consistent: inside.length >= 2 && inside.every(item => Math.abs(item.x - inside[0].x) < 0.0001 && Math.abs(item.zoom - inside[0].zoom) < 0.0001),
                count: keys.length,
                uiCount: document.querySelectorAll('.crop-keyframe-marker').length,
                panelOverflow: document.querySelector('#directCropPanel').scrollWidth - document.querySelector('#directCropPanel').clientWidth,
                bodyOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
            };
        }""")
        await browser.close()

    checks = {
        'timelineVisible': initial['count'] == 3 and initial['markers'] == 3 and not initial['panelHidden'],
        'copyPasteWorks': pasted['count'] == 4 and pasted['atEight'],
        'dragMoveCollisionCleanup': moved['count'] == 3 and moved['nearSix'] == 1 and moved['persisted'] == 3,
        'rangeApplicationWorks': ranged['start'] and ranged['end'] and ranged['consistent'] and ranged['count'] == ranged['uiCount'],
        'noHorizontalOverflow': ranged['panelOverflow'] <= 1 and ranged['bodyOverflow'] <= 1,
        'noRuntimeErrors': not page_errors and not console_errors
    }
    return {
        'version': VERSION,
        'generatedAt': dt.datetime.now(dt.timezone.utc).isoformat(),
        'harness': 'real MP4 import, smart crop keyframe creation, marker selection, clipboard paste, drag collision cleanup, and selected-range application',
        'initial': initial,
        'pasted': pasted,
        'moved': moved,
        'ranged': ranged,
        'checks': checks,
        'passed': all(checks.values()),
        'pageErrors': page_errors,
        'consoleErrors': console_errors
    }

async def main() -> None:
    with tempfile.TemporaryDirectory(prefix='ai-shorts-crop-timeline-') as tmp:
        _, media, _ = make_media(Path(tmp), {'video'})
        report = await run(media)
    OUTPUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(OUTPUT)
    print(json.dumps(report['checks'], ensure_ascii=False, indent=2))
    if not report['passed']:
        raise SystemExit(1)

if __name__ == '__main__':
    asyncio.run(main())
