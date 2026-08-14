import { useState, type CSSProperties, type DragEvent, type KeyboardEvent } from 'react'
import type { TimelineVoiceBlock } from '../../workspace/workspaceTypes'

function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds))
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`
}

interface TimelineVoiceBlockCardProps {
  block: TimelineVoiceBlock
  voiceIndex: number
  index: number
  total: number
  width: number
  selected: boolean
  multiSelected: boolean
  playbackActive: boolean
  onSelect: (id: string, mode: 'single' | 'toggle' | 'range') => void
  onToggleTrack: (trackId: string) => void
  onMove: (id: string, direction: -1 | 1) => void
  onReorder: (sourceId: string, targetId: string) => void
  onSplit: (id: string) => void
  onEdit: (id: string) => void
  onRetry: (id: string) => void
  onRemove: (id: string) => void
}

export function TimelineVoiceBlockCard({
  block,
  voiceIndex,
  index,
  total,
  width,
  selected,
  multiSelected,
  playbackActive,
  onSelect,
  onToggleTrack,
  onMove,
  onReorder,
  onSplit,
  onEdit,
  onRetry,
  onRemove,
}: TimelineVoiceBlockCardProps) {
  const [blockMenuOpen, setBlockMenuOpen] = useState(false)
  const blockMenuId = `dubbing-block-menu-${voiceIndex + 1}`

  function handleKeyboard(event: KeyboardEvent<HTMLElement>) {
    const target = event.target as HTMLElement
    if (target.closest('textarea, input, button, a, [contenteditable="true"]')) return
    if ((event.key === 'Delete' || event.key === 'Backspace') && block.status !== 'generating') {
      event.preventDefault()
      onRemove(block.id)
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      onEdit(block.id)
      return
    }
    if (event.altKey && event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault()
      onMove(block.id, -1)
      return
    }
    if (event.altKey && event.key === 'ArrowRight' && index < total - 1) {
      event.preventDefault()
      onMove(block.id, 1)
      return
    }
    if (event.key === ' ' && block.status === 'ready' && block.trackId) {
      event.preventDefault()
      onToggleTrack(block.trackId)
    }
  }

  const statusLabel = block.status === 'ready'
    ? '완료'
    : block.status === 'generating'
      ? `${Math.round(block.progress)}% 생성 중`
      : block.status === 'failed'
        ? '생성 실패'
        : '생성 대기'
  const sttLabel = block.sttVerification?.status === 'passed'
    ? 'STT 통과'
    : block.sttVerification?.status === 'failed'
      ? 'STT 재생성 필요'
      : block.sttVerification?.status === 'blocked'
        ? 'STT 재생성 한도'
        : block.sttVerification?.status === 'unchecked'
          ? 'STT 재검수 대기'
          : null
  const actionLabel = block.status === 'ready' && block.trackId
    ? playbackActive
      ? `${voiceIndex + 1}번 대사 일시정지`
      : `${voiceIndex + 1}번 대사 재생`
    : block.status === 'generating'
      ? `${voiceIndex + 1}번 대사 음성 생성 중`
      : block.status === 'queued'
        ? `${voiceIndex + 1}번 대사 음성 생성`
        : `${voiceIndex + 1}번 대사 음성 다시 생성`

  return (
    <article
      className={`soa-dubbing-block is-${block.status} ${selected ? 'is-selected' : ''} ${playbackActive ? 'is-playing' : ''}`}
      style={{ '--soa-clip-width': `${width}px` } as CSSProperties}
      tabIndex={0}
      aria-current={selected ? 'true' : undefined}
      draggable={block.status !== 'generating' && !multiSelected}
      onClick={(event) => onSelect(
        block.id,
        event.shiftKey ? 'range' : event.metaKey || event.ctrlKey ? 'toggle' : 'single',
      )}
      title={block.text}
      aria-label={`클립 ${voiceIndex + 1} · ${block.voiceName} · ${formatDuration(block.durationSeconds)} · ${statusLabel}`}
      onKeyDown={handleKeyboard}
      onDoubleClick={(event) => {
        const target = event.target as HTMLElement
        if (target.closest('button, textarea, input, a, [contenteditable="true"]')) return
        event.stopPropagation()
        onEdit(block.id)
      }}
      onDragStart={(event: DragEvent<HTMLElement>) => {
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/plain', block.id)
      }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault()
        const sourceId = event.dataTransfer.getData('text/plain')
        if (sourceId) onReorder(sourceId, block.id)
      }}
    >
      <div className="soa-dubbing-block__grip" aria-hidden="true">⠿</div>
      <button
        type="button"
        className="soa-timeline-touch-select"
        aria-label={selected ? `${voiceIndex + 1}번 대사 선택 해제` : `${voiceIndex + 1}번 대사 다중 선택`}
        aria-pressed={selected}
        onClick={(event) => {
          event.stopPropagation()
          onSelect(block.id, 'toggle')
        }}
      >
        {selected ? '✓' : '＋'}
      </button>
      <header>
        <div className="soa-dubbing-block__voice">
          <span aria-hidden="true">{block.voiceName.slice(0, 1)}</span>
          <div><strong>{block.voiceName}</strong><small>클립 {voiceIndex + 1}</small></div>
        </div>
        <div className="soa-dubbing-block__tools">
          {block.status === 'ready' && block.trackId ? (
            <button
              type="button"
              className={playbackActive ? 'is-playing' : ''}
              onClick={(event) => {
                event.stopPropagation()
                onToggleTrack(block.trackId!)
              }}
              aria-label={actionLabel}
              aria-pressed={playbackActive}
            >
              {playbackActive ? 'Ⅱ' : '▶'}
            </button>
          ) : (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                onRetry(block.id)
              }}
              disabled={block.status === 'generating' || block.text.trim().length === 0}
              aria-label={actionLabel}
            >
              {block.status === 'generating' ? '…' : '▶'}
            </button>
          )}
          <button
            type="button"
            className="soa-dubbing-block__direct-tool"
            onClick={(event) => {
              event.stopPropagation()
              onEdit(block.id)
            }}
            aria-label={`${voiceIndex + 1}번 대사 바로 편집`}
          >
            ✎
          </button>
          <button
            type="button"
            className="soa-dubbing-block__direct-tool"
            onClick={(event) => {
              event.stopPropagation()
              onSplit(block.id)
            }}
            aria-label={`${voiceIndex + 1}번 대사 가위로 나누기`}
          >
            ✂
          </button>
          <button
            type="button"
            className="soa-dubbing-block__direct-tool is-danger"
            onClick={(event) => {
              event.stopPropagation()
              onRemove(block.id)
            }}
            aria-label={`${voiceIndex + 1}번 대사 삭제`}
          >
            ⌫
          </button>
          <div className="soa-dubbing-block-menu">
            <button
              type="button"
              className="soa-dubbing-block-menu__trigger"
              aria-label={`${voiceIndex + 1}번 대사 블록 메뉴 열기`}
              aria-expanded={blockMenuOpen}
              aria-controls={blockMenuId}
              onClick={(event) => {
                event.stopPropagation()
                setBlockMenuOpen((open) => !open)
              }}
            >
              ⋮
            </button>
            {blockMenuOpen ? (
              <div id={blockMenuId} className="soa-dubbing-block-menu__items" aria-label={`${voiceIndex + 1}번 대사 블록 메뉴`}>
                <button type="button" onClick={() => { setBlockMenuOpen(false); onSplit(block.id) }}>문장 나누기</button>
                <button type="button" disabled={index === 0} onClick={() => { setBlockMenuOpen(false); onMove(block.id, -1) }}>앞으로 이동</button>
                <button type="button" disabled={index === total - 1} onClick={() => { setBlockMenuOpen(false); onMove(block.id, 1) }}>뒤로 이동</button>
                <button type="button" className="is-danger" onClick={() => { setBlockMenuOpen(false); onRemove(block.id) }}>클립 삭제</button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <p className="soa-dubbing-block__script-preview" title={block.text}>{block.text}</p>

      <footer>
        <span className="soa-dubbing-block__status"><i aria-hidden="true" />{statusLabel}</span>
        {block.audio?.partial ? (
          <small>구간 {block.audio.partial.index}/{block.audio.partial.totalSegments} · 첫 구간 {block.audio.telemetry?.serverSegmentReadyMs ?? block.audio.partial.readyAfterMs}ms</small>
        ) : block.audio?.result.firstAudioMs != null ? (
          <small>첫 음성 {block.audio.result.firstAudioMs}ms</small>
        ) : null}
        <time>{formatDuration(block.durationSeconds)}</time>
      </footer>
      {block.status === 'generating' ? (
        <div className="soa-dubbing-block__progress"><i style={{ width: `${Math.max(4, block.progress)}%` }} /></div>
      ) : null}
      {block.error ? <p className="soa-dubbing-block__error">{block.error}</p> : null}
      {block.sttVerification ? (
        <p className="soa-dubbing-block__error">
          {sttLabel} · CER {(block.sttVerification.characterErrorRate * 100).toFixed(1)}%
          {' · '}WER {(block.sttVerification.wordErrorRate * 100).toFixed(1)}%
          {block.sttVerification.regenerationAttempts
            ? ` · 재생성 ${block.sttVerification.regenerationAttempts}회`
            : ''}
        </p>
      ) : null}
    </article>
  )
}
