import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BrandMasthead } from './BrandMasthead'

describe('BrandMasthead', () => {
  it('shows the inherited product and creator naming', () => {
    render(<BrandMasthead />)

    expect(screen.getByRole('heading', { name: /곰같은여우 SoriON AI/i })).toBeInTheDocument()
    expect(screen.getByText('모바일 · PC 호환')).toBeInTheDocument()
    expect(screen.getAllByText('곰같은여우').length).toBeGreaterThan(0)
  })

  it('contains rotating Korean-first messages and microphone marks', () => {
    render(<BrandMasthead />)

    expect(screen.getByText('문장을 목소리로.')).toBeInTheDocument()
    expect(screen.getByText('목소리를 새로운 가능성으로.')).toBeInTheDocument()
    expect(screen.getByTestId('brand-title-microphone')).toBeInTheDocument()
    expect(screen.getByTestId('voice-core-microphone')).toBeInTheDocument()
  })
})
