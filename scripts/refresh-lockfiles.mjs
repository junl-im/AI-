import { mkdir } from 'node:fs/promises'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

import { runCommandWithRetry } from './lock-retry.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const logDirectory = join(root, '.sorion', 'lock-audit')
await mkdir(logDirectory, { recursive: true })

const resilientEnvironment = {
  ...process.env,
  npm_config_fetch_retries: process.env.npm_config_fetch_retries ?? '5',
  npm_config_fetch_retry_factor: process.env.npm_config_fetch_retry_factor ?? '2',
  npm_config_fetch_retry_mintimeout: process.env.npm_config_fetch_retry_mintimeout ?? '10000',
  npm_config_fetch_retry_maxtimeout: process.env.npm_config_fetch_retry_maxtimeout ?? '120000',
  npm_config_fetch_timeout: process.env.npm_config_fetch_timeout ?? '300000',
  npm_config_maxsockets: process.env.npm_config_maxsockets ?? '8',
  npm_config_prefer_online: process.env.npm_config_prefer_online ?? 'true',
  UV_HTTP_TIMEOUT: process.env.UV_HTTP_TIMEOUT ?? '300',
  UV_HTTP_RETRIES: process.env.UV_HTTP_RETRIES ?? '5',
}

function safeLabel(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

function run(label, command, args, cwd = root, attempts = 1) {
  const attemptOutputs = []
  const result = runCommandWithRetry({
    command,
    args,
    cwd,
    attempts,
    env: resilientEnvironment,
    onAttempt: ({ attempt, attempts: total, output, retryable }) => {
      const heading = `=== ${label} · attempt ${attempt}/${total} ===`
      const body = `${heading}\n${output}`
      attemptOutputs.push(body)
      writeFileSync(join(logDirectory, `${safeLabel(label)}-attempt-${attempt}.log`), `${body}\n`)
      process.stdout.write(`\n${body}\n`)
      if (retryable && attempt < total) {
        process.stdout.write('일시적 registry/network 오류로 분류되어 자동 재시도합니다.\n')
      }
    },
  })
  writeFileSync(
    join(logDirectory, `${safeLabel(label)}.log`),
    `${attemptOutputs.join('\n\n')}\n`,
  )
  if ((result?.status ?? 1) !== 0) {
    throw new Error(`${label} 실패 · 종료 코드 ${result?.status ?? 1}`)
  }
  return attemptOutputs.join('\n')
}

function runBestEffort(label, command, args, cwd = root) {
  try {
    run(label, command, args, cwd)
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  }
}

function requireExactRuntime() {
  const node = process.versions.node
  const npmResult = spawnSync('npm', ['--version'], { encoding: 'utf8' })
  const npm = npmResult.stdout.trim()
  const failures = []
  if (node !== '22.18.0') failures.push(`Node ${node} (필요: 22.18.0)`)
  if (npm !== '10.9.3') failures.push(`npm ${npm || '확인 실패'} (필요: 10.9.3)`)
  if (failures.length > 0) throw new Error(`lock 생성 런타임 불일치: ${failures.join(', ')}`)
}

function auditWarnings(label, output) {
  const lines = output.split(/\r?\n/).filter((line) => /npm warn/i.test(line))
  const dangerous = lines.filter((line) => /ERESOLVE|UNMET|invalid|missing|EBADENGINE/i.test(line))
  const report = lines.length > 0 ? lines.join('\n') : 'npm warning 없음\n'
  writeFileSync(join(logDirectory, `${label}-warnings.log`), report)
  if (dangerous.length > 0) {
    throw new Error(`${label}에서 peer/트리 경고 발견:\n${dangerous.join('\n')}`)
  }
}

requireExactRuntime()
runBestEffort('npm cache verify', 'npm', ['cache', 'verify'])
const lockOutput = run(
  'npm package lock',
  'npm',
  [
    'install',
    '--package-lock-only',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    '--prefer-online',
  ],
  root,
  4,
)
auditWarnings('npm-package-lock', lockOutput)
const ciOutput = run(
  'npm clean install',
  'npm',
  ['ci', '--no-audit', '--no-fund', '--prefer-offline'],
  root,
  4,
)
auditWarnings('npm-ci', ciOutput)
run('npm dependency tree', 'node', ['scripts/audit-npm-tree.mjs'])

for (const service of ['api', 'worker']) {
  const cwd = join(root, 'services', service)
  run(`${service} uv lock`, 'uv', ['lock', '--python', '3.10'], cwd, 3)
  run(`${service} uv lock check`, 'uv', ['lock', '--check'], cwd)
  run(`${service} uv sync locked`, 'uv', ['sync', '--locked', '--dev', '--python', '3.10'], cwd, 3)
}
run('lock structure check', 'node', ['scripts/check-lockfiles.mjs'])
console.log(`\n검증된 lock 파일 생성 완료. 감사 로그: ${logDirectory}`)
