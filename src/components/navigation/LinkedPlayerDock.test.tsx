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

  it('음성이 없으면 메뉴 Dock만 표시한다', () => {
    render(<LinkedPlayerDock />)

    expect(screen.getByRole('navigation', { name: '주요 메뉴' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: '연계형 오디오 플레이어' }))
      .not.toBeInTheDocument()
    expect(screen.getByLabelText('SoriON 고정 Dock')).toHaveClass('soa-dock--nav-only')
  })

  it('완성 음성이 생기면 플레이어를 메뉴 위에 표시한다', () => {
    usePlayerStore.getState().enqueue(generatedAudio(), '완성 음성')
    render(<LinkedPlayerDock />)

    const player = screen.getByRole('region', { name: '연계형 오디오 플레이어' })
    const navigation = screen.getByRole('navigation', { name: '주요 메뉴' })
    const relation = player.compareDocumentPosition(navigation)

    expect(screen.getByText('완성 음성')).toBeInTheDocument()
    expect(relation & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByLabelText('SoriON 고정 Dock')).toHaveClass('soa-dock--has-player')
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
