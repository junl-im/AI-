import { describe, expect, it } from 'vitest'
import {
  countDetectedSpeakers,
  looksLikeSubtitleScript,
  normalizeImportedScript,
  polishScriptForSpeech,
} from './scriptPreparation'

describe('scriptPreparation', () => {
  it('붙여 넣은 SRT/VTT는 파일명이 없어도 자막으로 감지한다', () => {
    const source = `1\n00:00:01,000 --> 00:00:03,000\n안녕하세요.\n\n2\n00:00:03,100 --> 00:00:05,000\n두 번째 문장입니다.`
    expect(looksLikeSubtitleScript(source)).toBe(true)
    expect(normalizeImportedScript(source)).toBe('안녕하세요.\n두 번째 문장입니다.')
  })

  it('말하기용 정리는 Markdown 장식만 걷어내고 대사 내용은 유지한다', () => {
    expect(polishScriptForSpeech(`# 제목\n\n- 첫 문장입니다.\n2. 두 번째 문장입니다.\n> 마지막 문장입니다.`)).toBe(
      '제목\n\n첫 문장입니다.\n두 번째 문장입니다.\n마지막 문장입니다.',
    )
  })

  it('두 명 이상의 명시적 화자 표기만 화자 수로 안내한다', () => {
    expect(countDetectedSpeakers('철수: 안녕하세요.\n영희: 반가워요.\n철수: 시작할까요?')).toBe(2)
    expect(countDetectedSpeakers('주의: 저장 전에 확인하세요.')).toBe(0)
  })
})
