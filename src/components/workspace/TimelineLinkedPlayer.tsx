import type { MouseEvent } from 'react'
import { getCurrentTrack, usePlayerStore } from '../../store/usePlayerStore'

function formatTime(value: number): string {
  const safe = Number.isFinite(value) ? Math.max(0, value) : 0
  return `${Math.floor(safe / 60)}:${String(Math.floor(safe % 60)).padStart(2, '0')}`
}

export function TimelineLinkedPlayer() {
  const queue = usePlayerStore((state) => state.queue)
  const currentTrackId = usePlayerStore((state) => state.currentTrackId)
  const playbackTrackId = usePlayerStore((state) => state.playbackTrackId)
  const playbackPositionSeconds = usePlayerStore((state) => state.playbackPositionSeconds)
  const playbackActive = usePlayerStore((state) => state.playbackActive)
  const toggleTrack = usePlayerStore((state) => state.toggleTrack)
  const seekTrack = usePlayerStore((state) => state.seekTrack)
  const select = usePlayerStore((state) => state.select)
  const selectAndPlay = usePlayerStore((state) => state.selectAndPlay)
  const track = usePlayerStore(getCurrentTrack)
  const duration = Math.max(0, track?.audio.durationSeconds ?? 0)
  const current = playbackTrackId === currentTrackId
    ? Math.min(duration || playbackPositionSeconds, playbackPositionSeconds)
    : Math.min(duration, track?.resumePositionSeconds ?? 0)
  const progress = duration > 0 ? Math.min(100, (current / duration) * 100) : 0
  const playing = Boolean(track && playbackTrackId === currentTrackId && playbackActive)
  const seekBlocked = Boolean(track?.audio.browserSpeech || track?.audio.partial)
  const currentIndex = currentTrackId ? queue.findIndex((item) => item.id === currentTrackId) : -1

  function move(direction: -1 | 1) {
    if (!queue.length) return
    const fallbackIndex = direction > 0 ? 0 : queue.length - 1
    const targetIndex = currentIndex < 0 ? fallbackIndex : currentIndex + direction
    if (targetIndex < 0 || targetIndex >= queue.length) return
    const target = queue[targetIndex]
    if (playing) selectAndPlay(target.id)
    else select(target.id)
  }

  function seek(event: MouseEvent<HTMLButtonElement>) {
    if (!track || !currentTrackId || !duration || seekBlocked) return
    const rect = event.currentTarget.getBoundingClientRect()
    if (rect.width <= 0) return
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
    seekTrack(currentTrackId, duration * ratio)
  }

  return (
    <section className="soa-timeline-linked-player" aria-label="타임라인 연계 플레이어">
      <div className="soa-timeline-linked-player__identity">
        <span>PLAYER</span>
        <strong>{track?.title ?? '완성된 대사를 선택하세요'}</strong>
        <small>하단 Dock과 같은 재생 상태를 사용합니다.</small>
      </div>
      <button type="button" className="soa-timeline-linked-player__skip" onClick={() => move(-1)} disabled={!queue.length || currentIndex <= 0} aria-label="이전 음성">‹</button>
      <button type="button" className="soa-timeline-linked-player__toggle" onClick={() => currentTrackId && toggleTrack(currentTrackId)} disabled={!track} aria-label={playing ? '일시정지' : '재생'} aria-pressed={playing}>{playing ? 'Ⅱ' : '▶'}</button>
      <button type="button" className="soa-timeline-linked-player__skip" onClick={() => move(1)} disabled={!queue.length || currentIndex < 0 || currentIndex >= queue.length - 1} aria-label="다음 음성">›</button>
      <div className="soa-timeline-linked-player__transport">
        <button type="button" className="soa-timeline-linked-player__scrub" onClick={seek} disabled={!track || !duration || seekBlocked} aria-label={seekBlocked ? '현재 음성은 위치 이동을 지원하지 않음' : '타임라인 재생 위치 이동'}>
          <i style={{ width: `${progress}%` }} />
          <b style={{ left: `${progress}%` }} />
        </button>
        <div>
          <time>{formatTime(current)}</time>
          <span>{track ? `${Math.max(1, currentIndex + 1)} / ${queue.length}` : `${queue.length}개 음성`}</span>
          <time>{formatTime(duration)}</time>
        </div>
      </div>
      <span className={`soa-timeline-linked-player__sync ${playing ? 'is-active' : ''}`}><i aria-hidden="true" /> SYNC</span>
    </section>
  )
}
