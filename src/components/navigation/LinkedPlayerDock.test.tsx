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

function browserSpeechAudio(): GeneratedAudio {
  return {
    url: null,
    filename: 'browser-speech.wav',
    source: 'browser-speech',
    durationSeconds: 4,
    browserSpeech: {
      text: '브라우저 음성 재생 테스트',
      lang: 'ko-KR',
      rate: 1,
      pitch: 1,
      voiceId: 'sori-warm',
    },
    result: {
      jobId: 'browser-speech-test',
      status: 'completed',
      engineId: 'browser-speech',
      engineMode: 'browser',
      audioUrl: null,
      estimatedDurationSeconds: 4,
      message: '브라우저 음성 준비',
      normalizedText: '브라우저 음성 재생 테스트',
      segmentCount: 1,
      processingMs: 0,
      fileSizeBytes: null,
      realtimeFactor: 0,
    },
  }
}

class TestUtterance {
  text: string
  lang = ''
  rate = 1
  pitch = 1
  voice: SpeechSynthesisVoice | null = null
  onstart: (() => void) | null = null
  onend: (() => void) | null = null
  onerror: (() => void) | null = null

  constructor(text: string) {
    this.text = text
  }
}

const originalUtterance = Object.getOwnPropertyDescriptor(globalThis, 'SpeechSynthesisUtterance')
const originalSynthesis = Object.getOwnPropertyDescriptor(window, 'speechSynthesis')

function installSpeechSynthesis() {
  const speak = vi.fn((utterance: TestUtterance) => utterance.onstart?.())
  const synthesis = {
    speaking: false,
    paused: false,
    speak,
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    getVoices: () => [{ name: 'Korean', lang: 'ko-KR', voiceURI: 'ko' }] as SpeechSynthesisVoice[],
  }
  Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', {
    configurable: true,
    value: TestUtterance,
  })
  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: synthesis,
  })
  return synthesis
}

function restoreProperty(target: object, name: string, descriptor?: PropertyDescriptor) {
  if (descriptor) Object.defineProperty(target, name, descriptor)
  else Reflect.deleteProperty(target, name)
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
    restoreProperty(globalThis, 'SpeechSynthesisUtterance', originalUtterance)
    restoreProperty(window, 'speechSynthesis', originalSynthesis)
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

  it('Voice API가 없어도 브라우저 한국어 음성을 재생한다', () => {
    const synthesis = installSpeechSynthesis()
    usePlayerStore.getState().enqueue(browserSpeechAudio(), '브라우저 완성 음성')
    render(<LinkedPlayerDock />)

    expect(screen.getByText('브라우저 재생')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '다운로드' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '브라우저 음성은 위치 이동을 지원하지 않음' }))
      .toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: '재생' }))

    expect(synthesis.speak).toHaveBeenCalledTimes(1)
    expect(synthesis.speak.mock.calls[0][0].text).toBe('브라우저 음성 재생 테스트')
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
