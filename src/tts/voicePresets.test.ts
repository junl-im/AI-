import { describe, expect, it } from 'vitest'
import { voicePresets } from './voicePresets'

describe('voicePresets pace calibration', () => {
  it('1.00× UI 기준을 자연스러운 한국어 기본 발화에 가깝게 유지한다', () => {
    expect(Object.fromEntries(voicePresets.map((voice) => [voice.id, voice.rateMultiplier]))).toEqual({
      'sori-warm': 1.0,
      'on-clear': 1.04,
      'dam-calm': 0.98,
      'jun-deep': 0.98,
      'min-energetic': 1.08,
    })
  })

  it('차분/저음 프리셋도 사용자가 자연스럽게 빠른 범위를 선택할 수 있다', () => {
    const calm = voicePresets.find((voice) => voice.id === 'dam-calm')!
    const deep = voicePresets.find((voice) => voice.id === 'jun-deep')!

    expect(calm.naturalSpeedRange).toEqual([0.95, 1.15])
    expect(deep.naturalSpeedRange).toEqual([0.95, 1.12])
  })

  it('시스템 근사 음성의 기본 pitch를 전자음이 두드러지지 않는 범위로 낮춘다', () => {
    expect(Object.fromEntries(voicePresets.map((voice) => [voice.id, voice.pitchOffset]))).toEqual({
      'sori-warm': 0.5,
      'on-clear': -0.5,
      'dam-calm': 0,
      'jun-deep': -1.0,
      'min-energetic': 0.25,
    })
    expect(voicePresets.find((voice) => voice.id === 'sori-warm')?.naturalPitchRange).toEqual([-1, 2])
    expect(voicePresets.find((voice) => voice.id === 'dam-calm')?.naturalPitchRange).toEqual([-1, 1])
    expect(voicePresets.find((voice) => voice.id === 'jun-deep')?.naturalPitchRange).toEqual([-3, 0])
  })
})
