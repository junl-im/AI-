import { act, render } from '@testing-library/react'
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
    vi.restoreAllMocks()
    usePlayerStore.getState().clearQueue()
    useAppStore.setState({ page: 'home', notice: null })
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined)
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined)
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
  })

  afterEach(() => {
    usePlayerStore.getState().clearQueue()
    vi.restoreAllMocks()
  })

  it('플레이어 유무에 따라 작업 화면의 하단 안전 여백을 바꾼다', () => {
    const view = render(<AppShell><p>작업 화면</p></AppShell>)
    const workspace = view.container.querySelector('.soa-workspace-shell')

    expect(workspace).not.toHaveClass('soa-workspace-shell--has-player')

    act(() => {
      usePlayerStore.getState().enqueue(generatedAudio(), '완성 음성')
    })

    expect(workspace).toHaveClass('soa-workspace-shell--has-player')
  })
})
