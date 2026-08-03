import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { WEB_QUALITY_PHASES, WEB_QUALITY_SCHEMA_VERSION } from './web-quality-plan.mjs'
import { buildDirectoryManifest, evidenceDigest, fileSha256, reportDigest } from './web-quality-report.mjs'

const root = process.env.SORION_WEB_QUALITY_ROOT || fileURLToPath(new URL('..', import.meta.url))
const reportPath = process.argv.find((value, index) => index > 1 && !value.startsWith('--'))
  || join(root, '.sorion', 'web-quality', 'report.json')
const allowPlan = process.argv.includes('--allow-plan')
const report = JSON.parse(await readFile(reportPath, 'utf8'))
const reportDirectory = dirname(reportPath)
const failures = []

if (report.schemaVersion !== WEB_QUALITY_SCHEMA_VERSION) failures.push('schemaVersion 불일치')
if (!['plan', 'run'].includes(report.mode)) failures.push('mode 오류')
if (report.mode === 'plan' && !allowPlan) failures.push('plan report는 실검증 증거가 아닙니다.')
if (report.appVersion !== '0.9.3-beta.3') failures.push('제품 버전 불일치')
if (report.heartbeat !== '6.7') failures.push('Heartbeat 불일치')
const expectedIds = WEB_QUALITY_PHASES.map((phase) => phase.id)
const actualIds = report.phases?.map((phase) => phase.id) ?? []
if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) failures.push('phase 순서 또는 개수 불일치')
for (const [index, phase] of (report.phases ?? []).entries()) {
  const expected = WEB_QUALITY_PHASES[index]
  const expectedCommand = expected?.command.map((value) => /\s/.test(value) ? JSON.stringify(value) : value).join(' ')
  if (phase.command !== expectedCommand) failures.push(`${phase.id}: 실행 명령 불일치`)
  const logPath = join(reportDirectory, 'logs', `${phase.id}.log`)
  try {
    if (await fileSha256(logPath) !== phase.logSha256) failures.push(`${phase.id}: 로그 SHA-256 불일치`)
  } catch {
    failures.push(`${phase.id}: 로그 파일 누락`)
  }
}
if (report.mode === 'run') {
  if (!report.inputs?.packageLockSha256) failures.push('package-lock SHA-256 누락')
  try {
    if (await fileSha256(join(root, 'package.json')) !== report.inputs?.packageJsonSha256) failures.push('package.json SHA-256 불일치')
  } catch { failures.push('package.json 확인 실패') }
  try {
    if (await fileSha256(join(root, 'package-lock.json')) !== report.inputs?.packageLockSha256) failures.push('package-lock SHA-256 불일치')
  } catch { failures.push('package-lock.json 확인 실패') }
  if (!report.passed) failures.push('실행 report가 실패 상태입니다.')
  if (report.phases?.some((phase) => phase.status !== 'passed' || phase.exitCode !== 0)) {
    failures.push('통과하지 않은 phase가 있습니다.')
  }
  const actualDist = await buildDirectoryManifest(root, join(root, 'dist'))
  if (JSON.stringify(actualDist) !== JSON.stringify(report.dist ?? [])) failures.push('dist 산출물 manifest 불일치')
}
const expectedEvidenceDigest = evidenceDigest(report)
if (report.evidenceSha256 !== expectedEvidenceDigest) failures.push('evidence SHA-256 불일치')
const expectedDigest = reportDigest(report)
if (report.reportSha256 !== expectedDigest) failures.push('report SHA-256 불일치')

if (failures.length) {
  console.error('Web quality report 검증 실패')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log(`Web quality report 검증 통과 · ${report.reportSha256}`)
