import type { EngineMode } from '../ai/contracts'
import type { VoiceGender } from '../tts/voicePresets'

export type QualityReviewDecision = 'approved' | 'rejected' | 'needs-review'

export interface QualityReview {
  id: string
  sentence: string
  voiceId: string
  voiceName: string
  voiceGender: VoiceGender
  engineId: string
  engineName: string
  engineMode: EngineMode
  decision?: QualityReviewDecision
  rating: number
  note: string
  elapsedMs: number | null
  durationSeconds: number | null
  realtimeFactor: number | null
  createdAt: string
  updatedAt: string
}

export interface QualityReviewInput {
  sentence: string
  voiceId: string
  voiceName: string
  voiceGender: VoiceGender
  engineId: string
  engineName: string
  engineMode: EngineMode
  decision: QualityReviewDecision
  rating: number
  note: string
  elapsedMs: number | null
  durationSeconds: number | null
  realtimeFactor: number | null
}
