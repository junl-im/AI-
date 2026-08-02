import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { runCommandWithRetry } from './lock-retry.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const logDirectory = join(root, '.sorion', 'npm-ci')
await mkdir(logDirectory, { recursive: true })

const outputs = []
const result = runCommandWithRetry({
  command: 'npm',
  args: ['ci', '--no-audit', '--no-fund', '--prefer-offline'],
  cwd: root,
  attempts: 4,
  env: {
    ...process.env,
    npm_config_fetch_retries: process.env.npm_config_fetch_retries ?? '5',
    npm_config_fetch_retry_factor: process.env.npm_config_fetch_retry_factor ?? '2',
    npm_config_fetch_retry_mintimeout: process.env.npm_config_fetch_retry_mintimeout ?? '10000',
    npm_config_fetch_retry_maxtimeout: process.env.npm_config_fetch_retry_maxtimeout ?? '120000',
    npm_config_fetch_timeout: process.env.npm_config_fetch_timeout ?? '300000',
    npm_config_maxsockets: process.env.npm_config_maxsockets ?? '8',
  },
  onAttempt: ({ attempt, attempts, output, retryable }) => {
    const message = `=== npm ci · attempt ${attempt}/${attempts} ===\n${output}`
    outputs.push(message)
    process.stdout.write(`\n${message}\n`)
    if (retryable && attempt < attempts) {
      process.stdout.write('일시적 npm network 오류로 분류되어 자동 재시도합니다.\n')
    }
  },
})
await writeFile(join(logDirectory, 'npm-ci.log'), `${outputs.join('\n\n')}\n`, 'utf8')
if ((result?.status ?? 1) !== 0) {
  throw new Error(`npm ci 실패 · 종료 코드 ${result?.status ?? 1}`)
}
