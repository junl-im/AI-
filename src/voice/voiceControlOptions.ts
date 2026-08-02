import type { VoiceEmotion } from '../ai/contracts'

export const VOICE_SPEED_CONTROL = {
  min: 0.7,
  max: 1.4,
  step: 0.05,
} as const

export const VOICE_PITCH_CONTROL = {
  min: -6,
  max: 6,
  step: 1,
} as const

export const VOICE_EMOTION_OPTIONS: ReadonlyArray<{
  id: VoiceEmotion
  label: string
}> = [
  { id: 'neutral', label: '기본' },
  { id: 'happy', label: '밝게' },
  { id: 'calm', label: '차분' },
  { id: 'commercial', label: '광고' },
  { id: 'sad', label: '슬프게' },
  { id: 'angry', label: '강하게' },
]

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, value))
}

export function normalizeVoiceSpeed(value: number): number {
  const clamped = clamp(value, VOICE_SPEED_CONTROL.min, VOICE_SPEED_CONTROL.max)
  const steps = Math.round((clamped - VOICE_SPEED_CONTROL.min) / VOICE_SPEED_CONTROL.step)
  return Number((VOICE_SPEED_CONTROL.min + steps * VOICE_SPEED_CONTROL.step).toFixed(2))
}

export function normalizeVoicePitch(value: number): number {
  return Math.round(clamp(value, VOICE_PITCH_CONTROL.min, VOICE_PITCH_CONTROL.max))
}

export function formatPitch(value: number): string {
  const normalized = normalizeVoicePitch(value)
  return `${normalized > 0 ? '+' : ''}${normalized}`
}
