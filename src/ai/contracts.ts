export type VoiceEmotion = 'neutral' | 'happy' | 'calm' | 'sad' | 'angry' | 'commercial'
export type EngineMode = 'mock' | 'local' | 'ai' | 'browser'

export interface TtsSynthesisRequest {
  text: string
  voiceId: string
  emotion: VoiceEmotion
  speed: number
  pitch: number
  format: 'mp3' | 'wav' | 'flac'
  engineId?: string
  normalizeText: boolean
}

export interface TtsSynthesisResult {
  jobId: string
  status: 'queued' | 'processing' | 'completed' | 'mock-complete' | 'cancelled' | 'failed'
  engineId: string
  engineMode: EngineMode
  audioUrl: string | null
  estimatedDurationSeconds: number
  message: string
  normalizedText: string | null
  segmentCount: number
  firstAudioMs?: number | null
  processingMs: number | null
  fileSizeBytes: number | null
  realtimeFactor: number | null
  requestedEngineId?: string | null
  attemptedEngineIds?: string[]
  fallbackUsed?: boolean
}

export interface EngineInfo {
  id: string
  name: string
  kind: string
  mode: EngineMode
  provider: string
  languages: string[]
  outputFormats: string[]
  supportsEmotion: boolean
  supportsSpeed: boolean
  supportsPitch: boolean
  supportsVoiceClone: boolean
  ready: boolean
  reason: string | null
  qualityTier?: 'basic' | 'standard' | 'premium' | 'reference'
  autoEligible?: boolean
  koreanSpecialization?: number
  longForm?: boolean
  streaming?: boolean
  recommended?: boolean
  health?: 'ready' | 'probing' | 'cooldown' | 'unavailable'
  successCount?: number
  failureCount?: number
  attemptCount?: number
  successRate?: number | null
  consecutiveFailures?: number
  cooldownRemainingSeconds?: number
  lastError?: string | null
  circuitOpenCount?: number
  probeInFlight?: boolean
  averageLatencyMs?: number | null
  lastLatencyMs?: number | null
  lastSuccessAt?: string | null
  lastFailureAt?: string | null
  selectionPenalty?: number
  degradedRemainingSeconds?: number
  selectionReason?: string | null
}

export interface HealthResult {
  status: 'ok'
  service: string
  version: string
  defaultEngine: string
}
