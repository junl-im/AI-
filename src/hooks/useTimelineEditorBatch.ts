import { useEffect, useMemo, useState } from 'react'
import type {
  TimelineBatchFailureKind,
  TimelineBatchGenerationSummary,
} from './useTimelineGeneration'
import { voicePresets } from '../tts/voicePresets'
import { resolveVoiceChoice, type VoiceChoice } from '../voice/voiceChoices'
import { summarizeTimelineVoiceSelection } from '../timeline/timelineSelection'
import type { WorkspaceBatchHistoryEntry, WorkspaceBatchRetrySnapshot } from '../workspace/sessionTypes'
import type { TimelineBlock, TimelineVoiceBlock } from '../workspace/workspaceTypes'

export const TIMELINE_BATCH_RETRY_LIMIT = 3
export const TIMELINE_BATCH_HISTORY_LIMIT = 6

export type TimelineBatchCommandKind = 'regenerate' | 'retry-failed' | 'delete'
export type TimelineVoiceChangeReason = 'batch' | 'recovery'

export interface TimelineBatchCommandPreview {
  kind: TimelineBatchCommandKind
  ids: string[]
}

export type TimelineBatchVoiceChangeHandler = (
  ids: string[],
  voiceId: string,
  regenerate: boolean,
  reason?: TimelineVoiceChangeReason,
) => Promise<TimelineBatchGenerationSummary | null> | TimelineBatchGenerationSummary | null

interface UseTimelineEditorBatchOptions {
  blocks: TimelineBlock[]
  selectedVoiceBlocks: TimelineVoiceBlock[]
  voiceChoices: VoiceChoice[]
  currentVoiceId?: string
  batchRetrySnapshot?: WorkspaceBatchRetrySnapshot
  onBatchRetrySnapshotChange?: (snapshot: WorkspaceBatchRetrySnapshot) => void
  onBatchVoiceChange?: TimelineBatchVoiceChangeHandler
  onRegenerateMany?: (ids: string[]) => Promise<TimelineBatchGenerationSummary>
  onReplaceSelection: (ids: string[]) => void
  onRemoveMany?: (ids: string[]) => void
  onClearSelection: () => void
}

const batchFailureLabels: Record<TimelineBatchFailureKind, string> = {
  engine: '엔진',
  preset: '프리셋',
  network: '연결',
  cancelled: '취소',
  unknown: '기타',
}

export { batchFailureLabels }

export function useTimelineEditorBatch({
  blocks,
  selectedVoiceBlocks,
  voiceChoices,
  currentVoiceId,
  batchRetrySnapshot,
  onBatchRetrySnapshotChange,
  onBatchVoiceChange,
  onRegenerateMany,
  onReplaceSelection,
  onRemoveMany,
  onClearSelection,
}: UseTimelineEditorBatchOptions) {
  const selectedVoiceIds = useMemo(() => selectedVoiceBlocks.map((block) => block.id), [selectedVoiceBlocks])
  const selectedVoiceIdKey = selectedVoiceIds.join('|')
  const firstSelectedVoiceId = selectedVoiceBlocks[0]?.voiceId ?? null
  const [batchVoiceId, setBatchVoiceId] = useState(
    () => voiceChoices.find((voice) => voice.ready)?.id ?? voicePresets[0].id,
  )
  const [batchPreviewOpen, setBatchPreviewOpen] = useState(false)
  const [batchRunning, setBatchRunning] = useState(false)
  const [batchResult, setBatchResult] = useState<TimelineBatchGenerationSummary | null>(null)
  const [batchRetryCount, setBatchRetryCount] = useState(batchRetrySnapshot?.retryCount ?? 0)
  const [batchHistory, setBatchHistory] = useState<WorkspaceBatchHistoryEntry[]>(batchRetrySnapshot?.history ?? [])
  const [batchHistoryOpen, setBatchHistoryOpen] = useState(false)
  const [batchCommandPreview, setBatchCommandPreview] = useState<TimelineBatchCommandPreview | null>(null)
  const [recoveryVoiceId, setRecoveryVoiceId] = useState('')
  const [recoveryImpactOpen, setRecoveryImpactOpen] = useState(false)
  const [recoveryRunning, setRecoveryRunning] = useState(false)

  const selectedFailedVoiceIds = selectedVoiceBlocks
    .filter((block) => block.status === 'failed')
    .map((block) => block.id)
  const selectedReadyVoiceCount = selectedVoiceBlocks.filter((block) => block.status === 'ready').length
  const selectedGeneratingVoiceCount = selectedVoiceBlocks.filter((block) => block.status === 'generating').length
  const batchVoice = resolveVoiceChoice(voiceChoices, batchVoiceId)
  const currentVoice = resolveVoiceChoice(voiceChoices, currentVoiceId ?? batchVoice.id)
  const voiceSelectionSummary = useMemo(
    () => summarizeTimelineVoiceSelection(selectedVoiceBlocks),
    [selectedVoiceBlocks],
  )
  const batchVoiceChangeCount = selectedVoiceBlocks.filter((block) => block.voiceId !== batchVoice.id).length

  const selectedUnavailableVoiceBlocks = useMemo(
    () => selectedVoiceBlocks.filter((block) => {
      const choice = resolveVoiceChoice(voiceChoices, block.voiceId)
      return choice.kind === 'my-voice' && !choice.ready
    }),
    [selectedVoiceBlocks, voiceChoices],
  )
  const selectedUnavailableVoiceIds = useMemo(
    () => selectedUnavailableVoiceBlocks.map((block) => block.id),
    [selectedUnavailableVoiceBlocks],
  )
  const selectedUnavailableVoiceIdKey = selectedUnavailableVoiceIds.join('|')
  const unavailableVoiceSummary = useMemo(
    () => summarizeTimelineVoiceSelection(selectedUnavailableVoiceBlocks),
    [selectedUnavailableVoiceBlocks],
  )
  const unavailableOriginalVoiceIdKey = unavailableVoiceSummary.voiceIds.join('|')
  const unavailableReadyCount = selectedUnavailableVoiceBlocks.filter((block) => block.status === 'ready').length
  const unavailableGeneratingCount = selectedUnavailableVoiceBlocks.filter((block) => block.status === 'generating').length
  const unavailableMissingProfileCount = selectedUnavailableVoiceBlocks.filter((block) => {
    const choice = resolveVoiceChoice(voiceChoices, block.voiceId)
    return choice.kind === 'my-voice' && !choice.ready && !choice.profile
  }).length
  const recoveryReplacementChoices = useMemo(
    () => voiceChoices.filter((voice) => voice.ready && !unavailableVoiceSummary.voiceIds.includes(voice.id)),
    [unavailableOriginalVoiceIdKey, voiceChoices],
  )
  const recoveryVoice = resolveVoiceChoice(voiceChoices, recoveryVoiceId)

  const selectedVoiceBlock = selectedVoiceBlocks.length === 1 ? selectedVoiceBlocks[0] : null
  const selectedVoiceChoice = selectedVoiceBlock ? resolveVoiceChoice(voiceChoices, selectedVoiceBlock.voiceId) : null
  const selectedVoiceUnavailable = Boolean(selectedVoiceChoice?.kind === 'my-voice' && !selectedVoiceChoice.ready)
  const selectedVoiceMissingProfile = Boolean(selectedVoiceUnavailable && !selectedVoiceChoice?.profile)

  const batchFailures = batchResult?.failures
    ?? batchResult?.failedIds.map((id) => ({ id, kind: 'unknown' as const, message: '실패 원인을 확인하지 못했습니다.' }))
    ?? []
  const batchFailureGroups = (Object.keys(batchFailureLabels) as TimelineBatchFailureKind[])
    .map((kind) => ({
      kind,
      ids: batchFailures.filter((failure) => failure.kind === kind).map((failure) => failure.id),
    }))
    .filter((group) => group.ids.length > 0)
  const batchRetryLimitReached = batchRetryCount >= TIMELINE_BATCH_RETRY_LIMIT

  const commandPreviewBlocks = batchCommandPreview
    ? blocks.filter((block) => batchCommandPreview.ids.includes(block.id))
    : []
  const commandPreviewVoiceCount = commandPreviewBlocks.filter((block) => block.kind === 'voice').length
  const commandPreviewReadyCount = commandPreviewBlocks.filter((block) => block.kind === 'voice' && block.status === 'ready').length

  useEffect(() => {
    if (!batchRetrySnapshot) return
    setBatchRetryCount(batchRetrySnapshot.retryCount)
    setBatchHistory(batchRetrySnapshot.history)
  }, [batchRetrySnapshot])

  useEffect(() => {
    setBatchPreviewOpen(false)
    setBatchCommandPreview(null)
    setRecoveryImpactOpen(false)
    if (!firstSelectedVoiceId) return
    const firstChoice = resolveVoiceChoice(voiceChoices, firstSelectedVoiceId)
    const currentChoice = currentVoiceId ? resolveVoiceChoice(voiceChoices, currentVoiceId) : null
    const preferred = voiceSelectionSummary.mixed || !firstChoice.ready
      ? (currentChoice?.ready ? currentChoice.id : voiceChoices.find((voice) => voice.ready)?.id)
      : firstChoice.id
    if (preferred) setBatchVoiceId(preferred)
  }, [currentVoiceId, firstSelectedVoiceId, selectedVoiceIdKey, voiceChoices, voiceSelectionSummary.mixed])

  useEffect(() => {
    if (!selectedUnavailableVoiceBlocks.length) {
      setRecoveryVoiceId('')
      setRecoveryImpactOpen(false)
      return
    }
    const currentChoice = currentVoiceId ? resolveVoiceChoice(voiceChoices, currentVoiceId) : null
    const preferred = currentChoice?.ready && !unavailableVoiceSummary.voiceIds.includes(currentChoice.id)
      ? currentChoice.id
      : recoveryReplacementChoices[0]?.id ?? ''
    setRecoveryVoiceId(preferred)
    setRecoveryImpactOpen(false)
  }, [
    currentVoiceId,
    recoveryReplacementChoices,
    selectedUnavailableVoiceIdKey,
    unavailableOriginalVoiceIdKey,
    voiceChoices,
  ])

  function applyBatchResult(summary: TimelineBatchGenerationSummary, retry: boolean) {
    setBatchResult(summary)
    const failureKinds = Array.from(new Set((summary.failures ?? []).map((failure) => failure.kind)))
    const nextEntry: WorkspaceBatchHistoryEntry = {
      completedAt: new Date().toISOString(),
      retry,
      requested: summary.requestedIds.length,
      succeeded: summary.succeededIds.length,
      failed: summary.failedIds.length,
      skipped: summary.skippedIds.length,
      failureKinds,
    }
    const nextHistory = [nextEntry, ...batchHistory].slice(0, TIMELINE_BATCH_HISTORY_LIMIT)
    const nextRetryCount = retry ? Math.min(TIMELINE_BATCH_RETRY_LIMIT, batchRetryCount + 1) : 0
    setBatchHistory(nextHistory)
    setBatchRetryCount(nextRetryCount)
    onBatchRetrySnapshotChange?.({ retryCount: nextRetryCount, history: nextHistory })
    if (summary.failedIds.length) onReplaceSelection(summary.failedIds)
  }

  async function runBatchGeneration(ids: string[], retry = false) {
    if (!onRegenerateMany || !ids.length || batchRunning || recoveryRunning) return
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
    if (!onBatchVoiceChange || !selectedVoiceIds.length || batchRunning || recoveryRunning) return
    const ids = [...selectedVoiceIds]
    setBatchRunning(regenerate)
    setBatchResult(null)
    try {
      const summary = await onBatchVoiceChange(ids, batchVoice.id, regenerate)
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

  async function applyRecovery(regenerate: boolean) {
    if (
      !onBatchVoiceChange
      || !selectedUnavailableVoiceIds.length
      || !recoveryVoiceId
      || recoveryRunning
      || batchRunning
      || unavailableGeneratingCount > 0
      || !recoveryVoice.ready
    ) return
    const ids = [...selectedUnavailableVoiceIds]
    setRecoveryRunning(true)
    setBatchResult(null)
    try {
      const summary = await onBatchVoiceChange(ids, recoveryVoice.id, regenerate, 'recovery')
      if (summary) applyBatchResult(summary, false)
      setRecoveryImpactOpen(false)
    } finally {
      setRecoveryRunning(false)
    }
  }

  function stageBatchCommand(kind: TimelineBatchCommandKind, ids: string[]) {
    if (!ids.length || batchRunning || recoveryRunning) return
    setBatchCommandPreview({ kind, ids: [...ids] })
  }

  async function executeBatchCommand() {
    const preview = batchCommandPreview
    if (!preview) return
    setBatchCommandPreview(null)
    if (preview.kind === 'delete') {
      onRemoveMany?.(preview.ids)
      onClearSelection()
      return
    }
    await runBatchGeneration(preview.ids, preview.kind === 'retry-failed')
  }

  return {
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
  }
}
