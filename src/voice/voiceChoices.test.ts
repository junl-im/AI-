import { describe, expect, it } from 'vitest'
import type { VoiceCloneProfile } from '../voiceclone/voiceCloneTypes'
import { buildVoiceChoices, resolveVoiceChoice } from './voiceChoices'

function profile(status: VoiceCloneProfile['status'] = 'engine-ready'): VoiceCloneProfile {
  const now = '2026-08-15T00:00:00.000Z'
  return {
    id: 'mine-1',
    displayName: '내 테스트 목소리',
    status,
    engineId: 'cosyvoice3-worker',
    fileName: 'sample.wav',
    mimeType: 'audio/wav',
    sampleBlob: new Blob(['sample'], { type: 'audio/wav' }),
    analysis: {
      durationSeconds: 22,
      sampleRate: 48000,
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
      consentedAt: now,
      allowedPurpose: 'content',
    },
    createdAt: now,
    updatedAt: now,
    message: 'ready',
  }
}

describe('voiceChoices', () => {
  it('MY VOICE를 기본 성우보다 앞에 노출하고 엔진 준비 상태를 반영한다', () => {
    const choices = buildVoiceChoices([profile()])
    expect(choices[0]).toMatchObject({ id: 'myvoice:mine-1', kind: 'my-voice', ready: true })
    expect(resolveVoiceChoice(choices, 'myvoice:mine-1').name).toBe('내 테스트 목소리')
  })

  it('엔진 미준비 MY VOICE는 보이지만 생성 대상으로 활성화하지 않는다', () => {
    const choices = buildVoiceChoices([profile('engine-unavailable')])
    expect(choices[0].ready).toBe(false)
  })

  it('서버 등록 여부가 불확실한 MY VOICE는 생성 대상으로 활성화하지 않는다', () => {
    const uncertain = profile()
    uncertain.remoteSynced = null
    const choices = buildVoiceChoices([uncertain])
    expect(choices[0].ready).toBe(false)
  })
})
