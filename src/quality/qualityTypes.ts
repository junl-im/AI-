import type { EngineMode, VoiceEmotion } from '../ai/contracts'

export interface DiagnosticCheck {
  id: string
  label: string
  status: string
  detail: string
}

export interface EngineDiagnostic {
  engineId: string
  name: string
  mode: EngineMode
  ready: boolean
  provider: string
  qualityTier: 'basic' | 'standard' | 'premium' | 'reference'
  costTier: 'free' | 'metered'
  autoEligible: boolean
  koreanSpecialization: number
  longForm: boolean
  streaming: boolean
  modelLoaded: boolean | null
  recommended: boolean
  health: 'ready' | 'cooldown' | 'unavailable'
  successCount: number
  failureCount: number
  cooldownRemainingSeconds: number
  checks: DiagnosticCheck[]
}

export interface QualityDiagnostics {
  version: string
  pythonVersion: string
  platform: string
  processId: number
  memoryMb: number | null
  engines: EngineDiagnostic[]
}

export interface EvaluationSentence {
  id: string
  category: string
  text: string
  focus: string[]
}

export interface TextPreview {
  originalText: string
  normalizedText: string
  changes: string[]
  segments: string[]
  segmentCount: number
}

export interface QualityCompareRequest {
  text: string
  engineIds: string[]
  voiceId: string
  emotion: VoiceEmotion
  speed: number
  pitch: number
}

export interface QualityResult {
  engineId: string
  engineName: string
  engineMode: EngineMode
  status: string
  audioUrl: string | null
  message: string
  elapsedMs: number | null
  durationSeconds: number | null
  realtimeFactor: number | null
  fileSizeBytes: number | null
  segmentCount: number
}

export interface QualityComparison {
  normalizedText: string
  changes: string[]
  results: QualityResult[]
}
