#!/usr/bin/env python3
"""Chromium process RSS/USS and JS-heap auxiliary audit for AI Shorts Studio."""
from __future__ import annotations

import argparse
import asyncio
import json
import math
import os
import shutil
import statistics
import subprocess
import tempfile
import time
from pathlib import Path

import psutil
from playwright.async_api import async_playwright

from run_browser_audit import build_inline_html

ROOT = Path(__file__).resolve().parents[1]
VERSION = json.loads((ROOT / 'package.json').read_text(encoding='utf-8'))['version']
OUTPUT = ROOT / 'qa' / f'runtime-process-memory-v{VERSION}.json'
MIB = 1024 * 1024


def classify_process(command: str, is_root: bool) -> str:
    if is_root:
        return 'browser'
    if '--type=gpu-process' in command:
        return 'gpu'
    if '--type=renderer' in command:
        return 'renderer'
    if '--type=utility' in command:
        lower = command.lower()
        if any(token in lower for token in ('audio', 'video', 'media', 'capture')):
            return 'mediaUtility'
        if 'network' in lower:
            return 'networkUtility'
        return 'utility'
    if '--type=' not in command:
        return 'browserHelper'
    return 'other'


def process_memory(root_pid: int) -> dict:
    root = psutil.Process(root_pid)
    processes = [root] + root.children(recursive=True)
    categories: dict[str, dict[str, float | int]] = {}
    details = []
    for proc in processes:
        try:
            command = ' '.join(proc.cmdline())
            info = proc.memory_info()
            try:
                uss = proc.memory_full_info().uss
            except (psutil.AccessDenied, AttributeError):
                uss = 0
            category = classify_process(command, proc.pid == root_pid)
            bucket = categories.setdefault(category, {'processCount': 0, 'rssMiB': 0.0, 'ussMiB': 0.0})
            bucket['processCount'] += 1
            bucket['rssMiB'] += info.rss / MIB
            bucket['ussMiB'] += uss / MIB
            details.append({
                'pid': proc.pid,
                'category': category,
                'rssMiB': round(info.rss / MIB, 3),
                'ussMiB': round(uss / MIB, 3),
                'commandHint': command[:280],
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied, ProcessLookupError):
            continue
    for bucket in categories.values():
        bucket['rssMiB'] = round(float(bucket['rssMiB']), 3)
        bucket['ussMiB'] = round(float(bucket['ussMiB']), 3)
    return {
        'totalProcessCount': len(details),
        'totalRssMiB': round(sum(item['rssMiB'] for item in details), 3),
        'totalUssMiB': round(sum(item['ussMiB'] for item in details), 3),
        'categories': categories,
        'processes': details,
    }


def slope(values: list[float]) -> float:
    if len(values) < 2:
        return 0.0
    xs = list(range(len(values)))
    x_mean = statistics.fmean(xs)
    y_mean = statistics.fmean(values)
    denominator = sum((x - x_mean) ** 2 for x in xs)
    if not denominator:
        return 0.0
    return sum((x - x_mean) * (y - y_mean) for x, y in zip(xs, values)) / denominator


async def wait_devtools_port(profile: Path, process: subprocess.Popen, timeout: float = 15.0) -> int:
    marker = profile / 'DevToolsActivePort'
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if process.poll() is not None:
            stderr = process.stderr.read().decode('utf-8', errors='replace') if process.stderr else ''
            raise RuntimeError(f'Chromium exited before DevTools became ready: {stderr[-1200:]}')
        if marker.exists():
            lines = marker.read_text(encoding='utf-8').splitlines()
            if lines and lines[0].isdigit():
                return int(lines[0])
        await asyncio.sleep(0.1)
    raise TimeoutError('Timed out waiting for Chromium DevTools port')


async def collect_sample(page, cdp, root_pid: int, cycle: int) -> dict:
    await page.evaluate("() => { if (typeof gc === 'function') gc(); }")
    await page.wait_for_timeout(120)
    metrics = await cdp.send('Performance.getMetrics')
    metric_map = {entry['name']: entry['value'] for entry in metrics.get('metrics', [])}
    browser_memory = await page.evaluate("""() => ({
      jsHeapUsedSize: performance.memory?.usedJSHeapSize || 0,
      jsHeapTotalSize: performance.memory?.totalJSHeapSize || 0,
      jsHeapLimit: performance.memory?.jsHeapSizeLimit || 0,
      operations: window.AIShortsOperationCoordinator?.snapshot?.() || null,
      renderQueueSize: window.AIShortsRenderQueue?.getJobs?.().length || 0,
      bodyBuild: document.body.dataset.build || '',
      activeFlow: document.body.dataset.activeFlowTab || ''
    })""")
    proc = process_memory(root_pid)
    return {
        'cycle': cycle,
        'timestamp': time.time(),
        'jsHeapUsedMiB': round((metric_map.get('JSHeapUsedSize') or browser_memory['jsHeapUsedSize']) / MIB, 3),
        'jsHeapTotalMiB': round((metric_map.get('JSHeapTotalSize') or browser_memory['jsHeapTotalSize']) / MIB, 3),
        'domNodes': int(metric_map.get('Nodes', 0)),
        'layoutCount': int(metric_map.get('LayoutCount', 0)),
        'recalcStyleCount': int(metric_map.get('RecalcStyleCount', 0)),
        'operations': browser_memory['operations'],
        'renderQueueSize': browser_memory['renderQueueSize'],
        'bodyBuild': browser_memory['bodyBuild'],
        'activeFlow': browser_memory['activeFlow'],
        'processMemory': proc,
    }


async def run(cycles: int) -> dict:
    tmp = tempfile.mkdtemp(prefix='ai-shorts-memory-')
    profile = Path(tmp)
    args = [
        '/usr/bin/chromium', '--headless=new', '--no-sandbox', '--disable-dev-shm-usage',
        '--remote-debugging-port=0', f'--user-data-dir={profile}', '--enable-precise-memory-info',
        '--js-flags=--expose-gc', '--disable-background-networking', '--disable-component-update',
        '--no-first-run', '--no-default-browser-check', 'about:blank',
    ]
    process = subprocess.Popen(args, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    try:
        port = await wait_devtools_port(profile, process)
        async with async_playwright() as playwright:
            browser = await playwright.chromium.connect_over_cdp(f'http://127.0.0.1:{port}')
            context = browser.contexts[0] if browser.contexts else await browser.new_context()
            pages = context.pages
            page = pages[0] if pages else await context.new_page()
            errors: list[str] = []
            page.on('pageerror', lambda err: errors.append(str(err)))
            page.on('console', lambda msg: errors.append(msg.text) if msg.type == 'error' else None)
            await page.set_content(build_inline_html(), wait_until='load', timeout=30000)
            await page.wait_for_timeout(1400)
            cdp = await context.new_cdp_session(page)
            await cdp.send('Performance.enable')
            samples = [await collect_sample(page, cdp, process.pid, 0)]
            flow_order = ['file', 'recommend', 'candidates', 'preview', 'waveform', 'cut', 'edit', 'export']
            for cycle in range(1, cycles + 1):
                flow = flow_order[(cycle - 1) % len(flow_order)]
                await page.evaluate("""flow => {
                  window.AIShortsFlowDirectorFinal?.setActive?.(flow, {force:true, source:'process-memory-audit'});
                  if (window.AIShortsWorkspaceLayout && innerWidth >= 1180) {
                    const modes=['balanced','preview','waveform'];
                    window.AIShortsWorkspaceLayout.setMode(modes[flow.length % modes.length], {navigate:false});
                  }
                }""", flow)
                await page.wait_for_timeout(180)
                samples.append(await collect_sample(page, cdp, process.pid, cycle))
            await browser.close()
    finally:
        if process.poll() is None:
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait(timeout=5)
        # Chromium can briefly recreate profile files while its helpers exit.
        for attempt in range(4):
            try:
                shutil.rmtree(tmp)
                break
            except OSError:
                if attempt == 3:
                    shutil.rmtree(tmp, ignore_errors=True)
                else:
                    await asyncio.sleep(0.15 * (attempt + 1))

    rss_values = [sample['processMemory']['totalRssMiB'] for sample in samples]
    uss_values = [sample['processMemory']['totalUssMiB'] for sample in samples]
    heap_values = [sample['jsHeapUsedMiB'] for sample in samples]
    warm = rss_values[1:min(4, len(rss_values))] or rss_values[:1]
    final = rss_values[-min(3, len(rss_values)):]
    categories = sorted({name for sample in samples for name in sample['processMemory']['categories']})
    return {
        'version': VERSION,
        'generatedAt': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'cycles': cycles,
        'scope': {
            'direct': ['Chromium process-tree RSS', 'Chromium process-tree USS where available', 'renderer JS heap', 'DOM/layout/style counters'],
            'auxiliary': ['GPU-process RSS', 'media-capable utility-process RSS when Chromium exposes a separate process'],
            'limitations': [
                'RSS categories can share allocations and do not identify individual decoder buffers.',
                'Headless Chromium GPU behavior can differ from a hardware-accelerated desktop browser.',
                'This UI-navigation audit does not replace the long MP4 real-media audit.',
            ],
        },
        'summary': {
            'initialRssMiB': rss_values[0],
            'finalRssMiB': rss_values[-1],
            'peakRssMiB': max(rss_values),
            'warmMedianRssMiB': round(statistics.median(warm), 3),
            'finalMedianRssMiB': round(statistics.median(final), 3),
            'rssSlopeMiBPerCycle': round(slope(rss_values[1:]), 4),
            'initialUssMiB': uss_values[0],
            'finalUssMiB': uss_values[-1],
            'jsHeapSlopeMiBPerCycle': round(slope(heap_values[1:]), 4),
            'processCategories': categories,
            'runtimeErrorCount': len(errors),
        },
        'errors': errors,
        'samples': samples,
    }


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--cycles', type=int, default=8)
    args = parser.parse_args()
    report = await run(max(4, min(args.cycles, 30)))
    OUTPUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(OUTPUT)
    print(json.dumps(report['summary'], ensure_ascii=False))


if __name__ == '__main__':
    asyncio.run(main())
