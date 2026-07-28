#!/usr/bin/env python3
"""Real Chromium audit for diagnostics import, compatibility preview, corruption guidance, and normalized export."""
from __future__ import annotations
import asyncio
import datetime as dt
import json
import tempfile
from pathlib import Path
from playwright.async_api import async_playwright
from run_media_e2e import ROOT, build_inline_html

VERSION = json.loads((ROOT / 'package.json').read_text(encoding='utf-8'))['version']
OUTPUT = ROOT / 'qa' / f'runtime-support-diagnostics-import-v{VERSION}.json'
SUPPORT_SOURCE = (ROOT / 'src/diagnostics/support-diagnostics.js').read_text(encoding='utf-8')

async def capture(page):
    return await page.evaluate("""() => ({
      hidden: document.querySelector('#supportDiagnosticsDialog').hidden,
      state: document.querySelector('#supportDiagnosticsState').textContent.trim(),
      status: document.querySelector('#supportDiagnosticsState').dataset.status,
      meta: document.querySelector('#supportDiagnosticsMeta').textContent.trim(),
      summary: document.querySelector('#supportDiagnosticsSummary').innerText.trim(),
      issues: document.querySelector('#supportDiagnosticsIssueList').innerText.trim(),
      normalizedDisabled: document.querySelector('#supportDiagnosticsNormalizedBtn').disabled,
      bodyOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
    })""")

async def main():
    with tempfile.TemporaryDirectory(prefix='ai-shorts-support-import-') as tmp:
        folder = Path(tmp)
        legacy = folder / 'legacy-analysis.json'
        legacy.write_text(json.dumps({
            'exportType': 'analysis-timing-diagnostics', 'version': 1, 'appVersion': 'v1.6.15',
            'history': [{'mediaKey': 'media-aabbccdd', 'status': 'completed', 'totalMs': 120, 'fileName': 'private.mp4', 'error': '/Users/private/movie.mp4', 'stages': [{'key': 'engine', 'label': '엔진', 'durationMs': 80}]}]
        }, ensure_ascii=False), encoding='utf-8')
        future = folder / 'future-bundle.json'
        future.write_text(json.dumps({'schema': 'ai-shorts-support-diagnostics-bundle', 'schemaVersion': 99, 'exportType': 'ai-shorts-support-diagnostics-bundle'}), encoding='utf-8')
        corrupt = folder / 'corrupt.json'
        corrupt.write_text('{"schema":', encoding='utf-8')

        errors, console_errors = [], []
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
            context = await browser.new_context(accept_downloads=True, viewport={'width': 1180, 'height': 900})
            page = await context.new_page()
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.on('console', lambda message: console_errors.append(message.text) if message.type == 'error' else None)
            await page.set_content(build_inline_html(), wait_until='load', timeout=30000)
            await page.add_script_tag(content=SUPPORT_SOURCE)

            await page.set_input_files('#supportDiagnosticsFileInput', str(legacy))
            await page.wait_for_function("() => !document.querySelector('#supportDiagnosticsDialog').hidden && document.querySelector('#supportDiagnosticsState').dataset.status === 'compatible'", timeout=10000)
            legacy_preview = await capture(page)
            async with page.expect_download(timeout=10000) as download_info:
                await page.click('#supportDiagnosticsNormalizedBtn')
            download = await download_info.value
            normalized_path = folder / download.suggested_filename
            await download.save_as(str(normalized_path))
            normalized_payload = json.loads(normalized_path.read_text(encoding='utf-8'))
            normalized_text = json.dumps(normalized_payload, ensure_ascii=False)

            await page.click('#supportDiagnosticsDismissBtn')
            await page.set_input_files('#supportDiagnosticsFileInput', str(future))
            await page.wait_for_function("() => !document.querySelector('#supportDiagnosticsDialog').hidden && document.querySelector('#supportDiagnosticsState').dataset.status === 'invalid'", timeout=10000)
            future_preview = await capture(page)

            await page.click('#supportDiagnosticsDismissBtn')
            await page.set_input_files('#supportDiagnosticsFileInput', str(corrupt))
            await page.wait_for_function("() => !document.querySelector('#supportDiagnosticsDialog').hidden && /손상/.test(document.querySelector('#supportDiagnosticsIssueList').innerText)", timeout=10000)
            corrupt_preview = await capture(page)

            await page.keyboard.press('Escape')
            escape_hidden = await page.evaluate("document.querySelector('#supportDiagnosticsDialog').hidden")
            diagnostics = await page.evaluate("AIShortsAppState.state.diagnostics.filter(item => item.type === 'support-diagnostics-import-preview' || item.type === 'support-diagnostics-normalized-export').map(item => ({type:item.type,status:item.status,schema:item.schema,schemaVersion:item.schemaVersion}))")
            await context.close()
            await browser.close()

    checks = {
        'legacyPreviewCompatible': legacy_preview['status'] == 'compatible' and '구버전' in legacy_preview['state'] and '분석 이력' in legacy_preview['summary'],
        'legacyPreviewContained': legacy_preview['bodyOverflow'] <= 1 and not legacy_preview['normalizedDisabled'],
        'normalizedDownloadValid': normalized_payload.get('schema') == 'ai-shorts-support-diagnostics-bundle' and normalized_payload.get('schemaVersion') == 1,
        'normalizedDownloadPrivate': 'private.mp4' not in normalized_text and '/Users/private' not in normalized_text,
        'futureSchemaGuidance': future_preview['status'] == 'invalid' and '새로운 schema' in future_preview['issues'] and '업데이트' in future_preview['issues'] and future_preview['normalizedDisabled'],
        'corruptJsonGuidance': corrupt_preview['status'] == 'invalid' and '손상' in corrupt_preview['issues'] and corrupt_preview['normalizedDisabled'],
        'escapeClosesPreview': escape_hidden is True,
        'diagnosticsBounded': 1 <= len(diagnostics) <= 20 and all('fileName' not in item and 'path' not in item for item in diagnostics),
        'noRuntimeErrors': not errors and not console_errors,
    }
    report = {
        'version': VERSION, 'generatedAt': dt.datetime.now(dt.timezone.utc).isoformat(),
        'legacyPreview': legacy_preview, 'futurePreview': future_preview, 'corruptPreview': corrupt_preview,
        'normalizedFilename': normalized_path.name, 'diagnostics': diagnostics,
        'checks': checks, 'passed': all(checks.values()), 'pageErrors': errors, 'consoleErrors': console_errors
    }
    OUTPUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(OUTPUT)
    print(json.dumps(checks, ensure_ascii=False, indent=2))
    if not report['passed']:
        raise SystemExit(1)

if __name__ == '__main__':
    asyncio.run(main())
