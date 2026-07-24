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
        'progressCompletes': '스마트 리프레임 준비 완료' in edited['progress'],
        'operationReleased': edited['operationActive'] is False,
        'noPageErrors': not errors,
        'noConsoleErrors': not console_errors
    }
    return {
        'version': VERSION,
        'generatedAt': dt.datetime.now(dt.timezone.utc).isoformat(),
        'harness': 'real 20-second MP4 import, motion fallback, explicit two-face detector, manual subject pin, crop-keyframe create/delete, local transcript speaker-face switching, and operation cleanup',
        'motion': motion,
        'edited': edited,
        'deleted': deleted,
        'speaker': speaker,
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
