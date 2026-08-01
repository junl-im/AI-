import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DubbingVoiceControls } from './DubbingVoiceControls'

const baseProps = {
  voiceId: 'sori-warm',
  previewingId: null,
  speed: 1,
  pitch: 0,
  emotion: 'neutral' as const,
  normalizeText: true,
  engine: null,
  onVoiceChange: vi.fn(),
  onPreview: vi.fn(),
  onSpeedChange: vi.fn(),
  onPitchChange: vi.fn(),
  onEmotionChange: vi.fn(),
  onNormalizeTextChange: vi.fn(),
  onCreateVoice: vi.fn(),
}

describe('DubbingVoiceControls', () => {
  it('화자 선택과 읽기 설정을 별도 Sheet로 연다', () => {
    render(<DubbingVoiceControls {...baseProps} />)

    const voicePickerButton = screen.getByRole('button', { name: '현재 목소리 혜린 선택' })
    expect(voicePickerButton).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('button', { name: '혜린 목소리 미리듣기' })).toBeInTheDocument()

    fireEvent.click(voicePickerButton)
    expect(screen.getByRole('dialog', { name: '전체 목소리' })).toBeInTheDocument()
    expect(voicePickerButton).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(screen.getByRole('button', { name: '목소리 선택 닫기' }))

    fireEvent.click(screen.getByRole('button', { name: '음성 설정 열기' }))
    expect(screen.getByRole('dialog', { name: '음성 설정' })).toBeInTheDocument()
    expect(screen.getByText('한국어 숫자·기호 읽기 보정')).toBeInTheDocument()
    expect(screen.getAllByRole('slider').every((slider) => !slider.hasAttribute('disabled'))).toBe(true)
    expect(screen.getAllByText('지원 엔진 자동 선택').length).toBeGreaterThan(0)
  })
})
