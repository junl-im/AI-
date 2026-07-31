import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const workerDirectory = fileURLToPath(new URL('../services/worker/', import.meta.url))
const command = process.platform === 'win32' ? 'uv.exe' : 'uv'
const child = spawn(
  command,
  [
    'run',
    '--python',
    '3.10',
    'uvicorn',
    'app.main:app',
    '--host',
    '0.0.0.0',
    '--port',
    '9000',
    '--reload',
  ],
  { cwd: workerDirectory, stdio: 'inherit' },
)

child.on('error', (error) => {
  console.error(`CosyVoice Worker를 시작하지 못했습니다: ${error.message}`)
  process.exitCode = 1
})

child.on('exit', (code, signal) => {
  if (signal) console.error(`CosyVoice Worker가 ${signal} 신호로 종료되었습니다.`)
  process.exitCode = code ?? 1
})
