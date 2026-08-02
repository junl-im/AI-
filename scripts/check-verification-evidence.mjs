import { access, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const failures = []

async function content(relativePath) {
  const path = join(root, relativePath)
  try {
    await access(path)
    return await readFile(path, 'utf8')
  } catch {
    failures.push(`${relativePath}: 필수 파일이 없습니다.`)
    return ''
  }
}

function requireText(relativePath, source, expected, message) {
  if (!source.includes(expected)) failures.push(`${relativePath}: ${message}`)
}

const packageJson = JSON.parse(await content('package.json'))
if (packageJson.scripts?.['quality:export-soak'] !== 'cd services/api && python -m scripts.run_export_soak') {
  failures.push('package.json: quality:export-soak 실행 경로가 고정 계약과 다릅니다.')
}

const finalExport = await content('services/api/app/services/final_export.py')
requireText('services/api/app/services/final_export.py', finalExport, '_CHUNK_FRAMES = 65_536', '장문 청크 상수가 없습니다.')
requireText('services/api/app/services/final_export.py', finalExport, 'def _part_path', '원자적 임시 파일 경로가 없습니다.')
requireText('services/api/app/services/final_export.py', finalExport, 'timeout=max(', 'FFmpeg hard timeout이 없습니다.')
requireText('services/api/app/services/final_export.py', finalExport, 'for path in created:', '오류 시 부분 파일 정리가 없습니다.')

const soak = await content('services/api/app/services/export_soak.py')
requireText('services/api/app/services/export_soak.py', soak, 'ffprobe', 'MP3 실제 컨테이너 길이 측정이 없습니다.')
requireText('services/api/app/services/export_soak.py', soak, '_last_subtitle_end', '자막 종료 시각 검증이 없습니다.')
const soakCli = await content('services/api/scripts/run_export_soak.py')
requireText('services/api/scripts/run_export_soak.py', soakCli, '{10, 30, 60}', '공식 10·30·60분 시나리오 제한이 없습니다.')
requireText('services/api/scripts/run_export_soak.py', soakCli, 'build_export_soak_record', 'soak 결과 판정 저장이 없습니다.')

const evidenceRoute = await content('services/api/app/api/routes/evidence.py')
for (const path of [
  '/stt/regeneration-comparisons',
  '/export-soak-records',
  '/evidence-summary',
  '/evidence-bundle',
]) {
  requireText('services/api/app/api/routes/evidence.py', evidenceRoute, path, `${path} endpoint가 없습니다.`)
}
requireText('services/api/app/api/routes/evidence.py', evidenceRoute, '"device_name": item.get("device_profile", "redacted")', '장치 이름 기본 제거가 없습니다.')
requireText('services/api/app/api/routes/evidence.py', evidenceRoute, '"notes": ""', '메모 기본 제거가 없습니다.')

const sttApi = await content('src/stt/verificationApi.ts')
requireText('src/stt/verificationApi.ts', sttApi, 'buildSttComparisonRequests', '재생성 전후 비교 요청 생성기가 없습니다.')
requireText('src/stt/verificationApi.ts', sttApi, 'recordSttRegenerationComparisons', 'STT 개선 증거 저장 호출이 없습니다.')
const sttHook = await content('src/hooks/useSelectiveSttRegeneration.ts')
const recordIndex = sttHook.indexOf('recordSttRegenerationComparisons')
const applyIndex = sttHook.indexOf('timeline.applySttVerification')
if (recordIndex < 0 || applyIndex < 0 || recordIndex > applyIndex) {
  failures.push('src/hooks/useSelectiveSttRegeneration.ts: 이전 transcript를 덮기 전에 개선 증거를 저장해야 합니다.')
}

const qualityPage = await content('src/pages/QualityPage.tsx')
requireText('src/pages/QualityPage.tsx', qualityPage, 'VerificationEvidenceCard', 'Quality Lab 증거 카드가 연결되지 않았습니다.')
for (const testPath of [
  'services/api/tests/test_evidence.py',
  'services/api/tests/test_export_soak.py',
  'src/stt/verificationApi.test.ts',
]) {
  await content(testPath)
}
await content('docs/EXPORT_SOAK_REPORT.md')

if (failures.length) {
  console.error('검증 증거·장문 Export 계약 검사 실패')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}
console.log('검증 증거·장문 Export 계약 검사 통과')
