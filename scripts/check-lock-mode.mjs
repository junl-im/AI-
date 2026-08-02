import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const selector = join(root, 'scripts', 'resolve-lock-mode.mjs')
const fixture = await mkdtemp(join(tmpdir(), 'sorion-lock-mode-'))

function run(expected, extraEnv = {}) {
  const result = spawnSync(process.execPath, [selector], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, SORION_LOCK_ROOT: fixture, ...extraEnv },
  })
  const output = `${result.stdout || ''}${result.stderr || ''}`
  if (result.status !== 0 || !output.includes(`Lock 모드: ${expected}`)) {
    throw new Error(`예상 모드 ${expected} 실패\n${output}`)
  }
}

try {
  await mkdir(join(fixture, 'services', 'api'), { recursive: true })
  await mkdir(join(fixture, 'services', 'worker'), { recursive: true })

  run('generate')
  await writeFile(join(fixture, 'package-lock.json'), '{}\n')
  await writeFile(join(fixture, 'services', 'api', 'uv.lock'), 'version = 1\n')
  run('generate')
  await writeFile(join(fixture, 'services', 'worker', 'uv.lock'), 'version = 1\n')
  run('verify')
  run('generate', { SORION_FORCE_LOCK_REFRESH: 'true' })
  console.log('Lock bootstrap selector self-test passed.')
} finally {
  await rm(fixture, { recursive: true, force: true })
}
