import { access, appendFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const defaultRoot = fileURLToPath(new URL('..', import.meta.url))
const root = resolve(process.env.SORION_LOCK_ROOT || defaultRoot)
const githubOutputIndex = process.argv.indexOf('--github-output')
const githubOutputPath =
  githubOutputIndex >= 0 ? process.argv[githubOutputIndex + 1] : process.env.GITHUB_OUTPUT
const forceRefresh =
  process.argv.includes('--force') ||
  ['1', 'true', 'yes'].includes((process.env.SORION_FORCE_LOCK_REFRESH || '').toLowerCase())

const required = ['package-lock.json', 'services/api/uv.lock', 'services/worker/uv.lock']
const missing = []

for (const relativePath of required) {
  try {
    await access(join(root, relativePath))
  } catch {
    missing.push(relativePath)
  }
}

const mode = forceRefresh || missing.length > 0 ? 'generate' : 'verify'
const reason = forceRefresh
  ? 'forced-refresh'
  : missing.length > 0
    ? `missing:${missing.join(',')}`
    : 'all-lockfiles-present'

if (githubOutputPath) {
  await appendFile(
    githubOutputPath,
    [`mode=${mode}`, `reason=${reason}`, `missing=${missing.join(',')}`, ''].join('\n'),
    'utf8',
  )
}

if (mode === 'generate') {
  console.log(
    forceRefresh
      ? 'Lock 모드: generate · 수동 강제 갱신'
      : `Lock 모드: generate · 누락: ${missing.join(', ')}`,
  )
} else {
  console.log('Lock 모드: verify · 세 lock 파일이 모두 존재합니다.')
}
