import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const workflow = await readFile(join(root, '.github', 'workflows', 'ci.yml'), 'utf8')
const failures = []
for (const token of [
  'npm_lock:', 'api_lock:', 'worker_lock:',
  'needs: [preflight, npm_lock]', 'needs: [preflight, api_lock]', 'needs: [preflight, worker_lock]',
  "needs.preflight.result == 'success'", "needs.npm_lock.result == 'success'",
  "needs.api_lock.result == 'success'", "needs.worker_lock.result == 'success'",
  'npm run quality:preflight', 'sorion-repository-preflight-${{ github.run_attempt }}',
  'Committed npm lock required', 'npm run locks:refresh:npm',
  'npm run locks:check -- --component npm', 'lock-structure-check.log',
  'Run reproducible Web quality', 'npm run quality:web-repro',
  'npm run quality:web-report:verify', 'sorion-web-quality-${{ github.run_attempt }}',
  'Fail after preserving Web evidence',
]) if (!workflow.includes(token)) failures.push(`workflow 계약 누락: ${token}`)

for (const forbidden of [
  'commit_verified_locks:',
  'Commit available verified lockfiles · main only',
  'contents: write',
  'git push origin HEAD:main',
  'if [[ "$FORCE_REFRESH" == "true" || ! -f package-lock.json ]]',
  'needs: lockfiles',
  'sorion-verified-lockfiles',
]) {
  if (workflow.includes(forbidden)) failures.push(`비재현 자동 변경 또는 단일 장애점 재유입: ${forbidden}`)
}
if (!workflow.includes('if [[ ! -f package-lock.json ]]; then')) {
  failures.push('일반 push/PR에서 누락 package-lock을 명확히 차단하지 않습니다.')
}
if (!workflow.includes("if [[ \"$FORCE_REFRESH\" == \"true\" ]]; then")) {
  failures.push('명시적 workflow_dispatch lock 생성 경로가 없습니다.')
}
if (workflow.includes('env:\n        env:')) failures.push('workflow에 중복 env 키가 있습니다.')
if (!/permissions:\n  contents: read/.test(workflow)) failures.push('전역 권한이 contents read가 아닙니다.')
for (const component of ['npm', 'api', 'worker']) {
  if (!workflow.includes(`.sorion/lock-audit/${component}/status.txt`)) {
    failures.push(`${component} lock 진단 디렉터리 초기화가 없습니다.`)
  }
}

const fixture = await mkdtemp(join(tmpdir(), 'sorion-lock-proof-'))
try {
  await mkdir(join(fixture, 'services', 'api'), { recursive: true })
  await writeFile(join(fixture, 'package.json'), '{"name":"fixture","version":"1.0.0"}\n')
  await writeFile(join(fixture, 'package-lock.json'), '{"lockfileVersion":3,"packages":{"":{"version":"1.0.0"}}}\n')
  const env = { ...process.env, SORION_LOCK_ROOT: fixture }
  const write = spawnSync(process.execPath, [join(root, 'scripts', 'write-lock-proof.mjs'), 'npm'], { env, encoding: 'utf8' })
  const verify = spawnSync(process.execPath, [join(root, 'scripts', 'verify-lock-proof.mjs'), 'npm'], { env, encoding: 'utf8' })
  if (write.status !== 0 || verify.status !== 0) failures.push(`정상 lock 증명 실패: ${write.stderr}${verify.stderr}`)
  await writeFile(join(fixture, 'package.json'), '{"name":"fixture","version":"1.0.1"}\n')
  const corrupt = spawnSync(process.execPath, [join(root, 'scripts', 'verify-lock-proof.mjs'), 'npm'], { env, encoding: 'utf8' })
  if (corrupt.status === 0) failures.push('manifest가 바뀐 손상 lock 증명을 허용했습니다.')
  await writeFile(join(fixture, 'package.json'), '{"name":"fixture","version":"1.0.0","dependencies":{"react":"19.2.8"}}\n')
  await writeFile(join(fixture, 'package-lock.json'), '{"lockfileVersion":3,"packages":{"":{"version":"1.0.0","dependencies":{"react":"19.2.8","firebase":"11.4.0"}},"node_modules/react":{"version":"19.2.8"}}}\n')
  const stale = spawnSync(process.execPath, [join(root, 'scripts', 'check-lockfiles.mjs'), '--component', 'npm'], { env, encoding: 'utf8' })
  if (stale.status === 0) failures.push('package.json에 없는 npm root dependency가 남은 stale lock을 허용했습니다.')
} finally {
  await rm(fixture, { recursive: true, force: true })
}

if (failures.length) {
  console.error('CI failure-domain 검사 실패')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log('CI failure-domain 및 lock proof 검사 통과')
