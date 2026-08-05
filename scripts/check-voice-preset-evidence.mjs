import { createHash } from 'node:crypto'
import { access, readFile, stat } from 'node:fs/promises'
import { constants } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const presetDirectory = join(root, 'voice-presets')
const presets = [
  ['sori-warm', '혜린', 'female'],
  ['on-clear', '도윤', 'male'],
  ['dam-calm', '소리', 'neutral'],
  ['jun-deep', '준호', 'male'],
  ['min-energetic', '민준', 'male'],
]
const failures = []
const warnings = []
const actualHashes = new Map()

async function exists(path) {
  try {
    await access(path, constants.F_OK)
    return true
  } catch {
    return false
  }
}

function isIsoDate(value) {
  return typeof value === 'string' && value.length > 0 && !Number.isNaN(Date.parse(value))
}

for (const [voiceId, displayName, gender] of presets) {
  const manifestPath = join(presetDirectory, `${voiceId}.manifest.json`)
  let manifest
  try {
    manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  } catch (error) {
    failures.push(`${voiceId}: manifest를 읽을 수 없습니다: ${error.message}`)
    continue
  }

  if (manifest.schema_version !== 2) failures.push(`${voiceId}: schema_version은 2여야 합니다.`)
  if (manifest.voice_id !== voiceId) failures.push(`${voiceId}: voice_id 불일치`)
  if (manifest.display_name !== displayName) failures.push(`${voiceId}: display_name 불일치`)
  if (manifest.declared_gender !== gender) failures.push(`${voiceId}: declared_gender 불일치`)
  if (manifest.reference_file !== `${voiceId}.wav`) failures.push(`${voiceId}: reference_file 불일치`)

  const consent = manifest.consent ?? {}
  if (!['pending', 'confirmed', 'rejected', 'expired'].includes(consent.status)) {
    failures.push(`${voiceId}: consent.status가 올바르지 않습니다.`)
  }
  if (consent.status === 'confirmed') {
    if (!String(consent.evidence_reference ?? '').trim()) failures.push(`${voiceId}: confirmed 동의 증거가 비어 있습니다.`)
    if (!isIsoDate(consent.consented_at)) failures.push(`${voiceId}: confirmed consented_at이 유효하지 않습니다.`)
  } else {
    warnings.push(`${voiceId}: 화자 동의 ${consent.status ?? 'missing'}`)
  }

  const rights = manifest.rights ?? {}
  if (!['self-recorded', 'commissioned', 'licensed', 'synthetic', 'unknown'].includes(rights.source_type)) {
    failures.push(`${voiceId}: rights.source_type이 올바르지 않습니다.`)
  }
  if (!Array.isArray(rights.allowed_uses) || !rights.allowed_uses.includes('tts-inference')) {
    failures.push(`${voiceId}: allowed_uses에 tts-inference가 필요합니다.`)
  }
  if (rights.source_type === 'unknown') warnings.push(`${voiceId}: 출처 유형 미확정`)
  if (rights.source_type !== 'unknown' && !String(rights.source_reference ?? '').trim()) {
    failures.push(`${voiceId}: 확정된 출처의 source_reference가 비어 있습니다.`)
  }

  const review = manifest.human_review ?? {}
  if (!['pending', 'approved', 'rejected'].includes(review.status)) {
    failures.push(`${voiceId}: human_review.status가 올바르지 않습니다.`)
  }
  if (review.status === 'approved') {
    if (!String(review.reviewer ?? '').trim()) failures.push(`${voiceId}: 승인 검수자가 비어 있습니다.`)
    if (!isIsoDate(review.reviewed_at)) failures.push(`${voiceId}: 승인 reviewed_at이 유효하지 않습니다.`)
    if (!String(review.sample_text ?? '').trim()) failures.push(`${voiceId}: 승인 sample_text가 비어 있습니다.`)
    if (!/^[0-9a-f]{64}$/.test(String(review.audio_sha256 ?? ''))) failures.push(`${voiceId}: 승인 audio_sha256가 유효하지 않습니다.`)
  } else {
    warnings.push(`${voiceId}: 사람 검수 ${review.status ?? 'missing'}`)
  }

  const wavPath = join(presetDirectory, `${voiceId}.wav`)
  const declaredSha = String(manifest.integrity?.sha256 ?? '').trim().toLowerCase()
  if (declaredSha && !/^[0-9a-f]{64}$/.test(declaredSha)) {
    failures.push(`${voiceId}: integrity.sha256 형식 오류`)
  }
  if (await exists(wavPath)) {
    const data = await readFile(wavPath)
    const actualSha = createHash('sha256').update(data).digest('hex')
    const file = await stat(wavPath)
    if (!declaredSha) failures.push(`${voiceId}: WAV가 있으나 integrity.sha256가 비어 있습니다.`)
    if (declaredSha && declaredSha !== actualSha) failures.push(`${voiceId}: WAV SHA-256 불일치`)
    if (manifest.integrity?.file_size_bytes !== file.size) failures.push(`${voiceId}: file_size_bytes 불일치`)
    const duplicate = actualHashes.get(actualSha) ?? []
    duplicate.push(voiceId)
    actualHashes.set(actualSha, duplicate)
  } else {
    warnings.push(`${voiceId}: WAV 미배치`)
  }
}

for (const [sha256, voiceIds] of actualHashes) {
  if (voiceIds.length > 1) failures.push(`중복 WAV SHA-256 ${sha256}: ${voiceIds.join(', ')}`)
}

if (failures.length) {
  console.error('Voice preset evidence 검사 실패')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log(`Voice preset evidence 구조 검사 통과 · manifest ${presets.length}/5`)
if (warnings.length) {
  console.log(`운영 준비 경고 ${warnings.length}개 · 실제 WAV/동의/검수 완료 전 CosyVoice 전용 프리셋은 비활성`)
  warnings.forEach((warning) => console.log(`- ${warning}`))
}
