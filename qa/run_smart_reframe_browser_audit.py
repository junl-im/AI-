#!/usr/bin/env python3
"""Real-video Chromium audit for the smart-reframe user flow."""
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
        page = await browser.new_page(viewport={'width': 1440, 'height': 1000})
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
            panelHidden: document.querySelector('#smartReframePanel')?.hidden,
            status: document.querySelector('#smartReframeStatus')?.textContent?.trim() || '',
            detail: document.querySelector('#smartReframeDetail')?.textContent?.trim() || ''
        })""")
        await page.evaluate("""() => AIShortsSmartReframe.registerDetectorProvider({
            name: 'browser-audit-face-detector',
            async detect(frame, meta) {
                return [{
                    x: 0.55 + (Number(meta?.time || 0) % 2) * 0.05,
                    y: 0.12,
                    width: 0.18,
                    height: 0.30,
                    confidence: 0.92
                }];
            }
        })""")
        await page.click('#smartReframeAnalyzeBtn')
        await page.wait_for_function(
            "() => !AIShortsAppState.state.isReframing && Number(AIShortsAppState.state.smartReframe?.summary?.faceCoverage || 0) > 0",
            timeout=60000
        )
        face = await page.evaluate("""() => ({
            source: AIShortsAppState.state.smartReframe?.source || '',
            points: AIShortsAppState.state.smartReframe?.points?.length || 0,
            faceCoverage: AIShortsAppState.state.smartReframe?.summary?.faceCoverage || 0,
            status: document.querySelector('#smartReframeStatus')?.textContent?.trim() || '',
            progress: document.querySelector('#analysisStatus')?.textContent?.trim() || '',
            operationActive: AIShortsOperationCoordinator.snapshot().active.some(item => item.channel === 'smart-reframe')
        })""")
        await browser.close()

    checks = {
        'motionTrackAutoCreated': motion['cropMode'] == 'smart' and motion['source'] == 'motion' and motion['points'] > 0,
        'panelVisibleForSmartVideo': motion['panelHidden'] is False,
        'motionStatusVisible': '모션 추적' in motion['status'],
        'faceDetectorPromotesTrack': face['source'] == 'face' and face['faceCoverage'] == 1 and face['points'] > 0,
        'faceStatusVisible': '얼굴 추적' in face['status'],
        'progressCompletes': '스마트 리프레임 준비 완료' in face['progress'],
        'operationReleased': face['operationActive'] is False,
        'noPageErrors': not errors,
        'noConsoleErrors': not console_errors
    }
    return {
        'version': VERSION,
        'generatedAt': dt.datetime.now(dt.timezone.utc).isoformat(),
        'harness': 'real 20-second MP4 import, motion fallback selection, explicit local face detector registration, face-track promotion, and operation cleanup',
        'motion': motion,
        'face': face,
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
