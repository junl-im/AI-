import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { isRetryableNetworkFailure, runCommandWithRetry } from './lock-retry.mjs'
import { rankRegistryCandidates } from './npm-registry-probe.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const logDirectory = join(root, '.sorion', 'npm-ci')
await mkdir(logDirectory, { recursive: true })
const env = {
  ...process.env,
  npm_config_fetch_retries: '0',
  npm_config_fetch_timeout: '45000',
  npm_config_maxsockets: '12',
  npm_config_omit_lockfile_registry_resolved: 'true',
  npm_config_replace_registry_host: 'always',
}
const registryCandidates = (process.env.SORION_NPM_REGISTRIES || [
  'https://registry.npmjs.org/',
  'https://registry.npmjs.com/',
  'https://registry.yarnpkg.com/',
].join(','))
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)
const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
const probeEntries = Object.entries({ ...(manifest.dependencies || {}), ...(manifest.devDependencies || {}) })
const [probePackageName, probePackageVersion] = probeEntries.find(([name]) => name === 'firebase') || probeEntries[0] || []
const ranking = await rankRegistryCandidates(registryCandidates, {
  packageName: probePackageName,
  packageVersion: probePackageVersion,
})
await writeFile(
  join(logDirectory, 'registry-probe.json'),
  `${JSON.stringify({ package: `${probePackageName}@${probePackageVersion}`, ...ranking }, null, 2)}\n`,
  'utf8',
)

async function run(label, args, timeoutMs, commandEnv = env) {
  const outputs = []
  const result = runCommandWithRetry({
    command: 'npm', args, cwd: root, attempts: 1, timeoutMs, env: commandEnv,
    onAttempt: ({ attempt, attempts: total, output }) => {
      const message = `=== ${label} · attempt ${attempt}/${total} ===\n${output}`
      outputs.push(message)
      process.stdout.write(`\n${message}\n`)
    },
  })
  await writeFile(join(logDirectory, `${label}.log`), `${outputs.join('\n\n')}\n`, 'utf8')
  return { result, output: outputs.join('\n\n') }
}

const offline = await run('npm-ci-offline', ['ci', '--no-audit', '--no-fund', '--offline'], 60_000)
if ((offline.result.status ?? 1) === 0) process.exit(0)
if (!/ENOTCACHED|cache miss|offline mode/i.test(offline.output) && !isRetryableNetworkFailure(offline.output)) {
  throw new Error('offline npm ci가 의존성 또는 lock 오류로 실패했습니다.')
}

let last = offline
for (const [index, registry] of ranking.ordered.entries()) {
  const online = await run(
    `npm-ci-online-${index + 1}`,
    ['ci', '--no-audit', '--no-fund', '--prefer-offline', `--registry=${registry}`],
    120_000,
    { ...env, npm_config_registry: registry },
  )
  last = online
  if ((online.result.status ?? 1) === 0) process.exit(0)
  if (!isRetryableNetworkFailure(online.output)) {
    throw new Error(`${registry} npm ci가 의존성 또는 lock 오류로 실패했습니다.`)
  }
}
throw new Error(`모든 registry에서 npm ci 실패 · 종료 코드 ${last.result.status ?? 1}`)
