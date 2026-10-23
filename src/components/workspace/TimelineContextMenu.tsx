import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { TimelineBlock } from '../../workspace/workspaceTypes'

interface Props {
  block: TimelineBlock
  index: number
  total: number
  x: number
  y: number
  playing: boolean
  onClose: () => void
  onDurationChange: (seconds: number) => void
  onToggle: () => void
  onEdit: () => void
  onSplit: () => void
  onMove: (direction: -1 | 1) => void
  onRemove: () => void
}

export function TimelineContextMenu({ block, index, total, x, y, playing, onClose, onDurationChange,
  onToggle, onEdit, onSplit, onMove, onRemove }: Props) {
  const menuRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    menuRef.current?.querySelector<HTMLElement>('input, button:not(:disabled)')?.focus({ preventScroll: true })
    return () => previous?.focus({ preventScroll: true })
  }, [])
  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (!(event.target as HTMLElement).closest('.soa-timeline-context-menu')) onClose()
    }
    const closeEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('pointerdown', closeOutside)
    window.addEventListener('keydown', closeEscape)
    window.addEventListener('scroll', onClose, true)
    window.addEventListener('resize', onClose)
    return () => {
      window.removeEventListener('pointerdown', closeOutside)
      window.removeEventListener('keydown', closeEscape)
      window.removeEventListener('scroll', onClose, true)
      window.removeEventListener('resize', onClose)
    }
  }, [onClose])
  const run = (action: () => void) => { onClose(); action() }
  return createPortal(
    <div ref={menuRef} className="soa-timeline-context-menu" role="menu" aria-label={block.kind === 'pause' ? '쉼 편집 메뉴' : '대사 클립 편집 메뉴'}
      style={{ left: Math.max(8, Math.min(x, window.innerWidth - 224)), top: Math.max(8, Math.min(y, window.innerHeight - 270)) }}>
      <strong>{block.kind === 'pause' ? `쉼 · ${block.durationSeconds.toFixed(1)}초` : `${block.voiceName} · 대사 클립`}</strong>
      {block.kind === 'pause' ? (
        <label className="soa-timeline-context-menu__duration">길이 <input key={`${block.id}-${block.durationSeconds}`} type="number" min="0.1" max="30" step="0.1" defaultValue={block.durationSeconds.toFixed(1)} aria-label="쉼 길이(초)"
          onBlur={(event) => { const next = Number(event.currentTarget.value); if (Number.isFinite(next) && next !== block.durationSeconds) onDurationChange(next) }}
          onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur() }} /> 초</label>
      ) : (
        <>
          {block.status === 'ready' && block.trackId ? <button type="button" role="menuitem" onClick={() => run(onToggle)}>{playing ? '일시정지' : '이 클립 재생'}</button> : null}
          <button type="button" role="menuitem" onClick={() => run(onEdit)}>대사 편집</button>
          <button type="button" role="menuitem" disabled={block.status === 'generating' || block.text.trim().length < 2} onClick={() => run(onSplit)}>문장 나누기</button>
        </>
      )}
      <hr />
      <button type="button" role="menuitem" disabled={index <= 0} onClick={() => run(() => onMove(-1))}>앞으로 이동</button>
      <button type="button" role="menuitem" disabled={index >= total - 1} onClick={() => run(() => onMove(1))}>뒤로 이동</button>
      <button type="button" role="menuitem" className="is-danger" disabled={block.kind === 'voice' && block.status === 'generating'} onClick={() => run(onRemove)}>{block.kind === 'pause' ? '쉼 삭제' : '클립 삭제'}</button>
    </div>, document.body,
  )
}
