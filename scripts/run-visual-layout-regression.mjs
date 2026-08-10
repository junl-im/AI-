import { createHash } from 'node:crypto'
import { createServer } from 'node:http'
import { copyFile, mkdtemp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { extname, join, normalize } from 'node:path'
import { spawn, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const dist = join(root, 'dist')
function argument(name, fallback) {
  const index = process.argv.indexOf(name)
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback
}

const output = argument('--output', join(root, '.sorion', 'web-quality', 'visual-layout'))
const baselineDir = argument('--baseline-dir', join(root, 'visual-baselines', 'workspace'))
const approveBaseline = process.argv.includes('--approve')
const requireBaseline = process.argv.includes('--require-baseline')
  || process.env.SORION_VISUAL_BASELINE_REQUIRED === '1'
const maxDiffRatio = Number(argument(
  '--max-diff-ratio',
  process.env.SORION_VISUAL_MAX_DIFF_RATIO ?? '0.005',
))
const channelThreshold = Number(argument(
  '--channel-threshold',
  process.env.SORION_VISUAL_CHANNEL_THRESHOLD ?? '24',
))
const viewports = [1024, 1280, 1440]
const height = 900
const browserCandidates = [
  process.env.SORION_CHROMIUM_BIN,
  'chromium',
  'chromium-browser',
  'google-chrome',
  'google-chrome-stable',
].filter(Boolean)

function resolveBrowser() {
  for (const candidate of browserCandidates) {
    const result = spawnSync(candidate, ['--version'], { encoding: 'utf8' })
    if (result.status === 0) return { command: candidate, version: result.stdout.trim() }
  }
  throw new Error('Chromium/Chrome 실행 파일을 찾지 못했습니다.')
}

function contentType(pathname) {
  const extension = extname(pathname)
  if (extension === '.html') return 'text/html; charset=utf-8'
  if (extension === '.js') return 'text/javascript; charset=utf-8'
  if (extension === '.css') return 'text/css; charset=utf-8'
  if (extension === '.json') return 'application/json; charset=utf-8'
  if (extension === '.svg') return 'image/svg+xml'
  if (extension === '.png') return 'image/png'
  if (extension === '.ico') return 'image/x-icon'
  if (extension === '.woff2') return 'font/woff2'
  return 'application/octet-stream'
}

async function existingFile(relativePath) {
  const safe = normalize(relativePath).replace(/^(\.\.[/\\])+/, '')
  const candidate = join(dist, safe)
  try {
    const info = await stat(candidate)
    return info.isFile() ? candidate : null
  } catch {
    return null
  }
}

async function resolveRequest(pathname) {
  const decoded = decodeURIComponent(pathname).replace(/^\/+/, '')
  const direct = await existingFile(decoded)
  if (direct) return direct
  const parts = decoded.split('/')
  if (parts.length > 1) {
    const withoutBase = await existingFile(parts.slice(1).join('/'))
    if (withoutBase) return withoutBase
  }
  return join(dist, 'index.html')
}

async function startStaticServer() {
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? '/', 'http://127.0.0.1')
      const file = await resolveRequest(url.pathname)
      const body = await readFile(file)
      response.writeHead(200, {
        'Content-Type': contentType(file),
        'Cache-Control': 'no-store',
      })
      response.end(body)
    } catch (error) {
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
      response.end(error instanceof Error ? error.message : 'static server error')
    }
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('visual server port를 열지 못했습니다.')
  return { server, url: `http://127.0.0.1:${address.port}/` }
}

async function waitForJson(url, timeoutMs = 8_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)
      if (response.ok) return await response.json()
    } catch {
      // Browser debugging endpoint is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error(`시간 안에 브라우저 디버깅 endpoint가 열리지 않았습니다: ${url}`)
}

function createCdpClient(socketUrl) {
  const socket = new WebSocket(socketUrl)
  let nextId = 1
  const pending = new Map()
  const events = new Map()
  const opened = new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true })
    socket.addEventListener('error', reject, { once: true })
  })
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data))
    if (message.id) {
      const entry = pending.get(message.id)
      if (!entry) return
      pending.delete(message.id)
      if (message.error) entry.reject(new Error(message.error.message))
      else entry.resolve(message.result)
      return
    }
    const listeners = events.get(message.method) ?? []
    events.delete(message.method)
    listeners.forEach((resolve) => resolve(message.params))
  })
  return {
    async send(method, params = {}) {
      await opened
      const id = nextId++
      const result = new Promise((resolve, reject) => pending.set(id, { resolve, reject }))
      socket.send(JSON.stringify({ id, method, params }))
      return result
    },
    once(method, timeoutMs = 8_000) {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`${method} event timeout`)), timeoutMs)
        const listeners = events.get(method) ?? []
        listeners.push((value) => {
          clearTimeout(timer)
          resolve(value)
        })
        events.set(method, listeners)
      })
    },
    close() {
      socket.close()
    },
  }
}

async function evaluate(cdp, expression) {
  const result = await cdp.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  })
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description ?? 'Runtime.evaluate 실패')
  }
  return result.result?.value
}

async function buildWorkspaceFixture(cdp) {
  const fixtureText = '첫 번째 실사용 더빙 문장입니다. 두 번째 클립의 목소리를 함께 바꿉니다. 세 번째 문장으로 화면 폭도 점검합니다.'
  await evaluate(cdp, `(() => {
    const button = [...document.querySelectorAll('button')]
      .find((item) => item.textContent?.includes('장문 음성 스튜디오 시작'))
    button?.click()
    return Boolean(button)
  })()`)
  await new Promise((resolve) => setTimeout(resolve, 250))
  await evaluate(cdp, `(() => {
    const editor = document.querySelector('[aria-label="음성으로 만들 장문 내용"]')
    if (!(editor instanceof HTMLTextAreaElement)) return false
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
    setter?.call(editor, ${JSON.stringify(fixtureText)})
    editor.dispatchEvent(new Event('input', { bubbles: true }))
    return true
  })()`)
  await new Promise((resolve) => setTimeout(resolve, 120))
  await evaluate(cdp, `(() => {
    const button = [...document.querySelectorAll('button')]
      .find((item) => item.textContent?.includes('전체 내용 음성 제작'))
    button?.click()
    return Boolean(button)
  })()`)
  await new Promise((resolve) => setTimeout(resolve, 450))
  await evaluate(cdp, `(() => {
    const voices = [...document.querySelectorAll('article.soa-dubbing-block')]
      .filter((item) => item.querySelector('.soa-dubbing-block__script-preview'))
    if (voices.length < 2) return voices.length
    voices[1].dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: true }))
    return voices.length
  })()`)
  await new Promise((resolve) => setTimeout(resolve, 180))
}

const layoutProbeExpression = `(() => {
  const rect = (selector) => {
    const node = document.querySelector(selector)
    if (!(node instanceof HTMLElement)) return null
    const box = node.getBoundingClientRect()
    return { x: box.x, y: box.y, width: box.width, height: box.height, right: box.right, bottom: box.bottom }
  }
  const dock = rect('.soa-dubbing-player-dock')
  const toggle = rect('.soa-dubbing-player-toggle')
  const progress = rect('.soa-dubbing-player-progress')
  const studio = rect('.soa-desktop-studio')
  const rail = rect('.soa-project-rail')
  const center = rect('.soa-desktop-studio__center')
  const drawer = rect('.soa-voice-drawer')
  const batch = rect('.soa-timeline-quick-editor.is-batch')
  const batchControls = rect('.soa-timeline-batch-controls')
  const overflow = document.documentElement.scrollWidth - window.innerWidth
  return {
    viewport: { width: window.innerWidth, height: window.innerHeight },
    overflow,
    dock,
    toggle,
    progress,
    studio,
    rail,
    center,
    drawer,
    batch,
    batchControls,
    assertions: {
      noHorizontalOverflow: overflow <= 1,
      compactDockHeight: Boolean(dock && dock.height <= 82),
      transportOrder: Boolean(toggle && progress && toggle.x < progress.x),
      threeColumnVisible: Boolean(rail && center && drawer && rail.width > 0 && center.width > 0 && drawer.width > 0),
      batchVisible: Boolean(batch && batch.height > 0),
      batchControlsContained: Boolean(batch && batchControls && batchControls.right <= batch.right + 1),
    },
  }
})()`

async function sha256(path) {
  return createHash('sha256').update(await readFile(path)).digest('hex')
}

async function pixelDiff(cdp, actualBase64, baselineBase64, threshold) {
  const expression = `(async () => {
    const load = (source) => new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('baseline image decode failed'))
      image.src = source
    })
    const [actual, baseline] = await Promise.all([
      load(${JSON.stringify('data:image/png;base64,')} + ${JSON.stringify(actualBase64)}),
      load(${JSON.stringify('data:image/png;base64,')} + ${JSON.stringify(baselineBase64)}),
    ])
    if (actual.width !== baseline.width || actual.height !== baseline.height) {
      return {
        dimensionsMatch: false,
        actual: { width: actual.width, height: actual.height },
        baseline: { width: baseline.width, height: baseline.height },
        diffPixels: null,
        diffRatio: 1,
        maxChannelDelta: 255,
        meanChannelDelta: 255,
      }
    }
    const canvas = document.createElement('canvas')
    canvas.width = actual.width
    canvas.height = actual.height
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('2d canvas unavailable')
    context.drawImage(actual, 0, 0)
    const actualData = context.getImageData(0, 0, canvas.width, canvas.height).data
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.drawImage(baseline, 0, 0)
    const baselineData = context.getImageData(0, 0, canvas.width, canvas.height).data
    let diffPixels = 0
    let maxChannelDelta = 0
    let totalChannelDelta = 0
    for (let index = 0; index < actualData.length; index += 4) {
      let pixelDelta = 0
      for (let channel = 0; channel < 4; channel += 1) {
        const delta = Math.abs(actualData[index + channel] - baselineData[index + channel])
        pixelDelta = Math.max(pixelDelta, delta)
        maxChannelDelta = Math.max(maxChannelDelta, delta)
        totalChannelDelta += delta
      }
      if (pixelDelta > ${threshold}) diffPixels += 1
    }
    const totalPixels = canvas.width * canvas.height
    return {
      dimensionsMatch: true,
      actual: { width: actual.width, height: actual.height },
      baseline: { width: baseline.width, height: baseline.height },
      diffPixels,
      diffRatio: totalPixels ? diffPixels / totalPixels : 0,
      maxChannelDelta,
      meanChannelDelta: totalPixels ? totalChannelDelta / (totalPixels * 4) : 0,
    }
  })()`
  return evaluate(cdp, expression)
}

async function optionalFile(path) {
  try {
    const info = await stat(path)
    return info.isFile() ? path : null
  } catch {
    return null
  }
}

await stat(join(dist, 'index.html')).catch(() => {
  throw new Error('dist/index.html이 없습니다. 먼저 production build를 실행하세요.')
})
await mkdir(output, { recursive: true })
const browser = resolveBrowser()
const userDataDirectory = await mkdtemp(join(tmpdir(), 'sorion-visual-'))
const { server, url } = await startStaticServer()
const debuggingPort = 9222 + Math.floor(Math.random() * 400)
const child = spawn(browser.command, [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--no-proxy-server',
  '--proxy-bypass-list=*',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  `--remote-debugging-port=${debuggingPort}`,
  `--user-data-dir=${userDataDirectory}`,
  'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] })

try {
  await waitForJson(`http://127.0.0.1:${debuggingPort}/json/version`)
  const targetResponse = await fetch(
    `http://127.0.0.1:${debuggingPort}/json/new?${encodeURIComponent(url)}`,
    { method: 'PUT' },
  )
  if (!targetResponse.ok) throw new Error(`Chromium target 생성 실패: ${targetResponse.status}`)
  const target = await targetResponse.json()
  const cdp = createCdpClient(target.webSocketDebuggerUrl)
  await cdp.send('Page.enable')
  await cdp.send('Runtime.enable')

  const firstLoad = cdp.once('Page.loadEventFired')
  await cdp.send('Page.navigate', { url })
  await firstLoad
  await buildWorkspaceFixture(cdp)

  const captures = []
  let failed = false
  for (const width of viewports) {
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false,
    })
    await new Promise((resolve) => setTimeout(resolve, 180))
    const metrics = await evaluate(cdp, layoutProbeExpression)
    const screenshot = await cdp.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
      fromSurface: true,
    })
    const filename = `workspace-${width}x${height}.png`
    const screenshotPath = join(output, filename)
    await writeFile(screenshotPath, Buffer.from(screenshot.data, 'base64'))
    const assertions = Object.entries(metrics.assertions)
    const failures = assertions.filter(([, passed]) => !passed).map(([name]) => name)
    const baselinePath = await optionalFile(join(baselineDir, filename))
    let baseline = {
      status: baselinePath ? 'available' : 'pending',
      filename,
      sha256: baselinePath ? await sha256(baselinePath) : null,
      diff: null,
    }
    if (baselinePath && !approveBaseline) {
      const baselineBase64 = (await readFile(baselinePath)).toString('base64')
      const diff = await pixelDiff(cdp, screenshot.data, baselineBase64, channelThreshold)
      const pixelPassed = diff.dimensionsMatch && diff.diffRatio <= maxDiffRatio
      baseline = { ...baseline, status: pixelPassed ? 'matched' : 'changed', diff }
      if (!pixelPassed) failures.push(`pixelDiff>${maxDiffRatio}`)
    } else if (!baselinePath && requireBaseline && !approveBaseline) {
      failures.push('baselineMissing')
    }
    if (failures.length) failed = true
    captures.push({
      viewport: metrics.viewport,
      filename,
      sha256: await sha256(screenshotPath),
      layout: metrics,
      baseline,
      passed: failures.length === 0,
      failures,
    })
  }

  const appVersion = JSON.parse(await readFile(join(root, 'package.json'), 'utf8')).version
  const manifest = {
    schemaVersion: 2,
    appVersion,
    capturedAt: new Date().toISOString(),
    browser: browser.version,
    fixture: 'workspace-multi-select',
    baselinePolicy: {
      directory: baselineDir,
      required: requireBaseline,
      approve: approveBaseline,
      maxDiffRatio,
      channelThreshold,
    },
    captures,
    passed: !failed,
  }
  await writeFile(join(output, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')

  if (approveBaseline && !failed) {
    await mkdir(baselineDir, { recursive: true })
    for (const capture of captures) {
      await copyFile(join(output, capture.filename), join(baselineDir, capture.filename))
    }
    const baselineManifest = {
      schemaVersion: 1,
      appVersion,
      approvedAt: new Date().toISOString(),
      browser: browser.version,
      fixture: 'workspace-multi-select',
      maxDiffRatio,
      channelThreshold,
      captures: captures.map((capture) => ({
        viewport: capture.viewport,
        filename: capture.filename,
        sha256: capture.sha256,
      })),
    }
    await writeFile(
      join(baselineDir, 'manifest.json'),
      `${JSON.stringify(baselineManifest, null, 2)}\n`,
      'utf8',
    )
    console.log(`Visual baseline 승인 완료 · ${baselineDir}`)
  }
  cdp.close()
  if (failed) {
    for (const capture of captures.filter((item) => !item.passed)) {
      const details = {
        failures: capture.failures,
        overflow: capture.layout.overflow,
        batch: capture.layout.batch,
        batchControls: capture.layout.batchControls,
        dock: capture.layout.dock,
        baseline: capture.baseline.status,
      }
      const message = `${capture.viewport.width}px 실패 · ${capture.failures.join(', ')} · ${JSON.stringify(details)}`
      console.error(message)
      if (process.env.GITHUB_ACTIONS === 'true') {
        const escaped = message.replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A')
        console.error(`::error title=Chromium visual layout ${capture.viewport.width}px::${escaped}`)
      }
    }
    process.exitCode = 1
  } else {
    console.log(`Visual layout regression 통과 · ${captures.map((item) => `${item.viewport.width}px`).join(' / ')}`)
  }
} finally {
  const exited = new Promise((resolve) => child.once('exit', resolve))
  child.kill('SIGTERM')
  server.close()
  await Promise.race([exited, new Promise((resolve) => setTimeout(resolve, 1_000))])
  await rm(userDataDirectory, { recursive: true, force: true, maxRetries: 3, retryDelay: 80 })
}
