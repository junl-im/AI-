import { describe, expect, it } from 'vitest'
import { getMyVoiceProfileId, isMyVoiceId, toMyVoiceId } from './voiceIdentity'

describe('voiceIdentity', () => {
  it('저장된 내 목소리 프로필을 충돌 없는 voice id로 변환한다', () => {
    const voiceId = toMyVoiceId('profile-123')

    expect(voiceId).toBe('myvoice:profile-123')
    expect(isMyVoiceId(voiceId)).toBe(true)
    expect(getMyVoiceProfileId(voiceId)).toBe('profile-123')
  })

  it('기본 프리셋 id는 내 목소리 프로필로 오인하지 않는다', () => {
    expect(isMyVoiceId('sori-warm')).toBe(false)
    expect(getMyVoiceProfileId('sori-warm')).toBeNull()
    expect(getMyVoiceProfileId('myvoice:')).toBeNull()
  })
})
