import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { VoicePresetSelector } from './VoicePresetSelector'

describe('VoicePresetSelector', () => {
  it('shows Korean presets and reports selection', () => {
    const onChange = vi.fn()
    render(<VoicePresetSelector value="sori-warm" onChange={onChange} />)

    expect(screen.getByRole('radio', { name: /^혜린 추천/ })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getAllByRole('radio')).toHaveLength(5)
    fireEvent.click(screen.getByRole('radio', { name: /^준호 저음/ }))
    expect(onChange).toHaveBeenCalledWith('jun-deep')
  })
})
