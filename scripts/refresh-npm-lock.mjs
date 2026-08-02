import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

import { isRetryableNetworkFailure, runCommandWithRetry } from './lock-retry.mjs'

const root = process.env.SORION_LOCK_ROOT || fileURLToPath(new URL('..', import.meta.url))
const lockPath = join(root, 'package-lock.json')
const logDirectory = join(root, '.sorion', 'lock-audit', 'npm')
await mkdir(logDirectory, { recursive: true })
await writeFile(join(logDirectory, 'status.txt'), 'npm lock bootstrap started\n', 'utf8')

async function readExistingLock() {
  try {
    return await readFile(lockPath)
  } catch (error) {
    if (error?.code === 'ENOENT') return null
    throw error
  }
}

async function restoreLock(previousLock) {
  if (previousLock) await writeFile(lockPath, previousLock)
  else await rm(lockPath, { force: true })
}

function requireRuntime() {
  const npmResult = spawnSync('npm', ['--version'], { encoding: 'utf8' })
  const npm = npmResult.stdout.trim()
  const failures = []
  if (process.versions.node !== '22.18.0') failures.push(`Node ${process.versions.node}`)
  if (npm !== '10.9.3') failures.push(`npm ${npm || '확인 실패'}`)
  if (failures.length) throw new Error(`lock 생성 런타임 불일치: ${failures.join(', ')}`)
}

const baseEnv = {
  ...process.env,
  npm_config_fetch_retries: '0',
  npm_config_fetch_retry_factor: '2',
  npm_config_fetch_retry_mintimeout: '5000',
  npm_config_fetch_retry_maxtimeout: '30000',
  npm_config_fetch_timeout: '45000',
  npm_config_maxsockets: '6',
  npm_config_replace_registry_host: 'always',
}
const registryCandidates = (process.env.SORION_NPM_REGISTRIES || [
  'https://registry.npmjs.org/',
  'https://registry.npmjs.com/',
].join(','))
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)

async function execute(label, args, {
  attempts = 1,
  timeoutMs = 75_000,
  env = baseEnv,
} = {}) {
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
  const output = logs.join('\n\n')
  await writeFile(
    join(logDirectory, `${label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.log`),
    `${output}\n`,
    'utf8',
  )
  return { result, output }
}

function isOfflineMiss(output) {
  return /ENOTCACHED|cache miss|offline mode/i.test(output)
}

function hasDangerousWarning(output) {
  return /npm warn.*(?:ERESOLVE|UNMET|invalid|missing|EBADENGINE)/i.test(output)
}

async function generateOnlineLock() {
  let last = null
  for (const [index, registry] of registryCandidates.entries()) {
    const label = `package-lock-online-${index + 1}`
    const run = await execute(label, [
      'install', '--package-lock-only', '--ignore-scripts', '--no-audit', '--no-fund',
      '--prefer-offline', `--registry=${registry}`,
    ], { env: { ...baseEnv, npm_config_registry: registry } })
    last = run
    if ((run.result.status ?? 1) === 0) {
      if (hasDangerousWarning(run.output)) throw new Error(`${registry} lock 생성에서 위험 warning을 발견했습니다.`)
      await writeFile(join(logDirectory, 'selected-registry.txt'), `${registry}\n`, 'utf8')
      return registry
    }
    if (!isRetryableNetworkFailure(run.output)) {
      throw new Error(`${registry} lock 생성이 의존성 오류로 실패했습니다.`)
    }
  }
  throw new Error(`모든 공식 npm registry endpoint가 실패했습니다 · 종료 코드 ${last?.result.status ?? 1}`)
}

async function installFromLock(preferredRegistry) {
  const offline = await execute('npm-ci-offline', ['ci', '--no-audit', '--no-fund', '--offline'], {
    timeoutMs: 60_000,
  })
  if ((offline.result.status ?? 1) === 0) return
  if (!isOfflineMiss(offline.output) && !isRetryableNetworkFailure(offline.output)) {
    throw new Error('offline npm ci가 의존성 또는 lock 오류로 실패했습니다.')
  }
  const ordered = [preferredRegistry, ...registryCandidates].filter((value, index, values) =>
    value && values.indexOf(value) === index)
  let last = null
  for (const [index, registry] of ordered.entries()) {
    const run = await execute(`npm-ci-online-${index + 1}`, [
      'ci', '--no-audit', '--no-fund', '--prefer-offline', `--registry=${registry}`,
    ], {
      timeoutMs: 90_000,
      env: { ...baseEnv, npm_config_registry: registry },
    })
    last = run
    if ((run.result.status ?? 1) === 0) {
      if (hasDangerousWarning(run.output)) throw new Error(`${registry} npm ci에서 위험 warning을 발견했습니다.`)
      return
    }
    if (!isRetryableNetworkFailure(run.output)) {
      throw new Error(`${registry} npm ci가 의존성 또는 lock 오류로 실패했습니다.`)
    }
  }
  throw new Error(`모든 공식 npm registry endpoint에서 npm ci 실패 · 종료 코드 ${last?.result.status ?? 1}`)
}

if (process.env.SORION_LOCK_TEST_MODE !== '1') requireRuntime()
const previousLock = await readExistingLock()
let completed = false
try {
  const offline = await execute('package-lock-offline', [
    'install', '--package-lock-only', '--ignore-scripts', '--no-audit', '--no-fund', '--offline',
  ], { timeoutMs: 60_000 })
  let selectedRegistry = null
  if ((offline.result.status ?? 1) !== 0) {
    if (!isOfflineMiss(offline.output) && !isRetryableNetworkFailure(offline.output)) {
      throw new Error('offline package-lock 생성이 의존성 오류로 실패했습니다.')
    }
    selectedRegistry = await generateOnlineLock()
  }
  await installFromLock(selectedRegistry)
  await writeFile(join(logDirectory, 'status.txt'), 'npm lock bootstrap completed\n', 'utf8')
  completed = true
  console.log('npm lock 생성 및 clean install 완료')
} finally {
  if (!completed) await restoreLock(previousLock)
}
