import { voicePresets } from '../tts/voicePresets'
import type { VoiceGender } from '../tts/voicePresets'
import { importQualityReviews } from './qualityReviewRepository'
import type { QualityReview, QualityReviewDecision, QualityReviewInput } from './qualityReviewTypes'

export const VOICE_REVIEW_BUNDLE_SCHEMA = 'sorion.voice-preset-review-bundle.v1' as const
const MAX_REVIEW_BUNDLE_BYTES = 5 * 1024 * 1024
const MAX_REVIEW_COUNT = 5000

interface ManifestReviewDraft {
  voiceId: string
  displayName: string
  declaredGender: VoiceGender
  proposedStatus: 'pending'
  approvedReviewIds: string[]
  rejectedReviewIds: string[]
  needsReviewIds: string[]
  audioSha256: ''
  reviewer: ''
  reviewedAt: null
  note: string
}

export interface VoicePresetReviewBundle {
  schemaVersion: typeof VOICE_REVIEW_BUNDLE_SCHEMA
  app: '곰같은여우 SoriON AI'
  appVersion: '0.9.3-beta.3'
  engineHeartbeat: '6.8.3'
  exportedAt: string
  reviewCount: number
  reviews: QualityReview[]
  manifestDrafts: ManifestReviewDraft[]
  payloadSha256: string
}

function canonicalPayload(bundle: Omit<VoicePresetReviewBundle, 'payloadSha256'>): string {
  return JSON.stringify(bundle)
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function decisionOf(review: QualityReview): QualityReviewDecision {
  if (review.decision) return review.decision
  if (review.rating >= 4) return 'approved'
  if (review.rating <= 2) return 'rejected'
  return 'needs-review'
}

export async function buildVoicePresetReviewBundle(reviews: QualityReview[]): Promise<VoicePresetReviewBundle> {
  const drafts = voicePresets.map((preset): ManifestReviewDraft => {
    const items = reviews.filter((review) => review.voiceId === preset.id)
    return {
      voiceId: preset.id,
      displayName: preset.name,
      declaredGender: preset.gender,
      proposedStatus: 'pending',
      approvedReviewIds: items.filter((item) => decisionOf(item) === 'approved').map((item) => item.id),
      rejectedReviewIds: items.filter((item) => decisionOf(item) === 'rejected').map((item) => item.id),
      needsReviewIds: items.filter((item) => decisionOf(item) === 'needs-review').map((item) => item.id),
      audioSha256: '',
      reviewer: '',
      reviewedAt: null,
      note: 'A/B 기록은 검토 초안일 뿐입니다. 현재 WAV SHA-256, 검수자, 검수 시각을 확인하기 전에는 manifest를 approved로 바꾸지 마세요.',
    }
  })
  const payload = {
    schemaVersion: VOICE_REVIEW_BUNDLE_SCHEMA,
    app: '곰같은여우 SoriON AI' as const,
    appVersion: '0.9.3-beta.3' as const,
    engineHeartbeat: '6.8.3' as const,
    exportedAt: new Date().toISOString(),
    reviewCount: reviews.length,
    reviews,
    manifestDrafts: drafts,
  }
  return { ...payload, payloadSha256: await sha256(canonicalPayload(payload)) }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function migrateLegacyReport(value: Record<string, unknown>): Record<string, unknown> {
  if (value.schemaVersion === VOICE_REVIEW_BUNDLE_SCHEMA) return value
  if (value.app === '곰같은여우 SoriON AI' && Array.isArray(value.reviews)) {
    return {
      schemaVersion: VOICE_REVIEW_BUNDLE_SCHEMA,
      app: value.app,
      appVersion: value.version ?? '0.9.3-beta.3',
      engineHeartbeat: 'legacy-migrated',
      exportedAt: value.exportedAt ?? new Date().toISOString(),
      reviewCount: value.reviews.length,
      reviews: value.reviews,
      manifestDrafts: [],
      payloadSha256: '',
    }
  }
  return value
}

function optionalNonNegativeNumber(value: unknown, label: string): number | null {
  if (value === null || value === undefined) return null
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error(`${label} 값이 올바르지 않습니다.`)
  }
  return value
}

function normalizeReview(value: unknown): QualityReviewInput {
  if (!isObject(value)) throw new Error('검수 기록 항목이 객체가 아닙니다.')
  const preset = voicePresets.find((item) => item.id === value.voiceId)
  if (!preset) throw new Error(`지원하지 않는 프리셋 ID입니다: ${String(value.voiceId)}`)
  if (value.voiceName !== preset.name || value.voiceGender !== preset.gender) {
    throw new Error(`${preset.id}의 인물명 또는 선언 성별이 현재 계약과 다릅니다.`)
  }
  const decision = value.decision ?? (
    typeof value.rating === 'number' && value.rating >= 4 ? 'approved'
      : typeof value.rating === 'number' && value.rating <= 2 ? 'rejected'
        : 'needs-review'
  )
  if (!['approved', 'rejected', 'needs-review'].includes(String(decision))) {
    throw new Error('검수 결정값이 올바르지 않습니다.')
  }
  if (typeof value.sentence !== 'string' || !value.sentence.trim()) throw new Error('검수 문장이 비어 있습니다.')
  if (value.sentence.length > 3000) throw new Error('검수 문장은 3000자를 넘을 수 없습니다.')
  if (typeof value.engineId !== 'string' || !value.engineId.trim()) throw new Error('엔진 ID가 비어 있습니다.')
  if (value.engineId.length > 100) throw new Error('엔진 ID가 너무 깁니다.')
  const rating = Number(value.rating)
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error('별점은 1~5 정수여야 합니다.')
  return {
    sentence: value.sentence,
    voiceId: preset.id,
    voiceName: preset.name,
    voiceGender: preset.gender,
    engineId: value.engineId,
    engineName: typeof value.engineName === 'string' ? value.engineName : value.engineId,
    engineMode: value.engineMode === 'ai' || value.engineMode === 'local' || value.engineMode === 'mock' || value.engineMode === 'browser' ? value.engineMode : 'local',
    decision: decision as QualityReviewDecision,
    rating,
    note: typeof value.note === 'string' ? value.note.slice(0, 500) : '',
    elapsedMs: optionalNonNegativeNumber(value.elapsedMs, '생성 시간'),
    durationSeconds: optionalNonNegativeNumber(value.durationSeconds, '음원 길이'),
    realtimeFactor: optionalNonNegativeNumber(value.realtimeFactor, 'RTF'),
  }
}

export async function parseAndImportVoicePresetReviewBundle(text: string): Promise<{ imported: number; migrated: boolean }> {
  if (new TextEncoder().encode(text).byteLength > MAX_REVIEW_BUNDLE_BYTES) {
    throw new Error('검수 묶음은 5MiB를 넘을 수 없습니다.')
  }
  const parsed: unknown = JSON.parse(text)
  if (!isObject(parsed)) throw new Error('검수 묶음 최상위 값이 객체가 아닙니다.')
  const migratedValue = migrateLegacyReport(parsed)
  const migrated = parsed.schemaVersion !== VOICE_REVIEW_BUNDLE_SCHEMA
  if (migratedValue.schemaVersion !== VOICE_REVIEW_BUNDLE_SCHEMA || !Array.isArray(migratedValue.reviews)) {
    throw new Error('지원하지 않는 검수 묶음 schema입니다.')
  }
  if (migratedValue.app !== '곰같은여우 SoriON AI') throw new Error('다른 앱의 검수 묶음은 가져올 수 없습니다.')
  if (migratedValue.reviews.length > MAX_REVIEW_COUNT) throw new Error('검수 기록은 한 번에 5000개까지 가져올 수 있습니다.')
  if (!migrated) {
    if (migratedValue.reviewCount !== migratedValue.reviews.length) {
      throw new Error('검수 묶음의 reviewCount가 실제 기록 수와 다릅니다.')
    }
    if (typeof migratedValue.payloadSha256 !== 'string' || !/^[0-9a-f]{64}$/.test(migratedValue.payloadSha256)) {
      throw new Error('검수 묶음 SHA-256가 없거나 형식이 올바르지 않습니다.')
    }
    const { payloadSha256, ...payload } = migratedValue
    const actual = await sha256(canonicalPayload(payload as Omit<VoicePresetReviewBundle, 'payloadSha256'>))
    if (actual !== payloadSha256) throw new Error('검수 묶음 SHA-256가 맞지 않습니다. 파일이 변경되었을 수 있습니다.')
  }
  const inputs = migratedValue.reviews.map(normalizeReview)
  return { imported: await importQualityReviews(inputs), migrated }
}

export function downloadVoicePresetReviewBundle(bundle: VoicePresetReviewBundle): void {
  const url = URL.createObjectURL(new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `SoriON-voice-review-draft-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
