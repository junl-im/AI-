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
})
