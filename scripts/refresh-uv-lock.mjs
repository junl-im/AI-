import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { runCommandWithRetry } from './lock-retry.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const service = process.argv[2]
if (!['api', 'worker'].includes(service)) throw new Error('사용법: node scripts/refresh-uv-lock.mjs api|worker')
const cwd = join(root, 'services', service)
const logDirectory = join(root, '.sorion', 'lock-audit', service)
await mkdir(logDirectory, { recursive: true })
await writeFile(join(logDirectory, 'status.txt'), `${service} lock bootstrap started\n`, 'utf8')

const env = {
  ...process.env,
  UV_HTTP_TIMEOUT: '60',
  UV_HTTP_RETRIES: '1',
}

async function execute(label, args, attempts = 1, timeoutMs = 120_000) {
  const logs = []
  const result = runCommandWithRetry({
    command: 'uv', args, cwd, env, attempts, timeoutMs,
    onAttempt: ({ attempt, attempts: total, output, retryable }) => {
      const text = `=== ${service} ${label} · attempt ${attempt}/${total} ===\n${output}`
      logs.push(text)
      process.stdout.write(`\n${text}\n`)
      if (retryable && attempt < total) process.stdout.write('일시적 Python registry 오류로 재시도합니다.\n')
    },
  })
  await writeFile(join(logDirectory, `${label}.log`), `${logs.join('\n\n')}\n`)
  if ((result.status ?? 1) !== 0) throw new Error(`${service} ${label} 실패 · 종료 코드 ${result.status ?? 1}`)
}

await execute('lock', ['lock', '--python', '3.10'], 2, 90_000)
await execute('lock-check', ['lock', '--check'])
await execute('sync-locked', ['sync', '--locked', '--dev', '--python', '3.10'], 2, 120_000)
await writeFile(join(logDirectory, 'status.txt'), `${service} lock bootstrap completed\n`, 'utf8')
console.log(`${service} uv lock 생성 및 locked sync 완료`)
