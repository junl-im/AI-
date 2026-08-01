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
      notice: null,
    })
    vi.restoreAllMocks()
  })

  it('초기 화면에서는 장문 스튜디오 시작 동선을 유지한다', () => {
    render(<HomePage />)

    expect(screen.getByRole('heading', { name: /긴 원고도/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /장문 음성 스튜디오 시작/ }))
      .toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: '음성으로 만들 장문 원고' }))
      .not.toBeInTheDocument()
  })

  it('작업공간에서는 장문 원고를 문장별 타임라인 블록으로 만든다', () => {
    useAppStore.setState({ workspaceEntered: true })
    const view = render(<HomePage />)
    const scoped = within(view.container)
    const textbox = scoped.getByRole('textbox', { name: '음성으로 만들 장문 원고' })

    expect(textbox.getAttribute('placeholder')).toContain('긴 원고')
    expect(scoped.getByRole('radio', { name: /혜린/ })).toBeInTheDocument()
    expect(scoped.getByText('음성 서버 연결 대기 중')).toBeInTheDocument()

    fireEvent.change(textbox, {
      target: { value: '첫 번째 문장입니다. 두 번째 문장입니다.' },
    })
    fireEvent.keyDown(textbox, { key: 'Enter', code: 'Enter', ctrlKey: true })

    expect(textbox).toHaveValue('첫 번째 문장입니다. 두 번째 문장입니다.')
    expect(scoped.getByText('첫 번째 문장입니다.')).toBeInTheDocument()
    expect(scoped.getByText('두 번째 문장입니다.')).toBeInTheDocument()
    expect(scoped.getAllByText(/음성 · 혜린/)).toHaveLength(2)
  })

  it('새로고침 뒤 전송 전 장문 원고와 작업공간을 자동 복원한다', async () => {
    window.localStorage.setItem('sorion-active-workspace-session', JSON.stringify({
      id: 'active-workspace',
      schemaVersion: 1,
      revision: 4,
      savedAt: new Date().toISOString(),
      workspaceEntered: true,
      page: 'home',
      voiceId: 'sori-warm',
      composerDraft: '아직 제작하지 않은 모바일 장문 원고',
      directiveIds: ['numbers', 'bright'],
      messages: [{ id: 'welcome', role: 'assistant', text: '장문 제작 준비' }],
      blocks: [],
    }))

    render(<HomePage />)

    await waitFor(() => expect(useAppStore.getState().workspaceEntered).toBe(true))
    expect(screen.getByRole('textbox', { name: '음성으로 만들 장문 원고' }))
      .toHaveValue('아직 제작하지 않은 모바일 장문 원고')
    expect(screen.getByRole('button', { name: '밝은 톤' })).toHaveAttribute('aria-pressed', 'true')
  })
})
