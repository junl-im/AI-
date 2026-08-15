import { describe, expect, it } from 'vitest'
import { getMyVoiceProfileId, isMyVoiceId, toMyVoiceId } from './voiceIdentity'

describe('voiceIdentity', () => {
  it('내 목소리 프로필 ID를 일반 voiceId와 충돌하지 않게 감싼다', () => {
    const voiceId = toMyVoiceId('profile-1')
    expect(voiceId).toBe('myvoice:profile-1')
    expect(isMyVoiceId(voiceId)).toBe(true)
    expect(getMyVoiceProfileId(voiceId)).toBe('profile-1')
    expect(isMyVoiceId('sori-warm')).toBe(false)
  })
})
