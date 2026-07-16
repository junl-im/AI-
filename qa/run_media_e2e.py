#!/usr/bin/env python3
"""Optional real-media Chromium audit for AI Shorts Studio v1.3.2.
Requires ffmpeg and Python Playwright. It does not run as part of npm test.
"""
import asyncio
import json
import re
import subprocess
import tempfile
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'qa' / 'runtime-media-e2e-v1.3.2.json'


def build_inline_html() -> str:
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    html = re.sub(r'<meta[^>]+Content-Security-Policy[^>]*>', '', html, flags=re.I)

    def inline_css(match):
        rel = match.group(1).split('?', 1)[0]
        path = ROOT / rel
        return f'<style data-source="{rel}">{path.read_text(encoding="utf-8")}</style>' if path.exists() else ''

    def inline_js(match):
        rel = match.group(1).split('?', 1)[0]
        if rel.endswith('staged-ui-loader.js'):
            return ''
        path = ROOT / rel
        content = path.read_text(encoding='utf-8').replace('</script>', '<\\/script>')
        return f'<script data-source="{rel}">{content}</script>' if path.exists() else ''

    html = re.sub(r'<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"[^>]*/?>', inline_css, html)
    html = re.sub(r'<script[^>]+src="([^"]+)"[^>]*></script>', inline_js, html)
    staged = [
        'src/ui/ux-controls.js', 'src/ui/hyperconnect-flow.js', 'src/ui/flow-polish.js',
        'src/ui/flow-hotfix.js', 'src/ui/flow-integrity.js', 'src/ui/flow-doctor.js',
        'src/ui/flow-quality-gate.js', 'src/ui/workspace-comfort.js', 'src/ui/session-continuity.js',
        'src/ui/range-drag-controls.js', 'src/ui/handoff-coach.js', 'src/ui/save-readiness.js',
        'src/ui/render-quality-planner.js', 'src/ui/candidate-preview-pro.js',
        'src/ui/candidate-pin-board.js', 'src/ui/export-finish-center.js'
    ]
    staged_scripts = ''.join(
        '<script data-source="{0}">{1}</script>'.format(
            rel, (ROOT / rel).read_text(encoding='utf-8').replace('</script>', '<\\/script>')
        ) for rel in staged
    )
    return html.replace('</head>', staged_scripts + '</head>')


def make_media(folder: Path):
    mp3 = folder / 'sample-20s.mp3'
    mp4 = folder / 'sample-20s.mp4'
    subprocess.run([
        'ffmpeg', '-y', '-hide_banner', '-loglevel', 'error',
        '-f', 'lavfi', '-i', 'sine=frequency=440:duration=20',
        '-f', 'lavfi', '-i', 'anoisesrc=color=pink:duration=20:amplitude=0.05',
        '-filter_complex', '[0:a][1:a]amix=inputs=2:duration=first,volume=0.8',
        '-c:a', 'libmp3lame', '-b:a', '128k', str(mp3)
    ], check=True)
    subprocess.run([
        'ffmpeg', '-y', '-hide_banner', '-loglevel', 'error',
        '-f', 'lavfi', '-i', 'testsrc2=size=640x360:rate=30:duration=20',
        '-f', 'lavfi', '-i', 'sine=frequency=660:duration=20',
        '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '30', '-pix_fmt', 'yuv420p',
        '-c:a', 'aac', '-shortest', '-movflags', '+faststart', str(mp4)
    ], check=True)
    return mp3, mp4


def probe_media(path: Path):
    result = subprocess.run([
        'ffprobe', '-v', 'error', '-show_entries', 'format=duration,size,format_name',
        '-of', 'json', str(path)
    ], check=True, capture_output=True, text=True)
    return json.loads(result.stdout).get('format', {})


async def prepare(page, media_path: Path, end_seconds: int):
    await page.set_content(build_inline_html(), wait_until='load', timeout=30000)
    await page.set_input_files('#fileInput', str(media_path))
    await page.wait_for_function("() => /분석 완료/.test(document.querySelector('#analysisStatus').textContent)", timeout=30000)
    await page.click('#analyzeBtn')
    await page.wait_for_selector('.recommendation-card', timeout=10000)
    await page.click('.recommendation-card')
    await page.fill('#rangeStartInput', '0')
    await page.fill('#rangeEndInput', str(end_seconds))
    await page.click('#applyRangeBtn')
    await page.wait_for_timeout(250)


async def export_case(browser, media_path: Path, output_dir: Path):
    context = await browser.new_context(accept_downloads=True, viewport={'width': 1366, 'height': 768})
    page = await context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    await prepare(page, media_path, 2)
    async with page.expect_download(timeout=25000) as download_info:
        await page.click('#exportBtn')
    download = await download_info.value
    saved = output_dir / download.suggested_filename
    await download.save_as(str(saved))
    await page.wait_for_function("() => !AIShortsRenderQueue.snapshot().running", timeout=10000)
    result = await page.evaluate("""() => ({
        analysisStatus: document.querySelector('#analysisStatus').textContent,
        recommendationCount: document.querySelectorAll('.recommendation-card').length,
        selectedCount: document.querySelectorAll('.recommendation-card.is-selected').length,
        fileMeta: AIShortsAppState.state.fileMeta,
        queue: AIShortsRenderQueue.snapshot(),
        operations: AIShortsOperationCoordinator.snapshot(),
        runtime: AIShortsRuntimeHealth.collect(),
        usedWorkerFallback: AIShortsAppState.state.diagnostics.some(item => item.type === 'analysis-worker-fallback')
    })""")
    result.update({'download': download.suggested_filename, 'outputProbe': probe_media(saved), 'errors': errors})
    await context.close()
    return result


async def cancel_case(browser, media_path: Path):
    context = await browser.new_context(accept_downloads=True, viewport={'width': 1366, 'height': 768})
    page = await context.new_page()
    downloads, errors = [], []
    page.on('download', lambda download: downloads.append(download.suggested_filename))
    page.on('pageerror', lambda error: errors.append(str(error)))
    await prepare(page, media_path, 6)
    await page.click('#exportBtn')
    await page.wait_for_function("() => AIShortsRenderQueue.snapshot().running", timeout=10000)
    cancel_enabled = await page.is_enabled('#renderQueueCancelBtn')
    await page.wait_for_timeout(500)
    await page.click('#renderQueueCancelBtn')
    await page.wait_for_function("() => !AIShortsRenderQueue.snapshot().running", timeout=10000)
    result = await page.evaluate("""() => ({
        queue: AIShortsRenderQueue.snapshot(),
        operations: AIShortsOperationCoordinator.snapshot(),
        status: document.querySelector('#renderQueueStatus').textContent,
        cancelDisabledAfter: document.querySelector('#renderQueueCancelBtn').disabled
    })""")
    result.update({'cancelEnabledDuringRun': cancel_enabled, 'downloads': downloads, 'errors': errors})
    await context.close()
    return result


async def retry_case(browser, media_path: Path, output_dir: Path):
    context = await browser.new_context(accept_downloads=True, viewport={'width': 1366, 'height': 768})
    page = await context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    await prepare(page, media_path, 2)
    await page.evaluate("""() => {
        const media = document.querySelector('#sourceAudio');
        const original = media.play.bind(media);
        let failOnce = true;
        media.play = function () {
            if (failOnce) {
                failOnce = false;
                return Promise.reject(new Error('E2E injected playback failure'));
            }
            return original();
        };
    }""")
    await page.click('#exportBtn')
    await page.wait_for_function("() => { const q=AIShortsRenderQueue.snapshot(); return !q.running && q.failed===1; }", timeout=10000)
    failed = await page.evaluate("() => ({queue:AIShortsRenderQueue.snapshot(), retryDisabled:document.querySelector('#renderQueueRetryBtn').disabled})")
    async with page.expect_download(timeout=25000) as download_info:
        await page.click('#renderQueueRetryBtn')
    download = await download_info.value
    saved = output_dir / ('retry-' + download.suggested_filename)
    await download.save_as(str(saved))
    await page.wait_for_function("() => { const q=AIShortsRenderQueue.snapshot(); return !q.running && q.done===1; }", timeout=10000)
    retried = await page.evaluate("() => ({queue:AIShortsRenderQueue.snapshot(), retryDisabled:document.querySelector('#renderQueueRetryBtn').disabled, operations:AIShortsOperationCoordinator.snapshot()})")
    retried.update({'download': download.suggested_filename, 'outputProbe': probe_media(saved), 'errors': errors})
    await context.close()
    return {'failed': failed, 'retried': retried}


async def main():
    with tempfile.TemporaryDirectory(prefix='ai-shorts-e2e-') as temp_name:
        temp = Path(temp_name)
        mp3, mp4 = make_media(temp)
        async with async_playwright() as playwright:
            browser = await playwright.chromium.launch(
                headless=True,
                executable_path='/usr/bin/chromium',
                args=['--no-sandbox', '--autoplay-policy=no-user-gesture-required']
            )
            report = {
                'version': '1.3.2',
                'harness': 'Chromium inline asset harness; service worker and localStorage are outside this audit',
                'audio': await export_case(browser, mp3, temp),
                'video': await export_case(browser, mp4, temp),
                'cancel': await cancel_case(browser, mp4),
                'retry': await retry_case(browser, mp3, temp)
            }
            await browser.close()
        OUTPUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print(OUTPUT)


if __name__ == '__main__':
    asyncio.run(main())
