#!/usr/bin/env python3
"""Focused 30-minute 1080p smart-reframe motion audit.

The full 15→30→15 media replacement/render audit remains expensive and is
tracked separately. This focused audit validates the v1.6.5 spatial-motion and
caption-safe crop path against a real 30-minute source with a bounded sample
budget.
"""
from __future__ import annotations

import argparse
import asyncio
import datetime as dt
import json
import tempfile
import time
from pathlib import Path

from playwright.async_api import async_playwright

from run_long_video_stability import ROOT, make_video, probe_streams
from run_media_e2e import build_inline_html

VERSION = json.loads((ROOT / 'package.json').read_text(encoding='utf-8'))['version']
OUTPUT = ROOT / 'qa' / f'runtime-smart-reframe-long-media-v{VERSION}.json'


async def run_audit(media: Path) -> dict:
    page_errors: list[str] = []
    console_errors: list[str] = []
    started = time.perf_counter()
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(
            headless=True,
            executable_path='/usr/bin/chromium',
            args=['--no-sandbox', '--autoplay-policy=no-user-gesture-required']
        )
        context = await browser.new_context(viewport={'width': 1366, 'height': 768})
        page = await context.new_page()
        page.on('pageerror', lambda error: page_errors.append(str(error)))
        page.on('console', lambda message: console_errors.append(message.text) if message.type == 'error' else None)
        await page.set_content(build_inline_html(), wait_until='load', timeout=30000)
        await page.evaluate("""() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.id = 'smartReframeLongAuditInput';
            document.body.append(input);
        }""")
        await page.set_input_files('#smartReframeLongAuditInput', str(media))
        result = await asyncio.wait_for(page.evaluate("""async () => {
            const file = document.querySelector('#smartReframeLongAuditInput').files[0];
            const url = URL.createObjectURL(file);
            const progress = [];
            try {
                const motion = await AIShortsVideoMotionAnalyzer.analyzeVideoMotion(
                    url,
                    (percent, message) => progress.push({ percent, message }),
                    null,
                    { maxSamples: 24 }
                );
                const track = AIShortsSmartReframe.createTrackFromMotion(motion, {
                    captionAvoidance: true,
                    smoothing: 0.30,
                    zoom: 1.08
                });
                const focus = AIShortsSmartReframe.getFocusAt(track, 900);
                const crop = AIShortsSmartReframe.resolveCropRect(
                    1920, 1080, 1080, 1920, focus,
                    { captionAvoidance: true, captionOptions: { position: 'lower' } }
                );
                const score = AIShortsSmartReframe.scoreRange(track, 0, 1800);
                return {
                    motion: {
                        summary: motion.summary,
                        frameCount: motion.frames.length,
                        first: motion.frames[0] || null,
                        middle: motion.frames[Math.floor(motion.frames.length / 2)] || null,
                        last: motion.frames[motion.frames.length - 1] || null
                    },
                    track: {
                        id: track.id,
                        source: track.source,
                        pointCount: track.points.length,
                        summary: track.summary,
                        status: AIShortsSmartReframe.getStatus(track)
                    },
                    focus,
                    crop,
                    score,
                    progress: progress.slice(-8)
                };
            } finally {
                URL.revokeObjectURL(url);
            }
        }"""), timeout=180)
        await context.close()
        await browser.close()

    source = probe_streams(media)
    elapsed = round(time.perf_counter() - started, 3)
    stream = next((item for item in source.get('streams', []) if item.get('codec_type') == 'video'), {})
    duration = float(source.get('format', {}).get('duration', 0) or 0)
    crop = result['crop']
    checks = {
        'realThirtyMinuteSource': abs(duration - 1800) < 0.6,
        'sourceIs1080p': stream.get('width') == 1920 and stream.get('height') == 1080,
        'boundedSpatialSamples': result['motion']['frameCount'] == 24 and result['motion']['summary'].get('samples') == 24,
        'spatialFieldsPresent': all(
            item is not None and all(key in item for key in ('motionX', 'motionY', 'spatialConfidence', 'motionSpread'))
            for item in (result['motion']['first'], result['motion']['middle'], result['motion']['last'])
        ),
        'trackMatchesSamples': result['track']['pointCount'] == 24 and result['track']['summary'].get('samples') == 24,
        'motionFallbackReady': result['track']['source'] == 'motion' and result['track']['status'].get('ready') is True,
        'captionSafeTrack': result['track']['summary'].get('captionSafe') is True,
        'cropWithinSource': crop['sx'] >= 0 and crop['sy'] >= 0 and crop['sw'] > 0 and crop['sh'] > 0 and crop['sx'] + crop['sw'] <= 1920.001 and crop['sy'] + crop['sh'] <= 1080.001,
        'verticalCropRatio': abs((crop['sw'] / crop['sh']) - (1080 / 1920)) < 0.001,
        'completedWithinBudget': elapsed < 120,
        'noPageErrors': not page_errors,
        'noConsoleErrors': not console_errors
    }
    return {
        'version': VERSION,
        'generatedAt': dt.datetime.now(dt.timezone.utc).isoformat(),
        'harness': 'real 30-minute 1920x1080 MP4, 24 bounded spatial-motion samples, motion-track creation, midpoint interpolation, and caption-safe 9:16 crop',
        'elapsedSeconds': elapsed,
        'source': source,
        'result': result,
        'checks': checks,
        'passed': all(checks.values()),
        'pageErrors': page_errors,
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
            workdir = args.workdir.resolve()
            workdir.mkdir(parents=True, exist_ok=True)
        else:
            temporary = tempfile.TemporaryDirectory(prefix='ai-shorts-smart-reframe-long-')
            workdir = Path(temporary.name)
        media = make_video(workdir, 30)
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
