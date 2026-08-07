import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'
import { usePlayerStore } from '../../store/usePlayerStore'
import type { TimelineBlock, TimelineVoiceBlock } from '../../workspace/workspaceTypes'
import { FinalExportControls } from './FinalExportControls'

interface TimelineEditorProps {
  blocks: TimelineBlock[]
  onMove: (id: string, direction: -1 | 1) => void
  onMoveMany?: (ids: string[], direction: -1 | 1) => void
  onReorder: (sourceId: string, targetId: string) => void
  onSplit: (id: string) => void
  onUpdateText: (id: string, text: string) => void
  onRetry: (id: string) => void
  onAddVoice: () => void
  onAddPause: () => void
  onRemove: (id: string) => void
  onRemoveMany?: (ids: string[]) => void
  onClear: () => void
  onVerifyAndRegenerate?: () => void
  sttBusy?: boolean
}

interface TimelineMetric {
  id: string
  offset: number
  width: number
  duration: number
}

function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds))
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`
}

function clipWidth(block: TimelineBlock, zoom: number): number {
  if (block.kind === 'pause') {
    return Math.round(Math.min(150, Math.max(72, 68 + block.durationSeconds * 20)) * zoom)
  }
  return Math.round(Math.min(430, Math.max(220, 210 + block.durationSeconds * 11)) * zoom)
}

interface VoiceBlockProps {
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
  onMove: TimelineEditorProps['onMove']
  onReorder: TimelineEditorProps['onReorder']
  onSplit: TimelineEditorProps['onSplit']
  onEdit: (id: string) => void
  onRetry: TimelineEditorProps['onRetry']
  onRemove: TimelineEditorProps['onRemove']
}

function VoiceBlock({
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
}: VoiceBlockProps) {
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
      onKeyDown={handleKeyboard}
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

export function TimelineEditor({
  blocks,
  onMove,
  onMoveMany,
  onReorder,
  onSplit,
  onUpdateText,
  onRetry,
  onAddVoice,
  onAddPause,
  onRemove,
  onRemoveMany,
  onClear,
  onVerifyAndRegenerate = () => undefined,
  sttBusy = false,
}: TimelineEditorProps) {
  const currentTrackId = usePlayerStore((state) => state.currentTrackId)
  const playbackTrackId = usePlayerStore((state) => state.playbackTrackId)
  const playbackPositionSeconds = usePlayerStore((state) => state.playbackPositionSeconds)
  const playbackActive = usePlayerStore((state) => state.playbackActive)
  const toggleTrack = usePlayerStore((state) => state.toggleTrack)
  const seekTrack = usePlayerStore((state) => state.seekTrack)
  const clipRefs = useRef(new Map<string, HTMLElement>())
  const quickEditorRef = useRef<HTMLTextAreaElement | null>(null)
  const [zoom, setZoom] = useState(1)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(blocks[0]?.id ?? null)
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(() => new Set(blocks[0] ? [blocks[0].id] : []))
  const [selectionAnchorId, setSelectionAnchorId] = useState<string | null>(blocks[0]?.id ?? null)
  const [quickDraft, setQuickDraft] = useState('')

  const metrics = useMemo(() => {
    let offset = 18
    return blocks.map<TimelineMetric>((block) => {
      const width = clipWidth(block, zoom)
      const metric = {
        id: block.id,
        offset,
        width,
        duration: Math.max(0.1, block.durationSeconds),
      }
      offset += width + 8
      return metric
    })
  }, [blocks, zoom])
  const totalDuration = blocks.reduce((total, block) => total + Math.max(0, block.durationSeconds), 0)
  const canvasWidth = Math.max(640, (metrics.at(-1)?.offset ?? 18) + (metrics.at(-1)?.width ?? 0) + 18)
  const playbackBlock = blocks.find((block) => block.kind === 'voice' && block.trackId === playbackTrackId)
    ?? blocks.find((block) => block.kind === 'voice' && block.trackId === currentTrackId)
    ?? null
  const playbackMetric = playbackBlock ? metrics.find((metric) => metric.id === playbackBlock.id) : null
  const playheadLeft = playbackMetric
    ? playbackMetric.offset + Math.min(1, playbackPositionSeconds / playbackMetric.duration) * playbackMetric.width
    : 18
  const playbackMetricIndex = playbackMetric ? metrics.findIndex((metric) => metric.id === playbackMetric.id) : -1
  const playbackTimelineSeconds = playbackMetricIndex >= 0
    ? blocks.slice(0, playbackMetricIndex).reduce((total, block) => total + Math.max(0, block.durationSeconds), 0)
      + Math.min(playbackMetric?.duration ?? 0, playbackPositionSeconds)
    : 0
  const selectedBlocks = blocks.filter((block) => selectedBlockIds.has(block.id))
  const selectedBlock = selectedBlocks.length === 1
    ? selectedBlocks[0]
    : blocks.find((block) => block.id === selectedBlockId) ?? null
  const selectedVoiceBlock = selectedBlocks.length === 1 && selectedBlock?.kind === 'voice' ? selectedBlock : null
  const selectedDuration = selectedBlocks.reduce((total, block) => total + Math.max(0, block.durationSeconds), 0)
  const selectedIds = selectedBlocks.map((block) => block.id)
  const canMoveSelectionLeft = selectedBlocks.some((block) => {
    const index = blocks.findIndex((item) => item.id === block.id)
    return index > 0 && !selectedBlockIds.has(blocks[index - 1].id)
  })
  const canMoveSelectionRight = selectedBlocks.some((block) => {
    const index = blocks.findIndex((item) => item.id === block.id)
    return index >= 0 && index < blocks.length - 1 && !selectedBlockIds.has(blocks[index + 1].id)
  })
  const quickDraftTrimmed = quickDraft.trim()
  const quickDraftDirty = Boolean(selectedVoiceBlock && quickDraftTrimmed && quickDraftTrimmed !== selectedVoiceBlock.text)
  const rulerTimes = [0, 0.25, 0.5, 0.75, 1].map((ratio) => totalDuration * ratio)

  function saveQuickDraft() {
    if (!selectedVoiceBlock) return false
    if (!quickDraftTrimmed) {
      setQuickDraft(selectedVoiceBlock.text)
      return false
    }
    if (quickDraftTrimmed !== selectedVoiceBlock.text) {
      onUpdateText(selectedVoiceBlock.id, quickDraftTrimmed)
    }
    return true
  }

  function selectBlock(id: string, mode: 'single' | 'toggle' | 'range' = 'single') {
    if (mode === 'range' && selectionAnchorId) {
      const anchorIndex = blocks.findIndex((block) => block.id === selectionAnchorId)
      const targetIndex = blocks.findIndex((block) => block.id === id)
      if (anchorIndex >= 0 && targetIndex >= 0) {
        const start = Math.min(anchorIndex, targetIndex)
        const end = Math.max(anchorIndex, targetIndex)
        setSelectedBlockIds(new Set(blocks.slice(start, end + 1).map((block) => block.id)))
        setSelectedBlockId(id)
        return
      }
    }

    if (mode === 'toggle') {
      const next = new Set(selectedBlockIds)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      setSelectedBlockIds(next)
      setSelectionAnchorId(id)
      setSelectedBlockId(next.has(id) ? id : [...next][0] ?? null)
      return
    }

    setSelectedBlockIds(new Set([id]))
    setSelectionAnchorId(id)
    setSelectedBlockId(id)
  }

  function editBlock(id: string) {
    selectBlock(id)
    window.requestAnimationFrame(() => quickEditorRef.current?.focus())
  }

  function moveSelection(id: string, direction: -1 | 1) {
    if (selectedBlockIds.has(id) && selectedBlockIds.size > 1 && onMoveMany) {
      onMoveMany(selectedIds, direction)
      return
    }
    onMove(id, direction)
  }

  function removeSelection(id: string) {
    if (selectedBlockIds.has(id) && selectedBlockIds.size > 1 && onRemoveMany) {
      onRemoveMany(selectedIds)
      setSelectedBlockIds(new Set())
      setSelectedBlockId(null)
      return
    }
    onRemove(id)
  }

  function seekFromTimeline(event: PointerEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement
    if (target.closest('button, textarea, input, a, .soa-dubbing-block__grip')) return
    const rect = event.currentTarget.getBoundingClientRect()
    const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left))
    const metric = metrics.find((item) => x >= item.offset && x <= item.offset + item.width)
    if (!metric) return
    const block = blocks.find((item) => item.id === metric.id)
    if (!block || block.kind !== 'voice' || !block.trackId || block.status !== 'ready') return
    const ratio = Math.max(0, Math.min(1, (x - metric.offset) / metric.width))
    selectBlock(block.id)
    seekTrack(block.trackId, ratio * metric.duration)
  }

  useEffect(() => {
    setQuickDraft(selectedVoiceBlock?.text ?? '')
  }, [selectedVoiceBlock?.id, selectedVoiceBlock?.text])

  useEffect(() => {
    const validIds = new Set(blocks.map((block) => block.id))
    const next = new Set([...selectedBlockIds].filter((id) => validIds.has(id)))
    if (next.size !== selectedBlockIds.size) setSelectedBlockIds(next)
    if (selectedBlockId && validIds.has(selectedBlockId)) return
    const fallback = [...next][0] ?? blocks[0]?.id ?? null
    setSelectedBlockId(fallback)
    setSelectionAnchorId(fallback)
    if (!next.size && fallback) setSelectedBlockIds(new Set([fallback]))
  }, [blocks, selectedBlockId, selectedBlockIds])

  const multiSelectionActive = selectedBlockIds.size > 1

  useEffect(() => {
    if (!playbackBlock) return
    if (!multiSelectionActive) {
      setSelectedBlockIds(new Set([playbackBlock.id]))
      setSelectionAnchorId(playbackBlock.id)
      setSelectedBlockId(playbackBlock.id)
    }
    const playbackElement = clipRefs.current.get(playbackBlock.id)
    if (typeof playbackElement?.scrollIntoView === 'function') {
      playbackElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    }
  }, [multiSelectionActive, playbackBlock])

  let voiceIndex = -1

  return (
    <section className="soa-timeline soa-dubbing-timeline" aria-label="음성 블록 편집">
      <header className="soa-dubbing-timeline__head">
        <div><span>TIMELINE EDITOR</span><strong>트랙 · 플레이헤드 · 클립 편집</strong></div>
        <div>
          <button
            type="button"
            onClick={onVerifyAndRegenerate}
            disabled={sttBusy || !blocks.some((block) => block.kind === 'voice' && block.status === 'ready')}
          >
            {sttBusy ? 'STT 검수 중…' : 'STT 검수 · 실패만 재생성'}
          </button>
          <button type="button" onClick={onAddPause}>쉼 추가</button>
          <button type="button" onClick={onClear} disabled={blocks.length === 0}>전체 비우기</button>
        </div>
      </header>

      <div className="soa-timeline-toolbar" aria-label="타임라인 도구">
        <div>
          <strong>{blocks.length}개 클립</strong>
          <span>총 {formatDuration(totalDuration)}</span>
          {selectedBlocks.length > 1 ? (
            <span>선택 · {selectedBlocks.length}개 · {formatDuration(selectedDuration)}</span>
          ) : selectedBlock ? (
            <span>선택 · {selectedBlock.kind === 'voice' ? selectedBlock.voiceName : '쉼'} {formatDuration(selectedBlock.durationSeconds)}</span>
          ) : null}
        </div>
        <p>트랙 클릭 위치 이동 · Ctrl/Cmd 클릭 다중 선택 · Shift 클릭 범위 선택 · Enter 편집 · Delete 삭제 · Alt+←/→ 이동</p>
        <div className="soa-timeline-zoom" aria-label="타임라인 확대 축소">
          <button type="button" onClick={() => setZoom((value) => Math.max(0.72, value - 0.14))} aria-label="타임라인 축소">−</button>
          <button type="button" onClick={() => setZoom(1)} aria-label="타임라인 기본 배율">{Math.round(zoom * 100)}%</button>
          <button type="button" onClick={() => setZoom((value) => Math.min(1.5, value + 0.14))} aria-label="타임라인 확대">＋</button>
        </div>
      </div>

      {selectedBlocks.length > 1 ? (
        <section className="soa-timeline-quick-editor is-batch" aria-label="선택 클립 일괄 작업">
          <div className="soa-timeline-quick-editor__meta">
            <span>다중 선택</span>
            <strong>{selectedBlocks.length}개 클립 · {formatDuration(selectedDuration)}</strong>
            <small>선택 순서는 유지한 채 한 칸씩 이동합니다.</small>
          </div>
          <div className="soa-timeline-batch-summary">
            {selectedBlocks.slice(0, 4).map((block) => (
              <span key={block.id}>{block.kind === 'voice' ? block.text : `쉼 ${block.durationSeconds.toFixed(1)}초`}</span>
            ))}
            {selectedBlocks.length > 4 ? <span>외 {selectedBlocks.length - 4}개</span> : null}
          </div>
          <div className="soa-timeline-quick-editor__actions is-batch">
            <button type="button" disabled={!onMoveMany || !canMoveSelectionLeft} onClick={() => onMoveMany?.(selectedIds, -1)}>선택 앞으로</button>
            <button type="button" disabled={!onMoveMany || !canMoveSelectionRight} onClick={() => onMoveMany?.(selectedIds, 1)}>선택 뒤로</button>
            <button type="button" onClick={() => { setSelectedBlockIds(new Set()); setSelectedBlockId(null) }}>선택 해제</button>
            <button type="button" className="is-danger" disabled={!onRemoveMany} onClick={() => { onRemoveMany?.(selectedIds); setSelectedBlockIds(new Set()); setSelectedBlockId(null) }}>선택 삭제</button>
          </div>
        </section>
      ) : selectedBlock ? (
        <section className="soa-timeline-quick-editor" aria-label="선택 클립 빠른 편집">
          <div className="soa-timeline-quick-editor__meta">
            <span>선택 클립</span>
            <strong>{selectedVoiceBlock ? `${selectedVoiceBlock.voiceName} · ${formatDuration(selectedVoiceBlock.durationSeconds)}` : `쉼 · ${formatDuration(selectedBlock.durationSeconds)}`}</strong>
            {selectedVoiceBlock ? <small>{quickDraftDirty ? '수정됨 · 저장 필요' : '저장됨'} · {quickDraft.length}/2000자</small> : <small>타임라인 간격 블록</small>}
          </div>
          {selectedVoiceBlock ? (
            <>
              <textarea
                ref={quickEditorRef}
                value={quickDraft}
                onChange={(event) => setQuickDraft(event.target.value)}
                onBlur={saveQuickDraft}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                    event.preventDefault()
                    if (saveQuickDraft()) onRetry(selectedVoiceBlock.id)
                  }
                }}
                maxLength={2_000}
                aria-label="선택 대사 빠른 수정"
                placeholder="선택한 대사를 바로 수정하세요."
              />
              <div className="soa-timeline-quick-editor__actions">
                <button
                  type="button"
                  className="is-primary"
                  onClick={() => {
                    saveQuickDraft()
                    if (selectedVoiceBlock.status === 'ready' && selectedVoiceBlock.trackId) toggleTrack(selectedVoiceBlock.trackId)
                    else onRetry(selectedVoiceBlock.id)
                  }}
                  disabled={selectedVoiceBlock.status === 'generating' || !quickDraftTrimmed}
                >
                  {selectedVoiceBlock.status === 'ready' && selectedVoiceBlock.trackId
                    ? playbackBlock?.id === selectedVoiceBlock.id && playbackActive ? '일시정지' : '미리듣기'
                    : selectedVoiceBlock.status === 'generating' ? '생성 중…' : '음성 생성'}
                </button>
                <button type="button" onClick={saveQuickDraft} disabled={!quickDraftDirty}>저장</button>
                <button type="button" onClick={() => { saveQuickDraft(); onRetry(selectedVoiceBlock.id) }} disabled={selectedVoiceBlock.status === 'generating' || !quickDraftTrimmed}>재생성</button>
                <button type="button" onClick={() => { saveQuickDraft(); onSplit(selectedVoiceBlock.id) }}>나누기</button>
                <button type="button" className="is-danger" onClick={() => removeSelection(selectedVoiceBlock.id)}>삭제</button>
              </div>
            </>
          ) : (
            <div className="soa-timeline-quick-editor__actions is-pause">
              <button type="button" disabled={blocks[0]?.id === selectedBlock.id} onClick={() => moveSelection(selectedBlock.id, -1)}>앞으로</button>
              <button type="button" disabled={blocks.at(-1)?.id === selectedBlock.id} onClick={() => moveSelection(selectedBlock.id, 1)}>뒤로</button>
              <button type="button" className="is-danger" onClick={() => removeSelection(selectedBlock.id)}>쉼 삭제</button>
            </div>
          )}
        </section>
      ) : null}

      <div className="soa-capcut-timeline">
        <div className="soa-capcut-ruler" aria-hidden="true">
          {rulerTimes.map((time, index) => <span key={`${time}-${index}`}>{formatDuration(time)}</span>)}
        </div>
        <div className="soa-capcut-track-row">
          <div className="soa-capcut-track-label">
            <strong>VOICE 1</strong>
            <small>대사 트랙</small>
            <span>{playbackActive ? '재생 중' : '편집 준비'}</span>
          </div>
          <div className="soa-capcut-track-lane">
            {blocks.length === 0 ? (
              <div className="soa-dubbing-timeline__empty">
                <strong>아직 음성 블록이 없습니다.</strong>
                <p>장문 내용을 제작하거나 아래 + 버튼으로 대사를 직접 추가하세요.</p>
              </div>
            ) : (
              <div
                className="soa-capcut-track-canvas"
                style={{ width: `${canvasWidth}px` }}
                onPointerDown={seekFromTimeline}
                aria-label="타임라인을 클릭해 재생 위치 이동"
              >
                <i className="soa-capcut-playhead" style={{ left: `${playheadLeft}px` }} aria-hidden="true">
                  <span>{formatDuration(playbackTimelineSeconds)}</span>
                </i>
                <div className="soa-dubbing-block-list">
                  {blocks.map((block, index) => {
                    const metric = metrics[index]
                    if (block.kind === 'pause') {
                      return (
                        <div
                          key={block.id}
                          ref={(element) => {
                            if (element) clipRefs.current.set(block.id, element)
                            else clipRefs.current.delete(block.id)
                          }}
                          className={`soa-dubbing-pause-block ${selectedBlockIds.has(block.id) ? 'is-selected' : ''}`}
                          style={{ '--soa-clip-width': `${metric.width}px` } as CSSProperties}
                          tabIndex={0}
                          draggable={selectedBlockIds.size <= 1}
                          onClick={(event) => selectBlock(
                            block.id,
                            event.shiftKey ? 'range' : event.metaKey || event.ctrlKey ? 'toggle' : 'single',
                          )}
                          onDragStart={(event) => event.dataTransfer.setData('text/plain', block.id)}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={(event) => {
                            event.preventDefault()
                            const sourceId = event.dataTransfer.getData('text/plain')
                            if (sourceId) onReorder(sourceId, block.id)
                          }}
                        >
                          <span>쉼</span><strong>{block.durationSeconds.toFixed(1)}초</strong>
                          <button type="button" onClick={(event) => { event.stopPropagation(); removeSelection(block.id) }} aria-label="쉼 블록 삭제">×</button>
                        </div>
                      )
                    }
                    voiceIndex += 1
                    const active = playbackBlock?.id === block.id
                    return (
                      <div
                        key={block.id}
                        ref={(element) => {
                          if (element) clipRefs.current.set(block.id, element)
                          else clipRefs.current.delete(block.id)
                        }}
                      >
                        <VoiceBlock
                          block={block}
                          voiceIndex={voiceIndex}
                          index={index}
                          total={blocks.length}
                          width={metric.width}
                          selected={selectedBlockIds.has(block.id)}
                          multiSelected={selectedBlockIds.size > 1 && selectedBlockIds.has(block.id)}
                          playbackActive={active && playbackActive}
                          onSelect={selectBlock}
                          onToggleTrack={toggleTrack}
                          onMove={moveSelection}
                          onReorder={onReorder}
                          onSplit={onSplit}
                          onEdit={editBlock}
                          onRetry={onRetry}
                          onRemove={removeSelection}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <FinalExportControls blocks={blocks} />

      <button type="button" className="soa-dubbing-add-block" onClick={onAddVoice} aria-label="새 대사 블록 추가">＋</button>
    </section>
  )
}
