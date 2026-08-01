import { act, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '../store/useAppStore'
import { App } from './App'

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
    useAppStore.setState({
      page: 'home',
      workspaceEntered: true,
      activeProject: null,
      notice: null,
    })
  })

  it('keeps the creation workspace mounted while visiting another page', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: '초안 0' }))
    expect(screen.getByRole('button', { name: '초안 1' })).toBeInTheDocument()

    act(() => useAppStore.getState().setPage('clone'))
    expect(screen.getByText('복제 화면')).toBeInTheDocument()

    act(() => useAppStore.getState().setPage('home'))
    expect(screen.getByRole('button', { name: '초안 1' })).toBeInTheDocument()
  })
})
