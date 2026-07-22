#!/usr/bin/env python3
"""Real 15/30-minute 1080p MP4 replacement, analysis, render, and cleanup audit.

This audit is intentionally optional because it launches Chromium, synthesizes
long media with ffmpeg, performs repeated analysis and short exports, and forces
V8 garbage collection through CDP. Normal npm QA validates the committed report.
"""
from __future__ import annotations

import argparse
import asyncio
import datetime as dt
import json
import shutil
import subprocess
import tempfile
import time
from pathlib import Path

from playwright.async_api import async_playwright

from run_media_e2e import ROOT, build_inline_html, probe_media

PACKAGE = json.loads((ROOT / 'package.json').read_text(encoding='utf-8'))
VERSION = PACKAGE['version']
OUTPUT = ROOT / 'qa' / f'runtime-long-video-stability-v{VERSION}.json'

TRACKER_SCRIPT = r"""
<script data-source="long-video-object-url-tracker">
(() => {
    const create = URL.createObjectURL.bind(URL);
    const revoke = URL.revokeObjectURL.bind(URL);
    const active = new Map();
    let created = 0;
    let revoked = 0;
    URL.createObjectURL = value => {
        const url = create(value);
        created += 1;
        active.set(url, value instanceof File ? 'source' : 'export');
        return url;
    };
    URL.revokeObjectURL = url => {
        if (active.delete(url)) revoked += 1;
        return revoke(url);
    };
    window.__longVideoUrls = {
        snapshot() {
            const values = Array.from(active.values());
            return {
                created,
                revoked,
                active: active.size,
                sourceActive: values.filter(value => value === 'source').length,
                exportActive: values.filter(value => value === 'export').length
            };
        }
    };
})();
</script>
"""


def instrumented_html() -> str:
    return build_inline_html().replace('</head>', TRACKER_SCRIPT + '</head>')


def media_path(folder: Path, minutes: int) -> Path:
    return folder / f'long-{minutes}m-1080p.mp4'


def make_video(folder: Path, minutes: int) -> Path:
    folder.mkdir(parents=True, exist_ok=True)
    output = media_path(folder, minutes)
    if output.exists():
        return output
    seconds = minutes * 60
    subprocess.run([
        'ffmpeg', '-y', '-hide_banner', '-loglevel', 'error',
        '-f', 'lavfi', '-i', f'testsrc2=size=1920x1080:rate=1:duration={seconds}',
        '-f', 'lavfi', '-i', f'sine=frequency={440 + minutes * 3}:sample_rate=8000:duration={seconds}',
        '-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency',
        '-crf', '42', '-g', '1', '-pix_fmt', 'yuv420p',
        '-c:a', 'aac', '-b:a', '16k', '-ac', '1', '-ar', '8000',
        '-shortest', '-movflags', '+faststart', str(output)
    ], check=True)
    return output


def probe_streams(path: Path) -> dict:
    result = subprocess.run([
        'ffprobe', '-v', 'error',
        '-show_entries', 'stream=index,codec_type,width,height,r_frame_rate,sample_rate,channels:format=duration,size,format_name',
        '-of', 'json', str(path)
    ], check=True, capture_output=True, text=True)
    return json.loads(result.stdout)


def mib(value: int | float) -> float:
    return round(float(value or 0) / 1024 / 1024, 3)


async def snapshot(page, cdp) -> dict:
    await page.evaluate("() => { if (typeof gc === 'function') gc(); }")
    await page.wait_for_timeout(100)
    heap = await cdp.send('Runtime.getHeapUsage')
    state = await page.evaluate("""() => ({
        urls: window.__longVideoUrls?.snapshot?.() || null,
        operations: window.AIShortsOperationCoordinator?.snapshot?.() || null,
        queue: window.AIShortsRenderQueue?.snapshot?.() || null,
        runtime: window.AIShortsRuntimeHealth?.collect?.() || null,
        mediaSessionId: window.AIShortsAppState?.state?.mediaSessionId || 0,
        fileMeta: window.AIShortsAppState?.state?.fileMeta || null,
        retainedAudioBuffer: Boolean(window.AIShortsAppState?.state?.audioBuffer),
        retainedChannelData: Boolean(window.AIShortsAppState?.state?.channelData)
    })""")
    state['heap'] = heap
    state['heapMiB'] = {
        'used': mib(heap.get('usedSize', 0)),
        'total': mib(heap.get('totalSize', 0)),
        'embedderUsed': mib(heap.get('embedderHeapUsedSize', 0)),
        'backingStorage': mib(heap.get('backingStorageSize', 0))
    }
    return state


async def run_cycle(page, cdp, media: Path, minutes: int, output_dir: Path, cycle: int) -> dict:
    previous_session = await page.evaluate("() => AIShortsOperationCoordinator.snapshot().mediaSessionId")
    started = time.perf_counter()
    await page.set_input_files('#fileInput', str(media))
    await page.wait_for_function(
        "previous => AIShortsOperationCoordinator.snapshot().mediaSessionId !== previous",
        arg=previous_session,
        timeout=10000
    )
    await page.wait_for_function(
        "() => Boolean(AIShortsAppState.state.audioAnalysis) && !AIShortsAppState.state.isAnalyzing",
        timeout=180000
    )
    analysis_seconds = time.perf_counter() - started
    analysis = await page.evaluate("""() => ({
        status: document.querySelector('#analysisStatus')?.textContent?.trim() || '',
        fileMeta: AIShortsAppState.state.fileMeta,
        engineMeta: AIShortsAppState.state.engineMeta,
        audioSummary: AIShortsAppState.state.audioAnalysis?.summary || null,
        motionSummary: AIShortsAppState.state.motionAnalysis?.summary || null,
        retainedAudioBuffer: Boolean(AIShortsAppState.state.audioBuffer),
        retainedChannelData: Boolean(AIShortsAppState.state.channelData),
        longMediaDiagnostics: AIShortsAppState.state.diagnostics.filter(item => item.type === 'long-media-budget').slice(-1)
    })""")

    await page.select_option('#durationSelect', '15')
    await page.click('#analyzeBtn')
    await page.wait_for_function(
        "() => AIShortsAppState.state.recommendations.length > 0 && document.querySelectorAll('.recommendation-card').length > 0",
        timeout=20000
    )
    await page.click('.recommendation-card')
    await page.fill('#rangeStartInput', '0')
    await page.fill('#rangeEndInput', '2')
    await page.click('#applyRangeBtn')
    await page.wait_for_function(
        "() => AIShortsAppState.state.selectedRange && AIShortsAppState.state.selectedRange.duration <= 2.05",
        timeout=5000
    )

    render_started = time.perf_counter()
    async with page.expect_download(timeout=45000) as download_info:
        await page.click('#exportBtn')
    download = await download_info.value
    saved = output_dir / f'cycle-{cycle}-{minutes}m-{download.suggested_filename}'
    await download.save_as(str(saved))
    await page.wait_for_function(
        "() => !AIShortsRenderQueue.snapshot().running && AIShortsOperationCoordinator.snapshot().active.length === 0",
        timeout=15000
    )
    render_seconds = time.perf_counter() - render_started
    output_probe = probe_media(saved)
    await page.evaluate("() => AIShortsRenderQueue.clear()")
    await page.wait_for_timeout(350)
    after = await snapshot(page, cdp)
    saved.unlink(missing_ok=True)
    return {
        'cycle': cycle,
        'minutes': minutes,
        'source': probe_streams(media),
        'analysisSeconds': round(analysis_seconds, 3),
        'renderSeconds': round(render_seconds, 3),
        'analysis': analysis,
        'outputProbe': output_probe,
        'after': after
    }


async def run_audit(workdir: Path) -> dict:
    videos = {15: make_video(workdir, 15), 30: make_video(workdir, 30)}
    errors: list[str] = []
    console_errors: list[str] = []
    sequence = [15, 30, 15]
    cycles = []

    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(
            headless=True,
            executable_path='/usr/bin/chromium',
            args=[
                '--no-sandbox',
                '--autoplay-policy=no-user-gesture-required',
                '--js-flags=--expose-gc',
                '--enable-precise-memory-info'
            ]
        )
        context = await browser.new_context(accept_downloads=True, viewport={'width': 1366, 'height': 768})
        page = await context.new_page()
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('console', lambda message: console_errors.append(message.text) if message.type == 'error' else None)
        cdp = await context.new_cdp_session(page)
        await page.set_content(instrumented_html(), wait_until='load', timeout=30000)
        baseline = await snapshot(page, cdp)

        for index, minutes in enumerate(sequence, start=1):
            cycle = await run_cycle(page, cdp, videos[minutes], minutes, workdir, index)
            cycles.append(cycle)
            print(
                f"cycle {index}/{len(sequence)}: {minutes}m analysis={cycle['analysisSeconds']:.3f}s "
                f"render={cycle['renderSeconds']:.3f}s heap={cycle['after']['heapMiB']['used']:.3f}MiB "
                f"urls={cycle['after']['urls']['active'] if cycle['after']['urls'] else 'n/a'}",
                flush=True
            )

        await page.evaluate("""() => {
            window.dispatchEvent(new Event('beforeunload'));
            if (window.AIShortsRenderQueue) AIShortsRenderQueue.clear();
            for (const media of document.querySelectorAll('audio, video')) {
                try { media.pause(); media.removeAttribute('src'); media.load(); } catch (error) {}
            }
        }""")
        await page.wait_for_timeout(1200)
        disposed = await snapshot(page, cdp)
        await context.close()
        await browser.close()

    def stream_for(cycle, kind):
        return next((item for item in cycle['source'].get('streams', []) if item.get('codec_type') == kind), {})

    checks = {
        'completedReplacementSequence': len(cycles) == len(sequence),
        'noPageErrors': not errors,
        'noConsoleErrors': not console_errors,
        'noRuntimeErrors': all(cycle['after']['runtime'] and cycle['after']['runtime'].get('runtimeErrors') == 0 for cycle in cycles),
        'sourceIs1080p': all(stream_for(cycle, 'video').get('width') == 1920 and stream_for(cycle, 'video').get('height') == 1080 for cycle in cycles),
        'sourceDurationsMatch': all(abs(float(cycle['source']['format']['duration']) - cycle['minutes'] * 60) < 0.6 for cycle in cycles),
        'analysisWithinBudget': all(cycle['analysisSeconds'] < 120 for cycle in cycles),
        'longMediaBudgetSelected': all(cycle['analysis']['engineMeta']['budget']['longMedia'] for cycle in cycles),
        'safeSequentialStrategy': all(cycle['analysis']['engineMeta']['analysisStrategy'] == 'sequential-safe' for cycle in cycles),
        'adaptiveSampleRates': all(cycle['analysis']['engineMeta']['budget']['analysisSampleRate'] <= (6000 if cycle['minutes'] == 30 else 8000) for cycle in cycles),
        'boundedMotionSamples': all(cycle['analysis']['motionSummary']['samples'] <= (64 if cycle['minutes'] == 30 else 88) for cycle in cycles),
        'decodedBuffersReleased': all(not cycle['analysis']['retainedAudioBuffer'] and not cycle['analysis']['retainedChannelData'] for cycle in cycles),
        'playableOutputs': all(float(cycle['outputProbe'].get('duration', 0)) > 1 and int(cycle['outputProbe'].get('size', 0)) > 0 for cycle in cycles),
        'operationsReleased': all(not cycle['after']['operations']['active'] for cycle in cycles),
        'renderQueueReleased': all(not cycle['after']['queue']['running'] and cycle['after']['queue']['total'] == 0 for cycle in cycles),
        'singleSourceObjectUrl': all(cycle['after']['urls']['sourceActive'] == 1 for cycle in cycles),
        'boundedExportObjectUrls': all(cycle['after']['urls']['exportActive'] <= 1 for cycle in cycles),
        'objectUrlsReleasedOnDispose': disposed['urls']['active'] == 0,
        'mediaSessionsAdvanced': [cycle['after']['mediaSessionId'] for cycle in cycles] == sorted({cycle['after']['mediaSessionId'] for cycle in cycles})
    }
    return {
        'version': VERSION,
        'generatedAt': dt.datetime.now(dt.timezone.utc).isoformat(),
        'harness': 'same-page Chromium 15m→30m→15m 1920x1080 MP4 replacement, adaptive analysis, 2s render, forced GC, and Object URL tracking',
        'sequenceMinutes': sequence,
        'baseline': baseline,
        'cycles': cycles,
        'disposed': disposed,
        'checks': checks,
        'passed': all(checks.values()),
        'pageErrors': errors,
        'consoleErrors': console_errors
    }


def parse_args():
    parser = argparse.ArgumentParser(description='Run long 1080p MP4 stability audit.')
    parser.add_argument('--workdir', help='Reusable media work directory; defaults to a temporary directory.')
    parser.add_argument('--keep-workdir', action='store_true', help='Keep an automatically-created work directory.')
    return parser.parse_args()


async def main():
    args = parse_args()
    auto_workdir = args.workdir is None
    workdir = Path(args.workdir) if args.workdir else Path(tempfile.mkdtemp(prefix='ai-shorts-long-video-'))
    try:
        report = await run_audit(workdir)
        OUTPUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print(OUTPUT, flush=True)
        if not report['passed']:
            failed = [name for name, passed in report['checks'].items() if not passed]
            raise SystemExit('long video stability audit failed: ' + ', '.join(failed))
    finally:
        if auto_workdir and not args.keep_workdir:
            shutil.rmtree(workdir, ignore_errors=True)


if __name__ == '__main__':
    asyncio.run(main())
