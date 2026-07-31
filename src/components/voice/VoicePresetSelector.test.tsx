import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { VoicePresetSelector } from './VoicePresetSelector'

describe('VoicePresetSelector', () => {
  it('shows Korean presets and reports selection', () => {
    const onChange = vi.fn()
    render(<VoicePresetSelector value="sori-warm" onChange={onChange} />)

    expect(screen.getByRole('radio', { name: /소리 · 따뜻함/ })).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(screen.getByRole('radio', { name: /온 · 또렷함/ }))
    expect(onChange).toHaveBeenCalledWith('on-clear')
  })
})
