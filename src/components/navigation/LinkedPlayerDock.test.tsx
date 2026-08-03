import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { GeneratedAudio } from '../../tts/generationTypes'
import { useAppStore } from '../../store/useAppStore'
import { usePlayerStore } from '../../store/usePlayerStore'
import { refreshSpeechFinalAudio } from '../../tts/voiceApi'
import { LinkedPlayerDock } from './LinkedPlayerDock'

vi.mock('../../tts/voiceApi', () => ({
  refreshSpeechFinalAudio: vi.fn(),
}))

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
    telemetry: { requestStartedAtMs: 1_000 },
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
    vi.mocked(refreshSpeechFinalAudio).mockReset()
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

  it('재생 요청이 포함된 트랙은 선택 즉시 재생한다', async () => {
    const play = vi.mocked(HTMLMediaElement.prototype.play)
    render(<LinkedPlayerDock />)

    usePlayerStore.getState().enqueueAndPlay(generatedAudio(), '자동 재생 음성')

    await vi.waitFor(() => expect(play).toHaveBeenCalled())
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


  it('브라우저 음성의 실제 시작 지연을 재생 이벤트에서 기록한다', () => {
    const synthesis = installSpeechSynthesis()
    vi.spyOn(Date, 'now').mockReturnValue(1_780)
    const id = usePlayerStore.getState().enqueue(browserSpeechAudio(), '브라우저 지연 측정')
    render(<LinkedPlayerDock />)

    fireEvent.click(screen.getByRole('button', { name: '재생' }))

    expect(synthesis.speak).toHaveBeenCalledTimes(1)
    expect(usePlayerStore.getState().queue.find((item) => item.id === id)?.audio.telemetry)
      .toMatchObject({ browserSpeechStartMs: 780 })
  })

  it('파일 음원의 첫 데이터와 실제 재생 지연을 서로 분리해 기록한다', () => {
    const timedAudio = generatedAudio()
    timedAudio.telemetry = { requestStartedAtMs: 1_000 }
    const id = usePlayerStore.getState().enqueue(timedAudio, '파일 지연 측정')
    const now = vi.spyOn(Date, 'now').mockReturnValue(1_420)
    const { container } = render(<LinkedPlayerDock />)
    const element = container.querySelector('audio')
    if (!element) throw new Error('audio element missing')

    fireEvent.loadedData(element)
    now.mockReturnValue(1_680)
    fireEvent.playing(element)

    expect(usePlayerStore.getState().queue.find((item) => item.id === id)?.audio.telemetry)
      .toMatchObject({ firstByteMs: 420, playingMs: 680 })
  })


  it('첫 구간이 최종 WAV로 교체되어도 재생 위치와 재생 상태를 이어간다', async () => {
    const partial = generatedAudio()
    partial.url = 'blob:partial-track'
    partial.partial = { index: 1, totalSegments: 3, readyAfterMs: 450 }
    partial.progressive = {
      jobId: 'partial-job',
      totalSegments: 3,
      segments: [{
        index: 1,
        totalSegments: 3,
        url: 'blob:partial-track',
        filename: 'segment-1.wav',
        durationSeconds: 3,
        readyAfterMs: 450,
      }],
    }
    const trackId = usePlayerStore.getState().enqueue(partial, '첫 구간')
    const play = vi.mocked(HTMLMediaElement.prototype.play)
    const { container } = render(<LinkedPlayerDock />)
    const element = container.querySelector('audio')
    if (!element) throw new Error('audio element missing')

    element.currentTime = 1.25
    fireEvent.timeUpdate(element)
    fireEvent.play(element)
    play.mockClear()

    const finalAudio = generatedAudio()
    const finalUrl = 'https://voice.example/final.wav'
    finalAudio.url = finalUrl
    finalAudio.revokeOnRemove = false
    act(() => {
      usePlayerStore.getState().replace(trackId, finalAudio, '최종 음원')
    })

    await vi.waitFor(() => expect(element).toHaveAttribute('src', finalUrl))
    Object.defineProperty(element, 'duration', { configurable: true, value: 6 })
    fireEvent.loadedMetadata(element)

    await vi.waitFor(() => expect(element.currentTime).toBeCloseTo(1.25, 2))
    await vi.waitFor(() => expect(play).toHaveBeenCalled())
    expect(screen.getByText('최종 음원')).toBeInTheDocument()
  })

  it('현재 구간 종료 뒤 다음 구간이 늦으면 대기하고 도착 즉시 순서대로 재생한다', async () => {
    const partial = generatedAudio()
    partial.url = 'blob:sequence-1'
    partial.durationSeconds = 1
    partial.partial = { index: 1, totalSegments: 3, readyAfterMs: 300 }
    partial.progressive = {
      jobId: 'sequence-job',
      totalSegments: 3,
      segments: [{
        index: 1,
        totalSegments: 3,
        url: 'blob:sequence-1',
        filename: 'segment-1.wav',
        durationSeconds: 1,
        readyAfterMs: 300,
      }],
    }
    const trackId = usePlayerStore.getState().enqueueAndPlay(partial, '순차 구간')
    const play = vi.mocked(HTMLMediaElement.prototype.play)
    const { container } = render(<LinkedPlayerDock />)
    const element = container.querySelector('audio')
    if (!element) throw new Error('audio element missing')
    Object.defineProperty(element, 'duration', { configurable: true, value: 1 })

    fireEvent.play(element)
    let clock = 1_000
    const now = vi.spyOn(performance, 'now').mockImplementation(() => clock)
    fireEvent.ended(element)

    expect(screen.getByText(/다음 구간 대기/)).toBeInTheDocument()
    play.mockClear()
    act(() => {
      usePlayerStore.getState().appendProgressiveSegment(trackId, {
        index: 2,
        totalSegments: 3,
        url: 'blob:sequence-2',
        filename: 'segment-2.wav',
        durationSeconds: 1.2,
        readyAfterMs: 600,
      })
    })

    await vi.waitFor(() => expect(element.getAttribute('src')).toBe('blob:sequence-2'))
    await vi.waitFor(() => expect(play).toHaveBeenCalled())
    clock = 1_140
    fireEvent.playing(element)
    expect(screen.getByText(/3개 중 2번째 구간/)).toBeInTheDocument()
    expect(screen.getByText(/전환 140ms \(대기 포함\)/)).toBeInTheDocument()
    expect(now).toHaveBeenCalled()
    expect(usePlayerStore.getState().queue[0].audio.telemetry?.seams).toMatchObject([{
      fromSegment: 1,
      toSegment: 2,
      gapMs: 140,
      waitedForSegment: true,
    }])
  })

  it('만료된 최종 음원 URL을 갱신해 같은 트랙과 재생 위치를 유지한다', async () => {
    const expired = generatedAudio()
    expired.url = 'https://voice.example/expired.wav?signature=old'
    expired.source = 'api'
    expired.revokeOnRemove = false
    expired.rehydration = { kind: 'tts-final', jobId: 'rehydrate-job' }
    expired.result = {
      ...expired.result,
      jobId: 'rehydrate-job',
      engineMode: 'local',
      audioUrl: expired.url,
    }
    vi.mocked(refreshSpeechFinalAudio).mockResolvedValue({
      ...expired.result,
      audioUrl: 'https://voice.example/fresh.wav?signature=new',
    })
    const trackId = usePlayerStore.getState().enqueue(expired, '만료 음원')
    usePlayerStore.getState().updateResumePosition(trackId, 2.2)
    const { container } = render(<LinkedPlayerDock />)
    const element = container.querySelector('audio')
    if (!element) throw new Error('audio element missing')
    element.currentTime = 2.2

    fireEvent.error(element)

    await vi.waitFor(() => expect(refreshSpeechFinalAudio).toHaveBeenCalledWith('rehydrate-job'))
    await vi.waitFor(() => expect(usePlayerStore.getState().queue[0].audio.url).toContain('signature=new'))
    Object.defineProperty(element, 'duration', { configurable: true, value: 10 })
    fireEvent.loadedMetadata(element)

    await vi.waitFor(() => expect(element.currentTime).toBeCloseTo(2.2, 2))
    expect(usePlayerStore.getState().currentTrackId).toBe(trackId)
    expect(usePlayerStore.getState().queue[0].resumePositionSeconds).toBe(2.2)
  })

  it('새로고침 복원 음원은 자동 재생하지 않고 저장된 위치만 복원한다', async () => {
    const restored = generatedAudio()
    restored.url = 'https://voice.example/final.wav'
    restored.source = 'api'
    restored.revokeOnRemove = false
    const trackId = usePlayerStore.getState().enqueue(restored, '복원 음원')
    usePlayerStore.getState().updateResumePosition(trackId, 2.4)
    const play = vi.mocked(HTMLMediaElement.prototype.play)
    play.mockClear()
    const { container } = render(<LinkedPlayerDock />)
    const element = container.querySelector('audio')
    if (!element) throw new Error('audio element missing')

    Object.defineProperty(element, 'duration', { configurable: true, value: 10 })
    fireEvent.loadedMetadata(element)

    await vi.waitFor(() => expect(element.currentTime).toBeCloseTo(2.4, 2))
    expect(play).not.toHaveBeenCalled()
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
