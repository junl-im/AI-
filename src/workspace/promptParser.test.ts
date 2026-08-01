import { describe, expect, it } from 'vitest'
import { interpretComposerPrompt } from './promptParser'

describe('interpretComposerPrompt', () => {
  it('추천 칩을 실제 생성 옵션으로 바꾼다', () => {
    const result = interpretComposerPrompt('안녕하세요.', [
      { id: 'commercial', label: '광고톤으로' },
      { id: 'slow', label: '더 천천히' },
      { id: 'numbers', label: '숫자 읽기 쉽게' },
    ])

    expect(result.emotion).toBe('commercial')
    expect(result.speed).toBe(0.88)
    expect(result.normalizeText).toBe(true)
    expect(result.spokenText).toBe('안녕하세요.')
  })

  it('LLM이 없을 때 대본 요청을 로컬 초안이라고 명확히 구분한다', () => {
    const result = interpretComposerPrompt(
      '봄날 피크닉 브이로그 대본 만들어줘 30초 밝은 톤으로',
      [{ id: 'bright', label: '밝은 톤으로' }],
    )

    expect(result.draftMode).toBe('local-draft')
    expect(result.emotion).toBe('happy')
    expect(result.spokenText).toContain('봄날 피크닉 브이로그')
  })
})
