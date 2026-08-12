import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearRememberedSpeakerVoices,
  getRememberedSpeakerVoiceMap,
  rememberSpeakerVoiceAssignments,
  speakerMemoryKey,
} from './speakerVoiceMemory'

describe('speaker voice memory', () => {
  beforeEach(() => clearRememberedSpeakerVoices())

  it('화자 원문 대신 안정적인 해시 키만 저장하고 목소리를 재사용한다', () => {
    rememberSpeakerVoiceAssignments([
      { speaker: '철수', voiceId: 'on-clear' },
      { speaker: '영희', voiceId: 'sori-warm' },
    ])
    const raw = window.localStorage.getItem('sorion-speaker-voice-memory-v1') ?? ''
    expect(raw).not.toContain('철수')
    expect(raw).not.toContain('영희')
    expect(raw).toContain(speakerMemoryKey('철수'))
    expect(getRememberedSpeakerVoiceMap(['철수', '영희'])).toEqual(new Map([
      ['철수', 'on-clear'],
      ['영희', 'sori-warm'],
    ]))
  })

  it('공백과 대소문자 차이는 같은 화자로 정규화한다', () => {
    rememberSpeakerVoiceAssignments([{ speaker: '  Narrator  ', voiceId: 'jun-deep' }])
    expect(getRememberedSpeakerVoiceMap(['narrator']).get('narrator')).toBe('jun-deep')
  })
})
