import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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
    const settings = screen.getByRole('dialog', { name: '음성 설정' })
    expect(settings).toBeInTheDocument()
    expect(within(settings).getByText('한국어 숫자·기호 읽기 보정')).toBeInTheDocument()
    expect(within(settings).getAllByRole('slider').every((slider) => !slider.hasAttribute('disabled'))).toBe(true)
    expect(within(settings).getAllByText('지원 엔진 자동 선택').length).toBeGreaterThan(0)
    expect(within(settings).queryByRole('button', { name: '적용하기' })).not.toBeInTheDocument()
    expect(within(settings).getByRole('button', { name: /현재 설정 적용 · 재생/ })).toBeInTheDocument()
  })

  it('PC와 모바일에서 같은 음성 범위와 전체 말투를 사용한다', () => {
    render(<DubbingVoiceControls {...baseProps} emotion="angry" speed={1.4} pitch={5} />)

    fireEvent.click(screen.getByRole('button', { name: '음성 설정 열기' }))
    const settings = screen.getByRole('dialog', { name: '음성 설정' })
    const speed = within(settings).getByRole('slider', { name: '음성 속도' })
    const pitch = within(settings).getByRole('slider', { name: '음성 높낮이' })

    expect(speed).toHaveAttribute('min', '0.7')
    expect(speed).toHaveAttribute('max', '1.4')
    expect(speed).toHaveAttribute('step', '0.05')
    expect(pitch).toHaveAttribute('min', '-6')
    expect(pitch).toHaveAttribute('max', '6')
    expect(pitch).toHaveAttribute('step', '1')
    expect(within(settings).getAllByRole('radio')).toHaveLength(6)
    expect(within(settings).getByRole('radio', { name: '강하게' })).toHaveAttribute('aria-checked', 'true')
  })

  it('Sheet를 열면 초점을 이동하고 Escape 뒤 실행 버튼으로 돌려준다', async () => {
    render(<DubbingVoiceControls {...baseProps} />)

    const settingsButton = screen.getByRole('button', { name: '음성 설정 열기' })
    settingsButton.focus()
    fireEvent.click(settingsButton)

    expect(screen.getByRole('button', { name: '음성 설정 닫기' })).toHaveFocus()
    expect(document.body.style.overflow).toBe('hidden')

    fireEvent.keyDown(document, { key: 'Escape' })

    await waitFor(() => expect(screen.queryByRole('dialog', { name: '음성 설정' })).not.toBeInTheDocument())
    expect(settingsButton).toHaveFocus()
    expect(document.body.style.overflow).toBe('')
  })

  it('프리뷰 중에는 중복 재생 요청을 막는다', () => {
    render(<DubbingVoiceControls {...baseProps} previewingId="sori-warm" />)

    fireEvent.click(screen.getByRole('button', { name: '현재 목소리 혜린 선택' }))
    expect(screen.getAllByRole('button', { name: /목소리 미리듣기/ }).every((button) => button.hasAttribute('disabled'))).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: '목소리 선택 닫기' }))

    fireEvent.click(screen.getByRole('button', { name: '음성 설정 열기' }))
    expect(screen.getByRole('button', { name: '현재 설정으로 재생 준비 중…' })).toBeDisabled()
  })

  it('목소리 라디오는 방향키로 이동하고 선택값을 갱신한다', () => {
    const onVoiceChange = vi.fn()
    render(<DubbingVoiceControls {...baseProps} onVoiceChange={onVoiceChange} />)

    fireEvent.click(screen.getByRole('button', { name: '현재 목소리 혜린 선택' }))
    const warmVoice = screen.getByRole('radio', { name: /혜린/ })
    warmVoice.focus()
    fireEvent.keyDown(warmVoice, { key: 'ArrowDown' })

    expect(onVoiceChange).toHaveBeenCalledWith('on-clear')
    expect(screen.getByRole('radio', { name: /도윤/ })).toHaveFocus()
  })


  it('남성 필터에서 세 가지 남성 프리셋을 비교한다', () => {
    render(<DubbingVoiceControls {...baseProps} />)

    fireEvent.click(screen.getByRole('button', { name: '현재 목소리 혜린 선택' }))
    fireEvent.click(screen.getByRole('button', { name: '남성' }))

    expect(screen.getAllByRole('radio')).toHaveLength(3)
    expect(screen.getByRole('radio', { name: /도윤/ })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /준호/ })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /민준/ })).toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: /혜린/ })).not.toBeInTheDocument()
  })

  it('프리셋 재생 버튼이 선택과 프리뷰를 동시에 적용한다', () => {
    const onVoiceChange = vi.fn()
    const onPreview = vi.fn()
    render(<DubbingVoiceControls {...baseProps} onVoiceChange={onVoiceChange} onPreview={onPreview} />)

    fireEvent.click(screen.getByRole('button', { name: '현재 목소리 혜린 선택' }))
    fireEvent.click(screen.getByRole('button', { name: '도윤 목소리 미리듣기' }))

    expect(onVoiceChange).toHaveBeenCalledWith('on-clear')
    expect(onPreview).toHaveBeenCalledWith('on-clear')
  })
})
