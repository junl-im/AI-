import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const failures = []

async function text(relativePath) {
  return readFile(join(root, relativePath), 'utf8')
}

async function requireMarkers(relativePath, markers) {
  const value = await text(relativePath)
  for (const marker of markers) {
    if (!value.includes(marker)) failures.push(`${relativePath}: 필수 계약 누락 · ${marker}`)
  }
  return value
}

await requireMarkers('services/api/app/core/config.py', [
  'voice_review_operator_token',
  'voice_review_allow_loopback_without_token',
])
await requireMarkers('services/api/app/services/voice_review_operator.py', [
  'hmac.compare_digest',
  'client_address(request, settings.trusted_proxy_cidr_list)',
  '_MIN_OPERATOR_TOKEN_LENGTH = 32',
  'SOA-6831',
  'SOA-6832',
  'SOA-6833',
])
const routes = await requireMarkers('services/api/app/api/routes/voice_preset_approvals.py', [
  'voice-review-authorization-denied',
  'authorize_voice_review_operator',
])
if ((routes.match(/_principal\(request\)/g) ?? []).length < 4) {
  failures.push('voice_preset_approvals.py: preview/apply/history/rollback 전체에 인증 게이트가 필요합니다.')
}
const service = await requireMarkers('services/api/app/services/voice_preset_approval.py', [
  'with self._write_lock() as lease:',
  '적용 직전 WAV가 변경되어 승인을 중단했습니다.',
  'os.fsync(output.fileno())',
])
const applyLock = service.indexOf('with self._write_lock() as lease:', service.indexOf('    def apply('))
const applyPrepare = service.indexOf('prepared = self._prepare', service.indexOf('    def apply('))
if (applyLock < 0 || applyPrepare < applyLock) {
  failures.push('voice_preset_approval.py: apply 재검증은 동일 잠금 안에서 실행되어야 합니다.')
}
await requireMarkers('src/quality/voicePresetApprovalApi.ts', [
  'X-SoriON-Operator-Token',
  'sessionStorage',
  'VOICE_REVIEW_OPERATOR_TOKEN_SESSION_KEY',
])
await requireMarkers('src/components/evaluation/VoicePresetApprovalCard.tsx', [
  '원격 운영자 토큰',
  '토큰 저장·재연결',
])
const reviewTest = await text('src/quality/voicePresetReviewBundle.test.ts')
if (reviewTest.includes('payloadSha256: _checksum')) {
  failures.push('voicePresetReviewBundle.test.ts: 미사용 _checksum 변수가 다시 유입됐습니다.')
}
const localBundle = await text('src/export/localExportBundle.ts')
if (localBundle.includes('\\u0000-\\u001f')) {
  failures.push('localExportBundle.ts: no-control-regex 위반 패턴이 다시 유입됐습니다.')
}
const dashboard = await text('src/components/evaluation/BenchmarkDashboardCard.tsx')
if (!dashboard.includes('const groups = useMemo(')) {
  failures.push('BenchmarkDashboardCard.tsx: groups 참조 안정화 useMemo가 필요합니다.')
}

if (failures.length) {
  console.error('Voice review operator gate / CI unblock 계약 검사 실패')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log('Voice review operator gate / CI unblock 계약 검사 통과')
