import type { TtsSynthesisRequest, TtsSynthesisResult } from '../ai/contracts'
import type { BrowserSpeechPlayback } from './browserSpeech'
import type { SpeechJobProgress } from './voiceApi'

export type GenerationPhase = 'idle' | 'preparing' | 'requesting' | 'rendering' | 'completed' | 'cancelled' | 'failed'
export type AudioSource = 'api' | 'browser-demo' | 'browser-speech'

export interface PlaybackSeamMetric {
  fromSegment: number
  toSegment: number
  gapMs: number
  waitedForSegment: boolean
  recordedAt: string
}

export interface PlaybackTelemetry {
  requestStartedAtMs: number
  serverSegmentReadyMs?: number | null
  firstByteMs?: number | null
  playingMs?: number | null
  browserSpeechStartMs?: number | null
  finalHandoffErrorMs?: number | null
  seams?: PlaybackSeamMetric[]
}

export interface AudioRehydration {
  kind: 'tts-final'
  jobId: string
  renewedAt?: string
}

export interface PartialAudioInfo {
  index: number
  totalSegments: number
  readyAfterMs: number
}

export interface ProgressiveAudioSegment {
  index: number
  totalSegments: number
  url: string
  filename: string
  durationSeconds: number
  readyAfterMs: number
  revokeOnRemove?: boolean
}

export interface ProgressiveAudioSequence {
  jobId: string
  totalSegments: number
  segments: ProgressiveAudioSegment[]
}

export interface GeneratedAudio {
  url: string | null
  filename: string
  source: AudioSource
  durationSeconds: number
  result: TtsSynthesisResult
  revokeOnRemove?: boolean
  browserSpeech?: BrowserSpeechPlayback
  partial?: PartialAudioInfo
  progressive?: ProgressiveAudioSequence
  telemetry?: PlaybackTelemetry
  rehydration?: AudioRehydration
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
