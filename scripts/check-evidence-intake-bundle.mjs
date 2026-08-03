import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const failures = []
async function source(path) {
  try { return await readFile(join(root, path), 'utf8') } catch { failures.push(`${path}: 필수 파일 누락`); return '' }
}
function requireToken(path, text, token) {
  if (!text.includes(token)) failures.push(`${path}: 계약 누락 ${token}`)
}

const route = await source('services/api/app/api/routes/evidence.py')
const webReport = await source('services/api/app/services/web_quality_report.py')
for (const token of ['verify_web_quality_report', 'evidenceSha256', 'reportSha256', 'WEB_QUALITY_PHASES']) requireToken('services/api/app/services/web_quality_report.py', webReport, token)
for (const token of ['/evidence-intake/preview', '/evidence-intake/import', '/evidence-intake', 'duplicate_record_count']) requireToken('services/api/app/api/routes/evidence.py', route, token)
const store = await source('services/api/app/services/evidence_intake_store.py')
for (const token of ['bundle_sha256s', 'record_sha256s', 'duplicate_records', 'imported-evidence', '.json.part']) requireToken('services/api/app/services/evidence_intake_store.py', store, token)
const page = await source('src/pages/QualityPage.tsx')
for (const token of ['EvidenceIntakeCard', 'LocalExportBundleCard']) requireToken('src/pages/QualityPage.tsx', page, token)
const intake = await source('src/quality/evidenceIntake.ts')
for (const token of ['5 * 1024 * 1024', 'evidence-intake/preview', 'evidence-intake/import']) requireToken('src/quality/evidenceIntake.ts', intake, token)
const zip = await source('src/export/localExportBundle.ts')
for (const token of ['MAX_LOCAL_BUNDLE_BYTES', 'LocalBundleBuildProgress', 'AbortSignal', 'throwIfAborted', 'sorion-bundle-manifest.json', "u32(0x06054b50)", "crypto.subtle.digest('SHA-256'"]) requireToken('src/export/localExportBundle.ts', zip, token)
const bundleCard = await source('src/components/evaluation/LocalExportBundleCard.tsx')
for (const token of ['생성 취소', 'progressPercent', '100MiB']) requireToken('src/components/evaluation/LocalExportBundleCard.tsx', bundleCard, token)
const intakeCard = await source('src/components/evaluation/EvidenceIntakeCard.tsx')
for (const token of ['reportSha256', "'github-actions'", 'Web quality run report']) requireToken('src/components/evaluation/EvidenceIntakeCard.tsx', intakeCard, token)
for (const path of ['services/api/tests/test_evidence.py', 'src/export/localExportBundle.test.ts', 'src/quality/evidenceIntake.test.ts']) await source(path)

if (failures.length) {
  console.error('Evidence Intake · Local Export Bundle 계약 검사 실패')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log('Evidence Intake · Local Export Bundle 계약 검사 통과')
