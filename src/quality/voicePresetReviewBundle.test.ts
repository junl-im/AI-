import { describe, expect, it } from 'vitest'
import type { QualityReview } from './qualityReviewTypes'
import {
  buildVoicePresetReviewBundle,
  parseAndImportVoicePresetReviewBundle,
  VOICE_REVIEW_BUNDLE_SCHEMA,
} from './voicePresetReviewBundle'

const review: QualityReview = {
  id: 'review-1',
  sentence: '공통 검수 문장입니다.',
  voiceId: 'on-clear',
  voiceName: '도윤',
  voiceGender: 'male',
  engineId: 'system',
  engineName: 'System',
  engineMode: 'local',
  decision: 'approved',
  rating: 5,
  note: '남성 음성 확인',
  elapsedMs: 100,
  durationSeconds: 2,
  realtimeFactor: 0.05,
  createdAt: '2026-08-05T00:00:00.000Z',
  updatedAt: '2026-08-05T00:00:00.000Z',
}

describe('voice preset review bundle', () => {
  it('keeps manifest approval pending and signs the payload', async () => {
    const bundle = await buildVoicePresetReviewBundle([review])
    expect(bundle.schemaVersion).toBe(VOICE_REVIEW_BUNDLE_SCHEMA)
    expect(bundle.payloadSha256).toMatch(/^[a-f0-9]{64}$/)
    const draft = bundle.manifestDrafts.find((item) => item.voiceId === 'on-clear')
    expect(draft?.proposedStatus).toBe('pending')
    expect(draft?.approvedReviewIds).toEqual(['review-1'])
    expect(draft?.audioSha256).toBe('')
  })

  it('rejects a modern bundle without a checksum', async () => {
    const bundle = await buildVoicePresetReviewBundle([review])
    const { payloadSha256: _checksum, ...unsigned } = bundle
    await expect(parseAndImportVoicePresetReviewBundle(JSON.stringify(unsigned)))
      .rejects.toThrow('SHA-256가 없거나')
  })

  it('rejects a changed payload before touching local storage', async () => {
    const bundle = await buildVoicePresetReviewBundle([review])
    const changed = { ...bundle, exportedAt: '2026-08-05T01:00:00.000Z' }
    await expect(parseAndImportVoicePresetReviewBundle(JSON.stringify(changed)))
      .rejects.toThrow('SHA-256가 맞지 않습니다')
  })

})
