import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LongformComposer } from './LongformComposer'

const activity = {
  id: 'activity',
  role: 'assistant' as const,
  badge: '준비',
  text: '원고를 입력해 주세요.',
}

describe('LongformComposer', () => {
  it('브라우저 대체 음성이 준비되면 서버 대기로 표시하지 않는다', () => {
    render(
      <LongformComposer
        disabled={false}
        value="안녕하세요."
        backendStatus="degraded"
        backendMessage="브라우저 한국어 음성 준비 · AI 서버 자동 재연결 중"
        activity={activity}
        onValueChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByText('브라우저 음성 준비됨')).toBeInTheDocument()
    expect(screen.queryByText('음성 서버 연결 대기')).not.toBeInTheDocument()
  })

  it('Ctrl+Enter로 현재 장문 원고를 제작 요청한다', () => {
    const onSubmit = vi.fn()
    render(
      <LongformComposer
        disabled={false}
        value="첫 문장입니다. 두 번째 문장입니다."
        backendStatus="online"
        backendMessage="실제 TTS 준비"
        activity={activity}
        onValueChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    )

    fireEvent.keyDown(screen.getByRole('textbox', { name: '음성으로 만들 장문 원고' }), {
      key: 'Enter',
      ctrlKey: true,
    })

    expect(onSubmit).toHaveBeenCalledWith('첫 문장입니다. 두 번째 문장입니다.')
  })
})
