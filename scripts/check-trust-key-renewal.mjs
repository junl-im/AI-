import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const failures = []

async function requireMarkers(relativePath, markers) {
  const text = await readFile(join(root, relativePath), 'utf8')
  for (const marker of markers) {
    if (!text.includes(marker)) failures.push(`${relativePath}: 필수 계약 누락 · ${marker}`)
  }
}

await requireMarkers('services/api/app/services/voice_review_trust.py', [
  'parse_trusted_keys_json',
  'active_key_id',
  'trusted_key_ids',
  'previous',
])
await requireMarkers('services/api/app/services/interprocess_lock.py', [
  'exclusive_file_lock',
  'LOCK_EX',
  'LK_NBLCK',
  'InterprocessLockTimeoutError',
])
await requireMarkers('services/api/app/services/voice_preset_approval.py', [
  '현재 키로 재서명',
  'preview_resign',
  'apply_resign',
  'renewal_queue',
  '_write_lock',
  're-signed',
])
await requireMarkers('services/api/app/services/voice_preset_evidence.py', [
  'trusted_signing_keys',
  'trust_store.secret_for',
  '신뢰 키 목록',
])
await requireMarkers('services/api/app/api/routes/voice_preset_approvals.py', [
  '/voice-preset-approvals/renewals',
  '/voice-preset-approvals/resign/preview',
  '/voice-preset-approvals/resign/apply',
])
await requireMarkers('src/components/evaluation/VoicePresetApprovalCard.tsx', [
  '증거 갱신·신뢰 키 교체 대기열',
  '현재 키 재서명 diff',
  '재서명 적용',
])
await requireMarkers('.env.example', [
  'SORION_VOICE_REVIEW_TRUSTED_KEYS_JSON',
  'SORION_VOICE_REVIEW_LOCK_TIMEOUT_SECONDS',
])
await requireMarkers('docs/TRUST_KEY_ROTATION_AND_RENEWAL.md', [
  'active key',
  'previous key',
  '프로세스 간 파일 잠금',
  '자동 연장하지 않습니다',
])

if (failures.length) {
  console.error('Trust key rotation / evidence renewal 계약 검사 실패')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log('Trust key rotation / evidence renewal 계약 검사 통과')
