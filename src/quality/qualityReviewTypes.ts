import type { EngineMode } from '../ai/contracts'

export interface QualityReview {
  id: string
  sentence: string
  engineId: string
  engineName: string
  engineMode: EngineMode
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
  engineId: string
  engineName: string
  engineMode: EngineMode
  rating: number
  note: string
  elapsedMs: number | null
  durationSeconds: number | null
  realtimeFactor: number | null
}
