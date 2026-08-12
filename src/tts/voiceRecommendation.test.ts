import { describe, expect, it } from 'vitest'
import { voicePresets } from './voicePresets'
import { clampVoiceSettingsToNaturalRange, recommendVoiceForScript } from './voiceRecommendation'

describe('voiceRecommendation', () => {
  it('대본 성격에 맞는 프리셋을 제안한다', () => {
    expect(recommendVoiceForScript('지금 바로 구독하고 이벤트 할인 혜택을 만나보세요!', voicePresets)?.voiceId)
      .toBe('min-energetic')
    expect(recommendVoiceForScript('이 기능의 사용법을 세 단계로 설명합니다.', voicePresets)?.voiceId)
      .toBe('on-clear')
    expect(recommendVoiceForScript('역사 속 사건을 기록한 다큐멘터리입니다.', voicePresets)?.voiceId)
      .toBe('jun-deep')
  })

  it('목소리 변경 시 과한 속도와 높낮이를 자연 범위로 제한한다', () => {
    const calm = voicePresets.find((voice) => voice.id === 'dam-calm')!
    expect(clampVoiceSettingsToNaturalRange(calm, 1.4, 6)).toEqual({ speed: 1.02, pitch: 2 })
  })
})
