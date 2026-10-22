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

  it('붙여 쓴 한국어 문장부호를 나누고 소수점은 유지한다', () => {
    expect(splitTextForUi('값은 3.5%입니다.다음은 2.1%입니다!확인하세요.')).toEqual([
      '값은 3.5%입니다.', '다음은 2.1%입니다!', '확인하세요.',
    ])
  })

  it('상담 안내 예시의 첫 인사말은 한 클립만 생성한다', () => {
    const script = [
      '안녕하세요. 매장 운영의 새로운 가치를 만들어가는 메타씨티입니다.',
      '포스와 키오스크, 그리고 메타플레이스까지.',
      '더욱 편리한 주문과 스마트한 결제, 효율적인 매장 운영을 위해 언제나 고객님과 함께하겠습니다.',
      '잠시만 기다려 주시면 전문 상담원에게 친절하게 연결해 드리겠습니다.',
      '감사합니다.',
    ].join('\n')
    const clips = splitTextForUi(script)
    expect(clips[0]).toBe('안녕하세요.')
    expect(clips.filter((clip) => clip === '안녕하세요.')).toHaveLength(1)
    expect(clips.join(' ')).toContain('감사합니다.')
  })

  it('빈 문장은 빈 구간을 반환한다', () => {
    expect(splitTextForUi('   ')).toEqual([])
  })
})
