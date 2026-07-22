#!/usr/bin/env python3
"""GPU/WebGL and media decode capability comparison for AI Shorts Studio."""
from __future__ import annotations

import asyncio
import base64
import json
import shutil
import subprocess
import tempfile
import time
from pathlib import Path

from playwright.async_api import async_playwright

from run_browser_audit import build_inline_html
from run_process_memory_audit import process_memory, wait_devtools_port

ROOT = Path(__file__).resolve().parents[1]
VERSION = json.loads((ROOT / 'package.json').read_text(encoding='utf-8'))['version']
OUTPUT = ROOT / 'qa' / f'runtime-gpu-media-capability-v{VERSION}.json'


def create_fixture(path: Path) -> None:
    cmd = [
        '/usr/bin/ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
        '-f', 'lavfi', '-i', 'testsrc2=size=1280x720:rate=30',
        '-f', 'lavfi', '-i', 'sine=frequency=880:sample_rate=48000',
        '-t', '3', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '25',
        '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart',
        str(path),
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def renderer_is_hardware(renderer: str) -> bool:
    lowered = renderer.lower()
    software_tokens = ('swiftshader', 'llvmpipe', 'software rasterizer', 'softpipe')
    return bool(renderer) and not any(token in lowered for token in software_tokens)


async def collect_mode(mode: str, extra_args: list[str], media_b64: str) -> dict:
    tmp = tempfile.mkdtemp(prefix=f'ai-shorts-gpu-{mode}-')
    profile = Path(tmp)
    args = [
        '/usr/bin/chromium', '--headless=new', '--no-sandbox', '--disable-dev-shm-usage',
        '--remote-debugging-port=0', f'--user-data-dir={profile}', '--enable-precise-memory-info',
        '--disable-background-networking', '--disable-component-update', '--no-first-run',
        '--no-default-browser-check', 'about:blank', *extra_args,
    ]
    process = subprocess.Popen(args, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    errors: list[str] = []
    try:
        port = await wait_devtools_port(profile, process)
        async with async_playwright() as playwright:
            browser = await playwright.chromium.connect_over_cdp(f'http://127.0.0.1:{port}')
            context = browser.contexts[0] if browser.contexts else await browser.new_context()
            page = context.pages[0] if context.pages else await context.new_page()
            page.on('pageerror', lambda err: errors.append(str(err)))
            page.on('console', lambda msg: errors.append(msg.text) if msg.type == 'error' else None)
            await page.set_content(build_inline_html(), wait_until='load', timeout=30000)
            await page.wait_for_timeout(1000)
            baseline = process_memory(process.pid)
            webgl = await page.evaluate("""async () => {
              const canvas=document.createElement('canvas'); canvas.width=960; canvas.height=540;
              canvas.style.cssText='position:fixed;left:-2000px;top:-2000px'; document.body.appendChild(canvas);
              const gl=canvas.getContext('webgl2',{antialias:true,preserveDrawingBuffer:false}) || canvas.getContext('webgl',{antialias:true,preserveDrawingBuffer:false});
              if(!gl){canvas.remove();return {available:false};}
              const ext=gl.getExtension('WEBGL_debug_renderer_info');
              const vendor=ext?gl.getParameter(ext.UNMASKED_VENDOR_WEBGL):gl.getParameter(gl.VENDOR);
              const renderer=ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);
              for(let i=0;i<150;i++){
                gl.viewport(0,0,canvas.width,canvas.height);
                gl.clearColor((i%17)/17,(i%29)/29,(i%43)/43,1);
                gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
                await new Promise(requestAnimationFrame);
              }
              const result={available:true,vendor:String(vendor||''),renderer:String(renderer||''),version:String(gl.getParameter(gl.VERSION)||''),maxTextureSize:Number(gl.getParameter(gl.MAX_TEXTURE_SIZE)||0)};
              const lose=gl.getExtension('WEBGL_lose_context'); if(lose) lose.loseContext(); canvas.remove(); return result;
            }""")
            after_webgl = process_memory(process.pid)
            media = await page.evaluate("""async encoded => {
              const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
              const url=URL.createObjectURL(new Blob([bytes],{type:'video/mp4'}));
              const video=document.createElement('video'); video.muted=true; video.playsInline=true; video.preload='auto';
              video.style.cssText='position:fixed;left:-2000px;top:-2000px;width:640px;height:360px'; document.body.appendChild(video);
              const loaded=new Promise((resolve,reject)=>{video.addEventListener('loadeddata',resolve,{once:true});video.addEventListener('error',()=>reject(new Error(video.error?.message||'video decode error')),{once:true});});
              video.src=url; await loaded; await video.play(); await new Promise(r=>setTimeout(r,2200));
              const q=video.getVideoPlaybackQuality?video.getVideoPlaybackQuality():null;
              const result={readyState:video.readyState,width:video.videoWidth,height:video.videoHeight,currentTime:video.currentTime,paused:video.paused,totalFrames:q?.totalVideoFrames||0,droppedFrames:q?.droppedVideoFrames||0};
              video.pause(); video.removeAttribute('src'); video.load(); video.remove(); URL.revokeObjectURL(url); return result;
            }""", media_b64)
            during_media = process_memory(process.pid)
            await page.wait_for_timeout(500)
            after_cleanup = process_memory(process.pid)
            runtime = await page.evaluate("""() => ({build:document.body.dataset.build||'', operations:window.AIShortsOperationCoordinator?.snapshot?.()||null, queue:window.AIShortsRenderQueue?.getJobs?.().length||0})""")
            await browser.close()
    finally:
        if process.poll() is None:
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill(); process.wait(timeout=5)
        shutil.rmtree(tmp, ignore_errors=True)
    renderer = webgl.get('renderer', '') if isinstance(webgl, dict) else ''
    return {
        'mode': mode,
        'requestedArgs': extra_args,
        'webgl': {**webgl, 'hardwareAccelerated': renderer_is_hardware(renderer)},
        'media': media,
        'memory': {'baseline': baseline, 'afterWebgl': after_webgl, 'duringMedia': during_media, 'afterCleanup': after_cleanup},
        'runtime': runtime,
        'errors': errors,
    }


async def main() -> None:
    with tempfile.TemporaryDirectory(prefix='ai-shorts-gpu-fixture-') as tmp:
        fixture = Path(tmp) / 'gpu-media-audit.mp4'
        create_fixture(fixture)
        media_b64 = base64.b64encode(fixture.read_bytes()).decode('ascii')
        accelerated = await collect_mode('acceleration-requested', [
            '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--enable-zero-copy', '--enable-unsafe-swiftshader'
        ], media_b64)
        software = await collect_mode('software-forced', [
            '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'
        ], media_b64)
    report = {
        'version': VERSION,
        'generatedAt': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'fixture': {'format': 'MP4/H.264/AAC', 'width': 1280, 'height': 720, 'fps': 30, 'durationSeconds': 3},
        'modes': [accelerated, software],
        'summary': {
            'acceleratedRequestWebglAvailable': accelerated['webgl'].get('available', False),
            'acceleratedRequestHardwareAvailable': accelerated['webgl'].get('hardwareAccelerated', False),
            'acceleratedRenderer': accelerated['webgl'].get('renderer', ''),
            'softwareRenderer': software['webgl'].get('renderer', ''),
            'gpuProcessObservedInBothModes': all('gpu' in m['memory']['afterWebgl']['categories'] for m in (accelerated, software)),
            'mediaUtilityObservedInBothModes': all('mediaUtility' in m['memory']['duringMedia']['categories'] for m in (accelerated, software)),
            'bothMediaDecoded': all(m['media']['readyState'] >= 2 and m['media']['width'] == 1280 for m in (accelerated, software)),
            'runtimeErrorCount': len(accelerated['errors']) + len(software['errors']),
        },
        'limitations': [
            'The container may expose SwiftShader instead of a physical GPU even when acceleration is requested.',
            'Process RSS is auxiliary and cannot attribute individual native decoder surfaces precisely.',
            'Real mobile Safari and Samsung Internet hardware paths require physical-device testing.',
        ],
    }
    OUTPUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(OUTPUT)
    print(json.dumps(report['summary'], ensure_ascii=False))


if __name__ == '__main__':
    asyncio.run(main())
