import type { TtsSynthesisRequest, TtsSynthesisResult } from '../ai/contracts'

export type GenerationPhase = 'idle' | 'preparing' | 'requesting' | 'rendering' | 'completed' | 'cancelled' | 'failed'
export type AudioSource = 'api' | 'browser-demo'

export interface GeneratedAudio {
  url: string
  filename: string
  source: AudioSource
  durationSeconds: number
  result: TtsSynthesisResult
}

export interface GenerationAttempt {
  request: TtsSynthesisRequest
  voiceName: string
}

export interface VoiceGenerationState {
  phase: GenerationPhase
  audio: GeneratedAudio | null
  error: string | null
  lastAttempt: GenerationAttempt | null
}
