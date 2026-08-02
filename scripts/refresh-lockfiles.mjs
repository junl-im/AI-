import { mkdir } from 'node:fs/promises'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const logDirectory = join(root, '.sorion', 'lock-audit')
await mkdir(logDirectory, { recursive: true })

function run(label, command, args, cwd = root) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    env: process.env,
  })
  const output = [result.stdout, result.stderr].filter(Boolean).join('\n')
  const safeLabel = label.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  writeFileSync(join(logDirectory, `${safeLabel}.log`), output)
  process.stdout.write(`\n=== ${label} ===\n${output}`)
  if ((result.status ?? 1) !== 0) {
    throw new Error(`${label} 실패 · 종료 코드 ${result.status ?? 1}`)
  }
  return output
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
const lockOutput = run(
  'npm package lock',
  'npm',
  ['install', '--package-lock-only', '--ignore-scripts', '--no-audit', '--no-fund'],
)
auditWarnings('npm-package-lock', lockOutput)
const ciOutput = run('npm clean install', 'npm', ['ci', '--no-audit', '--no-fund'])
auditWarnings('npm-ci', ciOutput)
run('npm dependency tree', 'node', ['scripts/audit-npm-tree.mjs'])

for (const service of ['api', 'worker']) {
  const cwd = join(root, 'services', service)
  run(`${service} uv lock`, 'uv', ['lock', '--python', '3.10'], cwd)
  run(`${service} uv lock check`, 'uv', ['lock', '--check'], cwd)
  run(`${service} uv sync locked`, 'uv', ['sync', '--locked', '--dev', '--python', '3.10'], cwd)
}
run('lock structure check', 'node', ['scripts/check-lockfiles.mjs'])
console.log(`\n검증된 lock 파일 생성 완료. 감사 로그: ${logDirectory}`)
