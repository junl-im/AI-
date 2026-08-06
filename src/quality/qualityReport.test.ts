import { describe, expect, it } from 'vitest'
import { buildQualityCsv, buildQualityReport } from './qualityReport'
import type { QualityReview } from './qualityReviewTypes'

const review: QualityReview = {
  id: 'melo-1',
  sentence: '안녕, "소리온"',
  voiceId: 'on-clear',
  voiceName: '도윤',
  voiceGender: 'male',
  engineId: 'melo',
  engineName: 'MeloTTS Korean',
  engineMode: 'ai',
  rating: 4,
  note: '숫자 발음이 자연스러움',
  elapsedMs: 1200,
  durationSeconds: 2.5,
  realtimeFactor: 0.48,
  createdAt: '2026-07-31T00:00:00.000Z',
  updatedAt: '2026-07-31T00:01:00.000Z',
}

describe('quality report export', () => {
  it('builds a versioned JSON report', () => {
    const report = buildQualityReport([review])
    expect(report.version).toBe('0.9.5')
    expect(report.reviews).toHaveLength(1)
  })

  it('escapes Korean CSV values and includes a BOM', () => {
    const csv = buildQualityCsv([review])
    expect(csv.startsWith('\ufeff')).toBe(true)
    expect(csv).toContain('"안녕, ""소리온"""')
    expect(csv).toContain('"MeloTTS Korean"')
    expect(csv).toContain('"on-clear"')
    expect(csv).toContain('"도윤"')
  })
})
