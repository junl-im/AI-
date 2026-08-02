import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

import { isRetryableNetworkFailure, runCommandWithRetry } from './lock-retry.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const logDirectory = join(root, '.sorion', 'lock-audit', 'npm')
await mkdir(logDirectory, { recursive: true })

function requireRuntime() {
  const npmResult = spawnSync('npm', ['--version'], { encoding: 'utf8' })
  const npm = npmResult.stdout.trim()
  const failures = []
  if (process.versions.node !== '22.18.0') failures.push(`Node ${process.versions.node}`)
  if (npm !== '10.9.3') failures.push(`npm ${npm || '확인 실패'}`)
  if (failures.length) throw new Error(`lock 생성 런타임 불일치: ${failures.join(', ')}`)
}

const env = {
  ...process.env,
  npm_config_fetch_retries: '0',
  npm_config_fetch_retry_factor: '2',
  npm_config_fetch_retry_mintimeout: '5000',
  npm_config_fetch_retry_maxtimeout: '30000',
  npm_config_fetch_timeout: '30000',
  npm_config_maxsockets: '6',
}

async function execute(label, args, { attempts = 1, timeoutMs = 60_000 } = {}) {
  const logs = []
  const result = runCommandWithRetry({
    command: 'npm', args, cwd: root, env, attempts, timeoutMs,
    onAttempt: ({ attempt, attempts: total, output, retryable }) => {
      const text = `=== ${label} · attempt ${attempt}/${total} ===\n${output}`
      logs.push(text)
      process.stdout.write(`\n${text}\n`)
      if (retryable && attempt < total) process.stdout.write('일시적 registry 오류로 재시도합니다.\n')
    },
  })
  await writeFile(join(logDirectory, `${label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.log`), `${logs.join('\n\n')}\n`)
  return { result, output: logs.join('\n\n') }
}

requireRuntime()

// Cache가 완전하면 네트워크 없이 먼저 끝낸다. ENOTCACHED는 정상적인 online fallback 신호다.
const offlineRun = await execute('package-lock-offline', [
  'install', '--package-lock-only', '--ignore-scripts', '--no-audit', '--no-fund', '--offline',
], { timeoutMs: 45_000 })

if ((offlineRun.result.status ?? 1) !== 0) {
  if (!/ENOTCACHED|cache miss|offline mode/i.test(offlineRun.output) && !isRetryableNetworkFailure(offlineRun.output)) {
    throw new Error('offline package-lock 생성이 의존성 오류로 실패했습니다.')
  }
  const onlineRun = await execute('package-lock-online', [
    'install', '--package-lock-only', '--ignore-scripts', '--no-audit', '--no-fund', '--prefer-offline',
  ], { attempts: 2, timeoutMs: 45_000 })
  if ((onlineRun.result.status ?? 1) !== 0) throw new Error(`npm package lock 실패 · 종료 코드 ${onlineRun.result.status ?? 1}`)
  if (/npm warn.*(?:ERESOLVE|UNMET|invalid|missing|EBADENGINE)/i.test(onlineRun.output)) throw new Error('npm package lock에서 위험 warning을 발견했습니다.')
}

const ciRun = await execute('npm-ci', ['ci', '--no-audit', '--no-fund', '--prefer-offline'], {
  attempts: 2,
  timeoutMs: 60_000,
})
if ((ciRun.result.status ?? 1) !== 0) throw new Error(`npm ci 실패 · 종료 코드 ${ciRun.result.status ?? 1}`)
if (/npm warn.*(?:ERESOLVE|UNMET|invalid|missing|EBADENGINE)/i.test(ciRun.output)) throw new Error('npm ci에서 위험 warning을 발견했습니다.')
console.log('npm lock 생성 및 clean install 완료')
