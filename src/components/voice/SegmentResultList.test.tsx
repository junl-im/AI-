import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SegmentResultList } from './SegmentResultList'

describe('SegmentResultList', () => {
  it('생성된 긴 문장을 문장별 완료 리스트로 보여준다', () => {
    render(
      <SegmentResultList
        text="첫 번째 문장입니다. 두 번째 문장입니다."
        reportedCount={2}
      />,
    )

    expect(screen.getByRole('heading', { name: '문장별 생성 구간' })).toBeInTheDocument()
    expect(screen.getAllByText('완료')).toHaveLength(2)
    expect(screen.getByText('2개 구간')).toBeInTheDocument()
  })
})
