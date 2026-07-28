#!/usr/bin/env python3
"""Chromium audit for energy paging, manual pages, transitions, and bulk grid crops."""
from __future__ import annotations
import asyncio
import datetime as dt
import json
from playwright.async_api import async_playwright
from run_media_e2e import ROOT, build_inline_html

VERSION = json.loads((ROOT / 'package.json').read_text(encoding='utf-8'))['version']
OUTPUT = ROOT / 'qa' / f'runtime-speaker-paging-v{VERSION}.json'

async def main():
    errors, console_errors = [], []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
        context = await browser.new_context(viewport={'width': 1180, 'height': 920})
        page = await context.new_page()
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('console', lambda message: console_errors.append(message.text) if message.type == 'error' else None)
        await page.set_content(build_inline_html(), wait_until='load', timeout=30000)
        await page.evaluate("""() => {
            const point = (time, x) => ({ time, x, y: .42, confidence: .93, source: 'face', box: { x: x - .05, y: .32, width: .1, height: .2 } });
            const energy = [.5,.12,.96,.35,.84,.72];
            const subjects = Array.from({ length: 6 }, (_, index) => ({ id: `subject-${index + 1}`, label: `화자 ${index + 1}`, points: [point(0,.12 + index * .14), point(8,.13 + index * .14)] }));
            const cues = subjects.map((subject, index) => ({ start: 0, end: 8, speaker: subject.label, subjectId: subject.id, confidence: .9 - index * .02, energy: energy[index], priority: index === 0 ? 'primary' : 'auto', gridCrop: {} }));
            const track = AIShortsSmartReframe._test.buildTrack([point(0,.5),point(8,.5)], 'hybrid', {}, {}, { subjects, activeSubjectId: 'auto', speakerPriority: true, speakerCues: cues, speakerLayout: { gridPaging: 'energy', gridTransition: 'fade' } });
            AIShortsAppState.state.settings.cropMode = 'smart';
            AIShortsAppState.state.fileKind = 'video';
            AIShortsAppState.state.smartReframe = track;
            AIShortsAppState.state.smartReframeEdits = AIShortsSmartReframe.extractEdits(track);
            const panel = document.querySelector('#speakerFaceTuningPanel');
            if (panel) panel.open = true;
            AIShortsStudioApp.renderAll();
        }""")
        await page.wait_for_function("() => document.querySelector('#speakerGridPagingSelect').value === 'energy'", timeout=10000)
        energy = await page.evaluate("""() => {
            const focus = AIShortsSmartReframe.getFocusAt(AIShortsAppState.state.smartReframe, .5);
            return { ids: focus.gridSubjects.map(item => item.subjectId), trigger: focus.gridPageTrigger, status: document.querySelector('#speakerPreviewOverlayStatus').textContent.trim() };
        }""")
        await page.evaluate("""() => {
            const change = (selector, value) => {
                const node = document.querySelector(selector);
                node.value = value;
                node.dispatchEvent(new Event('change', { bubbles: true }));
            };
            change('#speakerGridPagingSelect', 'manual');
            change('#speakerGridManualPagesInput', 'subject-1,subject-5,subject-3 | subject-1,subject-6,subject-2,subject-4');
            change('#speakerGridTransitionSelect', 'slide');
            change('#speakerGridTransitionMsInput', '480');
            change('#speakerGridPageSecondsInput', '2');
        }""")
        await page.wait_for_function("() => AIShortsAppState.state.smartReframe.speakerLayout.gridManualPages.length === 2 && AIShortsAppState.state.smartReframe.speakerLayout.gridTransition === 'slide'", timeout=10000)
        manual = await page.evaluate("""() => {
            const first = AIShortsSmartReframe.getFocusAt(AIShortsAppState.state.smartReframe, .8);
            const boundary = AIShortsSmartReframe.getFocusAt(AIShortsAppState.state.smartReframe, 2.12);
            return {
                first: first.gridSubjects.map(item => item.subjectId),
                second: boundary.gridSubjects.map(item => item.subjectId),
                previous: boundary.gridPreviousSubjects.map(item => item.subjectId),
                progress: boundary.gridTransitionProgress,
                transition: boundary.speakerLayout.gridTransition,
                pagesText: document.querySelector('#speakerGridManualPagesInput').value
            };
        }""")
        preview = await page.evaluate("""() => {
            document.querySelector('#speakerCueSelectAllBtn').click();
            const toggle = document.querySelector('#speakerCueBulkGridCropToggle');
            toggle.checked = true;
            toggle.dispatchEvent(new Event('change', { bubbles: true }));
            [['#speakerGridCropXInput','14'],['#speakerGridCropYInput','-9'],['#speakerGridCropZoomInput','121']].forEach(([selector,value]) => {
                const node = document.querySelector(selector);
                node.value = value;
                node.dispatchEvent(new Event('input', { bubbles: true }));
            });
            const text = document.querySelector('#speakerCueBulkPreviewText').textContent.trim();
            document.querySelector('#speakerCueBulkApplyBtn').click();
            return text;
        }""")
        await page.wait_for_function("() => AIShortsAppState.state.smartReframe.speakerCues.every(cue => cue.gridCrop?.x === .14 && cue.gridCrop?.y === -.09 && cue.gridCrop?.zoom === 1.21)", timeout=10000)
        bulk = await page.evaluate("""() => ({
            selected: document.querySelector('#speakerCueSelectedCount').textContent.trim(),
            crops: AIShortsAppState.state.smartReframe.speakerCues.map(cue => cue.gridCrop),
            overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
        })""")
        await context.close()
        await browser.close()

    checks = {
        'energyImmediateSelection': energy['trigger'] == 'energy' and energy['ids'] == ['subject-1','subject-3','subject-5','subject-6'] and '에너지 즉시 전환' in energy['status'],
        'manualPageOrder': manual['first'] == ['subject-1','subject-5','subject-3'] and manual['second'] == ['subject-1','subject-6','subject-2','subject-4'],
        'slideTransitionState': manual['transition'] == 'slide' and manual['previous'] == ['subject-1','subject-5','subject-3'] and 0 < manual['progress'] < 1,
        'manualPagesPersistInUi': 'subject-1,subject-5,subject-3' in manual['pagesText'],
        'bulkGridCropPreview': '셀 crop X 14%' in preview and '확대 121%' in preview,
        'bulkGridCropApplied': len(bulk['crops']) == 6 and all(abs(item['x']-.14)<.001 and abs(item['y']+.09)<.001 and abs(item['zoom']-1.21)<.001 for item in bulk['crops']),
        'selectionClearedAfterApply': bulk['selected'] == '선택 0개',
        'viewportContained': bulk['overflow'] <= 1,
        'noRuntimeErrors': not errors and not console_errors,
    }
    report = {
        'version': VERSION,
        'generatedAt': dt.datetime.now(dt.timezone.utc).isoformat(),
        'energy': energy,
        'manual': manual,
        'bulkPreview': preview,
        'bulk': bulk,
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
