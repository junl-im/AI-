import { describe, expect, it } from 'vitest'
import { voicePresets } from './voicePresets'

describe('voicePresets pace calibration', () => {
  it('1.00× UI 기준을 자연스러운 한국어 기본 발화에 가깝게 유지한다', () => {
    expect(Object.fromEntries(voicePresets.map((voice) => [voice.id, voice.rateMultiplier]))).toEqual({
      'sori-warm': 1.02,
      'on-clear': 1.04,
      'dam-calm': 0.99,
      'jun-deep': 1.0,
      'min-energetic': 1.07,
      'byeol-oracle': 0.96,
    })
  })

  it('차분/저음 프리셋도 사용자가 자연스럽게 빠른 범위를 선택할 수 있다', () => {
    const calm = voicePresets.find((voice) => voice.id === 'dam-calm')!
    const deep = voicePresets.find((voice) => voice.id === 'jun-deep')!

    expect(calm.naturalSpeedRange).toEqual([0.94, 1.05])
    expect(deep.naturalSpeedRange).toEqual([0.95, 1.06])
  })

  it('시스템 근사 음성의 기본 pitch를 전자음이 두드러지지 않는 범위로 낮춘다', () => {
    expect(Object.fromEntries(voicePresets.map((voice) => [voice.id, voice.pitchOffset]))).toEqual({
      'sori-warm': 0.35,
      'on-clear': -0.65,
      'dam-calm': -0.1,
      'jun-deep': -1.2,
      'min-energetic': 0.45,
      'byeol-oracle': 0.6,
    })
    expect(voicePresets.find((voice) => voice.id === 'sori-warm')?.naturalPitchRange).toEqual([-1, 1.25])
    expect(voicePresets.find((voice) => voice.id === 'dam-calm')?.naturalPitchRange).toEqual([-1, 1])
    expect(voicePresets.find((voice) => voice.id === 'jun-deep')?.naturalPitchRange).toEqual([-3, 0])
  })
})


describe('voicePresets persona identity', () => {
  it('여섯 성우가 서로 다른 페르소나와 cadence를 가진다', () => {
    expect(new Set(voicePresets.map((voice) => voice.personaLabel)).size).toBe(6)
    expect(new Set(voicePresets.map((voice) => voice.cadence)).size).toBe(6)
    expect(voicePresets.every((voice) => voice.rhythmTags.length === 3)).toBe(true)
    expect(new Set(voicePresets.map((voice) => `${voice.softness}:${voice.articulation}:${voice.pauseStyle}`)).size).toBe(6)
    expect(voicePresets.find((voice) => voice.id === 'byeol-oracle')).toMatchObject({
      name: '별하', gender: 'female', cadence: 'oracle', pauseStyle: 'luminous',
    })
    expect(voicePresets.find((voice) => voice.id === 'min-energetic')?.rateMultiplier)
      .toBeGreaterThan(voicePresets.find((voice) => voice.id === 'jun-deep')?.rateMultiplier ?? 0)
  })
})
