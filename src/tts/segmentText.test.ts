import { describe, expect, it } from 'vitest'
import { splitTextForUi } from './segmentText'

describe('splitTextForUi', () => {
  it('문장 경계와 최대 길이를 기준으로 생성 구간을 나눈다', () => {
    const text = '첫 번째 문장입니다. 두 번째 문장입니다. 세 번째 문장입니다.'
    expect(splitTextForUi(text, 22)).toEqual([
      '첫 번째 문장입니다.',
      '두 번째 문장입니다.',
      '세 번째 문장입니다.',
    ])
  })

  it('기본 길이에서도 문장 경계를 각각의 UI 구간으로 유지한다', () => {
    expect(splitTextForUi('첫 번째 문장입니다. 두 번째 문장입니다.')).toEqual([
      '첫 번째 문장입니다.',
      '두 번째 문장입니다.',
    ])
  })

  it('빈 문장은 빈 구간을 반환한다', () => {
    expect(splitTextForUi('   ')).toEqual([])
  })
})
