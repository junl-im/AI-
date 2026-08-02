import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent,
  type SyntheticEvent,
} from 'react'
import { primaryNavigationItems } from '../../navigation/navigationItems'
import { useAppStore } from '../../store/useAppStore'
import { getCurrentTrack, usePlayerStore } from '../../store/usePlayerStore'
import {
  createBrowserSpeechUtterance,
  isBrowserSpeechSupported,
} from '../../tts/browserSpeech'
import { PlayerQueuePanel } from './PlayerQueuePanel'

const rates = [0.75, 1, 1.25, 1.5, 2]

function formatTime(value: number) {
  const safe = Number.isFinite(value) ? Math.max(0, value) : 0
  return `${Math.floor(safe / 60)}:${String(Math.floor(safe % 60)).padStart(2, '0')}`
}

export function LinkedPlayerDock() {
  const page = useAppStore((state) => state.page)
  const enterWorkspace = useAppStore((state) => state.enterWorkspace)
  const queue = usePlayerStore((state) => state.queue)
  const currentTrackId = usePlayerStore((state) => state.currentTrackId)
  const playRequestId = usePlayerStore((state) => state.playRequestId)
  const repeatMode = usePlayerStore((state) => state.repeatMode)
  const playbackRate = usePlayerStore((state) => state.playbackRate)
  const selectAndPlay = usePlayerStore((state) => state.selectAndPlay)
  const remove = usePlayerStore((state) => state.remove)
  const clearQueue = usePlayerStore((state) => state.clearQueue)
  const selectNext = usePlayerStore((state) => state.selectNext)
  const selectPrevious = usePlayerStore((state) => state.selectPrevious)
  const cycleRepeatMode = usePlayerStore((state) => state.cycleRepeatMode)
  const setPlaybackRate = usePlayerStore((state) => state.setPlaybackRate)
  const track = usePlayerStore(getCurrentTrack)
  const ref = useRef<HTMLAudioElement | null>(null)
  const resumeAfterTrackChange = useRef(false)
  const handledPlayRequestRef = useRef(0)
  const playbackRateRef = useRef(playbackRate)
  const speechTimerRef = useRef<number | null>(null)
  const speechStartedAtRef = useRef(0)
  const speechElapsedRef = useRef(0)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [queueOpen, setQueueOpen] = useState(false)
  const browserPlayback = track?.audio.browserSpeech ?? null
  const progress = duration > 0 ? Math.min(100, (current / duration) * 100) : 0
  const bars = useMemo(
    () => [18, 34, 58, 28, 74, 42, 86, 38, 68, 30, 52, 22, 44, 70, 36, 56, 26, 48],
    [],
  )

  function clearSpeechTimer() {
    if (speechTimerRef.current !== null) window.clearInterval(speechTimerRef.current)
    speechTimerRef.current = null
  }

  function startSpeechTimer() {
    clearSpeechTimer()
    speechStartedAtRef.current = performance.now()
    speechTimerRef.current = window.setInterval(() => {
      const elapsed = speechElapsedRef.current + (performance.now() - speechStartedAtRef.current) / 1_000
      setCurrent(Math.min(duration || track?.audio.durationSeconds || 0, elapsed))
    }, 200)
  }

  function pauseSpeechTimer() {
    if (speechTimerRef.current === null) return
    speechElapsedRef.current += (performance.now() - speechStartedAtRef.current) / 1_000
    clearSpeechTimer()
  }

  function cancelBrowserSpeech(resetProgress = true) {
    clearSpeechTimer()
    if (isBrowserSpeechSupported()) window.speechSynthesis.cancel()
    if (resetProgress) {
      speechElapsedRef.current = 0
      setCurrent(0)
    }
    setPlaying(false)
  }

  function handleEnded() {
    const element = ref.current
    if (repeatMode === 'one') {
      if (browserPlayback) {
        speechElapsedRef.current = 0
        startBrowserSpeech()
      } else if (element) {
        element.currentTime = 0
        void element.play()
      }
      return
    }
    resumeAfterTrackChange.current = true
    if (!selectNext()) {
      resumeAfterTrackChange.current = false
      setPlaying(false)
    }
  }

  function startBrowserSpeech() {
    if (!browserPlayback || !isBrowserSpeechSupported()) return
    window.speechSynthesis.cancel()
    const utterance = createBrowserSpeechUtterance({
      ...browserPlayback,
      rate: Math.min(2, Math.max(0.5, browserPlayback.rate * playbackRateRef.current)),
    })
    setDuration(track?.audio.durationSeconds ?? 0)
    utterance.onstart = () => {
      setPlaying(true)
      startSpeechTimer()
    }
    utterance.onend = () => {
      clearSpeechTimer()
      setCurrent(track?.audio.durationSeconds ?? duration)
      speechElapsedRef.current = 0
      setPlaying(false)
      handleEnded()
    }
    utterance.onerror = () => {
      clearSpeechTimer()
      speechElapsedRef.current = 0
      setPlaying(false)
    }
    window.speechSynthesis.speak(utterance)
  }

  useEffect(() => {
    const explicitPlay = playRequestId !== handledPlayRequestRef.current
    handledPlayRequestRef.current = playRequestId
    const shouldResume = resumeAfterTrackChange.current || explicitPlay
    cancelBrowserSpeech()
    setCurrent(0)
    setDuration(browserPlayback ? track?.audio.durationSeconds ?? 0 : 0)
    const element = ref.current
    if (element) {
      element.pause()
      element.load()
      element.playbackRate = playbackRateRef.current
      if (shouldResume && currentTrackId && !browserPlayback) {
        void element.play().catch(() => {
          const resume = () => void element.play().catch(() => undefined)
          element.addEventListener('canplay', resume, { once: true })
        })
      }
    }
    if (shouldResume && currentTrackId && browserPlayback) {
      window.setTimeout(startBrowserSpeech, 0)
    }
    resumeAfterTrackChange.current = false
    // Track identity is the synchronization boundary for native audio and browser speech.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrackId, playRequestId])

  useEffect(() => {
    playbackRateRef.current = playbackRate
    if (ref.current) ref.current.playbackRate = playbackRate
  }, [playbackRate])

  useEffect(() => {
    if (!track) setQueueOpen(false)
  }, [track])

  useEffect(() => () => {
    clearSpeechTimer()
    if (isBrowserSpeechSupported()) window.speechSynthesis.cancel()
  }, [])

  async function toggle() {
    if (!track) return
    if (browserPlayback) {
      if (!isBrowserSpeechSupported()) return
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume()
        setPlaying(true)
        startSpeechTimer()
      } else if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause()
        pauseSpeechTimer()
        setPlaying(false)
      } else {
        startBrowserSpeech()
      }
      return
    }
    const element = ref.current
    if (!element) return
    if (element.paused) await element.play()
    else element.pause()
  }

  function move(direction: 'next' | 'previous') {
    resumeAfterTrackChange.current = playing
    if (browserPlayback) cancelBrowserSpeech(false)
    const selected = direction === 'next' ? selectNext() : selectPrevious()
    if (!selected) resumeAfterTrackChange.current = false
  }

  function seek(event: MouseEvent<HTMLButtonElement>) {
    const element = ref.current
    if (!element || !duration || browserPlayback) return
    const rect = event.currentTarget.getBoundingClientRect()
    element.currentTime = ((event.clientX - rect.left) / rect.width) * duration
  }

  const audio = track?.audio.url ? (
    <audio
      ref={ref}
      src={track.audio.url}
      preload="metadata"
      onLoadedMetadata={(event: SyntheticEvent<HTMLAudioElement>) => {
        setDuration(event.currentTarget.duration)
      }}
      onTimeUpdate={(event: SyntheticEvent<HTMLAudioElement>) => {
        setCurrent(event.currentTarget.currentTime)
      }}
      onPlay={() => setPlaying(true)}
      onPause={() => setPlaying(false)}
      onEnded={handleEnded}
    />
  ) : null

  if (page === 'home') {
    return (
      <aside className="soa-dubbing-player-dock" aria-label="더빙 재생 플레이어">
        <div className="soa-dubbing-player-dock__inner">
          <button
            type="button"
            className="soa-dubbing-player-progress"
            onClick={seek}
            disabled={!track || Boolean(browserPlayback)}
            aria-label={browserPlayback ? '브라우저 음성은 위치 이동을 지원하지 않음' : '재생 위치 이동'}
          >
            <i style={{ width: `${progress}%` }} />
            <b style={{ left: `${progress}%` }} />
          </button>
          <div className="soa-dubbing-player-time">
            <time>{formatTime(current)}</time>
            <span>{track?.title ?? '완성된 음성을 선택하세요'}</span>
            <time>{formatTime(duration)}</time>
          </div>
          <div className="soa-dubbing-player-controls">
            <button type="button" onClick={() => move('previous')} disabled={!track} aria-label="이전 음성">|◀</button>
            <button
              type="button"
              className="is-primary"
              onClick={() => void toggle()}
              disabled={!track}
              aria-label={playing ? '일시정지' : '재생'}
            >
              {playing ? 'Ⅱ' : '▶'}
            </button>
            <button type="button" onClick={() => move('next')} disabled={!track} aria-label="다음 음성">▶|</button>
          </div>
          <div className="soa-dubbing-player-secondary">
            <button
              type="button"
              onClick={cycleRepeatMode}
              className={repeatMode !== 'off' ? 'is-active' : ''}
            >
              {repeatMode === 'one' ? '한 곡 반복' : '반복'}
            </button>
            <button type="button" onClick={() => setQueueOpen((open) => !open)} disabled={!track}>
              대기열 {queue.length}
            </button>
            {track?.audio.url ? <a href={track.audio.url} download={track.audio.filename}>다운로드</a> : null}
            {browserPlayback ? <span className="soa-browser-voice-label">브라우저 재생</span> : null}
          </div>
          {audio}
          {track && queueOpen ? (
            <PlayerQueuePanel
              tracks={queue}
              currentTrackId={currentTrackId}
              onSelect={selectAndPlay}
              onRemove={remove}
              onClear={clearQueue}
            />
          ) : null}
        </div>
      </aside>
    )
  }

  return (
    <aside
      className={`soa-dock ${track ? 'soa-dock--has-player' : 'soa-dock--nav-only'}`}
      aria-label="SoriON 고정 Dock"
    >
      <div className="soa-dock__inner">
        {track ? (
          <section className="soa-linked-player" aria-label="연계형 오디오 플레이어">
            <div className="soa-player-transport">
              <button type="button" onClick={() => move('previous')} aria-label="이전 음성">‹</button>
              <button
                type="button"
                className="soa-player-toggle"
                onClick={() => void toggle()}
                aria-label={playing ? '일시정지' : '재생'}
              >
                {playing ? 'Ⅱ' : '▶'}
              </button>
              <button type="button" onClick={() => move('next')} aria-label="다음 음성">›</button>
            </div>
            <div className="soa-player-main">
              <div className="soa-player-title">
                <strong>{track.title}</strong>
                <span>{track.audio.result.engineId}</span>
              </div>
              <button
                type="button"
                className="soa-player-wave"
                onClick={seek}
                disabled={Boolean(browserPlayback)}
                aria-label={browserPlayback ? '브라우저 음성은 위치 이동을 지원하지 않음' : '재생 위치 이동'}
              >
                <span className="soa-player-progress" style={{ width: `${progress}%` }} />
                {bars.map((height, index) => (
                  <i key={`${height}-${index}`} style={{ height: `${height}%` }} />
                ))}
                <b style={{ left: `${progress}%` }} />
              </button>
            </div>
            <time>{formatTime(current)} / {formatTime(duration)}</time>
            <div className="soa-player-actions">
              <button
                type="button"
                onClick={cycleRepeatMode}
                className={repeatMode !== 'off' ? 'is-active' : ''}
                aria-label={`반복 모드 ${repeatMode}`}
              >
                {repeatMode === 'one' ? '↻1' : '↻'}
              </button>
              <select
                aria-label="재생 속도"
                value={playbackRate}
                onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                  setPlaybackRate(Number(event.target.value))
                }}
              >
                {rates.map((rate) => <option key={rate} value={rate}>{rate}×</option>)}
              </select>
              {track.audio.url ? (
                <a href={track.audio.url} download={track.audio.filename} aria-label="현재 음성 다운로드">↓</a>
              ) : null}
              <button type="button" onClick={() => setQueueOpen((open) => !open)}>대기열 {queue.length}</button>
            </div>
            {audio}
          </section>
        ) : null}

        <nav className="soa-dock__nav" aria-label="주요 메뉴">
          {primaryNavigationItems.map((item) => (
            <button
              key={item.page}
              type="button"
              aria-current={page === item.page ? 'page' : undefined}
              onClick={() => {
                enterWorkspace(item.page)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className={page === item.page ? 'is-active' : ''}
            >
              <span aria-hidden="true">{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>

        {track && queueOpen ? (
          <PlayerQueuePanel
            tracks={queue}
            currentTrackId={currentTrackId}
            onSelect={selectAndPlay}
            onRemove={remove}
            onClear={clearQueue}
          />
        ) : null}
      </div>
    </aside>
  )
}
