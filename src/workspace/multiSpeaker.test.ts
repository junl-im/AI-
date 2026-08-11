import { describe, expect, it } from 'vitest'
import { voicePresets } from '../tts/voicePresets'
import {
  analyzeMultiSpeakerScript,
  buildMultiSpeakerTimelineSegments,
  suggestSpeakerVoiceAssignments,
} from './multiSpeaker'

const baseOptions = {
  voiceId: 'sori-warm',
  voiceName: '혜린',
  emotion: 'neutral' as const,
  speed: 1,
  pitch: 0,
  engineId: 'auto',
  normalizeText: true,
}

describe('multi speaker script', () => {
  it('명시적인 화자: 대사 형식만 자동 배정 대상으로 인정한다', () => {
    const analysis = analyzeMultiSpeakerScript('철수: 안녕하세요.\n영희：반가워요.')
    expect(analysis.eligible).toBe(true)
    expect(analysis.speakers).toEqual(['철수', '영희'])
    expect(analysis.sampleBySpeaker.철수).toBe('안녕하세요.')

    const mixed = analyzeMultiSpeakerScript('철수: 안녕하세요.\n설명 문장\n영희: 반가워요.')
    expect(mixed.eligible).toBe(false)
    expect(mixed.unmatchedLines).toEqual(['설명 문장'])
  })

  it('첫 화자는 현재 목소리를 유지하고 나머지는 제안만 만든다', () => {
    expect(suggestSpeakerVoiceAssignments(['철수', '영희', '해설'], 'dam-calm', voicePresets))
      .toEqual([
        { speaker: '철수', voiceId: 'dam-calm' },
        { speaker: '영희', voiceId: 'jun-deep' },
        { speaker: '해설', voiceId: 'min-energetic' },
      ])
  })

  it('승인된 화자 배정을 문장별 voice 옵션으로 변환한다', () => {
    const analysis = analyzeMultiSpeakerScript('철수: 첫 문장입니다. 두 번째입니다.\n영희: 네, 알겠습니다.')
    const segments = buildMultiSpeakerTimelineSegments(
      analysis,
      [
        { speaker: '철수', voiceId: 'on-clear' },
        { speaker: '영희', voiceId: 'sori-warm' },
      ],
      baseOptions,
      voicePresets,
    )
    expect(segments.map((segment) => [segment.speaker, segment.text, segment.options.voiceId])).toEqual([
      ['철수', '첫 문장입니다.', 'on-clear'],
      ['철수', '두 번째입니다.', 'on-clear'],
      ['영희', '네, 알겠습니다.', 'sori-warm'],
    ])
  })
})
