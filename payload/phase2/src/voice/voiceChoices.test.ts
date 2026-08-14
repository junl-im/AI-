import { describe, expect, it } from 'vitest'
import { voicePresets } from '../tts/voicePresets'
import type { VoiceCloneProfile } from '../voiceclone/voiceCloneTypes'
import { buildVoiceChoices, resolveVoiceChoice } from './voiceChoices'

function profile(overrides: Partial<VoiceCloneProfile> = {}): VoiceCloneProfile {
  return {
    id: 'mine-1',
    displayName: '내 메인 보이스',
    status: 'engine-ready',
    engineId: 'cosyvoice3-worker',
    fileName: 'mine.wav',
    mimeType: 'audio/wav',
    sampleBlob: new Blob(['voice'], { type: 'audio/wav' }),
    analysis: {
      durationSeconds: 24,
      sampleRate: 48_000,
      channelCount: 1,
      rmsDb: -18,
      silenceRatio: 0.08,
      clippingRatio: 0.001,
      status: 'good',
      messages: [],
    },
    consent: {
      rightsConfirmed: true,
      disclosureConfirmed: true,
      prohibitedUseConfirmed: true,
      consentedAt: '2026-08-13T00:00:00.000Z',
      allowedPurpose: 'personal',
    },
    createdAt: '2026-08-13T00:00:00.000Z',
    updatedAt: '2026-08-13T00:00:00.000Z',
    message: 'ready',
    ...overrides,
  }
}

describe('voiceChoices', () => {
  it('MY VOICE를 기본 성우보다 앞에 노출하고 실제 프로필을 유지한다', () => {
    const mine = profile()
    const choices = buildVoiceChoices([mine])

    expect(choices[0]).toMatchObject({
      id: 'myvoice:mine-1',
      name: '내 메인 보이스',
      kind: 'my-voice',
      ready: true,
      profile: mine,
    })
    expect(choices.some((choice) => choice.id === voicePresets[0].id)).toBe(true)
  })

  it('선택 id로 내 목소리와 기본 성우를 같은 계약으로 해석한다', () => {
    const mine = profile()

    expect(resolveVoiceChoice([mine], 'myvoice:mine-1')).toMatchObject({
      kind: 'my-voice',
      name: '내 메인 보이스',
    })
    expect(resolveVoiceChoice([mine], voicePresets[0].id)).toMatchObject({
      kind: 'preset',
      id: voicePresets[0].id,
    })
  })
})
