import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LongformComposer, normalizeImportedScript } from './LongformComposer'

const activity = {
  id: 'activity',
  role: 'assistant' as const,
  badge: '준비',
  text: '내용을 입력해 주세요.',
}

describe('LongformComposer', () => {
  it('일반 작업 화면에는 엔진 연결 기술 상태를 노출하지 않는다', () => {
    render(
      <LongformComposer
        disabled={false}
        value="안녕하세요."
        activity={activity}
        onValueChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /전체 내용 음성 제작/ })).toBeInTheDocument()
    expect(screen.queryByText(/엔진|서버 연결|브라우저 음성/)).not.toBeInTheDocument()
  })

  it('Ctrl+Enter로 현재 장문 내용을 제작 요청한다', () => {
    const onSubmit = vi.fn()
    render(
      <LongformComposer
        disabled={false}
        value="첫 문장입니다. 두 번째 문장입니다."
        activity={activity}
        onValueChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    )

    fireEvent.keyDown(screen.getByRole('textbox', { name: '음성으로 만들 장문 내용' }), {
      key: 'Enter',
      ctrlKey: true,
    })

    expect(onSubmit).toHaveBeenCalledWith('첫 문장입니다. 두 번째 문장입니다.')
  })
  it('화면에서 바로 타이핑하면 내용 편집기로 이동한다', () => {
    const onValueChange = vi.fn()
    render(
      <LongformComposer
        disabled={false}
        value=""
        activity={activity}
        onValueChange={onValueChange}
        onSubmit={vi.fn()}
      />,
    )

    fireEvent.keyDown(document.body, { key: '가' })

    const editor = screen.getByRole('textbox', { name: '음성으로 만들 장문 내용' })
    expect(editor).toHaveFocus()
    expect(onValueChange).toHaveBeenCalledWith('가')
  })
  it('SRT/VTT 대본 파일은 번호와 타임코드를 제거해 바로 읽을 문장만 남긴다', () => {
    const source = `1
00:00:01,000 --> 00:00:03,000
안녕하세요.

2
00:00:03,100 --> 00:00:05,000
두 번째 문장입니다.`
    expect(normalizeImportedScript(source, 'sample.srt')).toBe('안녕하세요.\n두 번째 문장입니다.')
  })

})
