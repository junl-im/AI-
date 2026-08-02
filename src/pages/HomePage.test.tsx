import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '../store/useAppStore'
import { usePlayerStore } from '../store/usePlayerStore'
import { HomePage } from './HomePage'

describe('HomePage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    usePlayerStore.getState().clearQueue()
    useAppStore.setState({
      page: 'home',
      workspaceEntered: false,
      activeProject: null,
      workspaceResetToken: 0,
      backendStatus: 'offline',
      backendMessage: '배포된 음성 서버 주소가 설정되지 않았습니다.',
      engineHealth: {
        api: 'unknown',
        tts: 'unknown',
        worker: 'unknown',
        gpu: 'unknown',
        baseUrl: '',
        latencyMs: null,
        lastCheckedAt: null,
        requestId: null,
      },
      notice: null,
    })
    vi.restoreAllMocks()
  })

  it('초기 화면에서는 장문 스튜디오 시작 동선을 유지한다', () => {
    render(<HomePage />)

    expect(screen.getByRole('heading', { name: /긴 내용도/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /장문 음성 스튜디오 시작/ }))
      .toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: '음성으로 만들 장문 내용' }))
      .not.toBeInTheDocument()
  })

  it('작업공간에서는 장문 내용을 문장별 타임라인 블록으로 만든다', () => {
    useAppStore.setState({ workspaceEntered: true })
    const view = render(<HomePage />)
    const scoped = within(view.container)
    const textbox = scoped.getByRole('textbox', { name: '음성으로 만들 장문 내용' })

    expect(textbox).toHaveAttribute('maxlength', '20000')
    expect(scoped.getByRole('button', { name: '현재 목소리 혜린 선택' })).toBeInTheDocument()
    expect(scoped.getByRole('button', { name: '혜린 목소리 미리듣기' })).toBeInTheDocument()
    expect(scoped.getByText('음성 서버 연결 대기')).toBeInTheDocument()

    fireEvent.change(textbox, {
      target: { value: '첫 번째 문장입니다. 두 번째 문장입니다.' },
    })
    fireEvent.keyDown(textbox, { key: 'Enter', code: 'Enter', ctrlKey: true })

    expect(textbox).toHaveValue('첫 번째 문장입니다. 두 번째 문장입니다.')
    expect(scoped.getByDisplayValue('첫 번째 문장입니다.')).toBeInTheDocument()
    expect(scoped.getByDisplayValue('두 번째 문장입니다.')).toBeInTheDocument()
    expect(scoped.getAllByText('혜린').length).toBeGreaterThanOrEqual(3)
    expect(scoped.getByRole('complementary', { name: '프로젝트 목록' })).toBeInTheDocument()
    expect(scoped.getByRole('complementary', { name: '미니 보이스 라이브러리' })).toBeInTheDocument()
    expect(scoped.getByRole('region', { name: '작업 메시지' })).toBeInTheDocument()
  })

  it('새로고침 뒤 전송 전 장문 내용과 작업공간을 자동 복원한다', async () => {
    window.localStorage.setItem('sorion-active-workspace-session', JSON.stringify({
      id: 'active-workspace',
      schemaVersion: 1,
      revision: 4,
      savedAt: new Date().toISOString(),
      workspaceEntered: true,
      page: 'home',
      voiceId: 'sori-warm',
      composerDraft: '아직 제작하지 않은 모바일 장문 내용',
      directiveIds: ['numbers', 'bright'],
      messages: [{ id: 'welcome', role: 'assistant', text: '장문 제작 준비' }],
      blocks: [],
    }))

    render(<HomePage />)

    await waitFor(() => expect(useAppStore.getState().workspaceEntered).toBe(true))
    expect(screen.getByRole('textbox', { name: '음성으로 만들 장문 내용' }))
      .toHaveValue('아직 제작하지 않은 모바일 장문 내용')
    fireEvent.click(screen.getByRole('button', { name: '음성 설정 열기' }))
    const voiceSettings = screen.getByRole('dialog', { name: '음성 설정' })
    expect(within(voiceSettings).getByRole('button', { name: '밝게' })).toHaveClass('is-active')
  })
  it('엔진 계층 실패를 작업 메시지로 즉시 알린다', async () => {
    useAppStore.setState({
      workspaceEntered: true,
      backendStatus: 'degraded',
      backendMessage: '브라우저 음성으로 전환했습니다.',
      engineHealth: {
        api: 'offline',
        tts: 'ready',
        worker: 'offline',
        gpu: 'offline',
        baseUrl: 'http://127.0.0.1:8000',
        latencyMs: null,
        lastCheckedAt: new Date().toISOString(),
        requestId: null,
      },
    })

    render(<HomePage />)

    await waitFor(() => expect(screen.getAllByText(/API 연결 실패 · Worker 연결 실패 · GPU 미연결/).length).toBeGreaterThan(0))
  })

})
