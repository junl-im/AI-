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

  it('현재 대본의 첫 문장을 별도 생성 없이 미리듣기 요청한다', () => {
    const onPreviewText = vi.fn()
    render(
      <LongformComposer
        disabled={false}
        value="첫 문장입니다. 두 번째 문장입니다."
        activity={activity}
        onPreviewText={onPreviewText}
        onValueChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: '▶ 첫 문장 미리듣기' }))
    expect(onPreviewText).toHaveBeenCalledWith('첫 문장입니다.')
  })

  it('긴 대본 생성 중에는 완료 수와 중지 동작을 같은 화면에서 제공한다', () => {
    const onCancelGeneration = vi.fn()
    render(
      <LongformComposer
        disabled
        value="첫 문장입니다. 두 번째 문장입니다. 세 번째 문장입니다."
        activity={activity}
        generationProgress={{ total: 3, ready: 1, failed: 0, generating: 2, queued: 0 }}
        onCancelGeneration={onCancelGeneration}
        onValueChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1')
    expect(screen.getByText('2개 생성 중')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '생성 중지' }))
    expect(onCancelGeneration).toHaveBeenCalledOnce()
  })

  it('화자 배정 확인 전에는 생성 단축키와 버튼을 막는다', () => {
    const onSubmit = vi.fn()
    render(
      <LongformComposer
        disabled={false}
        value="철수: 안녕하세요.\n영희: 반가워요."
        activity={activity}
        submitBlockedReason="2명 화자 목소리를 먼저 확인해 주세요."
        onValueChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    )

    const textbox = screen.getByRole('textbox', { name: '음성으로 만들 장문 내용' })
    fireEvent.keyDown(textbox, { key: 'Enter', ctrlKey: true })
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /전체 내용 음성 제작/ })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent('2명 화자 목소리를 먼저 확인해 주세요.')
  })

  it('중지 후 남은 대사를 한 번에 이어서 만들 수 있다', () => {
    const onResumeGeneration = vi.fn()
    render(
      <LongformComposer
        disabled={false}
        value="첫 문장입니다. 두 번째 문장입니다."
        activity={activity}
        resumeCount={2}
        onResumeGeneration={onResumeGeneration}
        onValueChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: '남은 대사 2개 이어서 만들기' }))
    expect(onResumeGeneration).toHaveBeenCalledOnce()
  })


  it('모바일에서 대본 입력을 시작하면 편집 칸을 상단 작업 위치로 맞춘다', () => {
    const originalWidth = window.innerWidth
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 })
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
    const requestAnimationFrame = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0)
      return 1
    })
    render(
      <LongformComposer
        disabled={false}
        value="모바일 대본"
        activity={activity}
        onValueChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    )
    const editor = screen.getByRole('textbox', { name: '음성으로 만들 장문 내용' })
    vi.spyOn(editor, 'getBoundingClientRect').mockReturnValue({
      x: 0, y: 420, top: 420, left: 0, right: 360, bottom: 620, width: 360, height: 200,
      toJSON: () => ({}),
    })

    fireEvent.focus(editor)
    expect(scrollTo).toHaveBeenCalled()

    requestAnimationFrame.mockRestore()
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalWidth })
  })

})
