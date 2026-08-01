import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { GeneratedAudio } from '../../tts/generationTypes'
import { useAppStore } from '../../store/useAppStore'
import { usePlayerStore } from '../../store/usePlayerStore'
import { AppShell } from './AppShell'

function generatedAudio(): GeneratedAudio {
  return {
    url: 'blob:app-shell-test',
    filename: 'app-shell-test.wav',
    source: 'browser-demo',
    durationSeconds: 3,
    revokeOnRemove: true,
    result: {
      jobId: 'app-shell-test',
      status: 'completed',
      engineId: 'test-engine',
      engineMode: 'mock',
      audioUrl: null,
      estimatedDurationSeconds: 3,
      message: 'ready',
      normalizedText: null,
      segmentCount: 1,
      processingMs: null,
      fileSizeBytes: 32,
      realtimeFactor: null,
    },
  }
}

describe('AppShell', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
    usePlayerStore.getState().clearQueue()
    useAppStore.setState({
      page: 'home',
      workspaceEntered: false,
      activeProject: null,
      workspaceResetToken: 0,
      backendStatus: 'unknown',
      backendMessage: '상태 미확인',
      notice: null,
    })
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined)
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined)
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
  })

  afterEach(() => {
    usePlayerStore.getState().clearQueue()
    vi.restoreAllMocks()
  })

  it('초기 화면과 작업공간의 상단 구조를 분리한다', () => {
    const view = render(<AppShell><p>작업 화면</p></AppShell>)

    expect(view.container.querySelector('.soa-workspace-shell--landing')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '곰같은여우 SoriON AI' })).toBeInTheDocument()
    expect(screen.queryByRole('complementary', { name: 'SoriON 고정 Dock' })).not.toBeInTheDocument()

    act(() => useAppStore.getState().enterWorkspace('home'))

    expect(view.container.querySelector('.soa-workspace-shell--editor')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /SoriON AI/ })).toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: 'SoriON 고정 Dock' })).toBeInTheDocument()
  })


  it('상단 아이콘과 이름을 누르면 어느 작업 화면에서도 첫 페이지로 돌아간다', () => {
    render(<AppShell><p>작업 화면</p></AppShell>)
    act(() => useAppStore.getState().enterWorkspace('quality'))

    fireEvent.click(screen.getByRole('button', { name: 'SoriON AI 첫 페이지로 이동' }))

    expect(useAppStore.getState().workspaceEntered).toBe(false)
    expect(useAppStore.getState().page).toBe('home')
    expect(screen.queryByRole('complementary', { name: 'SoriON 고정 Dock' })).not.toBeInTheDocument()
  })

  it('설정 화면을 상단에서 항상 찾을 수 있다', () => {
    render(<AppShell><p>작업 화면</p></AppShell>)
    act(() => useAppStore.getState().enterWorkspace('home'))

    const settings = screen.getByRole('button', { name: '설정' })
    fireEvent.click(settings)

    expect(useAppStore.getState().page).toBe('settings')
    expect(settings).toHaveAttribute('aria-current', 'page')
  })

  it('플레이어 유무에 따라 작업 화면의 하단 안전 여백을 바꾼다', () => {
    const view = render(<AppShell><p>작업 화면</p></AppShell>)
    const workspace = view.container.querySelector('.soa-workspace-shell')

    expect(workspace).not.toHaveClass('soa-workspace-shell--has-player')

    act(() => {
      usePlayerStore.getState().enqueue(generatedAudio(), '완성 음성')
    })

    expect(workspace).not.toHaveClass('soa-workspace-shell--has-player')

    act(() => useAppStore.getState().enterWorkspace('home'))

    expect(workspace).toHaveClass('soa-workspace-shell--has-player')
  })
})
