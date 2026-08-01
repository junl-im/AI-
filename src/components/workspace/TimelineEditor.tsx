import { useRef, useState, type DragEvent, type PointerEvent } from 'react'
import { usePlayerStore } from '../../store/usePlayerStore'
import type { TimelineBlock, TimelineVoiceBlock } from '../../workspace/workspaceTypes'

interface TimelineEditorProps {
  blocks: TimelineBlock[]
  onMove: (id: string, direction: -1 | 1) => void
  onReorder: (sourceId: string, targetId: string) => void
  onSplit: (id: string) => void
  onUpdateText: (id: string, text: string) => void
  onRetry: (id: string) => void
  onAddPause: () => void
  onClear: () => void
}

function formatDuration(seconds: number): string {
  return `0:${Math.max(1, Math.round(seconds)).toString().padStart(2, '0')}`
}

interface VoiceBlockProps {
  block: TimelineVoiceBlock
  index: number
  total: number
  onMove: TimelineEditorProps['onMove']
  onReorder: TimelineEditorProps['onReorder']
  onSplit: TimelineEditorProps['onSplit']
  onUpdateText: TimelineEditorProps['onUpdateText']
  onRetry: TimelineEditorProps['onRetry']
}

function VoiceBlock({
  block,
  index,
  total,
  onMove,
  onReorder,
  onSplit,
  onUpdateText,
  onRetry,
}: VoiceBlockProps) {
  const selectTrack = usePlayerStore((state) => state.select)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(block.text)
  const holdTimer = useRef<number | null>(null)

  function startHold(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse') return
    holdTimer.current = window.setTimeout(() => setEditing(true), 550)
  }

  function stopHold() {
    if (holdTimer.current !== null) window.clearTimeout(holdTimer.current)
    holdTimer.current = null
  }

  function saveEdit() {
    const next = draft.trim()
    if (next && next !== block.text) onUpdateText(block.id, next)
    setEditing(false)
  }

  const statusLabel = block.status === 'ready'
    ? '완료'
    : block.status === 'generating'
      ? `${Math.round(block.progress)}%`
      : block.status === 'failed'
        ? '실패'
        : '대기'

  return (
    <div
      className={`soa-timeline-block soa-timeline-block--voice is-${block.status}`}
      draggable={!editing && block.status !== 'generating'}
      onDragStart={(event: DragEvent<HTMLDivElement>) => {
        event.dataTransfer.setData('text/plain', block.id)
      }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault()
        const sourceId = event.dataTransfer.getData('text/plain')
        if (sourceId) onReorder(sourceId, block.id)
      }}
      onPointerDown={startHold}
      onPointerUp={stopHold}
      onPointerCancel={stopHold}
      onDoubleClick={() => setEditing(true)}
    >
      <div className="soa-timeline-block__top">
        <span>음성 · {block.voiceName}</span>
        <b>{formatDuration(block.durationSeconds)}</b>
      </div>
      {editing ? (
        <div className="soa-timeline-edit">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            aria-label="타임라인 문장 수정"
            autoFocus
          />
          <div>
            <button type="button" onClick={() => setEditing(false)}>취소</button>
            <button type="button" onClick={saveEdit}>저장</button>
          </div>
        </div>
      ) : (
        <p>{block.text}</p>
      )}
      <div className="soa-timeline-block__status">
        <span className="soa-timeline-status-dot" aria-hidden="true" />
        <strong>{statusLabel}</strong>
        {block.status === 'generating' ? (
          <i style={{ width: `${Math.max(4, block.progress)}%` }} />
        ) : null}
      </div>
      {block.error ? <small>{block.error}</small> : null}
      <div className="soa-timeline-actions">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => onMove(block.id, -1)}
          aria-label="블록 왼쪽 이동"
        >
          ←
        </button>
        <button
          type="button"
          disabled={index === total - 1}
          onClick={() => onMove(block.id, 1)}
          aria-label="블록 오른쪽 이동"
        >
          →
        </button>
        <button type="button" onClick={() => onSplit(block.id)} aria-label="블록 자르기">
          ✂
        </button>
        <button type="button" onClick={() => setEditing(true)} aria-label="블록 텍스트 수정">
          수정
        </button>
        {block.status === 'ready' && block.trackId ? (
          <button type="button" onClick={() => selectTrack(block.trackId!)}>
            듣기
          </button>
        ) : null}
        {block.status === 'failed' || block.status === 'queued' ? (
          <button type="button" className="is-primary" onClick={() => onRetry(block.id)}>
            {block.status === 'failed' ? '재시도' : '생성'}
          </button>
        ) : null}
      </div>
    </div>
  )
}

export function TimelineEditor({
  blocks,
  onMove,
  onReorder,
  onSplit,
  onUpdateText,
  onRetry,
  onAddPause,
  onClear,
}: TimelineEditorProps) {
  return (
    <section className="soa-timeline" aria-label="음성 타임라인">
      <header className="soa-timeline__head">
        <div>
          <span>LONGFORM VOICE TIMELINE</span>
          <strong>문장별 음성 편집</strong>
        </div>
        <div>
          <button type="button" onClick={onAddPause}>＋ 쉼 0.5초</button>
          <button type="button" onClick={onClear} disabled={blocks.length === 0}>비우기</button>
        </div>
      </header>
      {blocks.length === 0 ? (
        <div className="soa-timeline-empty">
          원고를 제작하면 문장별 음성 블록이 여기에 쌓입니다.
        </div>
      ) : (
        <div className="soa-timeline-track">
          {blocks.map((block, index) => block.kind === 'pause' ? (
            <div
              key={block.id}
              className="soa-timeline-block soa-timeline-block--pause"
              draggable
              onDragStart={(event) => event.dataTransfer.setData('text/plain', block.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                const sourceId = event.dataTransfer.getData('text/plain')
                if (sourceId) onReorder(sourceId, block.id)
              }}
            >
              <span>쉼</span>
              <strong>{block.durationSeconds.toFixed(1)}초</strong>
            </div>
          ) : (
            <VoiceBlock
              key={block.id}
              block={block}
              index={index}
              total={blocks.length}
              onMove={onMove}
              onReorder={onReorder}
              onSplit={onSplit}
              onUpdateText={onUpdateText}
              onRetry={onRetry}
            />
          ))}
        </div>
      )}
    </section>
  )
}
