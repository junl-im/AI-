#!/usr/bin/env python3
"""Real-video Chromium audit for the smart-reframe director user flow."""
from __future__ import annotations

import argparse
import asyncio
import datetime as dt
import json
import tempfile
from pathlib import Path

from playwright.async_api import async_playwright

from run_media_e2e import ROOT, build_inline_html, make_media

VERSION = json.loads((ROOT / 'package.json').read_text(encoding='utf-8'))['version']
OUTPUT = ROOT / 'qa' / f'runtime-smart-reframe-browser-v{VERSION}.json'


async def run_audit(media: Path) -> dict:
    errors: list[str] = []
    console_errors: list[str] = []
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(
            headless=True,
            executable_path='/usr/bin/chromium',
            args=['--no-sandbox', '--autoplay-policy=no-user-gesture-required']
        )
        page = await browser.new_page(viewport={'width': 1440, 'height': 1100})
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('console', lambda message: console_errors.append(message.text) if message.type == 'error' else None)
        await page.set_content(build_inline_html(), wait_until='load', timeout=30000)
        await page.set_input_files('#fileInput', str(media))
        await page.wait_for_function(
            "() => Boolean(AIShortsAppState.state.motionAnalysis) && !AIShortsAppState.state.isAnalyzing",
            timeout=60000
        )
        await page.select_option('#cropModeSelect', 'smart')
        await page.dispatch_event('#cropModeSelect', 'change')
        await page.wait_for_function("() => Boolean(AIShortsAppState.state.smartReframe)", timeout=10000)
        motion = await page.evaluate("""() => ({
            cropMode: AIShortsAppState.state.settings.cropMode,
            source: AIShortsAppState.state.smartReframe?.source || '',
            points: AIShortsAppState.state.smartReframe?.points?.length || 0,
            sceneCuts: AIShortsAppState.state.smartReframe?.sceneCuts?.length || 0,
            panelHidden: document.querySelector('#smartReframePanel')?.hidden,
            status: document.querySelector('#smartReframeStatus')?.textContent?.trim() || '',
            detail: document.querySelector('#smartReframeDetail')?.textContent?.trim() || ''
        })""")
        await page.evaluate("""() => AIShortsSmartReframe.registerDetectorProvider({
            name: 'browser-audit-two-face-detector',
            async detect(frame, meta) {
                const time = Number(meta?.time || 0);
                return [
                    { x: 0.12 + (time % 2) * 0.015, y: 0.14, width: 0.20, height: 0.32, confidence: 0.94 },
                    { x: 0.66 - (time % 2) * 0.012, y: 0.16, width: 0.18, height: 0.30, confidence: 0.91 }
                ];
            }
        })""")
        await page.click('#smartReframeAnalyzeBtn')
        await page.wait_for_function(
            "() => !AIShortsAppState.state.isReframing && Number(AIShortsAppState.state.smartReframe?.summary?.faceCoverage || 0) > 0",
            timeout=60000
        )
        await page.evaluate("""() => {
            if (window.AIShortsFlowDirectorFinal?.setActive) window.AIShortsFlowDirectorFinal.setActive('recommend', { force: true, source: 'smart-reframe-audit' });
        }""")
        await page.wait_for_timeout(120)
        await page.locator('#smartReframeEditor').evaluate('(node) => { node.open = true; }')
        await page.wait_for_function("() => document.querySelectorAll('#smartReframeSubjectSelect option').length >= 3", timeout=10000)
        subject_id = await page.evaluate("() => AIShortsAppState.state.smartReframe?.subjects?.[1]?.id || AIShortsAppState.state.smartReframe?.subjects?.[0]?.id || ''")
        await page.select_option('#smartReframeSubjectSelect', subject_id)
        await page.wait_for_function("(id) => AIShortsAppState.state.smartReframe?.activeSubjectId === id", arg=subject_id, timeout=10000)
        await page.evaluate("""() => {
            const video = document.querySelector('#sourceVideo');
            video.currentTime = 5;
            video.dispatchEvent(new Event('seeked'));
        }""")
        await page.locator('#smartReframeXInput').fill('72')
        await page.locator('#smartReframeYInput').fill('31')
        await page.locator('#smartReframeZoomInput').fill('118')
        await page.click('#smartReframeKeyframeSetBtn')
        await page.wait_for_function("() => AIShortsAppState.state.smartReframe?.keyframes?.length === 1", timeout=10000)
        edited = await page.evaluate("""() => {
            const track = AIShortsAppState.state.smartReframe;
            const focus = AIShortsSmartReframe.getFocusAt(track, 5);
            return {
                source: track?.source || '',
                points: track?.points?.length || 0,
                faceCoverage: track?.summary?.faceCoverage || 0,
                subjectCount: track?.subjects?.length || 0,
                activeSubjectId: track?.activeSubjectId || '',
                keyframes: track?.keyframes?.length || 0,
                focusX: focus?.x || 0,
                focusY: focus?.y || 0,
                focusZoom: focus?.zoom || 0,
                manualDataset: document.querySelector('#smartReframePanel')?.dataset?.manual || '',
                status: document.querySelector('#smartReframeStatus')?.textContent?.trim() || '',
                progress: document.querySelector('#analysisStatus')?.textContent?.trim() || '',
                operationActive: AIShortsOperationCoordinator.snapshot().active.some(item => item.channel === 'smart-reframe')
            };
        }""")
        await page.click('#smartReframeKeyframeDeleteBtn')
        await page.wait_for_function("() => AIShortsAppState.state.smartReframe?.keyframes?.length === 0", timeout=10000)
        deleted = await page.evaluate("""() => ({
            keyframes: AIShortsAppState.state.smartReframe?.keyframes?.length || 0,
            persistedKeyframes: AIShortsAppState.state.smartReframeEdits?.keyframes?.length || 0,
            activeSubjectId: AIShortsAppState.state.smartReframeEdits?.subjectId || ''
        })""")
        await page.select_option('#smartReframeSubjectSelect', 'auto')
        await page.wait_for_function("() => AIShortsAppState.state.smartReframe?.activeSubjectId === 'auto'", timeout=10000)
        await page.evaluate("""async () => {
            await AIShortsStudioApp.linkSpeakerFaces([
                { start: 0.2, end: 1.25, text: '첫 번째 화자', speaker: 'SPEAKER_00' },
                { start: 1.6, end: 2.8, text: '두 번째 화자', speaker: 'SPEAKER_01' }
            ], 'browser-audit');
        }""")
        speaker = await page.evaluate("""() => {
            const track = AIShortsAppState.state.smartReframe;
            const cues = track?.speakerCues || [];
            const first = AIShortsSmartReframe.getFocusAt(track, 0.7);
            const second = AIShortsSmartReframe.getFocusAt(track, 2.2);
            return {
                cueCount: cues.length,
                linkedCount: cues.filter(cue => cue.subjectId !== 'auto').length,
                distinctSubjects: [...new Set(cues.filter(cue => cue.subjectId !== 'auto').map(cue => cue.subjectId))].length,
                firstSource: first?.source || '',
                secondSource: second?.source || '',
                firstSubjectId: first?.subjectId || '',
                secondSubjectId: second?.subjectId || '',
                status: document.querySelector('#smartReframeSpeakerStatus')?.textContent?.trim() || '',
                persistedCueCount: AIShortsAppState.state.smartReframeEdits?.speakerCues?.length || 0,
                priorityEnabled: AIShortsAppState.state.smartReframeEdits?.speakerPriority !== false
            };
        }""")
        await page.locator('#speakerFaceTuningPanel').evaluate('(node) => { node.open = true; }')
        await page.click('#speakerFacePrevBtn')
        tuning_target = await page.evaluate("""() => {
            const cues = AIShortsAppState.state.smartReframe?.speakerCues || [];
            const subjects = AIShortsAppState.state.smartReframe?.subjects || [];
            const first = cues[0];
            const alternate = subjects.find(subject => subject.id !== first?.subjectId) || subjects[0];
            return { before: first?.subjectId || '', alternate: alternate?.id || '' };
        }""")
        await page.select_option('#speakerFaceSubjectSelect', tuning_target['alternate'])
        await page.check('#speakerFaceLockToggle')
        await page.click('#speakerFaceApplyBtn')
        await page.wait_for_function("(id) => AIShortsAppState.state.smartReframe?.speakerCues?.[0]?.locked === true && AIShortsAppState.state.smartReframe?.speakerCues?.[0]?.subjectId === id", arg=tuning_target['alternate'], timeout=10000)
        await page.evaluate("""async () => {
            await AIShortsStudioApp.linkSpeakerFaces([
                { start: 0.2, end: 1.25, text: '첫 번째 화자', speaker: 'SPEAKER_00' },
                { start: 1.6, end: 2.8, text: '두 번째 화자', speaker: 'SPEAKER_01' }
            ], 'browser-audit-relink');
        }""")
        tuning_locked = await page.evaluate("""() => {
            const cue = AIShortsAppState.state.smartReframe?.speakerCues?.[0];
            const focus = AIShortsSmartReframe.getFocusAt(AIShortsAppState.state.smartReframe, 0.7);
            return {
                subjectId: cue?.subjectId || '',
                locked: cue?.locked === true,
                mode: cue?.mode || '',
                source: cue?.source || '',
                focusSubjectId: focus?.subjectId || '',
                panelState: document.querySelector('#speakerFaceTuningPanel')?.dataset?.state || '',
                confidence: document.querySelector('#speakerFaceConfidenceValue')?.textContent?.trim() || ''
            };
        }""")
        await page.click('#speakerFaceAutoBtn')
        await page.wait_for_function("() => AIShortsAppState.state.smartReframe?.speakerCues?.[0]?.locked === false", timeout=10000)
        tuning_auto = await page.evaluate("""() => {
            const cue = AIShortsAppState.state.smartReframe?.speakerCues?.[0];
            return { locked: cue?.locked === true, mode: cue?.mode || '', source: cue?.source || '', persistedLocked: AIShortsAppState.state.smartReframeEdits?.speakerCues?.[0]?.locked === true };
        }""")
        overlap_target = await page.evaluate("""() => {
            const cues = AIShortsAppState.state.smartReframe?.speakerCues || [];
            const subjects = AIShortsAppState.state.smartReframe?.subjects || [];
            const first = cues[0];
            const primary = subjects.find(subject => subject.id === first?.subjectId) || subjects[0];
            const alternate = subjects.find(subject => subject.id !== primary?.id) || subjects[1] || subjects[0];
            return { primary: primary?.id || '', secondary: alternate?.id || '' };
        }""")
        await page.select_option('#speakerFaceSubjectSelect', overlap_target['primary'])
        await page.select_option('#speakerCuePrioritySelect', 'primary')
        await page.check('#speakerFaceLockToggle')
        await page.click('#speakerFaceApplyBtn')
        await page.click('#speakerCueOverlapBtn')
        await page.wait_for_function("() => (AIShortsAppState.state.smartReframe?.speakerCues?.length || 0) === 3", timeout=10000)
        await page.select_option('#speakerFaceSubjectSelect', overlap_target['secondary'])
        await page.select_option('#speakerCuePrioritySelect', 'secondary')
        await page.check('#speakerFaceLockToggle')
        await page.click('#speakerFaceApplyBtn')
        await page.wait_for_function("(id) => AIShortsSmartReframe.getFocusAt(AIShortsAppState.state.smartReframe, .7)?.source === 'speaker-dual-face' && AIShortsAppState.state.smartReframe?.speakerCues?.some(cue => cue.subjectId === id && cue.priority === 'secondary')", arg=overlap_target['secondary'], timeout=10000)
        overlap = await page.evaluate("""() => {
            const track = AIShortsAppState.state.smartReframe;
            const focus = AIShortsSmartReframe.getFocusAt(track, .7);
            const chips = [...document.querySelectorAll('#speakerFaceConfidenceHistory span')].map(node => node.textContent?.trim() || '');
            return {
                cueCount: track?.speakerCues?.length || 0,
                source: focus?.source || '',
                subjects: (focus?.dualSubjects || []).map(item => item.subjectId),
                priorities: (focus?.dualSubjects || []).map(item => item.speakerPriority),
                historyCount: chips.length,
                overlapButtonVisible: Boolean(document.querySelector('#speakerCueOverlapBtn')),
                status: document.querySelector('#smartReframeSpeakerStatus')?.textContent?.trim() || ''
            };
        }""")
        await page.select_option('#speakerPaneOrientationSelect', 'horizontal')
        await page.wait_for_function("() => AIShortsAppState.state.smartReframe?.speakerLayout?.orientation === 'horizontal'", timeout=10000)
        await page.locator('#speakerPaneSplitInput').fill('62')
        await page.dispatch_event('#speakerPaneSplitInput', 'change')
        await page.select_option('#speakerPanePositionSelect', 'right')
        await page.wait_for_function("() => AIShortsAppState.state.smartReframe?.speakerLayout?.orientation === 'horizontal' && AIShortsAppState.state.smartReframe?.speakerLayout?.split === .62 && AIShortsAppState.state.smartReframe?.speakerLayout?.primaryPosition === 'right'", timeout=10000)
        await page.evaluate("() => { const panel = document.querySelector('#speakerFaceTuningPanel'); if (panel) panel.open = true; }")
        await page.locator('#speakerPaneLayoutPreview').scroll_into_view_if_needed()
        await page.wait_for_timeout(100)
        preview_box = await page.locator('#speakerPaneLayoutPreview').bounding_box()
        divider_box = await page.locator('#speakerPaneDividerControl').bounding_box()
        if preview_box and divider_box:
            await page.mouse.move(divider_box['x'] + divider_box['width'] / 2, divider_box['y'] + divider_box['height'] / 2)
            await page.mouse.down()
            await page.mouse.move(preview_box['x'] + preview_box['width'] * .40, preview_box['y'] + preview_box['height'] / 2, steps=4)
            await page.mouse.up()
        drag_split = await page.evaluate("() => AIShortsAppState.state.smartReframe?.speakerLayout?.split || 0")
        await page.locator('#speakerPaneDividerControl').focus()
        await page.keyboard.press('ArrowRight')
        await page.keyboard.press('ArrowRight')
        expected_keyboard_split = min(.65, round(drag_split * 100 + 2) / 100)
        await page.wait_for_function("(expected) => Math.abs((AIShortsAppState.state.smartReframe?.speakerLayout?.split || 0) - expected) < .001", arg=expected_keyboard_split, timeout=10000)
        layout = await page.evaluate("""() => {
            const track = AIShortsAppState.state.smartReframe;
            const focus = AIShortsSmartReframe.getFocusAt(track, .7);
            const divider = document.querySelector('#speakerPaneDividerControl');
            const preview = document.querySelector('#speakerPaneLayoutPreview');
            return {
                orientation: track?.speakerLayout?.orientation || '',
                split: track?.speakerLayout?.split || 0,
                primaryPosition: track?.speakerLayout?.primaryPosition || '',
                focusOrientation: focus?.speakerLayout?.orientation || '',
                focusSplit: focus?.speakerLayout?.split || 0,
                focusPosition: focus?.speakerLayout?.primaryPosition || '',
                output: document.querySelector('#speakerPaneSplitValue')?.textContent?.trim() || '',
                dividerOrientation: divider?.getAttribute('aria-orientation') || '',
                dividerValue: divider?.getAttribute('aria-valuenow') || '',
                previewOrientation: preview?.dataset?.orientation || '',
                previewPosition: preview?.dataset?.primaryPosition || '',
                dragSplit: Number(window.__speakerDividerDragSplit || 0)
            };
        }""")
        cards = page.locator('.speaker-cue-card input[type="checkbox"]')
        await cards.nth(0).click()
        await page.locator('.speaker-cue-card input[type="checkbox"]').nth(1).click(modifiers=['Shift'])
        await page.wait_for_function("() => document.querySelector('#speakerCueSelectedCount')?.textContent?.includes('2개')", timeout=10000)
        await page.check('#speakerCueBulkShiftToggle')
        await page.check('#speakerCueBulkLabelToggle')
        await page.locator('#speakerCueBulkShiftInput').fill('0.1')
        await page.locator('#speakerCueBulkLabelInput').fill('일괄 화자')
        bulk_preview = await page.evaluate("""() => ({
            state: document.querySelector('#speakerCueBulkPreview')?.dataset?.state || '',
            text: document.querySelector('#speakerCueBulkPreviewText')?.textContent?.trim() || '',
            disabled: Boolean(document.querySelector('#speakerCueBulkApplyBtn')?.disabled)
        })""")
        before_bulk = await page.evaluate("() => (AIShortsAppState.state.smartReframe?.speakerCues || []).map(cue => ({ start: cue.start, speaker: cue.speaker, subjectId: cue.subjectId, priority: cue.priority }))")
        await page.click('#speakerCueBulkApplyBtn')
        await page.wait_for_function("() => (AIShortsAppState.state.smartReframe?.speakerCues || []).filter(cue => cue.speaker === '일괄 화자').length === 2", timeout=10000)
        after_bulk = await page.evaluate("() => (AIShortsAppState.state.smartReframe?.speakerCues || []).map(cue => ({ start: cue.start, speaker: cue.speaker, subjectId: cue.subjectId, priority: cue.priority }))")
        await page.click('#speakerCueUndoBtn')
        await page.wait_for_function("() => (AIShortsAppState.state.smartReframe?.speakerCues || []).filter(cue => cue.speaker === '일괄 화자').length === 0", timeout=10000)
        after_undo = await page.evaluate("() => (AIShortsAppState.state.smartReframe?.speakerCues || []).map(cue => ({ start: cue.start, speaker: cue.speaker }))")
        await page.click('#speakerCueRedoBtn')
        await page.wait_for_function("() => (AIShortsAppState.state.smartReframe?.speakerCues || []).filter(cue => cue.speaker === '일괄 화자').length === 2", timeout=10000)
        after_redo = await page.evaluate("() => (AIShortsAppState.state.smartReframe?.speakerCues || []).map(cue => ({ start: cue.start, speaker: cue.speaker }))")
        await browser.close()

    checks = {
        'motionTrackAutoCreated': motion['cropMode'] == 'smart' and motion['source'] == 'motion' and motion['points'] > 0,
        'panelVisibleForSmartVideo': motion['panelHidden'] is False,
        'motionStatusVisible': '모션 추적' in motion['status'],
        'faceDetectorPromotesTrack': edited['source'] == 'face' and edited['faceCoverage'] == 1 and edited['points'] > 0,
        'multipleSubjectsDetected': edited['subjectCount'] >= 2,
        'manualSubjectPinWorks': bool(subject_id) and edited['activeSubjectId'] == subject_id and deleted['activeSubjectId'] == subject_id,
        'keyframeCreateDeleteWorks': edited['keyframes'] == 1 and abs(edited['focusX'] - 0.72) < 0.001 and abs(edited['focusY'] - 0.31) < 0.001 and abs(edited['focusZoom'] - 1.18) < 0.001 and deleted['keyframes'] == 0 and deleted['persistedKeyframes'] == 0,
        'manualStateVisible': edited['manualDataset'] == 'true',
        'speakerFacesLinked': speaker['cueCount'] == 2 and speaker['linkedCount'] == 2 and speaker['distinctSubjects'] == 2,
        'speakerDirectionChangesCrop': speaker['firstSource'] == 'speaker-face' and speaker['secondSource'] == 'speaker-face' and speaker['firstSubjectId'] != speaker['secondSubjectId'],
        'speakerDirectionPersists': speaker['persistedCueCount'] == 2 and speaker['priorityEnabled'] is True,
        'speakerStatusVisible': '발화 2구간' in speaker['status'] and '전환' in speaker['status'],
        'speakerCueManualOverrideWorks': tuning_target['alternate'] != tuning_target['before'] and tuning_locked['subjectId'] == tuning_target['alternate'] and tuning_locked['focusSubjectId'] == tuning_target['alternate'],
        'speakerCueLockSurvivesRelink': tuning_locked['locked'] is True and tuning_locked['mode'] == 'manual' and tuning_locked['source'] == 'manual-override' and tuning_locked['panelState'] == 'manual',
        'speakerCueConfidenceVisible': tuning_locked['confidence'].endswith('%'),
        'speakerCueReturnsToAuto': tuning_auto['locked'] is False and tuning_auto['mode'] == 'auto' and tuning_auto['source'] != 'manual-override' and tuning_auto['persistedLocked'] is False,
        'overlappingSpeakersUseDualFaceLayout': overlap['cueCount'] == 3 and overlap['source'] == 'speaker-dual-face' and len(set(overlap['subjects'])) == 2 and overlap['priorities'][0] == 'primary' and overlap['priorities'][1] == 'secondary',
        'speakerConfidenceHistoryVisible': overlap['historyCount'] >= 2 and overlap['overlapButtonVisible'] is True,
        'adjustableSpeakerPaneLayoutWorks': layout['orientation'] == 'horizontal' and abs(layout['split'] - expected_keyboard_split) < .001 and layout['primaryPosition'] == 'right' and layout['focusOrientation'] == 'horizontal' and abs(layout['focusSplit'] - expected_keyboard_split) < .001 and layout['focusPosition'] == 'right' and layout['output'] == f"{round(expected_keyboard_split * 100)}%",
        'directDividerPointerKeyboardWorks': abs(drag_split - .6) <= .011 and layout['dividerOrientation'] == 'vertical' and layout['dividerValue'] == str(round(expected_keyboard_split * 100)) and layout['previewOrientation'] == 'horizontal' and layout['previewPosition'] == 'right',
        'bulkEditPreviewMatchesPatch': bulk_preview['state'] == 'ready' and '2개 구간' in bulk_preview['text'] and '시간 +0.10초' in bulk_preview['text'] and '라벨 “일괄 화자”' in bulk_preview['text'] and bulk_preview['disabled'] is False,
        'multiCueBulkEditWorks': sum(1 for cue in after_bulk if cue['speaker'] == '일괄 화자') == 2 and any(abs(cue['start'] - .3) < .001 for cue in after_bulk),
        'selectiveBulkPreservesUncheckedFields': sorted((cue['subjectId'], cue['priority']) for cue in before_bulk[:2]) == sorted((cue['subjectId'], cue['priority']) for cue in after_bulk if cue['speaker'] == '일괄 화자'),
        'speakerTimelineUndoRedoWorks': all(cue['speaker'] != '일괄 화자' for cue in after_undo) and sum(1 for cue in after_redo if cue['speaker'] == '일괄 화자') == 2,
        'overlapStatusVisible': '동시 발화' in overlap['status'],
        'progressCompletes': '스마트 리프레임 준비 완료' in edited['progress'],
        'operationReleased': edited['operationActive'] is False,
        'noPageErrors': not errors,
        'noConsoleErrors': not console_errors
    }
    return {
        'version': VERSION,
        'generatedAt': dt.datetime.now(dt.timezone.utc).isoformat(),
        'harness': 'real 20-second MP4 import, motion fallback, explicit two-face detector, manual subject pin, crop-keyframe create/delete, local transcript speaker-face switching, overlap dual-face composition, horizontal pane layout, direct pointer/keyboard divider, Shift/touch range selection, bulk edit preview, selective multi-cue bulk edit, timeline undo/redo, confidence history, per-segment manual lock/auto restore, and operation cleanup',
        'motion': motion,
        'edited': edited,
        'deleted': deleted,
        'speaker': speaker,
        'speakerTuning': { 'target': tuning_target, 'locked': tuning_locked, 'auto': tuning_auto, 'overlapTarget': overlap_target, 'overlap': overlap, 'layout': dict(layout, dragSplit=drag_split), 'bulkPreview': bulk_preview, 'beforeBulk': before_bulk, 'afterBulk': after_bulk, 'afterUndo': after_undo, 'afterRedo': after_redo },
        'checks': checks,
        'passed': all(checks.values()),
        'pageErrors': errors,
        'consoleErrors': console_errors
    }


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--workdir', type=Path)
    parser.add_argument('--media', type=Path)
    parser.add_argument('--keep-workdir', action='store_true')
    args = parser.parse_args()
    temporary = None
    if args.media:
        media = args.media.resolve()
    else:
        if args.workdir:
            folder = args.workdir.resolve()
        else:
            temporary = tempfile.TemporaryDirectory(prefix='ai-shorts-smart-reframe-browser-')
            folder = Path(temporary.name)
        _, media, _ = make_media(folder, {'video'})
    report = await run_audit(media)
    OUTPUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(OUTPUT)
    print(json.dumps(report['checks'], ensure_ascii=False, indent=2))
    if temporary and not args.keep_workdir:
        temporary.cleanup()
    if not report['passed']:
        raise SystemExit(1)


if __name__ == '__main__':
    asyncio.run(main())
