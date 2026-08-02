import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import process from 'node:process'

const root = fileURLToPath(new URL('../', import.meta.url))
const apiDirectory = fileURLToPath(new URL('../services/api/', import.meta.url))
const workerDirectory = fileURLToPath(new URL('../services/worker/', import.meta.url))
const presetDirectory = fileURLToPath(new URL('../voice-presets/', import.meta.url))
const uv = process.platform === 'win32' ? 'uv.exe' : 'uv'
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const withWorker = process.argv.includes('--worker') || Boolean(process.env.SORION_WORKER_MODEL_PATH)
const children = []

function start(command, args, options) {
  const child = spawn(command, args, { ...options, stdio: 'inherit' })
  children.push(child)
  child.on('error', (error) => {
    console.error(`[SoriON] ${command} 시작 실패: ${error.message}`)
    shutdown(1)
  })
  child.on('exit', (code) => {
    if (code && code !== 0) shutdown(code)
  })
  return child
}

function shutdown(code = 0) {
  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM')
  }
  process.exitCode = code
}

const apiEnv = {
  ...process.env,
  SORION_COSYVOICE_PRESET_DIRECTORY:
    process.env.SORION_COSYVOICE_PRESET_DIRECTORY || presetDirectory,
}
if (withWorker) apiEnv.SORION_COSYVOICE_WORKER_URL = 'http://127.0.0.1:9000'

if (withWorker) {
  start(uv, [
    'run', '--python', '3.10', 'uvicorn', 'app.main:app',
    '--host', '127.0.0.1', '--port', '9000',
  ], { cwd: workerDirectory, env: process.env })
}
start(uv, [
  'run', '--python', '3.10', 'uvicorn', 'app.main:app',
  '--host', '127.0.0.1', '--port', '8000',
], { cwd: apiDirectory, env: apiEnv })
start(npm, ['run', 'dev', '--', '--host', '127.0.0.1'], { cwd: root, env: process.env })

console.log('[SoriON] 무료 로컬 런타임을 시작했습니다.')
console.log('[SoriON] Web: http://127.0.0.1:5173')
console.log('[SoriON] Voice API: http://127.0.0.1:8000/api/v1')
console.log(`[SoriON] 프리셋 음색 폴더: ${apiEnv.SORION_COSYVOICE_PRESET_DIRECTORY}`)
console.log(withWorker
  ? '[SoriON] CosyVoice Worker: http://127.0.0.1:9000'
  : '[SoriON] Worker 모델 경로가 없어 System/Melo 엔진으로 시작합니다.')

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))
