import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { GeneratedAudio } from '../../tts/generationTypes'
import { useAppStore } from '../../store/useAppStore'
import { usePlayerStore } from '../../store/usePlayerStore'
import { LinkedPlayerDock } from './LinkedPlayerDock'

function generatedAudio(): GeneratedAudio {
  return {
    url: 'blob:dock-test',
    filename: 'dock-test.wav',
    source: 'browser-demo',
    durationSeconds: 3,
    revokeOnRemove: true,
    result: {
      jobId: 'dock-test',
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

describe('LinkedPlayerDock', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    usePlayerStore.getState().clearQueue()
    useAppStore.setState({ page: 'home', workspaceEntered: false })
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined)
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined)
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
  })


  afterEach(() => {
    usePlayerStore.getState().clearQueue()
    vi.restoreAllMocks()
  })

  it('만들기 화면에서는 음성이 없어도 고정 재생바를 표시한다', () => {
    render(<LinkedPlayerDock />)

    expect(screen.getByRole('complementary', { name: '더빙 재생 플레이어' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '재생' })).toBeDisabled()
    expect(screen.queryByRole('navigation', { name: '주요 메뉴' })).not.toBeInTheDocument()
  })

  it('완성 음성이 생기면 만들기 재생바에서 바로 재생할 수 있다', () => {
    usePlayerStore.getState().enqueue(generatedAudio(), '완성 음성')
    render(<LinkedPlayerDock />)

    expect(screen.getByText('완성 음성')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '재생' })).toBeEnabled()
    expect(screen.getByRole('link', { name: '다운로드' })).toBeInTheDocument()
  })

  it('Dock 메뉴를 누르면 페이지와 관계없이 화면 상단으로 이동한다', () => {
    useAppStore.setState({ page: 'quality', workspaceEntered: true })
    render(<LinkedPlayerDock />)

    fireEvent.click(screen.getByRole('button', { name: /만들기/ }))

    expect(useAppStore.getState().page).toBe('home')
    expect(useAppStore.getState().workspaceEntered).toBe(true)
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
  })

})
