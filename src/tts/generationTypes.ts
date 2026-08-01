import type { TtsSynthesisRequest, TtsSynthesisResult } from '../ai/contracts'
import type { BrowserSpeechPlayback } from './browserSpeech'
import type { SpeechJobProgress } from './voiceApi'

export type GenerationPhase = 'idle' | 'preparing' | 'requesting' | 'rendering' | 'completed' | 'cancelled' | 'failed'
export type AudioSource = 'api' | 'browser-demo' | 'browser-speech'

export interface GeneratedAudio {
  url: string | null
  filename: string
  source: AudioSource
  durationSeconds: number
  result: TtsSynthesisResult
  revokeOnRemove?: boolean
  browserSpeech?: BrowserSpeechPlayback
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
  progress: SpeechJobProgress | null
}
