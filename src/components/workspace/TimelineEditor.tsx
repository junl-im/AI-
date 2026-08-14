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
import type {
  TimelineBatchFailureKind,
  TimelineBatchGenerationSummary,
} from '../../hooks/useTimelineGeneration'
import { usePlayerStore } from '../../store/usePlayerStore'
import { getVoicePreset, voicePresets } from '../../tts/voicePresets'
import type { WorkspaceBatchHistoryEntry, WorkspaceBatchRetrySnapshot } from '../../workspace/sessionTypes'
import type { TimelineBlock, TimelineVoiceBlock } from '../../workspace/workspaceTypes'
import {
  TIMELINE_INSET_PX,
  TIMELINE_PIXELS_PER_SECOND,
  buildTimelineMetrics,
  buildTimelineRulerTicks,
  getTimelineCanvasWidth,
  getTimelineContentWidth,
} from '../../timeline/timelineGeometry'
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
  onBatchVoiceChange?: (
    ids: string[],
    voiceId: string,
    regenerate: boolean,
  ) => Promise<TimelineBatchGenerationSummary | null> | TimelineBatchGenerationSummary | null
  onRegenerateMany?: (ids: string[]) => Promise<TimelineBatchGenerationSummary>
  onClear: () => void
  onVerifyAndRegenerate?: () => void
  sttBusy?: boolean
  batchRetrySnapshot?: WorkspaceBatchRetrySnapshot
  onBatchRetrySnapshotChange?: (snapshot: WorkspaceBatchRetrySnapshot) => void
  canUndo?: boolean
  canRedo?: boolean
  undoLabel?: string | null
  redoLabel?: string | null
  onUndo?: () => boolean | void
  onRedo?: () => boolean | void
  onSelectionChange?: (ids: string[]) => void
}

const BATCH_RETRY_LIMIT = 3
const BATCH_HISTORY_LIMIT = 6

type BatchHistoryEntry = WorkspaceBatchHistoryEntry

type BatchCommandKind = 'regenerate' | 'retry-failed' | 'delete'

interface BatchCommandPreview {
  kind: BatchCommandKind
  ids: string[]
}

const batchFailureLabels: Record<TimelineBatchFailureKind, string> = {
  engine: '엔진',
  preset: '프리셋',
  network: '연결',
  cancelled: '취소',
  unknown: '기타',
}

function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds))
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`
}

function getDefaultTimelineZoom(): number {
  return typeof window !== 'undefined' && window.innerWidth <= 760 ? 1.25 : 1
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
  onBatchVoiceChange,
  onRegenerateMany,
  onClear,
  onVerifyAndRegenerate = () => undefined,
  sttBusy = false,
  batchRetrySnapshot,
  onBatchRetrySnapshotChange,
  canUndo = false,
  canRedo = false,
  undoLabel = null,
  redoLabel = null,
  onUndo,
  onRedo,
  onSelectionChange,
}: TimelineEditorProps) {
  const currentTrackId = usePlayerStore((state) => state.currentTrackId)
  const playbackTrackId = usePlayerStore((state) => state.playbackTrackId)
  const playbackPositionSeconds = usePlayerStore((state) => state.playbackPositionSeconds)
  const playbackActive = usePlayerStore((state) => state.playbackActive)
  const toggleTrack = usePlayerStore((state) => state.toggleTrack)
  const seekTrack = usePlayerStore((state) => state.seekTrack)
  const clipRefs = useRef(new Map<string, HTMLElement>())
  const quickEditorRef = useRef<HTMLTextAreaElement | null>(null)
  const timelineScrubbingRef = useRef(false)
  const [zoom, setZoom] = useState(getDefaultTimelineZoom)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(blocks[0]?.id ?? null)
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(() => new Set(blocks[0] ? [blocks[0].id] : []))
  const [selectionAnchorId, setSelectionAnchorId] = useState<string | null>(blocks[0]?.id ?? null)
  const [quickDraft, setQuickDraft] = useState('')
  const [batchVoiceId, setBatchVoiceId] = useState(voicePresets[0].id)
  const [batchPreviewOpen, setBatchPreviewOpen] = useState(false)
  const [batchRunning, setBatchRunning] = useState(false)
  const [batchResult, setBatchResult] = useState<TimelineBatchGenerationSummary | null>(null)
  const [batchRetryCount, setBatchRetryCount] = useState(batchRetrySnapshot?.retryCount ?? 0)
  const [batchHistory, setBatchHistory] = useState<BatchHistoryEntry[]>(batchRetrySnapshot?.history ?? [])
  const [batchHistoryOpen, setBatchHistoryOpen] = useState(false)
  const [batchCommandPreview, setBatchCommandPreview] = useState<BatchCommandPreview | null>(null)
  const [shortcutHelpOpen, setShortcutHelpOpen] = useState(false)
  const batchFailures = batchResult?.failures
    ?? batchResult?.failedIds.map((id) => ({ id, kind: 'unknown' as const, message: '실패 원인을 확인하지 못했습니다.' }))
    ?? []
  const batchFailureGroups = (Object.keys(batchFailureLabels) as TimelineBatchFailureKind[])
    .map((kind) => ({
      kind,
      ids: batchFailures.filter((failure) => failure.kind === kind).map((failure) => failure.id),
    }))
    .filter((group) => group.ids.length > 0)
  const batchRetryLimitReached = batchRetryCount >= BATCH_RETRY_LIMIT

  useEffect(() => {
    if (!batchRetrySnapshot) return
    setBatchRetryCount(batchRetrySnapshot.retryCount)
    setBatchHistory(batchRetrySnapshot.history)
  }, [batchRetrySnapshot])

  const metrics = useMemo(() => buildTimelineMetrics(blocks, zoom), [blocks, zoom])
  const totalDuration = blocks.reduce((total, block) => total + Math.max(0, block.durationSeconds), 0)
  const timelineContentWidth = getTimelineContentWidth(metrics)
  const canvasWidth = getTimelineCanvasWidth(metrics)
  const playbackBlock = blocks.find((block) => block.kind === 'voice' && block.trackId === playbackTrackId)
    ?? blocks.find((block) => block.kind === 'voice' && block.trackId === currentTrackId)
    ?? null
  const playbackMetric = playbackBlock ? metrics.find((metric) => metric.id === playbackBlock.id) : null
  const playheadLeft = playbackMetric
    ? playbackMetric.offset + Math.min(1, playbackPositionSeconds / playbackMetric.duration) * playbackMetric.width
    : TIMELINE_INSET_PX
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
  const selectedVoiceBlocks = selectedBlocks.filter((block): block is TimelineVoiceBlock => block.kind === 'voice')
  const selectedVoiceIds = selectedVoiceBlocks.map((block) => block.id)
  const selectedVoiceIdKey = selectedVoiceIds.join('|')
  const selectedIdKey = selectedIds.join('|')
  const firstSelectedVoiceId = selectedVoiceBlocks[0]?.voiceId ?? null
  const selectedFailedVoiceIds = selectedVoiceBlocks
    .filter((block) => block.status === 'failed')
    .map((block) => block.id)
  const selectedReadyVoiceCount = selectedVoiceBlocks.filter((block) => block.status === 'ready').length
  const selectedGeneratingVoiceCount = selectedVoiceBlocks.filter((block) => block.status === 'generating').length
  const batchVoice = getVoicePreset(batchVoiceId)
  const batchVoiceChangeCount = selectedVoiceBlocks.filter((block) => block.voiceId !== batchVoice.id).length
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
  const rulerTicks = buildTimelineRulerTicks(totalDuration, timelineContentWidth)
  const commandPreviewBlocks = batchCommandPreview
    ? blocks.filter((block) => batchCommandPreview.ids.includes(block.id))
    : []
  const commandPreviewVoiceCount = commandPreviewBlocks.filter((block) => block.kind === 'voice').length
  const commandPreviewReadyCount = commandPreviewBlocks.filter((block) => block.kind === 'voice' && block.status === 'ready').length

  function applyBatchResult(summary: TimelineBatchGenerationSummary, retry: boolean) {
    setBatchResult(summary)
    const failureKinds = Array.from(new Set(
      (summary.failures ?? []).map((failure) => failure.kind),
    ))
    const next: BatchHistoryEntry = {
      completedAt: new Date().toISOString(),
      retry,
      requested: summary.requestedIds.length,
      succeeded: summary.succeededIds.length,
      failed: summary.failedIds.length,
      skipped: summary.skippedIds.length,
      failureKinds,
    }
    const nextHistory = [next, ...batchHistory].slice(0, BATCH_HISTORY_LIMIT)
    const nextRetryCount = retry ? Math.min(BATCH_RETRY_LIMIT, batchRetryCount + 1) : 0
    setBatchHistory(nextHistory)
    setBatchRetryCount(nextRetryCount)
    onBatchRetrySnapshotChange?.({ retryCount: nextRetryCount, history: nextHistory })
    if (!summary.failedIds.length) return
    const firstFailedBlock = blocks.find((block) => block.id === summary.failedIds[0])
    setSelectedBlockIds(new Set(summary.failedIds))
    setSelectedBlockId(summary.failedIds[0])
    setSelectionAnchorId(summary.failedIds[0])
    setQuickDraft(firstFailedBlock?.kind === 'voice' ? firstFailedBlock.text : '')
  }

  async function runBatchGeneration(ids: string[], retry = false) {
    if (!onRegenerateMany || !ids.length || batchRunning) return
    setBatchRunning(true)
    setBatchResult(null)
    try {
      const summary = await onRegenerateMany(ids)
      if (summary) applyBatchResult(summary, retry)
    } finally {
      setBatchRunning(false)
    }
  }

  async function applyBatchVoice(regenerate: boolean) {
    if (!onBatchVoiceChange || !selectedVoiceIds.length || batchRunning) return
    setBatchRunning(regenerate)
    setBatchResult(null)
    try {
      const summary = await onBatchVoiceChange(selectedVoiceIds, batchVoice.id, regenerate)
      if (summary) applyBatchResult(summary, false)
      else {
        setBatchResult(null)
        setBatchRetryCount(0)
        onBatchRetrySnapshotChange?.({ retryCount: 0, history: batchHistory })
      }
      setBatchPreviewOpen(false)
    } finally {
      setBatchRunning(false)
    }
  }

  function selectVoiceBlocks(ids: string[]) {
    if (!ids.length) return
    setSelectedBlockIds(new Set(ids))
    setSelectedBlockId(ids[0])
    setSelectionAnchorId(ids[0])
  }

  function clearSelection() {
    setSelectedBlockIds(new Set())
    setSelectedBlockId(null)
    setSelectionAnchorId(null)
    setBatchCommandPreview(null)
  }

  function stageBatchCommand(kind: BatchCommandKind, ids: string[]) {
    if (!ids.length || batchRunning) return
    setBatchCommandPreview({ kind, ids: [...ids] })
  }

  async function executeBatchCommand() {
    const preview = batchCommandPreview
    if (!preview) return
    setBatchCommandPreview(null)
    if (preview.kind === 'delete') {
      onRemoveMany?.(preview.ids)
      clearSelection()
      return
    }
    await runBatchGeneration(preview.ids, preview.kind === 'retry-failed')
  }

  function performBatchMove(direction: -1 | 1) {
    if (!onMoveMany || !selectedIds.length) return
    onMoveMany(selectedIds, direction)
  }

  function handleTimelineCommandKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.defaultPrevented) return
    const target = event.target as HTMLElement
    if (target.closest('textarea, input, select, button, a, [contenteditable="true"]')) return

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
      const redo = event.shiftKey
      if ((redo && !canRedo) || (!redo && !canUndo)) return
      event.preventDefault()
      event.stopPropagation()
      if (redo) onRedo?.()
      else onUndo?.()
      return
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'y') {
      if (!canRedo) return
      event.preventDefault()
      event.stopPropagation()
      onRedo?.()
      return
    }

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'a') {
      const voiceIds = blocks.filter((block) => block.kind === 'voice').map((block) => block.id)
      if (!voiceIds.length) return
      event.preventDefault()
      event.stopPropagation()
      selectVoiceBlocks(voiceIds)
      return
    }
    if (event.key === '?') {
      event.preventDefault()
      event.stopPropagation()
      setShortcutHelpOpen((open) => !open)
      return
    }
    if (event.key === 'Escape' && selectedBlockIds.size > 1) {
      event.preventDefault()
      event.stopPropagation()
      clearSelection()
      return
    }
    if (selectedBlockIds.size <= 1) return

    if (event.key.toLowerCase() === 'r' && !event.metaKey && !event.ctrlKey && !event.altKey) {
      const ids = event.shiftKey ? selectedFailedVoiceIds : selectedVoiceIds
      if (!ids.length) return
      event.preventDefault()
      event.stopPropagation()
      stageBatchCommand(event.shiftKey ? 'retry-failed' : 'regenerate', ids)
      return
    }
    if ((event.key === 'Delete' || event.key === 'Backspace') && onRemoveMany) {
      event.preventDefault()
      event.stopPropagation()
      stageBatchCommand('delete', selectedIds)
      return
    }
    if (event.altKey && event.key === 'ArrowLeft' && canMoveSelectionLeft) {
      event.preventDefault()
      event.stopPropagation()
      performBatchMove(-1)
      return
    }
    if (event.altKey && event.key === 'ArrowRight' && canMoveSelectionRight) {
      event.preventDefault()
      event.stopPropagation()
      performBatchMove(1)
    }
  }

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
    if (target.closest('button, textarea, input, a, .soa-dubbing-block, .soa-dubbing-pause-block, .soa-dubbing-block__grip')) return
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

  function startTimelineScrub(event: PointerEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement
    if (target.closest('button, textarea, input, a, .soa-dubbing-block, .soa-dubbing-pause-block')) return
    timelineScrubbingRef.current = true
    event.currentTarget.setPointerCapture?.(event.pointerId)
    seekFromTimeline(event)
  }

  function continueTimelineScrub(event: PointerEvent<HTMLDivElement>) {
    if (!timelineScrubbingRef.current) return
    seekFromTimeline(event)
  }

  function stopTimelineScrub(event: PointerEvent<HTMLDivElement>) {
    timelineScrubbingRef.current = false
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  useEffect(() => {
    setQuickDraft(selectedVoiceBlock?.text ?? '')
  }, [selectedVoiceBlock?.id, selectedVoiceBlock?.text])

  useEffect(() => {
    setBatchPreviewOpen(false)
    setBatchCommandPreview(null)
    if (firstSelectedVoiceId) setBatchVoiceId(firstSelectedVoiceId)
  }, [firstSelectedVoiceId, selectedIdKey, selectedVoiceIdKey])

  useEffect(() => {
    onSelectionChange?.(selectedIdKey ? selectedIdKey.split('|') : [])
  }, [onSelectionChange, selectedIdKey])

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
    <section
      className="soa-timeline soa-dubbing-timeline"
      aria-label="음성 블록 편집"
      onKeyDownCapture={handleTimelineCommandKeyDown}
    >
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
        <p>트랙 클릭 위치 이동 · Ctrl/Cmd 클릭 다중 선택 · Shift 클릭 범위 선택 · Ctrl/Cmd+A 대사 전체 · R 일괄 재생성 · ? 단축키</p>
        <div className="soa-timeline-selection-actions" aria-label="타임라인 빠른 선택">
          <button
            type="button"
            disabled={!blocks.some((block) => block.kind === 'voice')}
            onClick={() => selectVoiceBlocks(blocks.filter((block) => block.kind === 'voice').map((block) => block.id))}
          >대사 전체</button>
          <button
            type="button"
            disabled={!blocks.some((block) => block.kind === 'voice' && block.status === 'failed')}
            onClick={() => selectVoiceBlocks(blocks.filter((block) => block.kind === 'voice' && block.status === 'failed').map((block) => block.id))}
          >실패만</button>
        </div>
        <div className="soa-timeline-history-controls" aria-label="타임라인 편집 이력">
          <button
            type="button"
            disabled={!canUndo}
            onClick={() => onUndo?.()}
            aria-label={undoLabel ? `${undoLabel} 되돌리기` : '편집 되돌리기'}
            title={undoLabel ? `되돌리기 · ${undoLabel}` : '되돌리기 · Ctrl/Cmd+Z'}
          >↶ <span>Undo</span></button>
          <button
            type="button"
            disabled={!canRedo}
            onClick={() => onRedo?.()}
            aria-label={redoLabel ? `${redoLabel} 다시 실행` : '편집 다시 실행'}
            title={redoLabel ? `다시 실행 · ${redoLabel}` : '다시 실행 · Ctrl/Cmd+Shift+Z'}
          >↷ <span>Redo</span></button>
        </div>
        <div className="soa-timeline-zoom" aria-label="타임라인 확대 축소">
          <button type="button" onClick={() => setZoom((value) => Math.max(0.72, value - 0.14))} aria-label="타임라인 축소">−</button>
          <button type="button" onClick={() => setZoom(getDefaultTimelineZoom())} aria-label="타임라인 기본 배율">{Math.round(zoom * 100)}%</button>
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
          <div className="soa-timeline-command-bar" aria-label="다중 선택 키보드 명령">
            <strong>COMMAND</strong>
            <button type="button" disabled={!selectedVoiceIds.length || batchRunning} onClick={() => stageBatchCommand('regenerate', selectedVoiceIds)}><kbd>R</kbd> 재생성</button>
            <button type="button" disabled={!selectedFailedVoiceIds.length || batchRunning || batchRetryLimitReached} onClick={() => stageBatchCommand('retry-failed', selectedFailedVoiceIds)}><kbd>⇧R</kbd> 실패만</button>
            <button type="button" disabled={!onMoveMany || !canMoveSelectionLeft} onClick={() => performBatchMove(-1)}><kbd>⌥←</kbd> 앞으로</button>
            <button type="button" disabled={!onMoveMany || !canMoveSelectionRight} onClick={() => performBatchMove(1)}><kbd>⌥→</kbd> 뒤로</button>
            <button type="button" className="is-danger" disabled={!onRemoveMany || batchRunning} onClick={() => stageBatchCommand('delete', selectedIds)}><kbd>Del</kbd> 삭제</button>
            <button type="button" onClick={clearSelection}><kbd>Esc</kbd> 해제</button>
            <button type="button" aria-expanded={shortcutHelpOpen} onClick={() => setShortcutHelpOpen((open) => !open)}><kbd>?</kbd> 도움말</button>
          </div>
          {shortcutHelpOpen ? (
            <div className="soa-timeline-command-help" role="note">
              <span><kbd>Ctrl/Cmd+Z</kbd> 최근 편집 되돌리기</span>
              <span><kbd>Ctrl/Cmd+Shift+Z</kbd> 다시 실행</span>
              <span><kbd>Ctrl/Cmd+A</kbd> 대사 전체 선택</span>
              <span><kbd>R</kbd> 선택 재생성 미리보기</span>
              <span><kbd>Shift+R</kbd> 실패만 재시도 미리보기</span>
              <span><kbd>Alt+←/→</kbd> 선택 이동</span>
              <span><kbd>Delete</kbd> 삭제 안전 확인</span>
              <span><kbd>Esc</kbd> 다중 선택 해제</span>
            </div>
          ) : null}
          <div className="soa-timeline-batch-controls">
            <label>
              <span>일괄 목소리</span>
              <select
                aria-label="선택 클립 일괄 목소리"
                value={batchVoiceId}
                disabled={!selectedVoiceBlocks.length || selectedGeneratingVoiceCount > 0}
                onChange={(event) => {
                  setBatchVoiceId(event.target.value)
                  setBatchPreviewOpen(false)
                }}
              >
                {voicePresets.map((voice) => (
                  <option key={voice.id} value={voice.id}>{voice.name}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={!selectedVoiceBlocks.length || selectedGeneratingVoiceCount > 0}
              onClick={() => setBatchPreviewOpen((value) => !value)}
            >
              {batchPreviewOpen ? '미리보기 닫기' : '변경 미리보기'}
            </button>
            <button
              type="button"
              disabled={!onRegenerateMany || !selectedVoiceIds.length || selectedGeneratingVoiceCount > 0 || batchRunning}
              onClick={() => selectedReadyVoiceCount > 0
                ? stageBatchCommand('regenerate', selectedVoiceIds)
                : void runBatchGeneration(selectedVoiceIds)}
            >{batchRunning ? '일괄 처리 중…' : '선택 재생성'}</button>
            <button
              type="button"
              disabled={!onRegenerateMany || !selectedFailedVoiceIds.length || selectedGeneratingVoiceCount > 0 || batchRunning || batchRetryLimitReached}
              onClick={() => void runBatchGeneration(selectedFailedVoiceIds, true)}
            >{batchRetryLimitReached
                ? `빠른 재시도 ${BATCH_RETRY_LIMIT}회 도달`
                : `실패만 재시도${selectedFailedVoiceIds.length ? ` ${selectedFailedVoiceIds.length}` : ''}`}
            </button>
          </div>
          {batchPreviewOpen ? (
            <div className="soa-timeline-batch-preview" role="status" aria-label="일괄 목소리 변경 영향 미리보기">
              <strong>{batchVoice.name} 목소리로 변경 · 대상 {batchVoiceChangeCount}개</strong>
              <span>대사 {selectedVoiceBlocks.length}개 · 쉼 {selectedBlocks.length - selectedVoiceBlocks.length}개 제외</span>
              <span>기존 완성 음원 {selectedReadyVoiceCount}개는 목소리가 바뀌면 폐기됩니다.</span>
              {selectedGeneratingVoiceCount ? <span className="is-warning">생성 중 {selectedGeneratingVoiceCount}개가 있어 지금은 적용할 수 없습니다.</span> : null}
              <div>
                <button
                  type="button"
                  disabled={!onBatchVoiceChange || !batchVoiceChangeCount || selectedGeneratingVoiceCount > 0 || batchRunning}
                  onClick={() => void applyBatchVoice(false)}
                >목소리만 적용</button>
                <button
                  type="button"
                  className="is-primary"
                  disabled={!onBatchVoiceChange || !selectedVoiceIds.length || selectedGeneratingVoiceCount > 0 || batchRunning}
                  onClick={() => void applyBatchVoice(true)}
                >{batchRunning ? '적용·재생성 중…' : '적용 후 재생성'}</button>
              </div>
            </div>
          ) : null}
          {batchCommandPreview ? (
            <div className="soa-timeline-batch-preview is-command" role="alertdialog" aria-label="일괄 명령 안전 미리보기">
              <strong>
                {batchCommandPreview.kind === 'delete'
                  ? `선택 ${commandPreviewBlocks.length}개 삭제`
                  : batchCommandPreview.kind === 'retry-failed'
                    ? `실패 대사 ${commandPreviewVoiceCount}개 재시도`
                    : `선택 대사 ${commandPreviewVoiceCount}개 재생성`}
              </strong>
              <span>대사 {commandPreviewVoiceCount}개 · 쉼 {commandPreviewBlocks.length - commandPreviewVoiceCount}개</span>
              <span className={batchCommandPreview.kind === 'delete' || commandPreviewReadyCount > 0 ? 'is-warning' : undefined}>
                {batchCommandPreview.kind === 'delete'
                  ? '삭제는 즉시 반영됩니다. 대상을 확인한 뒤 실행하세요.'
                  : commandPreviewReadyCount > 0
                    ? `완성 음원 ${commandPreviewReadyCount}개는 다시 생성하면서 교체됩니다.`
                    : '기존 완성 음원을 덮어쓰지 않습니다.'}
              </span>
              <div>
                <button type="button" onClick={() => setBatchCommandPreview(null)}>취소</button>
                <button type="button" className="is-primary" disabled={batchRunning} onClick={() => void executeBatchCommand()}>
                  {batchCommandPreview.kind === 'delete' ? '삭제 실행' : '안전 실행'}
                </button>
              </div>
            </div>
          ) : null}
          <div className="soa-timeline-quick-editor__actions is-batch">
            <button type="button" disabled={!onMoveMany || !canMoveSelectionLeft} onClick={() => performBatchMove(-1)}>선택 앞으로</button>
            <button type="button" disabled={!onMoveMany || !canMoveSelectionRight} onClick={() => performBatchMove(1)}>선택 뒤로</button>
            <button type="button" onClick={clearSelection}>선택 해제</button>
            <button type="button" className="is-danger" disabled={!onRemoveMany} onClick={() => stageBatchCommand('delete', selectedIds)}>선택 삭제</button>
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

      {batchResult ? (
        <div className={`soa-timeline-batch-result ${batchResult.failedIds.length ? 'has-failures' : 'is-success'}`} role="status" aria-label="최근 일괄 음성 작업 결과">
          <strong>최근 일괄 작업</strong>
          <span>성공 {batchResult.succeededIds.length} · 실패 {batchResult.failedIds.length} · 건너뜀 {batchResult.skippedIds.length}</span>
          {batchResult.failedIds.length ? (
            <>
              <small>실패한 클립만 선택했습니다.{batchRetryCount ? ` · 빠른 재시도 ${batchRetryCount}/${BATCH_RETRY_LIMIT}회` : ' · 원인별로 골라 다시 시도할 수 있습니다.'}</small>
              <div className="soa-timeline-batch-result__groups" aria-label="실패 원인별 재시도">
                {batchFailureGroups.map((group) => (
                  <button
                    key={group.kind}
                    type="button"
                    disabled={!onRegenerateMany || batchRunning || batchRetryLimitReached}
                    onClick={() => {
                      selectVoiceBlocks(group.ids)
                      void runBatchGeneration(group.ids, true)
                    }}
                  >
                    {batchFailureLabels[group.kind]} {group.ids.length} · 재시도
                  </button>
                ))}
              </div>
              {batchRetryLimitReached ? (
                <small className="is-warning">빠른 재시도 상한에 도달했습니다. 오류 원인을 확인한 뒤 선택 재생성을 사용하세요.</small>
              ) : null}
            </>
          ) : (
            <small>선택한 대사의 음성 작업이 모두 완료됐습니다.</small>
          )}
          {batchHistory.length ? (
            <div className="soa-timeline-batch-history">
              <button
                type="button"
                className="soa-timeline-batch-history__toggle"
                aria-expanded={batchHistoryOpen}
                onClick={() => setBatchHistoryOpen((open) => !open)}
              >세션 재시도 이력 {batchHistory.length}건</button>
              {batchHistoryOpen ? (
                <ol>
                  {batchHistory.map((entry) => (
                    <li key={`${entry.completedAt}-${entry.retry ? 'retry' : 'batch'}`}>
                      <time dateTime={entry.completedAt}>
                        {new Date(entry.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </time>
                      <span>{entry.retry ? '빠른 재시도' : '일괄 작업'}</span>
                      <strong>성공 {entry.succeeded} · 실패 {entry.failed} · 건너뜀 {entry.skipped}</strong>
                      {entry.failureKinds.length ? (
                        <small>{entry.failureKinds.map((kind) => batchFailureLabels[kind]).join(' · ')}</small>
                      ) : null}
                    </li>
                  ))}
                </ol>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {!batchResult && batchHistory.length ? (
        <div className="soa-timeline-batch-result is-session" role="status" aria-label="복원된 일괄 재시도 이력">
          <strong>복원된 세션 재시도 이력</strong>
          <span>{batchHistory.length}건 · 빠른 재시도 {batchRetryCount}/{BATCH_RETRY_LIMIT}회</span>
          <small>클립 ID·원문·음원·오류 문자열은 저장하지 않고 성공/실패 집계와 실패 분류만 복원했습니다.</small>
        </div>
      ) : null}

      <div className="soa-capcut-timeline" data-timeline-axis="horizontal">
        <div className="soa-capcut-track-row">
          <div className="soa-capcut-track-label">
            <strong>VOICE 1</strong>
            <small>대사 트랙</small>
            <span>{playbackActive ? '재생 중' : '편집 준비'}</span>
            <em>시간 →</em>
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
                style={{
                  width: `${canvasWidth}px`,
                  '--soa-timeline-second-px': `${TIMELINE_PIXELS_PER_SECOND * zoom}px`,
                } as CSSProperties}
                onPointerDown={startTimelineScrub}
                onPointerMove={continueTimelineScrub}
                onPointerUp={stopTimelineScrub}
                onPointerCancel={stopTimelineScrub}
                aria-label="가로 타임라인을 클릭하거나 드래그해 재생 위치 이동"
              >
                <div className="soa-capcut-ruler" aria-hidden="true">
                  {rulerTicks.map((tick, index) => (
                    <span key={`${tick.time}-${index}`} style={{ left: `${tick.left}px` }}>
                      <i />{formatDuration(tick.time)}
                    </span>
                  ))}
                </div>
                <i className="soa-capcut-playhead" style={{ left: `${playheadLeft}px` }} aria-hidden="true">
                  <span>{formatDuration(playbackTimelineSeconds)}</span>
                </i>
                <div className="soa-dubbing-block-list">
                  {blocks.map((block, index) => {
                    const metric = metrics[index]
                    const metricStyle = {
                      '--soa-clip-offset': `${metric.offset}px`,
                      '--soa-clip-width': `${metric.width}px`,
                    } as CSSProperties
                    if (block.kind === 'pause') {
                      return (
                        <div
                          key={block.id}
                          ref={(element) => {
                            if (element) clipRefs.current.set(block.id, element)
                            else clipRefs.current.delete(block.id)
                          }}
                          className={`soa-dubbing-pause-block ${selectedBlockIds.has(block.id) ? 'is-selected' : ''}`}
                          style={metricStyle}
                          tabIndex={0}
                          draggable={selectedBlockIds.size <= 1}
                          title={`쉼 ${block.durationSeconds.toFixed(1)}초`}
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
                        className="soa-timeline-clip-slot"
                        style={metricStyle}
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
