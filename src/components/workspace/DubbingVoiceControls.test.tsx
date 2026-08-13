import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DubbingVoiceControls } from './DubbingVoiceControls'

const baseProps = {
  voiceId: 'sori-warm',
  previewingId: null,
  activePreviewId: null,
  previewPlaying: false,
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
  it('현재 목소리 하나만 표시하고 목록은 선택 Sheet에서 연다', () => {
    render(<DubbingVoiceControls {...baseProps} />)

    expect(screen.getByRole('button', { name: '현재 목소리 혜린 선택' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '도윤 빠른 선택' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('빠른 목소리 선택')).not.toBeInTheDocument()
  })

  it('화자 선택과 읽기 설정을 별도 Sheet로 연다', () => {
    render(<DubbingVoiceControls {...baseProps} />)

    const voicePickerButton = screen.getByRole('button', { name: '현재 목소리 혜린 선택' })
    expect(voicePickerButton).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('button', { name: '혜린 목소리 미리듣기' })).toBeInTheDocument()

    fireEvent.click(voicePickerButton)
    expect(screen.getByRole('dialog', { name: '목소리 선택' })).toBeInTheDocument()
    expect(voicePickerButton).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(screen.getByRole('button', { name: '목소리 선택 닫기' }))

    fireEvent.click(screen.getByRole('button', { name: '음성 설정 열기' }))
    const settings = screen.getByRole('dialog', { name: '음성 설정' })
    expect(settings).toBeInTheDocument()
    expect(within(settings).getByText('한국어 숫자·기호 읽기 보정')).toBeInTheDocument()
    expect(within(settings).getAllByRole('slider').every((slider) => !slider.hasAttribute('disabled'))).toBe(true)
    expect(within(settings).getAllByText('자동 최적화').length).toBeGreaterThan(0)
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

  it('프리뷰 준비 중에는 현재 요청은 취소할 수 있고 다른 프리셋만 잠근다', () => {
    render(<DubbingVoiceControls {...baseProps} previewingId="sori-warm" />)

    expect(screen.getByRole('button', { name: '혜린 미리듣기 준비 취소' })).not.toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: '현재 목소리 혜린 선택' }))
    expect(screen.getByRole('button', { name: '도윤 목소리 미리듣기' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: '목소리 선택 닫기' }))

    fireEvent.click(screen.getByRole('button', { name: '음성 설정 열기' }))
    expect(screen.getByRole('button', { name: '현재 설정으로 재생 준비 중…' })).toBeDisabled()
  })

  it('재생 중인 프리셋 버튼은 일시정지로 바뀌고 다시 누를 수 있다', () => {
    render(
      <DubbingVoiceControls
        {...baseProps}
        activePreviewId="sori-warm"
        previewPlaying
      />,
    )

    expect(screen.getByRole('button', { name: '혜린 미리듣기 일시정지' })).toHaveTextContent('Ⅱ')
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

  it('목소리 목록의 재생 버튼은 선택을 바꾸지 않고 비교 재생만 한다', () => {
    const onVoiceChange = vi.fn()
    const onPreview = vi.fn()
    render(<DubbingVoiceControls {...baseProps} onVoiceChange={onVoiceChange} onPreview={onPreview} />)

    fireEvent.click(screen.getByRole('button', { name: '현재 목소리 혜린 선택' }))
    fireEvent.click(screen.getByRole('button', { name: '도윤 목소리 미리듣기' }))

    expect(onVoiceChange).not.toHaveBeenCalled()
    expect(onPreview).toHaveBeenCalledWith('on-clear')
  })

  it('대본 추천과 간결한 목소리 설명을 목록에서 제공한다', () => {
    render(<DubbingVoiceControls {...baseProps} scriptText="이 기능의 사용법을 세 단계로 설명합니다." />)

    fireEvent.click(screen.getByRole('button', { name: '현재 목소리 혜린 선택' }))
    const recommendation = screen.getByRole('status')
    expect(recommendation).toHaveTextContent('대본 맞춤 추천')
    expect(recommendation).toHaveTextContent('도윤')
    expect(screen.getByText('또렷하고 안정적인 남성 톤')).toBeInTheDocument()
    expect(screen.queryByText(/장점 ·/)).not.toBeInTheDocument()
    expect(screen.queryByText(/주의 ·/)).not.toBeInTheDocument()
  })
})
