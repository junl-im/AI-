import { describe, expect, it } from 'vitest'
import { alignItemsById } from './queueOrder'

describe('alignItemsById', () => {
  it('대상 트랙만 지정 순서로 맞추고 대상이 아닌 항목의 슬롯은 유지한다', () => {
    const queue = [
      { id: 'preview' },
      { id: 'third' },
      { id: 'first' },
      { id: 'second' },
    ]
    expect(alignItemsById(queue, ['first', 'second', 'third']).map((item) => item.id)).toEqual([
      'preview',
      'first',
      'second',
      'third',
    ])
  })
})
