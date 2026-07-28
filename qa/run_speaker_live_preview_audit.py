#!/usr/bin/env python3
"""Chromium audit for live overlay, adjustable grid crops, and paged multi-speaker layouts."""
from __future__ import annotations
import asyncio
import datetime as dt
import json
from playwright.async_api import async_playwright
from run_media_e2e import ROOT, build_inline_html

VERSION = json.loads((ROOT / 'package.json').read_text(encoding='utf-8'))['version']
OUTPUT = ROOT / 'qa' / f'runtime-speaker-live-preview-v{VERSION}.json'

async def main():
    errors, console_errors = [], []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
        context = await browser.new_context(viewport={'width': 1180, 'height': 900})
        page = await context.new_page()
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('console', lambda message: console_errors.append(message.text) if message.type == 'error' else None)
        await page.set_content(build_inline_html(), wait_until='load', timeout=30000)
        await page.evaluate("""() => {
            const point = (time, x, y = .42) => ({ time, x, y, confidence: .93, source: 'face', box: { x: x - .06, y: y - .1, width: .12, height: .2 } });
            const subjects = [
                { id: 'subject-1', label: '주 화자', points: [point(0,.12), point(8,.14)] },
                { id: 'subject-2', label: '화자 2', points: [point(0,.28), point(8,.3)] },
                { id: 'subject-3', label: '화자 3', points: [point(0,.44), point(8,.46)] },
                { id: 'subject-4', label: '화자 4', points: [point(0,.6), point(8,.62)] },
                { id: 'subject-5', label: '화자 5', points: [point(0,.76), point(8,.74)] },
                { id: 'subject-6', label: '화자 6', points: [point(0,.88), point(8,.86)] }
            ];
            const cues = subjects.map((subject, index) => ({ start: 0, end: 8, speaker: subject.label, subjectId: subject.id, confidence: .94 - index * .03, priority: index === 0 ? 'primary' : 'auto', gridCrop: index === 0 ? { x: .08, y: -.05, zoom: 1.12 } : {} }));
            const track = AIShortsSmartReframe._test.buildTrack([point(0,.5),point(8,.5)], 'hybrid', {}, {}, { subjects, activeSubjectId: 'auto', speakerPriority: true, speakerCues: cues, speakerLayout: { gridPaging: 'rotate', gridPageSeconds: 1.5, gridPrimaryPosition: 'left', gridPrimarySize: .6 } });
            AIShortsAppState.state.settings.cropMode = 'smart';
            AIShortsAppState.state.smartReframe = track;
            AIShortsAppState.state.smartReframeEdits = AIShortsSmartReframe.extractEdits(track);
            AIShortsStudioApp.renderAll();
        }""")
        await page.wait_for_function("() => !document.querySelector('#speakerPreviewOverlay').hidden && document.querySelector('#speakerPreviewOverlay').dataset.mode === 'grid'", timeout=10000)
        grid = await page.evaluate("""() => {
            const first = AIShortsSmartReframe.getFocusAt(AIShortsAppState.state.smartReframe, .2);
            const second = AIShortsSmartReframe.getFocusAt(AIShortsAppState.state.smartReframe, 1.7);
            return {
                mode: document.querySelector('#speakerPreviewOverlay').dataset.mode,
                visibleGuides: [...document.querySelectorAll('.speaker-preview-guide')].filter(node => !node.hidden).length,
                labels: [...document.querySelectorAll('.speaker-preview-guide')].filter(node => !node.hidden).map(node => node.textContent.trim()),
                status: document.querySelector('#speakerPreviewOverlayStatus').textContent.trim(),
                dividerHidden: document.querySelector('#speakerPreviewDividerControl').hidden,
                firstPage: first.gridSubjects.map(item => item.subjectId),
                secondPage: second.gridSubjects.map(item => item.subjectId),
                firstCrop: first.gridSubjects[0].gridCrop,
                overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
            };
        }""")
        await page.evaluate("""() => {
            const track = AIShortsAppState.state.smartReframe;
            let next = AIShortsSmartReframe.replaceSpeakerCues(track, track.speakerCues.slice(0, 3));
            next = AIShortsSmartReframe.updateSpeakerLayout(next, { gridPrimaryPosition: 'right', gridPrimarySize: .6 });
            AIShortsAppState.state.smartReframe = next;
            AIShortsAppState.state.smartReframeEdits = AIShortsSmartReframe.extractEdits(next);
            AIShortsStudioApp.renderAll();
        }""")
        await page.wait_for_function("() => document.querySelector('#speakerPreviewOverlay').dataset.mode === 'grid' && [...document.querySelectorAll('.speaker-preview-guide')].filter(node => !node.hidden).length === 3", timeout=10000)
        three = await page.evaluate("""() => {
            const guides=[...document.querySelectorAll('.speaker-preview-guide')].filter(node=>!node.hidden).map(node=>({left:parseFloat(node.style.left),top:parseFloat(node.style.top),width:parseFloat(node.style.width),height:parseFloat(node.style.height)}));
            return { guides, position: AIShortsAppState.state.smartReframe.speakerLayout.gridPrimaryPosition, size: AIShortsAppState.state.smartReframe.speakerLayout.gridPrimarySize };
        }""")
        await page.evaluate("""() => {
            document.querySelector('#speakerGridCropXInput').value = '10';
            document.querySelector('#speakerGridCropYInput').value = '-6';
            document.querySelector('#speakerGridCropZoomInput').value = '118';
            document.querySelector('#speakerFaceApplyBtn').click();
        }""")
        await page.wait_for_function("() => AIShortsAppState.state.smartReframe.speakerCues[0].gridCrop?.zoom === 1.18", timeout=10000)
        crop = await page.evaluate("""() => ({
            cue: AIShortsAppState.state.smartReframe.speakerCues[0].gridCrop,
            focus: AIShortsSmartReframe.getFocusAt(AIShortsAppState.state.smartReframe, .5).gridSubjects[0].gridCrop
        })""")
        await page.evaluate("""() => {
            const track = AIShortsAppState.state.smartReframe;
            const next = AIShortsSmartReframe.replaceSpeakerCues(track, track.speakerCues.slice(0, 2));
            AIShortsAppState.state.smartReframe = AIShortsSmartReframe.updateSpeakerLayout(next, { orientation: 'horizontal', split: .62, primaryPosition: 'right' });
            AIShortsAppState.state.smartReframeEdits = AIShortsSmartReframe.extractEdits(AIShortsAppState.state.smartReframe);
            AIShortsStudioApp.renderAll();
        }""")
        await page.wait_for_function("() => document.querySelector('#speakerPreviewOverlay').dataset.mode === 'dual' && !document.querySelector('#speakerPreviewDividerControl').hidden", timeout=10000)
        await page.locator('#speakerPreviewOverlay').scroll_into_view_if_needed()
        overlay_box = await page.locator('#speakerPreviewOverlay').bounding_box()
        divider_box = await page.locator('#speakerPreviewDividerControl').bounding_box()
        if overlay_box and divider_box:
            await page.mouse.move(divider_box['x'] + divider_box['width']/2, divider_box['y'] + divider_box['height']/2)
            await page.mouse.down()
            await page.mouse.move(overlay_box['x'] + overlay_box['width'] * .40, overlay_box['y'] + overlay_box['height']/2, steps=4)
            await page.mouse.up()
        drag_split = await page.evaluate("AIShortsAppState.state.smartReframe.speakerLayout.split")
        await page.locator('#speakerPreviewDividerControl').focus()
        await page.keyboard.press('ArrowRight')
        await page.keyboard.press('ArrowRight')
        await page.wait_for_function("() => AIShortsAppState.state.smartReframe.speakerLayout.split === .62", timeout=10000)
        dual = await page.evaluate("""() => ({
            mode: document.querySelector('#speakerPreviewOverlay').dataset.mode,
            orientation: document.querySelector('#speakerPreviewOverlay').dataset.orientation,
            position: document.querySelector('#speakerPreviewOverlay').dataset.primaryPosition,
            visibleGuides: [...document.querySelectorAll('.speaker-preview-guide')].filter(node => !node.hidden).length,
            status: document.querySelector('#speakerPreviewOverlayStatus').textContent.trim(),
            dividerOrientation: document.querySelector('#speakerPreviewDividerControl').getAttribute('aria-orientation'),
            dividerValue: document.querySelector('#speakerPreviewDividerControl').getAttribute('aria-valuenow'),
            labels: [...document.querySelectorAll('.speaker-preview-guide')].filter(node => !node.hidden).map(node => node.textContent.trim())
        })""")
        await context.close()
        await browser.close()

    checks = {
        'pagedSpeakerGridVisible': grid['mode'] == 'grid' and grid['visibleGuides'] == 4 and '4명 표시 / 6명' in grid['status'] and '페이지 1/2' in grid['status'],
        'gridPagingRotatesSecondarySpeakers': grid['firstPage'] == ['subject-1','subject-2','subject-3','subject-4'] and grid['secondPage'] == ['subject-1','subject-5','subject-6','subject-2'],
        'gridLabelsSafeAndVisible': len(grid['labels']) == 4 and all('화자' in label for label in grid['labels']),
        'gridDividerDisabled': grid['dividerHidden'] is True,
        'threeSpeakerPrimaryRightLayout': three['position'] == 'right' and abs(three['size'] - .6) < .001 and len(three['guides']) == 3 and three['guides'][0]['left'] > 35 and three['guides'][0]['width'] > three['guides'][1]['width'],
        'gridCellCropApplied': abs(crop['cue']['x'] - .1) < .001 and abs(crop['cue']['y'] + .06) < .001 and abs(crop['focus']['zoom'] - 1.18) < .001,
        'dualOverlayVisible': dual['mode'] == 'dual' and dual['visibleGuides'] == 2 and '2명 동시 화자' in dual['status'],
        'liveDividerPointerKeyboardWorks': abs(drag_split - .60) < .001 and dual['dividerValue'] == '62',
        'liveDividerAccessible': dual['orientation'] == 'horizontal' and dual['position'] == 'right' and dual['dividerOrientation'] == 'vertical',
        'viewportContained': grid['overflow'] <= 1,
        'noRuntimeErrors': not errors and not console_errors,
    }
    report = {
        'version': VERSION,
        'generatedAt': dt.datetime.now(dt.timezone.utc).isoformat(),
        'grid': grid,
        'threeSpeakerLayout': three,
        'gridCrop': crop,
        'dual': dict(dual, dragSplit=drag_split),
        'checks': checks,
        'passed': all(checks.values()),
        'pageErrors': errors,
        'consoleErrors': console_errors,
    }
    OUTPUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(OUTPUT)
    print(json.dumps(checks, ensure_ascii=False, indent=2))
    if not report['passed']:
        raise SystemExit(1)

if __name__ == '__main__':
    asyncio.run(main())
