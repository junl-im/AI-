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
import { refreshSpeechFinalAudio } from '../../tts/voiceApi'
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
  const replaceTrack = usePlayerStore((state) => state.replace)
  const remove = usePlayerStore((state) => state.remove)
  const clearQueue = usePlayerStore((state) => state.clearQueue)
  const selectNext = usePlayerStore((state) => state.selectNext)
  const selectPrevious = usePlayerStore((state) => state.selectPrevious)
  const cycleRepeatMode = usePlayerStore((state) => state.cycleRepeatMode)
  const setPlaybackRate = usePlayerStore((state) => state.setPlaybackRate)
  const updateTelemetry = usePlayerStore((state) => state.updateTelemetry)
  const recordSeamMetric = usePlayerStore((state) => state.recordSeamMetric)
  const updateResumePosition = usePlayerStore((state) => state.updateResumePosition)
  const track = usePlayerStore(getCurrentTrack)
  const ref = useRef<HTMLAudioElement | null>(null)
  const resumeAfterTrackChange = useRef(false)
  const previousTrackIdRef = useRef<string | null>(null)
  const previousPlaybackUrlRef = useRef<string | null>(null)
  const previousWasProgressiveRef = useRef(false)
  const progressiveOffsetRef = useRef(0)
  const currentTimeRef = useRef(0)
  const playingRef = useRef(false)
  const waitingForSegmentRef = useRef(false)
  const segmentEndedAtRef = useRef<number | null>(null)
  const segmentEndedIndexRef = useRef<number | null>(null)
  const segmentWaitedRef = useRef(false)
  const lastSeamKeyRef = useRef<string | null>(null)
  const lastSavedPositionRef = useRef(0)
  const handledPlayRequestRef = useRef(playRequestId)
  const rehydrationAttemptRef = useRef<string | null>(null)
  const playbackRateRef = useRef(playbackRate)
  const speechTimerRef = useRef<number | null>(null)
  const speechStartedAtRef = useRef(0)
  const speechElapsedRef = useRef(0)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [queueOpen, setQueueOpen] = useState(false)
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(null)
  const [waitingForSegment, setWaitingForSegment] = useState(false)
  const [playbackError, setPlaybackError] = useState<string | null>(null)
  const browserPlayback = track?.audio.browserSpeech ?? null
  const progressiveSequence = track?.audio.progressive ?? null
  const progressiveSegments = useMemo(
    () => progressiveSequence?.segments ?? [],
    [progressiveSequence],
  )
  const activeSegment = progressiveSegments.find((segment) => segment.index === activeSegmentIndex)
    ?? progressiveSegments[0]
    ?? null
  const progressiveActive = Boolean(track?.audio.partial && progressiveSequence && activeSegment)
  const playbackUrl = progressiveActive ? activeSegment?.url ?? null : track?.audio.url ?? null
  const progress = duration > 0 ? Math.min(100, (current / duration) * 100) : 0
  currentTimeRef.current = current
  playingRef.current = playing
  waitingForSegmentRef.current = waitingForSegment
  const bars = useMemo(
    () => [18, 34, 58, 28, 74, 42, 86, 38, 68, 30, 52, 22, 44, 70, 36, 56, 26, 48],
    [],
  )


  function recordPlaybackMetric(
    field: 'firstByteMs' | 'playingMs' | 'browserSpeechStartMs',
  ) {
    if (!track || !currentTrackId || !track.audio.telemetry) return
    if (track.audio.telemetry[field] != null) return
    updateTelemetry(currentTrackId, {
      [field]: Math.max(0, Date.now() - track.audio.telemetry.requestStartedAtMs),
    })
  }

  function recordProgressiveSeam() {
    if (!track || !currentTrackId || !progressiveActive || !activeSegment) return
    const endedAt = segmentEndedAtRef.current
    const fromSegment = segmentEndedIndexRef.current
    if (endedAt === null || fromSegment === null || activeSegment.index <= fromSegment) return
    const key = `${currentTrackId}:${fromSegment}:${activeSegment.index}`
    if (lastSeamKeyRef.current === key) return
    lastSeamKeyRef.current = key
    recordSeamMetric(currentTrackId, {
      fromSegment,
      toSegment: activeSegment.index,
      gapMs: Math.max(0, Math.round(performance.now() - endedAt)),
      waitedForSegment: segmentWaitedRef.current,
      recordedAt: new Date().toISOString(),
    })
    segmentEndedAtRef.current = null
    segmentEndedIndexRef.current = null
    segmentWaitedRef.current = false
  }

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
    if (progressiveActive && activeSegment) {
      const playedDuration = Number.isFinite(element?.duration) && (element?.duration ?? 0) > 0
        ? element?.duration ?? activeSegment.durationSeconds
        : activeSegment.durationSeconds
      const nextSegment = progressiveSegments.find((segment) => segment.index === activeSegment.index + 1)
      progressiveOffsetRef.current += playedDuration
      segmentEndedAtRef.current = performance.now()
      segmentEndedIndexRef.current = activeSegment.index
      segmentWaitedRef.current = !nextSegment
      setCurrent(progressiveOffsetRef.current)
      resumeAfterTrackChange.current = true
      if (nextSegment) {
        setWaitingForSegment(false)
        setActiveSegmentIndex(nextSegment.index)
      } else {
        setWaitingForSegment(true)
        setPlaying(false)
      }
      return
    }
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
      recordPlaybackMetric('browserSpeechStartMs')
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
    const trackChanged = previousTrackIdRef.current !== currentTrackId
    const sourceChangedInSameTrack = (
      !trackChanged
      && previousPlaybackUrlRef.current !== playbackUrl
    )
    const finalReplacedProgressive = (
      sourceChangedInSameTrack
      && previousWasProgressiveRef.current
      && !progressiveActive
    )
    const progressiveSegmentAdvanced = (
      sourceChangedInSameTrack
      && previousWasProgressiveRef.current
      && progressiveActive
    )
    const element = ref.current
    const nativePosition = element && Number.isFinite(element.currentTime)
      ? element.currentTime
      : 0
    const restoredPosition = trackChanged && !progressiveActive && !browserPlayback
      ? track?.resumePositionSeconds ?? 0
      : 0
    const renewedFinalAudio = (
      sourceChangedInSameTrack
      && !previousWasProgressiveRef.current
      && !progressiveActive
      && track?.audio.rehydration?.kind === 'tts-final'
    )
    const renewedFinalPosition = renewedFinalAudio
      ? Math.max(nativePosition, track?.resumePositionSeconds ?? 0)
      : 0
    const progressiveNativePosition = Math.max(
      nativePosition,
      Math.max(0, currentTimeRef.current - progressiveOffsetRef.current),
    )
    const handoffPosition = finalReplacedProgressive
      ? waitingForSegmentRef.current
        ? progressiveOffsetRef.current
        : progressiveOffsetRef.current + progressiveNativePosition
      : progressiveSegmentAdvanced
        ? progressiveOffsetRef.current
        : renewedFinalAudio
          ? renewedFinalPosition
          : restoredPosition
    const wasPlaying = sourceChangedInSameTrack && (
      playingRef.current || Boolean(element && !element.paused)
    )
    const shouldResume = resumeAfterTrackChange.current || explicitPlay || wasPlaying

    if (trackChanged) {
      progressiveOffsetRef.current = 0
      segmentEndedAtRef.current = null
      segmentEndedIndexRef.current = null
      segmentWaitedRef.current = false
      lastSeamKeyRef.current = null
      lastSavedPositionRef.current = restoredPosition
      setActiveSegmentIndex(progressiveSegments[0]?.index ?? null)
      setWaitingForSegment(false)
    } else if (finalReplacedProgressive) {
      setWaitingForSegment(false)
    }
    cancelBrowserSpeech(false)
    setPlaybackError(null)
    setCurrent(handoffPosition)
    setDuration(progressiveActive
      ? progressiveSegments.reduce((total, segment) => total + segment.durationSeconds, 0)
      : browserPlayback
        ? track?.audio.durationSeconds ?? 0
        : 0)
    if (element) {
      element.pause()
      element.load()
      element.playbackRate = playbackRateRef.current
      const shouldRestoreNativePosition = !progressiveActive && !browserPlayback && handoffPosition > 0
      const resumeNativeAudio = () => {
        if (shouldRestoreNativePosition && Number.isFinite(element.duration)) {
          const targetPosition = Math.min(handoffPosition, Math.max(0, element.duration - 0.05))
          element.currentTime = targetPosition
          if (finalReplacedProgressive && currentTrackId) {
            window.requestAnimationFrame(() => {
              updateTelemetry(currentTrackId, {
                finalHandoffErrorMs: Math.max(0, Math.round(Math.abs(element.currentTime - targetPosition) * 1_000)),
              })
            })
          }
        }
        if (shouldResume && currentTrackId && !browserPlayback && playbackUrl) {
          void element.play().catch(() => {
            const resume = () => void element.play().catch(() => undefined)
            element.addEventListener('canplay', resume, { once: true })
          })
        }
      }
      if (shouldRestoreNativePosition && element.readyState < 1) {
        element.addEventListener('loadedmetadata', resumeNativeAudio, { once: true })
      } else {
        resumeNativeAudio()
      }
    }
    if (shouldResume && currentTrackId && browserPlayback) {
      window.setTimeout(startBrowserSpeech, 0)
    }
    previousTrackIdRef.current = currentTrackId
    previousPlaybackUrlRef.current = playbackUrl
    previousWasProgressiveRef.current = progressiveActive
    resumeAfterTrackChange.current = false
    // Track id and actual playback URL are synchronization boundaries.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrackId, playRequestId, playbackUrl, progressiveActive])

  useEffect(() => {
    if (!progressiveActive) return
    setDuration(progressiveSegments.reduce((total, segment) => total + segment.durationSeconds, 0))
    if (!waitingForSegment || !activeSegment) return
    const nextSegment = progressiveSegments.find((segment) => segment.index === activeSegment.index + 1)
    if (!nextSegment) return
    resumeAfterTrackChange.current = true
    setWaitingForSegment(false)
    setActiveSegmentIndex(nextSegment.index)
  }, [activeSegment, progressiveActive, progressiveSegments, waitingForSegment])

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

  async function recoverFinalAudio() {
    if (!track || !currentTrackId || track.audio.rehydration?.kind !== 'tts-final') {
      setPlaybackError('음원 주소를 다시 발급할 수 없습니다. 음성을 다시 생성해 주세요.')
      return
    }
    const attemptKey = `${currentTrackId}:${track.audio.url ?? ''}`
    if (rehydrationAttemptRef.current === attemptKey) return
    rehydrationAttemptRef.current = attemptKey
    const shouldResume = playingRef.current || Boolean(ref.current && !ref.current.paused)
    resumeAfterTrackChange.current = shouldResume
    setPlaybackError('만료된 음원 주소를 다시 발급하고 있습니다.')
    try {
      const result = await refreshSpeechFinalAudio(track.audio.rehydration.jobId)
      if (!result.audioUrl) throw new Error('새 음원 주소가 없습니다.')
      replaceTrack(currentTrackId, {
        ...track.audio,
        url: result.audioUrl,
        result: { ...track.audio.result, ...result },
        rehydration: {
          kind: 'tts-final',
          jobId: track.audio.rehydration.jobId,
          renewedAt: new Date().toISOString(),
        },
      }, undefined, shouldResume)
      setPlaybackError(null)
    } catch {
      resumeAfterTrackChange.current = false
      setPlaybackError('최종 음원 보관 시간이 끝났습니다. 음성을 다시 생성해 주세요.')
    }
  }

  async function toggle() {
    if (!track || waitingForSegment) return
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
    else {
      if (!progressiveActive && currentTrackId) {
        lastSavedPositionRef.current = element.currentTime
        updateResumePosition(currentTrackId, element.currentTime)
      }
      element.pause()
    }
  }

  function move(direction: 'next' | 'previous') {
    resumeAfterTrackChange.current = playing
    if (browserPlayback) cancelBrowserSpeech(false)
    const selected = direction === 'next' ? selectNext() : selectPrevious()
    if (!selected) resumeAfterTrackChange.current = false
  }

  function seek(event: MouseEvent<HTMLButtonElement>) {
    const element = ref.current
    if (!element || !duration || browserPlayback || progressiveActive) return
    const rect = event.currentTarget.getBoundingClientRect()
    element.currentTime = ((event.clientX - rect.left) / rect.width) * duration
  }

  const telemetry = track?.audio.telemetry
  const latencyMetrics = telemetry
    ? [
        telemetry.serverSegmentReadyMs != null
          ? `서버 첫 구간 ${telemetry.serverSegmentReadyMs}ms`
          : null,
        telemetry.firstByteMs != null ? `첫 바이트 ${telemetry.firstByteMs}ms` : null,
        telemetry.playingMs != null ? `실제 재생 ${telemetry.playingMs}ms` : null,
        telemetry.browserSpeechStartMs != null
          ? `브라우저 시작 ${telemetry.browserSpeechStartMs}ms`
          : null,
        telemetry.finalHandoffErrorMs != null
          ? `최종 교체 오차 ${telemetry.finalHandoffErrorMs}ms`
          : null,
      ].filter((value): value is string => Boolean(value))
    : []
  const seamMetrics = telemetry?.seams ?? []
  const latestSeam = seamMetrics.at(-1)
  const playbackDetail = progressiveActive && activeSegment
    ? `${activeSegment.totalSegments}개 중 ${activeSegment.index}번째 구간${waitingForSegment ? ' · 다음 구간 대기' : ''}${latestSeam ? ` · 전환 ${latestSeam.gapMs}ms${latestSeam.waitedForSegment ? ' (대기 포함)' : ''}` : ''}`
    : playbackError ?? latencyMetrics.join(' · ')
  const seekBlockedLabel = browserPlayback
    ? '브라우저 음성은 위치 이동을 지원하지 않음'
    : progressiveActive
      ? '부분 구간 연속 재생 중에는 위치 이동을 지원하지 않음'
      : '재생 위치 이동'

  const audio = playbackUrl ? (
    <audio
      ref={ref}
      src={playbackUrl}
      preload="auto"
      onLoadedMetadata={(event: SyntheticEvent<HTMLAudioElement>) => {
        setDuration(progressiveActive
          ? progressiveSegments.reduce((total, segment) => total + segment.durationSeconds, 0)
          : event.currentTarget.duration)
      }}
      onLoadedData={() => {
        setPlaybackError(null)
        rehydrationAttemptRef.current = null
        recordPlaybackMetric('firstByteMs')
      }}
      onTimeUpdate={(event: SyntheticEvent<HTMLAudioElement>) => {
        const nextCurrent = progressiveActive
          ? progressiveOffsetRef.current + event.currentTarget.currentTime
          : event.currentTarget.currentTime
        currentTimeRef.current = nextCurrent
        setCurrent(nextCurrent)
        if (!progressiveActive && currentTrackId && Math.abs(nextCurrent - lastSavedPositionRef.current) >= 0.75) {
          lastSavedPositionRef.current = nextCurrent
          updateResumePosition(currentTrackId, nextCurrent)
        }
      }}
      onPlay={() => {
        playingRef.current = true
        setPlaying(true)
      }}
      onPlaying={() => {
        recordPlaybackMetric('playingMs')
        recordProgressiveSeam()
        playingRef.current = true
        setPlaying(true)
      }}
      onPause={() => {
        playingRef.current = false
        setPlaying(false)
      }}
      onEnded={handleEnded}
      onError={() => { void recoverFinalAudio() }}
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
            disabled={!track || Boolean(browserPlayback) || progressiveActive}
            aria-label={seekBlockedLabel}
          >
            <i style={{ width: `${progress}%` }} />
            <b style={{ left: `${progress}%` }} />
          </button>
          <div className="soa-dubbing-player-time">
            <time>{formatTime(current)}</time>
            <span>
              {track?.title ?? '완성된 음성을 선택하세요'}
              {playbackDetail ? <small>{playbackDetail}</small> : null}
            </span>
            <time>{formatTime(duration)}</time>
          </div>
          <div className="soa-dubbing-player-controls">
            <button type="button" onClick={() => move('previous')} disabled={!track} aria-label="이전 음성">|◀</button>
            <button
              type="button"
              className="is-primary"
              onClick={() => void toggle()}
              disabled={!track || waitingForSegment}
              aria-label={waitingForSegment ? '다음 구간 대기' : playing ? '일시정지' : '재생'}
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
            {track?.audio.url && !track.audio.partial ? <a href={track.audio.url} download={track.audio.filename}>다운로드</a> : null}
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
                aria-label={waitingForSegment ? '다음 구간 대기' : playing ? '일시정지' : '재생'}
                disabled={waitingForSegment}
              >
                {playing ? 'Ⅱ' : '▶'}
              </button>
              <button type="button" onClick={() => move('next')} aria-label="다음 음성">›</button>
            </div>
            <div className="soa-player-main">
              <div className="soa-player-title">
                <strong>{track.title}</strong>
                <span>{track.audio.result.engineId}</span>
                {playbackDetail ? <small>{playbackDetail}</small> : null}
              </div>
              <button
                type="button"
                className="soa-player-wave"
                onClick={seek}
                disabled={Boolean(browserPlayback) || progressiveActive}
                aria-label={seekBlockedLabel}
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
              {track.audio.url && !track.audio.partial ? (
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
