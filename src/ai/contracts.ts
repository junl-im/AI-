export type VoiceEmotion = 'neutral' | 'happy' | 'calm' | 'sad' | 'angry' | 'commercial'

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
  status: 'queued' | 'processing' | 'completed' | 'mock-complete'
  engineId: string
  audioUrl: string | null
  estimatedDurationSeconds: number
  message: string
}

export interface HealthResult {
  status: 'ok'
  service: string
  version: string
  defaultEngine: string
}
