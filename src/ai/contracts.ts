export type VoiceEmotion = 'neutral' | 'happy' | 'calm' | 'sad' | 'angry' | 'commercial'
export type EngineMode = 'mock' | 'local' | 'ai'

export interface TtsSynthesisRequest {
  text: string
  voiceId: string
  emotion: VoiceEmotion
  speed: number
  pitch: number
  format: 'mp3' | 'wav' | 'flac'
  engineId?: string
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
  processingMs: number | null
  fileSizeBytes: number | null
  realtimeFactor: number | null
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
}

export interface HealthResult {
  status: 'ok'
  service: string
  version: string
  defaultEngine: string
}
