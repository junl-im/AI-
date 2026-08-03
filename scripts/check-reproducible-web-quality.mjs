import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const failures = []
const packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
const workflow = await readFile(join(root, '.github', 'workflows', 'ci.yml'), 'utf8')

for (const [name, expected] of Object.entries({
  'quality:web-repro': 'node scripts/run-web-quality.mjs',
  'quality:web-report:verify': 'node scripts/verify-web-quality-report.mjs',
  'quality:reproducible-web': 'node scripts/check-reproducible-web-quality.mjs',
})) {
  if (packageJson.scripts?.[name] !== expected) failures.push(`package.json ${name} 계약 불일치`)
}
for (const token of [
  'npm run quality:web-repro',
  'npm run quality:web-report:verify',
  '.sorion/web-quality',
  'continue-on-error: true',
  'Fail after preserving Web evidence',
]) {
  if (!workflow.includes(token)) failures.push(`Web quality workflow 계약 누락: ${token}`)
}
for (const path of [
  'scripts/web-quality-plan.mjs',
  'scripts/web-quality-report.mjs',
  'scripts/run-web-quality.mjs',
  'scripts/verify-web-quality-report.mjs',
  'services/api/app/services/evidence_bundle.py',
]) {
  try { await readFile(join(root, path)) } catch { failures.push(`${path}: 필수 파일 누락`) }
}
const route = await readFile(join(root, 'services/api/app/api/routes/evidence.py'), 'utf8')
for (const token of ['EVIDENCE_BUNDLE_SCHEMA_VERSION', '/evidence-bundle/verify', 'build_bundle_manifest']) {
  if (!route.includes(token)) failures.push(`evidence route 계약 누락: ${token}`)
}
const schema = await readFile(join(root, 'services/api/app/schemas/evidence.py'), 'utf8')
for (const token of ['QualityEvidenceManifest', 'bundle_sha256', 'QualityEvidenceVerificationResponse']) {
  if (!schema.includes(token)) failures.push(`evidence schema 계약 누락: ${token}`)
}

const fixture = await mkdtemp(join(tmpdir(), 'sorion-web-quality-plan-'))
try {
  const run = spawnSync(process.execPath, [
    join(root, 'scripts', 'run-web-quality.mjs'),
    '--plan-only',
    '--output', fixture,
  ], { cwd: root, encoding: 'utf8' })
  const reportPath = join(fixture, 'report.json')
  const verify = spawnSync(process.execPath, [
    join(root, 'scripts', 'verify-web-quality-report.mjs'),
    reportPath,
    '--allow-plan',
  ], { cwd: root, encoding: 'utf8' })
  if (run.status !== 0 || verify.status !== 0) {
    failures.push(`plan report 생성/검증 실패: ${run.stderr}${verify.stderr}`)
  } else {
    const report = JSON.parse(await readFile(reportPath, 'utf8'))
    if (report.phases?.length !== 7) failures.push('Web quality phase가 7개가 아닙니다.')
    if (!/^[0-9a-f]{64}$/.test(report.evidenceSha256 ?? '')) failures.push('evidence SHA-256 형식 오류')
    const firstLogPath = join(fixture, 'logs', 'lock-structure.log')
    const originalLog = await readFile(firstLogPath, 'utf8')
    await writeFile(firstLogPath, `${originalLog}tampered\n`)
    const corruptLog = spawnSync(process.execPath, [
      join(root, 'scripts', 'verify-web-quality-report.mjs'),
      reportPath,
      '--allow-plan',
    ], { cwd: root, encoding: 'utf8' })
    if (corruptLog.status === 0) failures.push('변조된 Web quality 로그를 허용했습니다.')
    await writeFile(firstLogPath, originalLog)
    report.phases[0].command = 'tampered command'
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`)
    const corrupt = spawnSync(process.execPath, [
      join(root, 'scripts', 'verify-web-quality-report.mjs'),
      reportPath,
      '--allow-plan',
    ], { cwd: root, encoding: 'utf8' })
    if (corrupt.status === 0) failures.push('변조된 Web quality report를 허용했습니다.')
  }
} finally {
  await rm(fixture, { recursive: true, force: true })
}

if (failures.length) {
  console.error('재현 가능한 Web quality·증거 manifest 검사 실패')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log('재현 가능한 Web quality·증거 manifest 검사 통과')
