import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { isRetryableNetworkFailure, runCommandWithRetry } from './lock-retry.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const logDirectory = join(root, '.sorion', 'npm-ci')
await mkdir(logDirectory, { recursive: true })
const env = {
  ...process.env,
  npm_config_fetch_retries: '0',
  npm_config_fetch_timeout: '30000',
  npm_config_maxsockets: '6',
}

async function run(label, args, attempts, timeoutMs) {
  const outputs = []
  const result = runCommandWithRetry({
    command: 'npm', args, cwd: root, attempts, timeoutMs, env,
    onAttempt: ({ attempt, attempts: total, output, retryable }) => {
      const message = `=== ${label} · attempt ${attempt}/${total} ===\n${output}`
      outputs.push(message)
      process.stdout.write(`\n${message}\n`)
      if (retryable && attempt < total) process.stdout.write('일시적 npm network 오류로 재시도합니다.\n')
    },
  })
  await writeFile(join(logDirectory, `${label}.log`), `${outputs.join('\n\n')}\n`, 'utf8')
  return { result, output: outputs.join('\n\n') }
}

const offline = await run('npm-ci-offline', ['ci', '--no-audit', '--no-fund', '--offline'], 1, 45_000)
if ((offline.result.status ?? 1) !== 0) {
  if (!/ENOTCACHED|cache miss|offline mode/i.test(offline.output) && !isRetryableNetworkFailure(offline.output)) {
    throw new Error('offline npm ci가 의존성 또는 lock 오류로 실패했습니다.')
  }
  const online = await run('npm-ci-online', ['ci', '--no-audit', '--no-fund', '--prefer-offline'], 2, 60_000)
  if ((online.result.status ?? 1) !== 0) throw new Error(`npm ci 실패 · 종료 코드 ${online.result.status ?? 1}`)
}
