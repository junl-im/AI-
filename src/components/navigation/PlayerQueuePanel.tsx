import type { PlayerTrack } from '../../player/playerTypes'

interface PlayerQueuePanelProps {
  tracks: PlayerTrack[]
  currentTrackId: string | null
  onSelect: (trackId: string) => void
  onRemove: (trackId: string) => void
  onClear: () => void
}

export function PlayerQueuePanel({
  tracks,
  currentTrackId,
  onSelect,
  onRemove,
  onClear,
}: PlayerQueuePanelProps) {
  return (
    <section className="soa-player-queue" aria-label="재생 대기열">
      <div className="soa-player-queue__head">
        <strong>재생 대기열</strong>
        <button type="button" onClick={onClear} disabled={tracks.length === 0}>전체 비우기</button>
      </div>
      {tracks.length === 0 ? (
        <p>생성하거나 준비한 음성이 여기에 연결됩니다.</p>
      ) : (
        <ol>
          {tracks.map((track, index) => (
            <li key={track.id} className={track.id === currentTrackId ? 'is-current' : ''}>
              <button type="button" onClick={() => onSelect(track.id)}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{track.title}</strong>
                <small>{track.audio.result.engineId}</small>
              </button>
              <button
                type="button"
                aria-label={`${track.title} 대기열에서 삭제`}
                onClick={() => onRemove(track.id)}
              >
                ×
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
