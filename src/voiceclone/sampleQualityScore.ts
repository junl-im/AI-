import type { VoiceSampleAnalysis } from './voiceCloneTypes'

function scoreDuration(seconds: number): number {
  if (seconds >= 20 && seconds <= 30) return 30
  if (seconds >= 12 && seconds <= 30) return 25
  if (seconds > 30) return 0
  if (seconds >= 8) return 17
  if (seconds >= 4) return 8
  return 0
}

function scoreSilence(ratio: number | null): number {
  if (ratio == null) return 12
  if (ratio <= 0.12) return 25
  if (ratio <= 0.22) return 20
  if (ratio <= 0.35) return 12
  return 3
}

function scoreClipping(ratio: number | null): number {
  if (ratio == null) return 12
  if (ratio <= 0.003) return 25
  if (ratio <= 0.01) return 20
  if (ratio <= 0.03) return 10
  return 2
}

function scoreVolume(rmsDb: number | null): number {
  if (rmsDb == null) return 10
  if (rmsDb >= -24 && rmsDb <= -10) return 20
  if (rmsDb >= -30 && rmsDb <= -7) return 15
  if (rmsDb >= -36 && rmsDb <= -5) return 9
  return 3
}

/**
 * Device-side guide score only. It is intentionally conservative and is not
 * a model-quality guarantee. Blocked samples never receive a passing score.
 */
export function calculateVoiceSampleScore(analysis: VoiceSampleAnalysis): number {
  const raw = scoreDuration(analysis.durationSeconds)
    + scoreSilence(analysis.silenceRatio)
    + scoreClipping(analysis.clippingRatio)
    + scoreVolume(analysis.rmsDb)

  if (analysis.status === 'blocked') return Math.min(49, raw)
  if (analysis.status === 'warning') return Math.min(79, raw)
  return Math.min(100, raw)
}

export function voiceSampleScoreLabel(score: number): string {
  if (score >= 90) return '원본 품질 우수'
  if (score >= 80) return '매우 좋음'
  if (score >= 70) return '사용 가능'
  if (score >= 50) return '개선 권장'
  return '다시 녹음 권장'
}
