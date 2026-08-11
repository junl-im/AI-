import { describe, expect, it } from 'vitest'
import { runBoundedOrderedBatch } from './boundedBatch'

describe('runBoundedOrderedBatch', () => {
  it('동시에 실행하는 작업 수를 제한하면서 결과 배열은 입력 순서를 유지한다', async () => {
    let active = 0
    let maxActive = 0
    const results = await runBoundedOrderedBatch([1, 2, 3, 4], 2, async (value) => {
      active += 1
      maxActive = Math.max(maxActive, active)
      await new Promise((resolve) => setTimeout(resolve, value === 1 ? 15 : 2))
      active -= 1
      return value * 10
    })

    expect(maxActive).toBe(2)
    expect(results).toEqual([10, 20, 30, 40])
  })
})
