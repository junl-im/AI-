import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

import { isRetryableNetworkFailure, retryDelayMs } from './lock-retry.mjs'
import { rankRegistryCandidates } from './npm-registry-probe.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const retryable = [
  'npm error code ETIMEDOUT',
  'npm error network request to https://registry.npmjs.org/react failed',
  'error: EAI_AGAIN registry.npmjs.org',
  'HTTP 503 Service Unavailable',
  'ERR_SOCKET_TIMEOUT',
  'Error: spawnSync npm ETIMEDOUT',
]
const terminal = [
  'npm error code ERESOLVE unable to resolve dependency tree',
  'ruff check failed',
  'package-lock root version mismatch',
]
const failures = []
const npmrc = await readFile(join(root, '.npmrc'), 'utf8')
if (!npmrc.split(/\r?\n/).includes('omit-lockfile-registry-resolved=true')) {
  failures.push('.npmrc가 lock을 단일 registry tarball URL에 고정하지 않도록 설정되지 않았습니다.')
}
for (const sample of retryable) {
  if (!isRetryableNetworkFailure(sample)) failures.push(`재시도 누락: ${sample}`)
}
for (const sample of terminal) {
  if (isRetryableNetworkFailure(sample)) failures.push(`잘못된 재시도 분류: ${sample}`)
}
if (retryDelayMs(1) !== 5000 || retryDelayMs(3) !== 30000) {
  failures.push('재시도 지연 정책이 5/15/30초 계약과 다릅니다.')
}

const ranked = await rankRegistryCandidates(
  ['https://slow.invalid/', 'https://fast.invalid/'],
  {
    packageName: 'react',
    packageVersion: '19.2.8',
    timeoutMs: 50,
    fetchImpl: async (url) => {
      if (String(url).includes('slow.invalid')) throw new Error('ETIMEDOUT')
      return {
        ok: true,
        status: 200,
        async json() {
          return { name: 'react', version: '19.2.8', dist: { integrity: 'sha512-fixture' } }
        },
      }
    },
  },
)
if (ranked.ordered[0] !== 'https://fast.invalid/') {
  failures.push('응답 가능한 registry를 먼저 선택하지 못했습니다.')
}

const fixture = await mkdtemp(join(tmpdir(), 'sorion npm & fallback-'))
try {
  const bin = join(fixture, 'bin')
  await mkdir(bin, { recursive: true })
  const fakeNpm = join(bin, 'fake-npm.cjs')
  await writeFile(fakeNpm, `
const fs = require('node:fs')
const args = process.argv.slice(2)
const fail = (code) => { console.error('npm error code ' + code); process.exit(1) }
if (args.includes('--offline')) {
  if (args.includes('--package-lock-only')) fail('ENOTCACHED')
  process.exit(0)
}
if (process.env.FAKE_NPM_MODE === 'fail' || args.some((arg) => arg.includes('registry.npmjs.org'))) fail('ETIMEDOUT')
if (!args.some((arg) => arg.includes('registry.npmjs.com'))) fail('ERESOLVE')
fs.writeFileSync('package-lock.json', JSON.stringify({ lockfileVersion: 3, packages: { '': { version: '0.9.3-beta.3' } } }))
`, 'utf8')
  await writeFile(join(fixture, 'package.json'), '{"name":"fixture","version":"0.9.3-beta.3"}\n')
  const env = {
    ...process.env,
    npm_execpath: fakeNpm,
    SORION_LOCK_ROOT: fixture,
    SORION_LOCK_TEST_MODE: '1',
  }
  const fallback = spawnSync(process.execPath, [join(root, 'scripts', 'refresh-npm-lock.mjs')], {
    env,
    encoding: 'utf8',
    timeout: 30_000,
  })
  if (fallback.status !== 0) failures.push(`공식 registry fallback fixture 실패: ${fallback.stderr}`)
  if (fallback.status === 0) {
    const selected = await readFile(join(fixture, '.sorion', 'lock-audit', 'npm', 'selected-registry.txt'), 'utf8')
    if (!selected.includes('registry.npmjs.com')) failures.push('두 번째 공식 npm endpoint를 선택하지 못했습니다.')
  }

  const oldLock = '{"lockfileVersion":3,"packages":{"":{"version":"old"}}}\n'
  await writeFile(join(fixture, 'package-lock.json'), oldLock, 'utf8')
  const failed = spawnSync(process.execPath, [join(root, 'scripts', 'refresh-npm-lock.mjs')], {
    env: { ...env, FAKE_NPM_MODE: 'fail' },
    encoding: 'utf8',
    timeout: 30_000,
  })
  if (failed.status === 0) failures.push('모든 registry 실패 fixture를 성공으로 처리했습니다.')
  const restored = await readFile(join(fixture, 'package-lock.json'), 'utf8')
  if (restored !== oldLock) failures.push('npm lock 실패 후 기존 package-lock을 복원하지 못했습니다.')
} finally {
  await rm(fixture, { recursive: true, force: true })
}

if (failures.length) {
  console.error('Lock 네트워크 재시도 계약 검사 실패')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log('Lock 네트워크 재시도 계약 검사 통과')
