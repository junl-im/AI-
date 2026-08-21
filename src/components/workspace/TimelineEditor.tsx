import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'
import type { TimelineBatchGenerationSummary } from '../../hooks/useTimelineGeneration'
import { useTimelineEditorSelection, type TimelineSelectionMode } from '../../hooks/useTimelineEditorSelection'
import {
  TIMELINE_BATCH_RETRY_LIMIT,
  batchFailureLabels,
  useTimelineEditorBatch,
  type TimelineBatchVoiceChangeHandler,
} from '../../hooks/useTimelineEditorBatch'
import { usePlayerStore } from '../../store/usePlayerStore'
import { buildVoiceChoices, resolveVoiceChoice, type VoiceChoice } from '../../voice/voiceChoices'
import { findAdjacentVoiceBlockId } from '../../timeline/timelineSelection'
import type { WorkspaceBatchRetrySnapshot } from '../../workspace/sessionTypes'
import type { TimelineBlock } from '../../workspace/workspaceTypes'
import {
  TIMELINE_INSET_PX,
  TIMELINE_PIXELS_PER_SECOND,
  buildTimelineMetrics,
  buildTimelineRulerTicks,
  getTimelineCanvasWidth,
  getTimelineContentWidth,
} from '../../timeline/timelineGeometry'
import { TimelineQuickEditor } from './TimelineQuickEditor'
import { TimelineVoiceBlockCard } from './TimelineVoiceBlockCard'

const DEFAULT_VOICE_CHOICES = buildVoiceChoices([])

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
  onBatchVoiceChange?: TimelineBatchVoiceChangeHandler
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
  voiceChoices?: VoiceChoice[]
  currentVoiceId?: string
}

function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds))
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`
}

function getDefaultTimelineZoom(): number {
  return typeof window !== 'undefined' && window.innerWidth <= 760 ? 1.25 : 1
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
  voiceChoices = DEFAULT_VOICE_CHOICES,
  currentVoiceId,
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
  const [quickDraft, setQuickDraft] = useState('')
  const [shortcutHelpOpen, setShortcutHelpOpen] = useState(false)

  const selection = useTimelineEditorSelection({ blocks, onSelectionChange })
  const {
    selectedBlockId,
    selectedBlockIds,
    selectedBlocks,
    selectedBlock,
    selectedVoiceBlock,
    selectedIds,
    selectedVoiceBlocks,
    selectedVoiceIds,
    selectedDuration,
    multiSelectionActive,
    replaceSelection,
  } = selection

  const batch = useTimelineEditorBatch({
    blocks,
    selectedVoiceBlocks,
    voiceChoices,
    currentVoiceId,
    batchRetrySnapshot,
    onBatchRetrySnapshotChange,
    onBatchVoiceChange,
    onRegenerateMany,
    onReplaceSelection: replaceSelection,
    onRemoveMany,
    onClearSelection: selection.clearSelection,
  })
  const {
    batchVoiceId,
    setBatchVoiceId,
    batchPreviewOpen,
    setBatchPreviewOpen,
    batchRunning,
    batchResult,
    batchRetryCount,
    batchHistory,
    batchHistoryOpen,
    setBatchHistoryOpen,
    batchCommandPreview,
    setBatchCommandPreview,
    batchFailureGroups,
    batchRetryLimitReached,
    batchVoice,
    currentVoice,
    voiceSelectionSummary,
    batchVoiceChangeCount,
    selectedFailedVoiceIds,
    selectedReadyVoiceCount,
    selectedGeneratingVoiceCount,
    commandPreviewBlocks,
    commandPreviewVoiceCount,
    commandPreviewReadyCount,
    selectedVoiceChoice,
    selectedVoiceUnavailable,
    selectedVoiceMissingProfile,
    selectedUnavailableVoiceBlocks,
    unavailableVoiceSummary,
    unavailableReadyCount,
    unavailableGeneratingCount,
    unavailableMissingProfileCount,
    recoveryReplacementChoices,
    recoveryVoiceId,
    setRecoveryVoiceId,
    recoveryVoice,
    recoveryImpactOpen,
    setRecoveryImpactOpen,
    recoveryRunning,
    runBatchGeneration,
    applyBatchVoice,
    applyRecovery,
    stageBatchCommand,
    executeBatchCommand,
  } = batch

  const metrics = useMemo(() => buildTimelineMetrics(blocks, zoom), [blocks, zoom])
  const totalDuration = blocks.reduce((total, block) => total + Math.max(0, block.durationSeconds), 0)
  const timelineContentWidth = getTimelineContentWidth(metrics)
  const canvasWidth = getTimelineCanvasWidth(metrics)
  const playbackBlock = blocks.find((block) => block.kind === 'voice' && block.trackId === playbackTrackId)
    ?? blocks.find((block) => block.kind === 'voice' && block.trackId === currentTrackId)
    ?? null
  const observedPlaybackBlockIdRef = useRef<string | null>(playbackBlock?.id ?? null)
  const playbackMetric = playbackBlock ? metrics.find((metric) => metric.id === playbackBlock.id) : null
  const playheadLeft = playbackMetric
    ? playbackMetric.offset + Math.min(1, playbackPositionSeconds / playbackMetric.duration) * playbackMetric.width
    : TIMELINE_INSET_PX
  const playbackMetricIndex = playbackMetric ? metrics.findIndex((metric) => metric.id === playbackMetric.id) : -1
  const playbackTimelineSeconds = playbackMetricIndex >= 0
    ? blocks.slice(0, playbackMetricIndex).reduce((total, block) => total + Math.max(0, block.durationSeconds), 0)
      + Math.min(playbackMetric?.duration ?? 0, playbackPositionSeconds)
    : 0
  const previousVoiceBlockId = selectedVoiceBlock ? findAdjacentVoiceBlockId(blocks, selectedVoiceBlock.id, -1) : null
  const nextVoiceBlockId = selectedVoiceBlock ? findAdjacentVoiceBlockId(blocks, selectedVoiceBlock.id, 1) : null
  const canMoveSelectionLeft = selectedBlocks.some((block) => {
    const index = blocks.findIndex((item) => item.id === block.id)
    return index > 0 && !selectedBlockIds.has(blocks[index - 1].id)
  })
  const canMoveSelectionRight = selectedBlocks.some((block) => {
    const index = blocks.findIndex((item) => item.id === block.id)
    return index >= 0 && index < blocks.length - 1 && !selectedBlockIds.has(blocks[index + 1].id)
  })
  const quickDraftTrimmed = quickDraft.trim()
  const quickDraftDirty = Boolean(selectedVoiceBlock && quickDraftTrimmed !== selectedVoiceBlock.text)
  const rulerTicks = buildTimelineRulerTicks(totalDuration, timelineContentWidth)

  function clearSelection() {
    selection.clearSelection()
    setBatchCommandPreview(null)
    setRecoveryImpactOpen(false)
  }

  function selectVoiceBlocks(ids: string[]) {
    selection.selectVoiceBlocks(ids)
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

  const saveQuickDraft = useCallback(() => {
    if (!selectedVoiceBlock) return false
    if (!quickDraftTrimmed) {
      setQuickDraft(selectedVoiceBlock.text)
      return false
    }
    if (quickDraftTrimmed !== selectedVoiceBlock.text) {
      onUpdateText(selectedVoiceBlock.id, quickDraftTrimmed)
    }
    return true
  }, [onUpdateText, quickDraftTrimmed, selectedVoiceBlock])

  function navigateVoiceSelection(direction: -1 | 1) {
    if (!selectedVoiceBlock) return
    const targetId = findAdjacentVoiceBlockId(blocks, selectedVoiceBlock.id, direction)
    if (!targetId) return
    selectBlock(targetId)
    window.requestAnimationFrame(() => {
      clipRefs.current.get(targetId)?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      quickEditorRef.current?.focus()
    })
  }

  async function recoverSelectedVoice(regenerate: boolean) {
    if (!selectedVoiceBlock || !selectedVoiceUnavailable) return
    if (quickDraftDirty && !saveQuickDraft()) return
    await applyRecovery(regenerate)
  }

  function selectBlock(id: string, mode: TimelineSelectionMode = 'single') {
    if (quickDraftDirty) saveQuickDraft()
    selection.selectBlock(id, mode)
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
      clearSelection()
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
    if (!playbackBlock) {
      observedPlaybackBlockIdRef.current = null
      return
    }
    if (multiSelectionActive || observedPlaybackBlockIdRef.current === playbackBlock.id) return
    if (playbackBlock.id === selectedBlockId) {
      observedPlaybackBlockIdRef.current = playbackBlock.id
      return
    }
    if (quickDraftDirty && !saveQuickDraft()) return
    observedPlaybackBlockIdRef.current = playbackBlock.id
    replaceSelection([playbackBlock.id])
  }, [multiSelectionActive, playbackBlock, quickDraftDirty, replaceSelection, saveQuickDraft, selectedBlockId])

  useEffect(() => {
    if (!playbackBlock) return
    const playbackElement = clipRefs.current.get(playbackBlock.id)
    if (typeof playbackElement?.scrollIntoView === 'function') {
      playbackElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    }
  }, [playbackBlock])

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
          <div className={`soa-timeline-selection-voice-summary ${voiceSelectionSummary.mixed ? 'is-mixed' : ''}`} role="status" aria-label="선택 목소리 구성">
            <strong>{voiceSelectionSummary.mixed ? `혼합 목소리 ${voiceSelectionSummary.voiceCount}종` : `목소리 ${voiceSelectionSummary.labels[0]?.voiceName ?? '-'} 1종`}</strong>
            <span>현재 작업 목소리 · {currentVoice.name}</span>
            <span>적용 대상 · 대사 {selectedVoiceBlocks.length}개</span>
            {voiceSelectionSummary.labels.slice(0, 3).map((item) => <small key={item.voiceId}>{item.voiceName} {item.count}개</small>)}
            {voiceSelectionSummary.mixed ? <em>일괄 변경은 선택된 대사만 대상으로 합니다. 변경 미리보기에서 기존 음원 영향을 확인하세요.</em> : null}
          </div>
          {selectedUnavailableVoiceBlocks.length ? (
            <div className="soa-timeline-batch-recovery" role="status" aria-label="선택 사용 불가 목소리 복구">
              <div className="soa-timeline-batch-recovery__summary">
                <strong>사용 불가 MY VOICE {selectedUnavailableVoiceBlocks.length}개</strong>
                <span>선택 대사 {selectedVoiceBlocks.length}개 중 사용 불가 항목만 복구합니다.</span>
                <div aria-label="사용 불가 목소리 원래 구성">
                  {unavailableVoiceSummary.labels.slice(0, 4).map((item) => (
                    <small key={item.voiceId}>{item.voiceName} {item.count}개</small>
                  ))}
                </div>
                <em>현재 완성 음원 {unavailableReadyCount}개는 복구 실행 전까지 그대로 유지됩니다.</em>
                {unavailableMissingProfileCount ? <em>프로필 유실 {unavailableMissingProfileCount}개 · 자동 대체하지 않습니다.</em> : null}
              </div>
              <label>
                <span>복구 대체 목소리</span>
                <select
                  aria-label="사용 불가 목소리 일괄 대체 선택"
                  value={recoveryVoiceId}
                  disabled={!recoveryReplacementChoices.length || unavailableGeneratingCount > 0 || recoveryRunning || batchRunning}
                  onChange={(event) => {
                    setRecoveryVoiceId(event.target.value)
                    setRecoveryImpactOpen(false)
                  }}
                >
                  {recoveryReplacementChoices.map((voice) => (
                    <option key={voice.id} value={voice.id}>
                      {voice.kind === 'my-voice' ? `MY · ${voice.name}` : voice.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                disabled={!onBatchVoiceChange || !recoveryVoiceId || unavailableGeneratingCount > 0 || recoveryRunning || batchRunning}
                onClick={() => setRecoveryImpactOpen(true)}
              >복구 영향 확인</button>
              {unavailableGeneratingCount ? <small className="is-warning">생성 중인 사용 불가 대사 {unavailableGeneratingCount}개가 끝난 뒤 복구할 수 있습니다.</small> : null}
            </div>
          ) : null}
          {recoveryImpactOpen && selectedUnavailableVoiceBlocks.length ? (
            <div className="soa-timeline-batch-preview is-recovery" role="alertdialog" aria-label="사용 불가 목소리 일괄 복구 영향 확인">
              <strong>{selectedUnavailableVoiceBlocks.length}개를 {recoveryVoice.name} 목소리로 복구</strong>
              <span>선택 {selectedVoiceBlocks.length}개 중 사용 불가 MY VOICE {selectedUnavailableVoiceBlocks.length}개만 변경합니다.</span>
              <span>원래 구성 · {unavailableVoiceSummary.labels.map((item) => `${item.voiceName} ${item.count}개`).join(' · ')}</span>
              <span className={unavailableReadyCount ? 'is-warning' : undefined}>
                {unavailableReadyCount
                  ? `현재 완성 음원 ${unavailableReadyCount}개는 실행하는 순간 폐기되고 새 목소리 기준 queued 상태가 됩니다.`
                  : '현재 완성 음원을 폐기하지 않습니다.'}
              </span>
              <span>Undo는 목소리 배정을 되돌리지만 과거 음원 파일을 부활시키지 않고 안전하게 queued 상태로 복원합니다.</span>
              <div>
                <button type="button" onClick={() => setRecoveryImpactOpen(false)}>취소</button>
                <button
                  type="button"
                  disabled={!onBatchVoiceChange || recoveryRunning || batchRunning}
                  onClick={() => void applyRecovery(false)}
                >교체만 적용</button>
                <button
                  type="button"
                  className="is-primary"
                  disabled={!onBatchVoiceChange || recoveryRunning || batchRunning}
                  onClick={() => void applyRecovery(true)}
                >{recoveryRunning ? '복구·재생성 중…' : '교체 후 재생성'}</button>
              </div>
            </div>
          ) : null}
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
                {voiceChoices.map((voice) => (
                  <option key={voice.id} value={voice.id} disabled={!voice.ready}>
                    {voice.kind === 'my-voice' ? `MY · ${voice.name}` : voice.name}
                  </option>
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
                ? `빠른 재시도 ${TIMELINE_BATCH_RETRY_LIMIT}회 도달`
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
        <TimelineQuickEditor
          selectedBlock={selectedBlock}
          selectedVoiceBlock={selectedVoiceBlock}
          quickEditorRef={quickEditorRef}
          quickDraft={quickDraft}
          quickDraftDirty={quickDraftDirty}
          quickDraftTrimmed={quickDraftTrimmed}
          playbackActive={Boolean(selectedVoiceBlock && playbackBlock?.id === selectedVoiceBlock.id && playbackActive)}
          canNavigatePrevious={Boolean(previousVoiceBlockId)}
          canNavigateNext={Boolean(nextVoiceBlockId)}
          canMovePausePrevious={blocks[0]?.id !== selectedBlock.id}
          canMovePauseNext={blocks.at(-1)?.id !== selectedBlock.id}
          recovery={selectedVoiceUnavailable && selectedVoiceChoice ? {
            unavailable: true,
            missingProfile: selectedVoiceMissingProfile,
            choiceName: selectedVoiceMissingProfile ? selectedVoiceBlock?.voiceName ?? selectedVoiceChoice.name : selectedVoiceChoice.name,
            replacementVoiceId: recoveryVoiceId,
            replacementChoices: recoveryReplacementChoices,
            running: recoveryRunning,
          } : null}
          onDraftChange={setQuickDraft}
          onSave={saveQuickDraft}
          onPreviewOrGenerate={() => {
            saveQuickDraft()
            if (!selectedVoiceBlock) return
            if (selectedVoiceBlock.status === 'ready' && selectedVoiceBlock.trackId) toggleTrack(selectedVoiceBlock.trackId)
            else if (!selectedVoiceUnavailable) onRetry(selectedVoiceBlock.id)
          }}
          onRegenerate={() => {
            if (!selectedVoiceBlock || selectedVoiceUnavailable) return
            saveQuickDraft()
            onRetry(selectedVoiceBlock.id)
          }}
          onSplit={() => { if (selectedVoiceBlock) { saveQuickDraft(); onSplit(selectedVoiceBlock.id) } }}
          onRemove={() => removeSelection(selectedBlock.id)}
          onMovePause={(direction) => moveSelection(selectedBlock.id, direction)}
          onNavigateVoice={navigateVoiceSelection}
          onRecoveryVoiceChange={setRecoveryVoiceId}
          onRecoverVoice={(regenerate) => void recoverSelectedVoice(regenerate)}
        />
      ) : null}

      {batchResult ? (
        <div className={`soa-timeline-batch-result ${batchResult.failedIds.length ? 'has-failures' : 'is-success'}`} role="status" aria-label="최근 일괄 음성 작업 결과">
          <strong>최근 일괄 작업</strong>
          <span>성공 {batchResult.succeededIds.length} · 실패 {batchResult.failedIds.length} · 건너뜀 {batchResult.skippedIds.length}</span>
          {batchResult.failedIds.length ? (
            <>
              <small>실패한 클립만 선택했습니다.{batchRetryCount ? ` · 빠른 재시도 ${batchRetryCount}/${TIMELINE_BATCH_RETRY_LIMIT}회` : ' · 원인별로 골라 다시 시도할 수 있습니다.'}</small>
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
          <span>{batchHistory.length}건 · 빠른 재시도 {batchRetryCount}/{TIMELINE_BATCH_RETRY_LIMIT}회</span>
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
                          <button
                            type="button"
                            className="soa-timeline-touch-select is-pause"
                            aria-label={selectedBlockIds.has(block.id) ? '쉼 블록 선택 해제' : '쉼 블록 다중 선택'}
                            aria-pressed={selectedBlockIds.has(block.id)}
                            onClick={(event) => { event.stopPropagation(); selectBlock(block.id, 'toggle') }}
                          >
                            {selectedBlockIds.has(block.id) ? '✓' : '＋'}
                          </button>
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
                        <TimelineVoiceBlockCard
                          block={block}
                          voiceIndex={voiceIndex}
                          index={index}
                          total={blocks.length}
                          width={metric.width}
                          selected={selectedBlockIds.has(block.id)}
                          multiSelected={selectedBlockIds.size > 1 && selectedBlockIds.has(block.id)}
                          playbackActive={active && playbackActive}
                          voiceUnavailable={resolveVoiceChoice(voiceChoices, block.voiceId).kind === 'my-voice' && !resolveVoiceChoice(voiceChoices, block.voiceId).ready}
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

      <button type="button" className="soa-dubbing-add-block" onClick={onAddVoice} aria-label="새 대사 블록 추가">＋</button>
    </section>
  )
}
