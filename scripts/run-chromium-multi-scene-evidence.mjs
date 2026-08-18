import { createHash } from 'node:crypto'
import { createServer } from 'node:http'
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { extname, join, normalize } from 'node:path'
import { spawn, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const dist = join(root, 'dist')
const mobileMode = process.argv.includes('--mobile')
const output = join(root, '.sorion', 'web-quality', mobileMode ? 'multi-scene-mobile' : 'multi-scene-desktop')
const viewportConfigs = mobileMode
  ? [
      { width: 360, height: 800, mobile: true },
      { width: 390, height: 844, mobile: true },
      { width: 430, height: 932, mobile: true },
    ]
  : [1024, 1280, 1440].map((width) => ({ width, height: 900, mobile: false }))
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
      response.writeHead(200, { 'Content-Type': contentType(file), 'Cache-Control': 'no-store' })
      response.end(body)
    } catch (error) {
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
      response.end(error instanceof Error ? error.message : 'static server error')
    }
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('multi-scene server port를 열지 못했습니다.')
  return { server, url: `http://127.0.0.1:${address.port}/` }
}

async function waitForJson(url, timeoutMs = 20_000, browserState = null) {
  const deadline = Date.now() + timeoutMs
  let lastError = null
  while (Date.now() < deadline) {
    if (browserState?.exited()) {
      throw new Error(`Chromium이 디버깅 endpoint 준비 전에 종료되었습니다. exit=${browserState.exitCode()} stderr=${browserState.stderr()}`)
    }
    try {
      const response = await fetch(url)
      if (response.ok) return await response.json()
      lastError = new Error(`HTTP ${response.status}`)
    } catch (error) {
      lastError = error
    }
    await new Promise((resolve) => setTimeout(resolve, 120))
  }
  const suffix = lastError instanceof Error ? ` · 마지막 오류: ${lastError.message}` : ''
  throw new Error(`시간 안에 브라우저 디버깅 endpoint가 열리지 않았습니다: ${url}${suffix}`)
}

function createCdpClient(socketUrl) {
  const socket = new WebSocket(socketUrl)
  let nextId = 1
  const pending = new Map()
  const opened = new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true })
    socket.addEventListener('error', reject, { once: true })
  })
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data))
    if (!message.id) return
    const entry = pending.get(message.id)
    if (!entry) return
    pending.delete(message.id)
    if (message.error) entry.reject(new Error(message.error.message))
    else entry.resolve(message.result)
  })
  return {
    async send(method, params = {}) {
      await opened
      const id = nextId++
      const result = new Promise((resolve, reject) => pending.set(id, { resolve, reject }))
      socket.send(JSON.stringify({ id, method, params }))
      return result
    },
    close() { socket.close() },
  }
}

async function evaluate(cdp, expression) {
  const result = await cdp.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? 'Runtime.evaluate 실패')
  return result.result?.value
}

async function waitForCondition(cdp, expression, label, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs
  let lastError = null
  while (Date.now() < deadline) {
    try {
      if (await evaluate(cdp, expression)) return true
      lastError = null
    } catch (error) {
      lastError = error
    }
    await new Promise((resolve) => setTimeout(resolve, 120))
  }
  const suffix = lastError instanceof Error ? ` · 마지막 오류: ${lastError.message}` : ''
  throw new Error(`${label} 준비 대기 시간이 초과되었습니다.${suffix}`)
}

async function setViewport(cdp, viewport) {
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.mobile,
  })
  await new Promise((resolve) => setTimeout(resolve, 180))
}

async function openStudio(cdp) {
  await waitForCondition(
    cdp,
    `(() => [...document.querySelectorAll('button')].some((item) => item.textContent?.includes('장문 음성 스튜디오 시작')))()`,
    '장문 음성 스튜디오 시작 버튼',
  )
  const opened = await evaluate(cdp, `(() => {
    const button = [...document.querySelectorAll('button')].find((item) => item.textContent?.includes('장문 음성 스튜디오 시작'))
    button?.click()
    return Boolean(button)
  })()`)
  if (!opened) throw new Error('장문 음성 스튜디오 시작 버튼을 실행하지 못했습니다.')
  await waitForCondition(cdp, `(() => Boolean(document.querySelector('.soa-dubbing-workspace')))()`, '더빙 작업공간')
}

async function buildWorkspaceFixture(cdp) {
  const fixtureText = '첫 번째 실사용 더빙 문장입니다. 두 번째 클립의 목소리를 함께 바꿉니다. 세 번째 문장으로 화면 폭도 점검합니다.'
  await openStudio(cdp)
  await waitForCondition(cdp, `(() => document.querySelector('[aria-label="음성으로 만들 장문 내용"]') instanceof HTMLTextAreaElement)()`, '장문 내용 편집기')
  const editorUpdated = await evaluate(cdp, `(() => {
    const editor = document.querySelector('[aria-label="음성으로 만들 장문 내용"]')
    if (!(editor instanceof HTMLTextAreaElement)) return false
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
    setter?.call(editor, ${JSON.stringify(fixtureText)})
    editor.dispatchEvent(new Event('input', { bubbles: true }))
    return true
  })()`)
  if (!editorUpdated) throw new Error('장문 내용 fixture를 입력하지 못했습니다.')
  await waitForCondition(cdp, `(() => {
    const button = document.querySelector('button[aria-label^="전체 내용 음성 제작"]') ?? document.querySelector('button.soa-one-flow-composer__generate')
    return button instanceof HTMLButtonElement && !button.disabled
  })()`, '전체 내용 음성 제작 버튼')
  const started = await evaluate(cdp, `(() => {
    const button = document.querySelector('button[aria-label^="전체 내용 음성 제작"]') ?? document.querySelector('button.soa-one-flow-composer__generate')
    if (!(button instanceof HTMLButtonElement) || button.disabled) return false
    button.click()
    return true
  })()`)
  if (!started) throw new Error('전체 내용 음성 제작 버튼을 실행하지 못했습니다.')
  await waitForCondition(cdp, `(() => [...document.querySelectorAll('article.soa-dubbing-block')].filter((item) => item.querySelector('.soa-dubbing-block__script-preview')).length >= 2)()`, 'workspace fixture 음성 클립', 20_000)
  await evaluate(cdp, `(() => {
    const voices = [...document.querySelectorAll('article.soa-dubbing-block')].filter((item) => item.querySelector('.soa-dubbing-block__script-preview'))
    if (voices.length < 2) return false
    voices[0].click()
    if (${mobileMode ? 'true' : 'false'}) {
      const touch = voices[1].querySelector('.soa-timeline-touch-select')
      if (touch instanceof HTMLButtonElement) touch.click()
    } else {
      voices[1].dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: true }))
    }
    return true
  })()`)
  await waitForCondition(cdp, `(() => Boolean(document.querySelector('.soa-timeline-quick-editor.is-batch')))()`, 'workspace 다중 선택 편집기')
}

async function exerciseVoiceSurface(cdp) {
  if (mobileMode) {
    const opened = await evaluate(cdp, `(() => {
      const button = [...document.querySelectorAll('button')].find((item) => item.getAttribute('aria-label')?.startsWith('현재 목소리 '))
      button?.click()
      return Boolean(button)
    })()`)
    if (!opened) throw new Error('모바일 목소리 선택 Sheet를 열지 못했습니다.')
    await waitForCondition(cdp, `(() => Boolean(document.querySelector('.soa-voice-picker-sheet')))()`, '모바일 목소리 선택 Sheet')
    const interaction = await evaluate(cdp, `(() => {
      const sheet = document.querySelector('.soa-voice-picker-sheet')
      if (!(sheet instanceof HTMLElement)) return null
      const selected = sheet.querySelector('[role="radio"][aria-checked="true"]')
      const candidates = [...sheet.querySelectorAll('.soa-voice-sheet-list > div')]
      const target = candidates.find((item) => !item.classList.contains('is-selected') && item.querySelector('button[aria-label$="목소리 미리듣기"]'))
      const preview = target?.querySelector('button[aria-label$="목소리 미리듣기"]')
      if (!(preview instanceof HTMLButtonElement)) return null
      const before = selected?.textContent?.trim() ?? null
      const targetLabel = preview.getAttribute('aria-label')
      preview.click()
      return { before, targetLabel }
    })()`)
    if (!interaction) throw new Error('모바일 Voice Picker 미리듣기 대상을 찾지 못했습니다.')
    await waitForCondition(cdp, `(() => {
      const sheet = document.querySelector('.soa-voice-picker-sheet')
      const selected = sheet?.querySelector('[role="radio"][aria-checked="true"]')
      return Boolean(selected && selected.closest('div')?.classList.contains('is-selected'))
    })()`, '모바일 미리듣기 선택 반영')
    const after = await evaluate(cdp, `(() => document.querySelector('.soa-voice-picker-sheet [role="radio"][aria-checked="true"]')?.textContent?.trim() ?? null)()`)
    return { ...interaction, after, changed: interaction.before !== after, surface: 'voice-picker' }
  }

  const interaction = await evaluate(cdp, `(() => {
    const drawer = document.querySelector('.soa-voice-drawer')
    if (!(drawer instanceof HTMLElement)) return null
    const selected = drawer.querySelector('[role="radio"][aria-checked="true"]')
    const articles = [...drawer.querySelectorAll('.soa-voice-drawer__presets article')]
    const target = articles.find((item) => !item.classList.contains('is-selected') && item.querySelector('.soa-voice-drawer__play'))
    const preview = target?.querySelector('.soa-voice-drawer__play')
    if (!(preview instanceof HTMLButtonElement)) return null
    const before = selected?.textContent?.trim() ?? null
    const targetLabel = preview.getAttribute('aria-label')
    preview.click()
    return { before, targetLabel }
  })()`)
  if (!interaction) throw new Error('Desktop Voice Drawer 미리듣기 대상을 찾지 못했습니다.')
  await waitForCondition(cdp, `(() => Boolean(document.querySelector('.soa-voice-drawer [role="radio"][aria-checked="true"]')?.closest('article')?.classList.contains('is-selected')))()`, 'Desktop 미리듣기 선택 반영')
  const after = await evaluate(cdp, `(() => document.querySelector('.soa-voice-drawer [role="radio"][aria-checked="true"]')?.textContent?.trim() ?? null)()`)
  return { ...interaction, after, changed: interaction.before !== after, surface: 'voice-drawer' }
}

async function closeVoiceSurface(cdp) {
  if (!mobileMode) return
  await evaluate(cdp, `(() => {
    const button = document.querySelector('button[aria-label="목소리 선택 닫기"]')
    if (button instanceof HTMLButtonElement) button.click()
    return true
  })()`)
  await waitForCondition(cdp, `(() => !document.querySelector('.soa-voice-picker-sheet'))()`, '모바일 목소리 Sheet 닫기')
}

async function seedRecoveryProject(cdp) {
  const project = {
    id: 'visual-recovery-evidence',
    title: 'Visual Recovery Evidence',
    text: '유실 보이스 A 문장입니다. 유실 보이스 B 문장입니다. 정상 보이스 문장입니다.',
    voiceId: 'sori-warm',
    emotion: 'neutral',
    createdAt: '2026-08-18T00:00:00.000Z',
    updatedAt: '2026-08-18T00:00:00.000Z',
    status: 'draft',
    speed: 1,
    pitch: 0,
    normalizeText: true,
    jobIds: [null, null, null],
    timelineClips: [
      { text: '유실 보이스 A 문장입니다.', voiceId: 'myvoice:visual-missing-a', voiceName: '유실 보이스 A' },
      { text: '유실 보이스 B 문장입니다.', voiceId: 'myvoice:visual-missing-b', voiceName: '유실 보이스 B' },
      { text: '정상 보이스 문장입니다.', voiceId: 'sori-warm', voiceName: '혜린' },
    ],
  }
  const seeded = await evaluate(cdp, `(async () => {
    const project = ${JSON.stringify(project)}
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('sorion-ai', 4)
      request.onupgradeneeded = () => {
        const database = request.result
        if (!database.objectStoreNames.contains('projects')) database.createObjectStore('projects', { keyPath: 'id' })
        if (!database.objectStoreNames.contains('qualityReviews')) database.createObjectStore('qualityReviews', { keyPath: 'id' })
        if (!database.objectStoreNames.contains('voiceProfiles')) database.createObjectStore('voiceProfiles', { keyPath: 'id' })
        if (!database.objectStoreNames.contains('workspaceSessions')) database.createObjectStore('workspaceSessions', { keyPath: 'id' })
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    await new Promise((resolve, reject) => {
      const tx = db.transaction(['projects', 'workspaceSessions'], 'readwrite')
      tx.objectStore('projects').put(project)
      tx.objectStore('workspaceSessions').clear()
      tx.oncomplete = resolve
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
    db.close()
    return true
  })()`)
  if (!seeded) throw new Error('recovery evidence project를 IndexedDB에 준비하지 못했습니다.')
}

async function buildRecoveryFixture(cdp, url) {
  await seedRecoveryProject(cdp)
  const navigation = await cdp.send('Page.navigate', { url: `${url}?scene=recovery-evidence` })
  if (navigation?.errorText) throw new Error(`recovery fixture reload 실패: ${navigation.errorText}`)
  await waitForCondition(cdp, `(() => document.readyState === 'complete')()`, 'recovery page load', 20_000)
  await openStudio(cdp)
  await waitForCondition(cdp, `(() => Boolean(document.querySelector('button[aria-label="Visual Recovery Evidence 프로젝트 열기"]')))()`, 'recovery project rail item', 20_000)
  const opened = await evaluate(cdp, `(() => {
    const button = document.querySelector('button[aria-label="Visual Recovery Evidence 프로젝트 열기"]')
    if (!(button instanceof HTMLButtonElement)) return false
    button.click()
    return true
  })()`)
  if (!opened) throw new Error('recovery fixture 프로젝트를 열지 못했습니다.')
  await waitForCondition(cdp, `(() => [...document.querySelectorAll('article.soa-dubbing-block')].filter((item) => item.querySelector('.soa-dubbing-block__script-preview')).length === 3)()`, 'recovery fixture 음성 클립 3개', 20_000)
  const selected = await evaluate(cdp, `(() => {
    const voices = [...document.querySelectorAll('article.soa-dubbing-block')].filter((item) => item.querySelector('.soa-dubbing-block__script-preview'))
    if (voices.length !== 3) return 0
    voices[0].click()
    for (const voice of voices.slice(1)) {
      if (${mobileMode ? 'true' : 'false'}) {
        const touch = voice.querySelector('.soa-timeline-touch-select')
        if (touch instanceof HTMLButtonElement) touch.click()
      } else {
        voice.dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: true }))
      }
    }
    return voices.length
  })()`)
  if (selected !== 3) throw new Error(`recovery fixture 선택 대상이 3개가 아닙니다: ${selected}`)
  await waitForCondition(cdp, `(() => {
    const recovery = document.querySelector('[aria-label="선택 사용 불가 목소리 복구"]')
    return Boolean(recovery && recovery.textContent?.includes('사용 불가 MY VOICE 2개'))
  })()`, '사용 불가 MY VOICE 2/3 recovery status')
  const impactOpened = await evaluate(cdp, `(() => {
    const recovery = document.querySelector('[aria-label="선택 사용 불가 목소리 복구"]')
    const button = recovery ? [...recovery.querySelectorAll('button')].find((item) => item.textContent?.includes('복구 영향 확인')) : null
    button?.click()
    return Boolean(button)
  })()`)
  if (!impactOpened) throw new Error('복구 영향 확인 버튼을 실행하지 못했습니다.')
  await waitForCondition(cdp, `(() => {
    const dialog = document.querySelector('[aria-label="사용 불가 목소리 일괄 복구 영향 확인"]')
    return Boolean(dialog && dialog.textContent?.includes('선택 3개 중 사용 불가 MY VOICE 2개만 변경합니다.'))
  })()`, 'recovery impact dialog exact 2/3 scope')
}

const workspaceProbe = `(() => {
  const overflow = document.documentElement.scrollWidth - window.innerWidth
  const batch = document.querySelector('.soa-timeline-quick-editor.is-batch')
  const timeline = document.querySelector('.soa-timeline')
  return {
    overflow,
    assertions: {
      noHorizontalOverflow: overflow <= 1,
      timelineVisible: Boolean(timeline instanceof HTMLElement && timeline.getBoundingClientRect().height > 0),
      batchVisible: Boolean(batch instanceof HTMLElement && batch.getBoundingClientRect().height > 0),
    },
  }
})()`

const voiceProbe = `(() => {
  const overflow = document.documentElement.scrollWidth - window.innerWidth
  const surface = document.querySelector(${JSON.stringify(mobileMode ? '.soa-voice-picker-sheet' : '.soa-voice-drawer')})
  const box = surface instanceof HTMLElement ? surface.getBoundingClientRect() : null
  const selected = surface?.querySelector('[role="radio"][aria-checked="true"]')
  const previewButtons = surface ? [...surface.querySelectorAll('button[aria-label*="미리듣기"]')] : []
  return {
    overflow,
    surface: box ? { x: box.x, y: box.y, width: box.width, height: box.height, right: box.right, bottom: box.bottom } : null,
    selectedText: selected?.textContent?.trim() ?? null,
    previewButtonCount: previewButtons.length,
    assertions: {
      noHorizontalOverflow: overflow <= 1,
      voiceSurfaceVisible: Boolean(box && box.width > 0 && box.height > 0),
      selectedVoiceVisible: Boolean(selected),
      previewControlsVisible: previewButtons.length >= 5,
      surfaceContained: Boolean(box && box.x >= -1 && box.right <= window.innerWidth + 1),
    },
  }
})()`

const recoveryProbe = `(() => {
  const overflow = document.documentElement.scrollWidth - window.innerWidth
  const dialog = document.querySelector('[aria-label="사용 불가 목소리 일괄 복구 영향 확인"]')
  const box = dialog instanceof HTMLElement ? dialog.getBoundingClientRect() : null
  const text = dialog?.textContent ?? ''
  const selectedBlocks = document.querySelectorAll('article.soa-dubbing-block.is-selected').length
  return {
    overflow,
    dialog: box ? { x: box.x, y: box.y, width: box.width, height: box.height, right: box.right, bottom: box.bottom } : null,
    selectedBlocks,
    text,
    assertions: {
      noHorizontalOverflow: overflow <= 1,
      recoveryDialogVisible: Boolean(box && box.width > 0 && box.height > 0),
      recoveryDialogContained: Boolean(box && box.x >= -1 && box.right <= window.innerWidth + 1),
      selectedThree: selectedBlocks === 3,
      unavailableTwoOnly: text.includes('선택 3개 중 사용 불가 MY VOICE 2개만 변경합니다.'),
      undoSafetyVisible: text.includes('과거 음원 파일을 부활시키지 않고'),
      regenerateActionVisible: [...(dialog?.querySelectorAll('button') ?? [])].some((item) => item.textContent?.includes('교체 후 재생성')),
    },
  }
})()`

async function sha256(path) {
  return createHash('sha256').update(await readFile(path)).digest('hex')
}

async function captureScene(cdp, scene, viewport, probeExpression, interaction = null) {
  await setViewport(cdp, viewport)
  const metrics = await evaluate(cdp, probeExpression)
  const screenshot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, fromSurface: true })
  const surface = scene === 'voice-surface' ? (mobileMode ? 'voice-picker' : 'voice-drawer') : scene
  const filename = `${surface}-${viewport.width}x${viewport.height}.png`
  const screenshotPath = join(output, filename)
  await writeFile(screenshotPath, Buffer.from(screenshot.data, 'base64'))
  const failures = Object.entries(metrics.assertions).filter(([, passed]) => !passed).map(([name]) => name)
  if (interaction && interaction.changed === false) failures.push('previewDidNotSelectVoice')
  return {
    scene,
    surface,
    viewport: { width: viewport.width, height: viewport.height },
    filename,
    sha256: await sha256(screenshotPath),
    layout: metrics,
    interaction,
    passed: failures.length === 0,
    failures,
  }
}

await stat(join(dist, 'index.html')).catch(() => { throw new Error('dist/index.html이 없습니다. 먼저 production build를 실행하세요.') })
await mkdir(output, { recursive: true })
const browser = resolveBrowser()
const userDataDirectory = await mkdtemp(join(tmpdir(), 'sorion-multi-scene-'))
const { server, url } = await startStaticServer()
const debuggingPort = 9722 + Math.floor(Math.random() * 300)
const child = spawn(browser.command, [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--no-proxy-server', '--proxy-bypass-list=*',
  '--hide-scrollbars', '--force-device-scale-factor=1', `--remote-debugging-port=${debuggingPort}`, `--user-data-dir=${userDataDirectory}`, 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] })
const chromiumStderr = []
child.stderr?.setEncoding('utf8')
child.stderr?.on('data', (chunk) => {
  chromiumStderr.push(String(chunk))
  if (chromiumStderr.length > 40) chromiumStderr.shift()
})
const browserState = {
  exited: () => child.exitCode !== null,
  exitCode: () => child.exitCode,
  stderr: () => chromiumStderr.join('').trim().slice(-4_000),
}
let stage = 'chromium-debug-endpoint'

try {
  await waitForJson(`http://127.0.0.1:${debuggingPort}/json/version`, 20_000, browserState)
  stage = 'chromium-target'
  const targetResponse = await fetch(`http://127.0.0.1:${debuggingPort}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' })
  if (!targetResponse.ok) throw new Error(`Chromium target 생성 실패: ${targetResponse.status}`)
  const target = await targetResponse.json()
  stage = 'cdp-connect'
  const cdp = createCdpClient(target.webSocketDebuggerUrl)
  await cdp.send('Page.enable')
  await cdp.send('Runtime.enable')
  await setViewport(cdp, viewportConfigs[0])
  if (mobileMode) await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
  stage = 'page-navigate'
  const navigation = await cdp.send('Page.navigate', { url })
  if (navigation?.errorText) throw new Error(`Page.navigate 실패: ${navigation.errorText}`)
  await waitForCondition(cdp, `(() => document.readyState === 'complete')()`, 'production page load', 20_000)

  stage = 'workspace-fixture'
  await buildWorkspaceFixture(cdp)
  const captures = []
  let failed = false

  stage = 'workspace-scene'
  for (const viewport of viewportConfigs) {
    const capture = await captureScene(cdp, 'workspace', viewport, workspaceProbe)
    captures.push(capture)
    if (!capture.passed) failed = true

    stage = `voice-surface-${viewport.width}`
    const interaction = await exerciseVoiceSurface(cdp)
    const voiceCapture = await captureScene(cdp, 'voice-surface', viewport, voiceProbe, interaction)
    captures.push(voiceCapture)
    if (!voiceCapture.passed) failed = true
    await closeVoiceSurface(cdp)
  }

  stage = 'recovery-fixture'
  await buildRecoveryFixture(cdp, url)
  for (const viewport of viewportConfigs) {
    stage = `recovery-impact-${viewport.width}`
    const capture = await captureScene(cdp, 'recovery-impact', viewport, recoveryProbe, {
      selectedCount: 3,
      unavailableCount: 2,
      normalCount: 1,
      exactScope: true,
    })
    captures.push(capture)
    if (!capture.passed) failed = true
  }

  const appVersion = JSON.parse(await readFile(join(root, 'package.json'), 'utf8')).version
  const manifest = {
    schemaVersion: 'chromium-multi-scene/1',
    appVersion,
    capturedAt: new Date().toISOString(),
    browser: browser.version,
    mode: mobileMode ? 'mobile' : 'desktop',
    scenes: ['workspace', 'voice-surface', 'recovery-impact'],
    recoveryFixture: {
      selectedVoiceBlocks: 3,
      unavailableMyVoiceBlocks: 2,
      normalVoiceBlocks: 1,
      realWorkerClaimed: false,
      note: 'UI recovery scope fixture only. 실제 MY VOICE Worker 성공 증거가 아닙니다.',
    },
    captures,
    passed: !failed,
  }
  await writeFile(join(output, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  cdp.close()

  if (failed) {
    for (const capture of captures.filter((item) => !item.passed)) {
      console.error(`${capture.scene} ${capture.viewport.width}px 실패 · ${capture.failures.join(', ')}`)
    }
    process.exitCode = 1
  } else {
    console.log(`Chromium multi-scene evidence 통과 · ${mobileMode ? 'mobile' : 'desktop'} · ${captures.length} captures`)
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  const stderr = browserState.stderr()
  const detail = stderr ? `${message} · chromium stderr: ${stderr}` : message
  console.error(`Chromium multi-scene runner 실패 · stage=${stage} · ${detail}`)
  await writeFile(join(output, 'runner-failure.json'), `${JSON.stringify({
    schemaVersion: 'chromium-multi-scene-failure/1', stage, browser: browser.version, error: message, chromiumStderr: stderr || null, capturedAt: new Date().toISOString(),
  }, null, 2)}\n`, 'utf8').catch(() => {})
  process.exitCode = 1
} finally {
  const exited = new Promise((resolve) => child.once('exit', resolve))
  child.kill('SIGTERM')
  server.close()
  await Promise.race([exited, new Promise((resolve) => setTimeout(resolve, 1_000))])
  await rm(userDataDirectory, { recursive: true, force: true, maxRetries: 3, retryDelay: 80 })
}
