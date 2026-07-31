import { useEffect, useMemo, useRef, useState } from 'react'
import type { AppPage } from '../../store/useAppStore'
import { useAppStore } from '../../store/useAppStore'
import { usePlayerStore } from '../../store/usePlayerStore'

const items: Array<{ page: AppPage; label: string; icon: string }> = [
  { page: 'home', label: '만들기', icon: '＋' },
  { page: 'quality', label: '품질', icon: '◎' },
  { page: 'projects', label: '프로젝트', icon: '▣' },
]

function formatTime(value: number) {
  const safe = Number.isFinite(value) ? Math.max(0, value) : 0
  return `${Math.floor(safe / 60)}:${String(Math.floor(safe % 60)).padStart(2, '0')}`
}

export function LinkedPlayerDock() {
  const page = useAppStore((state) => state.page)
  const setPage = useAppStore((state) => state.setPage)
  const audio = usePlayerStore((state) => state.audio)
  const title = usePlayerStore((state) => state.title)
  const ref = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const progress = duration > 0 ? Math.min(100, (current / duration) * 100) : 0
  const bars = useMemo(() => [18, 34, 58, 28, 74, 42, 86, 38, 68, 30, 52, 22, 44, 70, 36, 56, 26, 48], [])

  useEffect(() => {
    const element = ref.current
    if (!element) return
    element.pause()
    element.load()
    setPlaying(false)
    setCurrent(0)
  }, [audio?.url])

  async function toggle() {
    const element = ref.current
    if (!element || !audio) return
    if (element.paused) await element.play()
    else element.pause()
  }

  return (
    <aside className="soa-dock safe-bottom" aria-label="SoriON 고정 플레이어와 메뉴">
      <div className="soa-dock__inner">
        <nav className="soa-dock__nav" aria-label="주요 메뉴">
          {items.map((item) => (
            <button
              key={item.page}
              type="button"
              aria-current={page === item.page ? 'page' : undefined}
              onClick={() => setPage(item.page)}
              className={page === item.page ? 'is-active' : ''}
            >
              <span aria-hidden="true">{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>

        <section className="soa-linked-player" aria-label="연계형 오디오 플레이어">
          <button type="button" className="soa-player-toggle" onClick={() => void toggle()} disabled={!audio} aria-label={playing ? '일시정지' : '재생'}>
            {playing ? 'Ⅱ' : '▶'}
          </button>
          <div className="soa-player-main">
            <div className="soa-player-title"><strong>{title}</strong><span>{audio ? audio.result.engineId : 'VOICE LINK READY'}</span></div>
            <button
              type="button"
              className="soa-player-wave"
              disabled={!audio}
              onClick={(event) => {
                const element = ref.current
                if (!element || !duration) return
                const rect = event.currentTarget.getBoundingClientRect()
                element.currentTime = ((event.clientX - rect.left) / rect.width) * duration
              }}
              aria-label="재생 위치 이동"
            >
              <span className="soa-player-progress" style={{ width: `${progress}%` }} />
              {bars.map((height, index) => <i key={`${height}-${index}`} style={{ height: `${height}%` }} />)}
              <b style={{ left: `${progress}%` }} />
            </button>
          </div>
          <time>{formatTime(current)} / {formatTime(duration)}</time>
          <audio
            ref={ref}
            src={audio?.url}
            preload="metadata"
            onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
            onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
          />
        </section>
      </div>
    </aside>
  )
}
