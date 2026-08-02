import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const apiDirectory = fileURLToPath(new URL('../services/api/', import.meta.url))
const presetDirectory = fileURLToPath(new URL('../voice-presets/', import.meta.url))
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
    '8000',
    '--reload',
  ],
  {
    cwd: apiDirectory,
    stdio: 'inherit',
    env: {
      ...process.env,
      SORION_COSYVOICE_PRESET_DIRECTORY:
        process.env.SORION_COSYVOICE_PRESET_DIRECTORY || presetDirectory,
    },
  },
)

child.on('error', (error) => {
  console.error(`Voice API를 시작하지 못했습니다: ${error.message}`)
  process.exitCode = 1
})

child.on('exit', (code, signal) => {
  if (signal) console.error(`Voice API가 ${signal} 신호로 종료되었습니다.`)
  process.exitCode = code ?? 1
})
