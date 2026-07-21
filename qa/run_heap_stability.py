#!/usr/bin/env python3
"""Run a repeat-media Chromium heap trend audit for AI Shorts Studio.

This audit is intentionally separate from npm test because it launches Chromium,
generates real media with ffmpeg, renders downloads, and forces V8 garbage
collection through CDP. The committed JSON artifact is checked by a fast smoke
test during normal QA.
"""
import argparse
import asyncio
import datetime
import json
import shutil
import statistics
import subprocess
import tempfile
from pathlib import Path

from playwright.async_api import async_playwright

from run_media_e2e import ROOT, build_inline_html

PACKAGE = json.loads((ROOT / 'package.json').read_text(encoding='utf-8'))
VERSION = PACKAGE['version']
OUTPUT = ROOT / 'qa' / f'runtime-heap-stability-v{VERSION}.json'

TRACKER_SCRIPT = r"""
<script data-source="heap-stability-object-url-tracker">
(() => {
    const nativeCreate = URL.createObjectURL.bind(URL);
    const nativeRevoke = URL.revokeObjectURL.bind(URL);
    const active = new Map();
    let created = 0;
    let revoked = 0;
    URL.createObjectURL = function (value) {
        const url = nativeCreate(value);
        created += 1;
        active.set(url, value instanceof File ? 'source' : 'export');
        return url;
    };
    URL.revokeObjectURL = function (url) {
        if (active.delete(url)) revoked += 1;
        return nativeRevoke(url);
    };
    window.__heapAuditObjectUrls = {
        snapshot() {
            return {
                created,
                revoked,
                active: active.size,
                sourceActive: Array.from(active.values()).filter(kind => kind === 'source').length,
                exportActive: Array.from(active.values()).filter(kind => kind === 'export').length,
                activeUrls: Array.from(active.entries()).map(([url, kind]) => ({ url, kind }))
            };
        }
    };
})();
</script>
"""


def instrumented_html() -> str:
    return build_inline_html().replace('</head>', TRACKER_SCRIPT + '</head>')


def make_cycle_media(folder: Path) -> Path:
    folder.mkdir(parents=True, exist_ok=True)
    media_path = folder / 'heap-cycle-16s.mp3'
    if not media_path.exists():
        subprocess.run([
            'ffmpeg', '-y', '-hide_banner', '-loglevel', 'error',
            '-f', 'lavfi', '-i', 'sine=frequency=440:duration=16',
            '-f', 'lavfi', '-i', 'anoisesrc=color=pink:duration=16:amplitude=0.04',
            '-filter_complex', '[0:a][1:a]amix=inputs=2:duration=first,volume=0.75',
            '-c:a', 'libmp3lame', '-b:a', '96k', str(media_path)
        ], check=True)
    return media_path


def mib(value: int) -> float:
    return round(float(value or 0) / 1024 / 1024, 3)


def median(values):
    return float(statistics.median(values)) if values else 0.0


def summarize_trend(samples):
    used = [int(sample['heap']['usedSize']) for sample in samples]
    if not used:
        return {
            'firstWindowMedianBytes': 0,
            'lastWindowMedianBytes': 0,
            'growthBytes': 0,
            'growthPercent': 0,
            'slopeBytesPerCycle': 0
        }
    window = min(5, max(1, len(used) // 4))
    warm_index = min(4, max(0, len(used) - window))
    first_window = used[warm_index:warm_index + window]
    last_window = used[-window:]
    first_median = median(first_window)
    last_median = median(last_window)
    growth = last_median - first_median
    growth_percent = (growth / first_median * 100.0) if first_median else 0.0
    n = len(used)
    x_mean = (n + 1) / 2.0
    y_mean = sum(used) / n
    denominator = sum((index + 1 - x_mean) ** 2 for index in range(n))
    slope = 0.0 if denominator == 0 else sum(
        (index + 1 - x_mean) * (value - y_mean)
        for index, value in enumerate(used)
    ) / denominator
    return {
        'windowSize': window,
        'firstWindowStartCycle': warm_index + 1,
        'firstWindowMedianBytes': round(first_median),
        'lastWindowMedianBytes': round(last_median),
        'growthBytes': round(growth),
        'growthPercent': round(growth_percent, 3),
        'slopeBytesPerCycle': round(slope),
        'firstWindowMedianMiB': mib(first_median),
        'lastWindowMedianMiB': mib(last_median),
        'growthMiB': mib(growth),
        'slopeMiBPerCycle': mib(slope)
    }


async def collect_sample(page, cdp, cycle, settle_ms=150):
    await page.wait_for_timeout(settle_ms)
    await page.evaluate("() => { if (typeof gc === 'function') gc(); }")
    await page.wait_for_timeout(80)
    heap = await cdp.send('Runtime.getHeapUsage')
    state = await page.evaluate("""() => ({
        urls: window.__heapAuditObjectUrls ? window.__heapAuditObjectUrls.snapshot() : null,
        operations: window.AIShortsOperationCoordinator ? AIShortsOperationCoordinator.snapshot() : null,
        queue: window.AIShortsRenderQueue ? AIShortsRenderQueue.snapshot() : null,
        mediaSessionId: window.AIShortsAppState ? AIShortsAppState.state.mediaSessionId : 0,
        recommendationCount: document.querySelectorAll('.recommendation-card').length,
        diagnosticsCount: window.AIShortsAppState ? AIShortsAppState.state.diagnostics.length : 0,
        hasAudioAnalysis: Boolean(window.AIShortsAppState && AIShortsAppState.state.audioAnalysis),
        hasMotionAnalysis: Boolean(window.AIShortsAppState && AIShortsAppState.state.motionAnalysis)
    })""")
    return {
        'cycle': cycle,
        'heap': heap,
        'heapMiB': {
            'used': mib(heap.get('usedSize', 0)),
            'total': mib(heap.get('totalSize', 0)),
            'embedderUsed': mib(heap.get('embedderHeapUsedSize', 0)),
            'backingStorage': mib(heap.get('backingStorageSize', 0))
        },
        **state
    }


async def run_audit(cycles: int, workdir: Path):
    media_path = make_cycle_media(workdir)
    errors = []
    samples = []
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
        context = await browser.new_context(
            accept_downloads=True,
            viewport={'width': 1366, 'height': 768}
        )
        page = await context.new_page()
        page.on('pageerror', lambda error: errors.append(str(error)))
        cdp = await context.new_cdp_session(page)
        await page.set_content(instrumented_html(), wait_until='load', timeout=30000)
        baseline = await collect_sample(page, cdp, 0)

        for cycle in range(1, cycles + 1):
            previous_session = await page.evaluate(
                "() => AIShortsOperationCoordinator.snapshot().mediaSessionId"
            )
            await page.set_input_files('#fileInput', str(media_path))
            await page.wait_for_function(
                "previous => AIShortsOperationCoordinator.snapshot().mediaSessionId !== previous",
                arg=previous_session,
                timeout=10000
            )
            await page.wait_for_function(
                "() => Boolean(AIShortsAppState.state.audioAnalysis) && !AIShortsAppState.state.isAnalyzing",
                timeout=30000
            )
            await page.select_option('#durationSelect', '15')
            await page.click('#analyzeBtn')
            await page.wait_for_function(
                "() => AIShortsAppState.state.recommendations.length > 0 && document.querySelectorAll('.recommendation-card').length > 0",
                timeout=10000
            )
            await page.click('.recommendation-card')
            await page.fill('#rangeStartInput', '0')
            await page.fill('#rangeEndInput', '1')
            await page.click('#applyRangeBtn')
            await page.wait_for_function(
                "() => AIShortsAppState.state.selectedRange && AIShortsAppState.state.selectedRange.duration <= 1.05",
                timeout=5000
            )
            async with page.expect_download(timeout=15000) as download_info:
                await page.click('#exportBtn')
            download = await download_info.value
            await page.wait_for_function(
                "() => !AIShortsRenderQueue.snapshot().running && AIShortsOperationCoordinator.snapshot().active.length === 0",
                timeout=10000
            )
            await download.delete()
            await page.evaluate("() => AIShortsRenderQueue.clear()")
            sample = await collect_sample(page, cdp, cycle)
            samples.append(sample)
            print(
                f"cycle {cycle:02d}/{cycles}: heap={sample['heapMiB']['used']:.3f} MiB "
                f"urls={sample['urls']['active'] if sample['urls'] else 'n/a'} "
                f"ops={len(sample['operations']['active']) if sample['operations'] else 'n/a'}",
                flush=True
            )

        await page.evaluate("""() => {
            window.dispatchEvent(new Event('beforeunload'));
            if (window.AIShortsRenderQueue) AIShortsRenderQueue.clear();
            for (const media of document.querySelectorAll('audio, video')) {
                try {
                    media.pause();
                    media.removeAttribute('src');
                    media.load();
                } catch (error) {}
            }
        }""")
        disposed = await collect_sample(page, cdp, cycles + 1, settle_ms=1250)
        runtime = await page.evaluate(
            "() => window.AIShortsRuntimeHealth ? AIShortsRuntimeHealth.collect() : null"
        )
        await context.close()
        await browser.close()

    trend = summarize_trend(samples)
    max_growth_bytes = max(24 * 1024 * 1024, int(trend['firstWindowMedianBytes'] * 0.5))
    max_slope_bytes = 2 * 1024 * 1024
    checks = {
        'completedCycles': len(samples) == cycles,
        'noPageErrors': len(errors) == 0,
        'noRuntimeErrors': bool(runtime) and runtime.get('runtimeErrors') == 0,
        'operationsReleasedEveryCycle': all(
            sample.get('operations') and len(sample['operations'].get('active', [])) == 0
            for sample in samples
        ),
        'renderQueueReleasedEveryCycle': all(
            sample.get('queue') and not sample['queue'].get('running') and sample['queue'].get('total') == 0
            for sample in samples
        ),
        'boundedObjectUrlsDuringCycles': all(
            sample.get('urls') and sample['urls'].get('sourceActive') == 1 and sample['urls'].get('exportActive', 0) <= 1
            for sample in samples
        ),
        'objectUrlsReleasedOnDispose': bool(disposed.get('urls')) and disposed['urls'].get('active') == 0,
        'boundedHeapWindowGrowth': trend['growthBytes'] <= max_growth_bytes,
        'boundedHeapSlope': trend['slopeBytesPerCycle'] <= max_slope_bytes
    }
    return {
        'version': VERSION,
        'generatedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'harness': 'Chromium inline asset harness with real 16-second MP3 analysis/render, CDP forced GC, and Object URL instrumentation',
        'cycles': cycles,
        'media': {
            'name': media_path.name,
            'sizeBytes': media_path.stat().st_size
        },
        'thresholds': {
            'maxGrowthBytes': max_growth_bytes,
            'maxGrowthMiB': mib(max_growth_bytes),
            'maxSlopeBytesPerCycle': max_slope_bytes,
            'maxSlopeMiBPerCycle': mib(max_slope_bytes)
        },
        'baseline': baseline,
        'samples': samples,
        'disposed': disposed,
        'trend': trend,
        'checks': checks,
        'passed': all(checks.values()),
        'pageErrors': errors,
        'runtimeHealth': runtime
    }


def parse_args():
    parser = argparse.ArgumentParser(description='Run repeated real-media Chromium heap trend audit.')
    parser.add_argument('--cycles', type=int, default=20, help='Number of import/analyze/render cycles (default: 20).')
    parser.add_argument('--workdir', help='Reusable media work directory; defaults to a temporary directory.')
    parser.add_argument('--keep-workdir', action='store_true', help='Keep an automatically-created work directory.')
    return parser.parse_args()


async def main():
    args = parse_args()
    if args.cycles < 5:
        raise SystemExit('--cycles must be at least 5')
    auto_workdir = args.workdir is None
    workdir = Path(args.workdir) if args.workdir else Path(tempfile.mkdtemp(prefix='ai-shorts-heap-'))
    try:
        report = await run_audit(args.cycles, workdir)
        OUTPUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print(OUTPUT, flush=True)
        if not report['passed']:
            failed = [name for name, passed in report['checks'].items() if not passed]
            raise SystemExit('heap stability audit failed: ' + ', '.join(failed))
    finally:
        if auto_workdir and not args.keep_workdir:
            shutil.rmtree(workdir, ignore_errors=True)


if __name__ == '__main__':
    asyncio.run(main())
