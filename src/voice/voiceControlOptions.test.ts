import { describe, expect, it } from 'vitest'
import {
  normalizeVoicePitch,
  normalizeVoiceSpeed,
  VOICE_EMOTION_OPTIONS,
} from './voiceControlOptions'

describe('voice control options', () => {
  it('이전 저장값을 UI와 API가 함께 허용하는 범위로 보정한다', () => {
    expect(normalizeVoiceSpeed(1.52)).toBe(1.4)
    expect(normalizeVoiceSpeed(0.81)).toBe(0.8)
    expect(normalizeVoicePitch(5.5)).toBe(6)
    expect(normalizeVoicePitch(-9)).toBe(-6)
  })

  it('모든 VoiceEmotion 선택지를 PC와 모바일에 공유한다', () => {
    expect(VOICE_EMOTION_OPTIONS.map((item) => item.id)).toEqual([
      'neutral',
      'happy',
      'calm',
      'commercial',
      'sad',
      'angry',
    ])
  })
})
