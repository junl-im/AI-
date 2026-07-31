import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BrandMasthead } from './BrandMasthead'

describe('BrandMasthead', () => {
  it('shows the inherited product and creator naming', () => {
    render(<BrandMasthead />)

    expect(screen.getByRole('heading', { name: /곰같은여우 SoriON AI/i })).toBeInTheDocument()
    expect(screen.getByText('모바일 · PC 호환')).toBeInTheDocument()
    expect(screen.getAllByText('곰같은여우').length).toBeGreaterThan(0)
  })

  it('contains the current rotating copy and microphone identity', () => {
    render(<BrandMasthead />)

    const introduction = within(screen.getByLabelText('SoriON 소개 문장'))
    expect(introduction.getByText('문장을 목소리로, 목소리를 새로운 가능성으로.')).toBeInTheDocument()
    expect(introduction.getByText('한국어의 감정과 호흡을 더 자연스럽게.')).toBeInTheDocument()
    expect(introduction.getByText('생성부터 복제와 변환까지, 모바일에서 빠르게.')).toBeInTheDocument()
    expect(screen.getByTestId('brand-title-microphone')).toBeInTheDocument()
    expect(screen.getByTestId('voice-core-microphone')).toBeInTheDocument()
  })
})
