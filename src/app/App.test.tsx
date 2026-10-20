import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '../store/useAppStore'
import { usePlayerStore } from '../store/usePlayerStore'
import { App } from './App'

const sessionMocks = vi.hoisted(() => ({ load: vi.fn() }))
vi.mock('../workspace/workspaceSessionRepository', () => ({ loadWorkspaceSession: sessionMocks.load }))

vi.mock('../components/layout/AppShell', () => ({
  AppShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))
vi.mock('../pages/HomePage', async () => {
  const React = await import('react')
  return {
    HomePage: () => {
      const [count, setCount] = React.useState(0)
      return <button type="button" onClick={() => setCount((value) => value + 1)}>초안 {count}</button>
    },
  }
})
vi.mock('../pages/VoiceClonePage', () => ({ VoiceClonePage: () => <p>복제 화면</p> }))
vi.mock('../pages/QualityPage', () => ({ QualityPage: () => <p>품질 화면</p> }))
vi.mock('../pages/ProjectsPage', () => ({ ProjectsPage: () => <p>프로젝트 화면</p> }))
vi.mock('../pages/SettingsPage', () => ({ SettingsPage: () => <p>설정 화면</p> }))

describe('App workspace continuity', () => {
  beforeEach(() => {
    sessionMocks.load.mockReset().mockResolvedValue({ session: null, mode: 'memory' })
    window.localStorage.clear()
    usePlayerStore.getState().clearQueue()
    useAppStore.setState({
      page: 'home',
      workspaceEntered: true,
      activeProject: null,
      workspaceResetToken: 0,
      notice: null,
    })
  })

  it('shows landing until entry is requested when there is no saved session', async () => {
    useAppStore.setState({ workspaceEntered: false })
    render(<App />)
    await waitFor(() => expect(sessionMocks.load).toHaveBeenCalled())
    expect(screen.queryByRole('button', { name: '초안 0' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /장문 음성 스튜디오 시작/ }))
    expect(await screen.findByRole('button', { name: '초안 0' })).toBeInTheDocument()
  })

  it('loads the existing restoration owner when a saved session exists', async () => {
    useAppStore.setState({ workspaceEntered: false })
    sessionMocks.load.mockResolvedValue({ session: { composerDraft: 'saved' }, mode: 'indexeddb' })
    render(<App />)
    expect(await screen.findByRole('button', { name: '초안 0' })).toBeInTheDocument()
  })

  it('keeps landing usable when the session lookup rejects', async () => {
    useAppStore.setState({ workspaceEntered: false })
    sessionMocks.load.mockRejectedValue(new Error('storage unavailable'))
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /장문 음성 스튜디오 시작/ }))
    expect(await screen.findByRole('button', { name: '초안 0' })).toBeInTheDocument()
  })

  it('keeps the creation workspace mounted while visiting another page', async () => {
    render(<App />)

    fireEvent.click(await screen.findByRole('button', { name: '초안 0' }))
    expect(screen.getByRole('button', { name: '초안 1' })).toBeInTheDocument()

    act(() => useAppStore.getState().setPage('clone'))
    expect(await screen.findByText('복제 화면')).toBeInTheDocument()

    act(() => useAppStore.getState().setPage('home'))
    expect(screen.getByRole('button', { name: '초안 1' })).toBeInTheDocument()
  })
})
