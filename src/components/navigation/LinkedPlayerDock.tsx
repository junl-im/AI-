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
  const repeatMode = usePlayerStore((state) => state.repeatMode)
  const playbackRate = usePlayerStore((state) => state.playbackRate)
  const select = usePlayerStore((state) => state.select)
  const remove = usePlayerStore((state) => state.remove)
  const clearQueue = usePlayerStore((state) => state.clearQueue)
  const selectNext = usePlayerStore((state) => state.selectNext)
  const selectPrevious = usePlayerStore((state) => state.selectPrevious)
  const cycleRepeatMode = usePlayerStore((state) => state.cycleRepeatMode)
  const setPlaybackRate = usePlayerStore((state) => state.setPlaybackRate)
  const track = usePlayerStore(getCurrentTrack)
  const ref = useRef<HTMLAudioElement | null>(null)
  const resumeAfterTrackChange = useRef(false)
  const playbackRateRef = useRef(playbackRate)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [queueOpen, setQueueOpen] = useState(false)
  const progress = duration > 0 ? Math.min(100, (current / duration) * 100) : 0
  const bars = useMemo(
    () => [18, 34, 58, 28, 74, 42, 86, 38, 68, 30, 52, 22, 44, 70, 36, 56, 26, 48],
    [],
  )

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const shouldResume = resumeAfterTrackChange.current
    element.pause()
    element.load()
    element.playbackRate = playbackRateRef.current
    setPlaying(false)
    setCurrent(0)
    setDuration(0)
    if (shouldResume && currentTrackId) {
      const resume = () => void element.play().catch(() => undefined)
      element.addEventListener('canplay', resume, { once: true })
    }
    resumeAfterTrackChange.current = false
  }, [currentTrackId])

  useEffect(() => {
    playbackRateRef.current = playbackRate
    if (ref.current) ref.current.playbackRate = playbackRate
  }, [playbackRate])

  useEffect(() => {
    if (!track) setQueueOpen(false)
  }, [track])

  async function toggle() {
    const element = ref.current
    if (!element || !track) return
    if (element.paused) await element.play()
    else element.pause()
  }

  function move(direction: 'next' | 'previous') {
    resumeAfterTrackChange.current = playing
    const selected = direction === 'next' ? selectNext() : selectPrevious()
    if (!selected) resumeAfterTrackChange.current = false
  }

  function handleEnded() {
    const element = ref.current
    if (!element) return
    if (repeatMode === 'one') {
      element.currentTime = 0
      void element.play()
      return
    }
    resumeAfterTrackChange.current = true
    if (!selectNext()) {
      resumeAfterTrackChange.current = false
      setPlaying(false)
    }
  }

  function seek(event: MouseEvent<HTMLButtonElement>) {
    const element = ref.current
    if (!element || !duration) return
    const rect = event.currentTarget.getBoundingClientRect()
    element.currentTime = ((event.clientX - rect.left) / rect.width) * duration
  }

  const audio = (
    <audio
      ref={ref}
      src={track?.audio.url}
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
  )

  if (page === 'home') {
    return (
      <aside className="soa-dubbing-player-dock" aria-label="더빙 재생 플레이어">
        <div className="soa-dubbing-player-dock__inner">
          <button
            type="button"
            className="soa-dubbing-player-progress"
            onClick={seek}
            disabled={!track}
            aria-label="재생 위치 이동"
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
            {track ? <a href={track.audio.url} download={track.audio.filename}>다운로드</a> : null}
          </div>
          {audio}
          {track && queueOpen ? (
            <PlayerQueuePanel
              tracks={queue}
              currentTrackId={currentTrackId}
              onSelect={select}
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
              <button type="button" className="soa-player-wave" onClick={seek} aria-label="재생 위치 이동">
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
              <a href={track.audio.url} download={track.audio.filename} aria-label="현재 음성 다운로드">↓</a>
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
            onSelect={select}
            onRemove={remove}
            onClear={clearQueue}
          />
        ) : null}
      </div>
    </aside>
  )
}
