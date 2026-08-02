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
  'Commit available verified lockfiles · main only', 'contents: write',
  "needs.npm_lock.result == 'success'", "needs.api_lock.result == 'success'",
  "needs.worker_lock.result == 'success'", 'npm run quality:preflight',
  'sorion-repository-preflight-${{ github.run_attempt }}', 'mode=missing',
  'GENERATE_WEB_LOCK.cmd', 'Fail fast when package-lock is not committed',
]) if (!workflow.includes(token)) failures.push(`workflow 계약 누락: ${token}`)
if (/FORCE_REFRESH.*\|\| ! -f package-lock\.json/s.test(workflow)) {
  failures.push('일반 push에서 package-lock을 자동 생성하는 이전 bootstrap 조건이 남아 있습니다.')
}
if (workflow.includes('env:\n        env:')) failures.push('workflow에 중복 env 키가 있습니다.')
for (const forbidden of [
  'needs: lockfiles', 'sorion-verified-lockfiles',
  'Commit verified lockfiles · main only', 'node scripts/verify-lock-proof.mjs all',
]) {
  if (workflow.includes(forbidden)) failures.push(`단일 장애점 재유입: ${forbidden}`)
}
if (!/permissions:\n  contents: read/.test(workflow)) failures.push('전역 권한이 contents read가 아닙니다.')
if (!workflow.includes("if: ${{ always() && needs.npm_lock.result == 'success' }}")) {
  failures.push('Web quality가 preflight 실패와 독립적으로 실행되지 않습니다.')
}
if (!workflow.includes("if: ${{ always() && needs.api_lock.result == 'success' }}")) {
  failures.push('API quality가 preflight 실패와 독립적으로 실행되지 않습니다.')
}
if (!workflow.includes("if: ${{ always() && needs.worker_lock.result == 'success' }}")) {
  failures.push('Worker quality가 preflight 실패와 독립적으로 실행되지 않습니다.')
}
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
} finally {
  await rm(fixture, { recursive: true, force: true })
}

if (failures.length) {
  console.error('CI failure-domain 검사 실패')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log('CI failure-domain 및 lock proof 검사 통과')
