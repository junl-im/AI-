import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import process from 'node:process'

const apiDirectory = fileURLToPath(new URL('../services/api/', import.meta.url))
const workerDirectory = fileURLToPath(new URL('../services/worker/', import.meta.url))
const uv = process.platform === 'win32' ? 'uv.exe' : 'uv'
const webUrl = process.env.SORION_WEB_URL?.trim() || 'https://junl-im.github.io/AI-/'
const withWorker = process.argv.includes('--worker') || Boolean(process.env.SORION_WORKER_MODEL_PATH)
const children = []
let startupFailure = null
let shuttingDown = false
let apiReady = false

function start(command, args, options) {
  const child = spawn(command, args, { ...options, stdio: 'inherit' })
  children.push(child)
  child.on('error', (error) => {
    startupFailure = new Error(`${command} 시작 실패: ${error.message}`)
    if (apiReady) shutdown(1)
  })
  child.on('exit', (code) => {
    if (shuttingDown) return
    startupFailure = new Error(`${command}가 예기치 않게 종료됐습니다. 종료 코드 ${code ?? 1}`)
    if (apiReady) shutdown(code || 1)
  })
  return child
}

function shutdown(code = 0) {
  shuttingDown = true
  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM')
  }
  process.exitCode = code
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForApi() {
  const deadline = Date.now() + 120_000
  while (Date.now() < deadline) {
    if (startupFailure) throw startupFailure
    try {
      const health = await fetch('http://127.0.0.1:8000/api/v1/health', { signal: AbortSignal.timeout(2_000) })
      if (health.ok) return
    } catch {
      // uv가 첫 실행 의존성을 준비하는 동안 짧게 재시도한다.
    }
    await delay(600)
  }
  throw new Error('2분 안에 Voice API가 준비되지 않았습니다.')
}

async function reportEngine() {
  const response = await fetch('http://127.0.0.1:8000/api/v1/engines', { signal: AbortSignal.timeout(4_000) })
  const engines = await response.json()
  const ready = engines.find((engine) => engine.ready && engine.mode !== 'mock')
  if (ready) {
    console.log(`[SoriON] 엔진 심장박동 확인: ${ready.name}`)
  } else {
    console.warn('[SoriON] 로컬 AI/시스템 엔진은 아직 준비되지 않았습니다.')
    console.warn('[SoriON] 웹에서는 브라우저 한국어 음성을 즉시 사용합니다.')
    console.warn('[SoriON] Windows 설정에서 한국어 음성 패키지를 설치하면 WAV 생성이 활성화됩니다.')
  }
}

function openBrowser(url) {
  const command = process.platform === 'win32'
    ? ['cmd.exe', ['/c', 'start', '', url]]
    : process.platform === 'darwin'
      ? ['open', [url]]
      : ['xdg-open', [url]]
  const child = spawn(command[0], command[1], { detached: true, stdio: 'ignore' })
  child.unref()
}

const apiEnv = {
  ...process.env,
  SORION_ALLOW_MOCK_ENGINE: process.env.SORION_ALLOW_MOCK_ENGINE || 'false',
}
if (withWorker) {
  if (!process.env.SORION_WORKER_MODEL_PATH) {
    console.error('[SoriON] --worker 사용에는 SORION_WORKER_MODEL_PATH가 필요합니다.')
    process.exit(1)
  }
  apiEnv.SORION_COSYVOICE_WORKER_URL = 'http://127.0.0.1:9000'
  start(uv, [
    'run', '--python', '3.10', 'uvicorn', 'app.main:app',
    '--host', '127.0.0.1', '--port', '9000',
  ], { cwd: workerDirectory, env: process.env })
}
start(uv, [
  'run', '--python', '3.10', 'uvicorn', 'app.main:app',
  '--host', '127.0.0.1', '--port', '8000',
], { cwd: apiDirectory, env: apiEnv })

console.log('[SoriON] 로컬 음성 엔진을 시작합니다. 첫 실행은 Python 준비 때문에 조금 걸릴 수 있습니다.')
try {
  await waitForApi()
  apiReady = true
  await reportEngine()
  console.log(`[SoriON] 웹 열기: ${webUrl}`)
  openBrowser(webUrl)
  console.log('[SoriON] 이 창을 닫으면 로컬 음성 엔진도 종료됩니다.')
} catch (error) {
  console.error(`[SoriON] 엔진 시작 실패: ${error instanceof Error ? error.message : error}`)
  shutdown(1)
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))
