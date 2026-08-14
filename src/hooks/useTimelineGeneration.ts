import { useCallback, useEffect, useRef, useState } from 'react'
import type { VoiceProject } from '../projects/projectTypes'
import { usePlayerStore } from '../store/usePlayerStore'
import type { GeneratedAudio } from '../tts/generationTypes'
import type { PersistedTimelineBlock } from '../workspace/sessionTypes'
import type { TimelineBlock, TimelineVoiceBlock } from '../workspace/workspaceTypes'
import {
  createTimelineVoiceBlock,
  estimateTimelineDuration,
  timelineBlocksFromText,
  timelineBlocksFromSegments,
  timelineOptionsFromBlock,
  timelineSplitPoint,
  type TimelineGenerationOptions,
  type TimelineStagedSegment,
} from '../workspace/timelineBlocks'
import { createRandomId } from '../utils/randomId'
import { runTimelineVoiceBlock } from '../timeline/generationRuntime'
import {
  EMPTY_TIMELINE_EDIT_HISTORY,
  TIMELINE_EDIT_HISTORY_LIMIT,
  captureTimelineEditSnapshot,
  pushTimelineEditHistory,
  snapshotVoiceToQueuedBlock,
  timelineBlockMatchesSnapshot,
  timelineEditSnapshotsEqual,
  type TimelineEditHistoryState,
  type TimelineEditSnapshot,
} from '../timeline/editHistory'
import { runBoundedOrderedBatch } from '../workspace/boundedBatch'
import type { SttSegmentVerificationResult } from '../stt/verificationApi'
import { buildEngineRoutingTrace, type EngineRoutingTrace } from '../workspace/engineRoutingTrace'
import {
  applySttResultsToBlocks,
  regenerateSttBlocks,
} from '../workspace/sttTimeline'
export type { TimelineGenerationOptions } from '../workspace/timelineBlocks'
export interface TimelineGenerationResult {
  blockId: string
  audio: GeneratedAudio
}

export interface TimelineGenerationBatchResult {
  results: TimelineGenerationResult[]
  cancelled: boolean
  concurrency: number
  routing: EngineRoutingTrace
}

export const TIMELINE_GENERATION_CONCURRENCY = 2

export type TimelineBatchFailureKind = 'engine' | 'preset' | 'network' | 'cancelled' | 'unknown'

export interface TimelineBatchFailure {
  id: string
  kind: TimelineBatchFailureKind
  message: string
}

export interface TimelineBatchGenerationSummary {
  requestedIds: string[]
  succeededIds: string[]
  failedIds: string[]
  skippedIds: string[]
  failures?: TimelineBatchFailure[]
}

function classifyBatchFailure(message: string | null | undefined): TimelineBatchFailureKind {
  const normalized = (message ?? '').toLowerCase()
  if (/soa-4022|프리셋|preset|목소리.*지원/.test(normalized)) return 'preset'
  if (/offline|network|연결|cors|timeout|502|503|504|fetch/.test(normalized)) return 'network'
  if (/cancel|abort|취소/.test(normalized)) return 'cancelled'
  if (/engine|엔진|worker|melo|cosyvoice|system tts|espeak/.test(normalized)) return 'engine'
  return 'unknown'
}
type BlocksUpdater = (current: TimelineBlock[]) => TimelineBlock[]
export function useTimelineGeneration() {
  const [blocks, setBlocks] = useState<TimelineBlock[]>([])
  const blocksRef = useRef<TimelineBlock[]>([])
  const controllers = useRef(new Map<string, AbortController>())
  const timers = useRef(new Map<string, number>())
  const batchGenerationRunRef = useRef(0)
  const editHistoryRef = useRef<TimelineEditHistoryState>(EMPTY_TIMELINE_EDIT_HISTORY)
  const editHistoryIdRef = useRef(0)
  const [editHistory, setEditHistory] = useState<TimelineEditHistoryState>(EMPTY_TIMELINE_EDIT_HISTORY)
  const enqueue = usePlayerStore((state) => state.enqueue)
  const enqueueAndPlay = usePlayerStore((state) => state.enqueueAndPlay)
  const replaceTrack = usePlayerStore((state) => state.replace)
  const alignTrackOrder = usePlayerStore((state) => state.alignTrackOrder)
  const appendProgressiveSegment = usePlayerStore((state) => state.appendProgressiveSegment)
  const removeTrack = usePlayerStore((state) => state.remove)
  const commit = useCallback((updater: BlocksUpdater) => {
    const next = updater(blocksRef.current)
    blocksRef.current = next
    setBlocks(next)
  }, [])
  const replaceEditHistory = useCallback((next: TimelineEditHistoryState) => {
    editHistoryRef.current = next
    setEditHistory(next)
  }, [])
  const resetEditHistory = useCallback(() => {
    replaceEditHistory(EMPTY_TIMELINE_EDIT_HISTORY)
  }, [replaceEditHistory])
  const commitEdit = useCallback((label: string, updater: BlocksUpdater) => {
    const before = captureTimelineEditSnapshot(blocksRef.current)
    const next = updater(blocksRef.current)
    const after = captureTimelineEditSnapshot(next)
    if (timelineEditSnapshotsEqual(before, after)) return false
    blocksRef.current = next
    setBlocks(next)
    const history = pushTimelineEditHistory(editHistoryRef.current, {
      id: ++editHistoryIdRef.current,
      label,
      before,
      after,
    })
    replaceEditHistory(history)
    return true
  }, [replaceEditHistory])
  const stopPolling = useCallback((blockId: string) => {
    const timer = timers.current.get(blockId)
    if (timer !== undefined) window.clearTimeout(timer)
    timers.current.delete(blockId)
  }, [])
  const cancelActiveGeneration = useCallback((blockId: string) => {
    controllers.current.get(blockId)?.abort()
    controllers.current.delete(blockId)
    stopPolling(blockId)
  }, [stopPolling])
  const applyEditSnapshot = useCallback((snapshot: TimelineEditSnapshot) => {
    batchGenerationRunRef.current += 1
    const current = blocksRef.current
    const currentById = new Map(current.map((block) => [block.id, block]))
    const snapshotById = new Map(snapshot.map((block) => [block.id, block]))

    current.forEach((block) => {
      const target = snapshotById.get(block.id)
      if (target && timelineBlockMatchesSnapshot(block, target)) return
      cancelActiveGeneration(block.id)
      if (block.kind === 'voice' && block.trackId) removeTrack(block.trackId)
    })

    const next: TimelineBlock[] = snapshot.map((item) => {
      const currentBlock = currentById.get(item.id)
      if (timelineBlockMatchesSnapshot(currentBlock, item)) return currentBlock!
      if (item.kind === 'pause') return { ...item }
      return snapshotVoiceToQueuedBlock(
        item,
        currentBlock?.kind === 'voice' ? currentBlock.revision : 0,
      )
    })
    blocksRef.current = next
    setBlocks(next)
    alignTrackOrder(next.flatMap((block) => (
      block.kind === 'voice' && block.trackId ? [block.trackId] : []
    )))
  }, [alignTrackOrder, cancelActiveGeneration, removeTrack])

  const undoEdit = useCallback(() => {
    const current = editHistoryRef.current
    const entry = current.past[current.past.length - 1]
    if (!entry) return false
    applyEditSnapshot(entry.before)
    replaceEditHistory({
      past: current.past.slice(0, -1),
      future: [entry, ...current.future].slice(0, TIMELINE_EDIT_HISTORY_LIMIT),
    })
    return true
  }, [applyEditSnapshot, replaceEditHistory])

  const redoEdit = useCallback(() => {
    const current = editHistoryRef.current
    const entry = current.future[0]
    if (!entry) return false
    applyEditSnapshot(entry.after)
    replaceEditHistory({
      past: [...current.past, entry].slice(-TIMELINE_EDIT_HISTORY_LIMIT),
      future: current.future.slice(1),
    })
    return true
  }, [applyEditSnapshot, replaceEditHistory])
  useEffect(() => () => {
    controllers.current.forEach((controller) => controller.abort())
    timers.current.forEach((timer) => window.clearTimeout(timer))
  }, [])
  const updateVoiceBlock = useCallback((
    id: string,
    patch: Partial<TimelineVoiceBlock>,
    expectedRevision?: number,
  ) => {
    commit((current) => current.map((block) => {
      if (block.id !== id || block.kind !== 'voice') return block
      if (expectedRevision !== undefined && block.revision !== expectedRevision) return block
      return { ...block, ...patch }
    }))
  }, [commit])
  const stageText = useCallback((
    text: string,
    options: TimelineGenerationOptions,
  ): string[] => {
    const staged = timelineBlocksFromText(text, options)
    commitEdit('대본 클립 추가', (current) => current.length === 0
      ? staged
      : [
          ...current,
          { id: createRandomId(), kind: 'pause', durationSeconds: 0.8 },
          ...staged,
        ])
    return staged.filter((block) => block.kind === 'voice').map((block) => block.id)
  }, [commitEdit])
  const stageSegments = useCallback((segments: TimelineStagedSegment[]): string[] => {
    const staged = timelineBlocksFromSegments(segments)
    commitEdit('다중 화자 대본 추가', (current) => current.length === 0
      ? staged
      : [
          ...current,
          { id: createRandomId(), kind: 'pause', durationSeconds: 0.8 },
          ...staged,
        ])
    return staged.filter((block) => block.kind === 'voice').map((block) => block.id)
  }, [commitEdit])
  const addVoiceBlock = useCallback((
    options: TimelineGenerationOptions,
    text = '',
  ): string => {
    const block = createTimelineVoiceBlock(text, options)
    commitEdit('대사 클립 추가', (current) => [...current, block])
    return block.id
  }, [commitEdit])
  const runBlock = useCallback((
    blockId: string,
    allowSynthesis = true,
    autoplay = false,
  ) => runTimelineVoiceBlock({
    getBlocks: () => blocksRef.current,
    controllers: controllers.current,
    timers: timers.current,
    updateVoiceBlock,
    enqueue,
    enqueueAndPlay,
    replaceTrack,
    appendProgressiveSegment,
    removeTrack,
    stopPolling,
  }, blockId, allowSynthesis, autoplay), [
    appendProgressiveSegment,
    enqueue,
    enqueueAndPlay,
    removeTrack,
    replaceTrack,
    stopPolling,
    updateVoiceBlock,
  ])

  const generateBlock = useCallback(
    (blockId: string) => runBlock(blockId, true, false),
    [runBlock],
  )
  const retryBlock = useCallback(
    (blockId: string) => runBlock(blockId, true, true),
    [runBlock],
  )

  const recoverBlocks = useCallback(async (ids: string[]) => {
    const results: GeneratedAudio[] = []
    for (const id of ids) {
      const audio = await runBlock(id, false)
      if (audio) results.push(audio)
    }
    return results
  }, [runBlock])

  const generateAll = useCallback(async (ids: string[], autoplayFirst = false): Promise<TimelineGenerationBatchResult> => {
    const requestedIds = [...new Set(ids)]
    const runId = batchGenerationRunRef.current + 1
    batchGenerationRunRef.current = runId
    const resultById = new Map<string, GeneratedAudio>()

    const generateOne = async (id: string, autoplay = false) => {
      if (batchGenerationRunRef.current !== runId) return
      const audio = await runBlock(id, true, autoplay)
      if (audio) resultById.set(id, audio)
    }

    let startIndex = 0
    if (autoplayFirst && requestedIds.length > 0) {
      await generateOne(requestedIds[0], true)
      startIndex = 1
    }

    const remainingIds = requestedIds.slice(startIndex)
    const concurrency = Math.min(TIMELINE_GENERATION_CONCURRENCY, Math.max(1, remainingIds.length))
    await runBoundedOrderedBatch(
      remainingIds,
      concurrency,
      async (id) => {
        await generateOne(id)
        return id
      },
      () => batchGenerationRunRef.current !== runId,
    )

    const orderedTrackIds = requestedIds.flatMap((id) => {
      const block = blocksRef.current.find((item) => item.id === id)
      return block?.kind === 'voice' && block.trackId ? [block.trackId] : []
    })
    alignTrackOrder(orderedTrackIds)

    const results = requestedIds.flatMap((blockId) => {
      const audio = resultById.get(blockId)
      return audio ? [{ blockId, audio }] : []
    })
    return {
      results,
      cancelled: batchGenerationRunRef.current !== runId,
      concurrency,
      routing: buildEngineRoutingTrace(results),
    }
  }, [alignTrackOrder, runBlock])

  const cancelAllGeneration = useCallback(() => {
    batchGenerationRunRef.current += 1
    for (const blockId of [...controllers.current.keys()]) cancelActiveGeneration(blockId)
    commit((current) => current.map((block) => (
      block.kind === 'voice' && block.status === 'generating'
        ? { ...block, status: 'queued' as const, progress: 0, error: null }
        : block
    )))
  }, [cancelActiveGeneration, commit])

  const getQueuedVoiceBlockIds = useCallback((ids?: string[]) => {
    const selected = ids ? new Set(ids) : null
    return blocksRef.current.flatMap((block) => (
      block.kind === 'voice'
      && block.status === 'queued'
      && (!selected || selected.has(block.id))
        ? [block.id]
        : []
    ))
  }, [])

  const getVoiceBlockSnapshots = useCallback((ids: string[]) => {
    const selected = new Set(ids)
    return blocksRef.current.flatMap((block) => (
      block.kind === 'voice' && selected.has(block.id)
        ? [{
            id: block.id,
            text: block.text,
            voiceId: block.voiceId,
            voiceName: block.voiceName,
            jobId: block.jobId,
          }]
        : []
    ))
  }, [])

  const applySttVerification = useCallback((results: SttSegmentVerificationResult[]) => {
    commit((current) => applySttResultsToBlocks(current, results))
  }, [commit])

  const regenerateBlocks = useCallback((ids: string[]) => regenerateSttBlocks(ids, {
    cancel: cancelActiveGeneration,
    update: commit,
    removeTrack,
    generate: generateBlock,
  }), [cancelActiveGeneration, commit, generateBlock, removeTrack])

  const updateVoiceMany = useCallback((ids: string[], voiceId: string, voiceName: string) => {
    const selected = new Set(ids)
    if (!selected.size) return
    ids.forEach((id) => cancelActiveGeneration(id))
    commitEdit('선택 클립 목소리 변경', (current) => current.map((block) => {
      if (block.kind !== 'voice' || !selected.has(block.id) || block.voiceId === voiceId) return block
      if (block.trackId) removeTrack(block.trackId)
      return {
        ...block,
        voiceId,
        voiceName,
        status: 'queued' as const,
        progress: 0,
        audio: null,
        trackId: null,
        jobId: null,
        error: null,
        revision: block.revision + 1,
        sttVerification: undefined,
      }
    }))
  }, [cancelActiveGeneration, commitEdit, removeTrack])

  const regenerateMany = useCallback(async (ids: string[]): Promise<TimelineBatchGenerationSummary> => {
    const requestedIds = [...new Set(ids)]
    const selected = new Set(requestedIds)
    if (!selected.size) {
      return { requestedIds: [], succeededIds: [], failedIds: [], skippedIds: [], failures: [] }
    }
    const voiceIds = blocksRef.current
      .filter((block): block is TimelineVoiceBlock => block.kind === 'voice' && selected.has(block.id))
      .map((block) => block.id)
    const voiceIdSet = new Set(voiceIds)
    const skippedIds = requestedIds.filter((id) => !voiceIdSet.has(id))

    voiceIds.forEach((id) => cancelActiveGeneration(id))
    commit((current) => current.map((block) => {
      if (block.kind !== 'voice' || !voiceIdSet.has(block.id)) return block
      const alreadyClean = block.status === 'queued'
        && !block.audio
        && !block.trackId
        && !block.jobId
        && !block.error
      if (alreadyClean) return block
      if (block.trackId) removeTrack(block.trackId)
      return {
        ...block,
        status: 'queued' as const,
        progress: 0,
        audio: null,
        trackId: null,
        jobId: null,
        error: null,
        revision: block.revision + 1,
        sttVerification: block.sttVerification
          ? { ...block.sttVerification, status: 'unchecked' as const }
          : undefined,
      }
    }))

    const succeededIds: string[] = []
    const failedIds: string[] = []
    const failures: TimelineBatchFailure[] = []
    for (const id of voiceIds) {
      const audio = await generateBlock(id)
      if (audio) {
        succeededIds.push(id)
        continue
      }
      failedIds.push(id)
      const latest = blocksRef.current.find((block) => block.id === id)
      const message = latest?.kind === 'voice'
        ? (latest.error ?? '재생성 결과를 만들지 못했습니다.')
        : '재생성 가능한 대사 클립이 아닙니다.'
      failures.push({ id, kind: classifyBatchFailure(message), message })
    }
    return { requestedIds, succeededIds, failedIds, skippedIds, failures }
  }, [cancelActiveGeneration, commit, generateBlock, removeTrack])

  const restoreSession = useCallback((savedBlocks: PersistedTimelineBlock[]): string[] => {
    controllers.current.forEach((controller) => controller.abort())
    timers.current.forEach((timer) => window.clearTimeout(timer))
    controllers.current.clear()
    timers.current.clear()
    blocksRef.current.forEach((block) => {
      if (block.kind === 'voice' && block.trackId) removeTrack(block.trackId)
    })

    const restored: TimelineBlock[] = savedBlocks.map((block) => {
      if (block.kind === 'pause') return block
      const recoverable = Boolean(block.jobId)
      return {
        ...block,
        status: recoverable ? 'queued' : block.status === 'failed' ? 'failed' : 'queued',
        progress: 0,
        audio: null,
        trackId: null,
        error: recoverable
          ? '이전 작업의 음원 결과를 다시 연결하고 있습니다.'
          : block.error,
        revision: Math.max(1, block.revision),
      }
    })
    commit(() => restored)
    resetEditHistory()
    return restored
      .filter((block): block is TimelineVoiceBlock => block.kind === 'voice' && Boolean(block.jobId))
      .map((block) => block.id)
  }, [commit, removeTrack, resetEditHistory])
  const restoreProject = useCallback((
    project: VoiceProject,
    options: TimelineGenerationOptions,
  ): string[] => {
    controllers.current.forEach((controller) => controller.abort())
    timers.current.forEach((timer) => window.clearTimeout(timer))
    controllers.current.clear()
    timers.current.clear()
    blocksRef.current.forEach((block) => {
      if (block.kind === 'voice' && block.trackId) removeTrack(block.trackId)
    })

    const jobIds = project.jobIds?.length
      ? project.jobIds
      : project.lastJobId
        ? [project.lastJobId]
        : []
    let voiceIndex = 0
    const restoredBase = project.timelineClips?.length
      ? timelineBlocksFromSegments(project.timelineClips.map((clip) => ({
          text: clip.text,
          options: {
            ...options,
            voiceId: clip.voiceId,
            voiceName: clip.voiceName,
          },
        })))
      : timelineBlocksFromText(project.text, options)
    const restored = restoredBase.map((block) => {
      if (block.kind !== 'voice') return block
      const jobId = jobIds[voiceIndex] ?? null
      voiceIndex += 1
      return {
        ...block,
        jobId,
        error: jobId ? '저장된 음원 결과를 확인하고 있습니다.' : null,
        revision: 1,
      }
    })
    commit(() => restored)
    resetEditHistory()
    return restored
      .filter((block): block is TimelineVoiceBlock => block.kind === 'voice' && Boolean(block.jobId))
      .map((block) => block.id)
  }, [commit, removeTrack, resetEditHistory])

  const moveBlock = useCallback((id: string, direction: -1 | 1) => {
    commitEdit('클립 이동', (current) => {
      const index = current.findIndex((block) => block.id === id)
      const target = index + direction
      if (index < 0 || target < 0 || target >= current.length) return current
      const next = [...current]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }, [commitEdit])

  const reorderBlock = useCallback((sourceId: string, targetId: string) => {
    commitEdit('클립 순서 변경', (current) => {
      const sourceIndex = current.findIndex((block) => block.id === sourceId)
      const targetIndex = current.findIndex((block) => block.id === targetId)
      if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return current
      const next = [...current]
      const [moved] = next.splice(sourceIndex, 1)
      next.splice(targetIndex, 0, moved)
      return next
    })
  }, [commitEdit])

  const moveBlocks = useCallback((ids: string[], direction: -1 | 1) => {
    const selected = new Set(ids)
    if (!selected.size) return
    commitEdit('선택 클립 이동', (current) => {
      const next = [...current]
      if (direction < 0) {
        for (let index = 1; index < next.length; index += 1) {
          if (!selected.has(next[index].id) || selected.has(next[index - 1].id)) continue
          ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
        }
      } else {
        for (let index = next.length - 2; index >= 0; index -= 1) {
          if (!selected.has(next[index].id) || selected.has(next[index + 1].id)) continue
          ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
        }
      }
      return next
    })
  }, [commitEdit])

  const updateText = useCallback((id: string, text: string) => {
    cancelActiveGeneration(id)
    commitEdit('대사 수정', (current) => current.map((block) => {
      if (block.id !== id || block.kind !== 'voice') return block
      if (block.trackId) removeTrack(block.trackId)
      return {
        ...block,
        text,
        durationSeconds: estimateTimelineDuration(text),
        status: 'queued' as const,
        progress: 0,
        audio: null,
        trackId: null,
        jobId: null,
        error: null,
        revision: block.revision + 1,
        sttVerification: undefined,
      }
    }))
  }, [cancelActiveGeneration, commitEdit, removeTrack])

  const splitBlock = useCallback((id: string) => {
    cancelActiveGeneration(id)
    commitEdit('클립 분할', (current) => {
      const index = current.findIndex((block) => block.id === id)
      const block = current[index]
      if (!block || block.kind !== 'voice' || block.text.length < 8) return current
      if (block.trackId) removeTrack(block.trackId)
      const splitAt = timelineSplitPoint(block.text)
      const options = timelineOptionsFromBlock(block)
      const left = createTimelineVoiceBlock(block.text.slice(0, splitAt).trim(), options)
      const right = createTimelineVoiceBlock(block.text.slice(splitAt).trim(), options)
      return [
        ...current.slice(0, index),
        left,
        { id: createRandomId(), kind: 'pause', durationSeconds: 0.5 },
        right,
        ...current.slice(index + 1),
      ]
    })
  }, [cancelActiveGeneration, commitEdit, removeTrack])

  const addPause = useCallback(() => {
    commitEdit('쉼 추가', (current) => [
      ...current,
      { id: createRandomId(), kind: 'pause', durationSeconds: 0.5 },
    ])
  }, [commitEdit])


  const removeBlock = useCallback((id: string) => {
    cancelActiveGeneration(id)
    commitEdit('클립 삭제', (current) => current.filter((block) => {
      if (block.id !== id) return true
      if (block.kind === 'voice' && block.trackId) removeTrack(block.trackId)
      return false
    }))
  }, [cancelActiveGeneration, commitEdit, removeTrack])

  const removeBlocks = useCallback((ids: string[]) => {
    const selected = new Set(ids)
    if (!selected.size) return
    ids.forEach((id) => cancelActiveGeneration(id))
    commitEdit('선택 클립 삭제', (current) => current.filter((block) => {
      if (!selected.has(block.id)) return true
      if (block.kind === 'voice' && block.trackId) removeTrack(block.trackId)
      return false
    }))
  }, [cancelActiveGeneration, commitEdit, removeTrack])

  const clear = useCallback(() => {
    batchGenerationRunRef.current += 1
    Array.from(controllers.current.keys()).forEach((id) => cancelActiveGeneration(id))
    blocksRef.current.forEach((block) => {
      if (block.kind === 'voice' && block.trackId) removeTrack(block.trackId)
    })
    commitEdit('타임라인 전체 비우기', () => [])
  }, [cancelActiveGeneration, commitEdit, removeTrack])

  return {
    blocks,
    stageText,
    stageSegments,
    addVoiceBlock,
    restoreProject,
    restoreSession,
    recoverBlocks,
    generateAll,
    cancelAllGeneration,
    getQueuedVoiceBlockIds,
    getVoiceBlockSnapshots,
    applySttVerification,
    regenerateBlocks,
    regenerateMany,
    updateVoiceMany,
    retryBlock,
    moveBlock,
    moveBlocks,
    reorderBlock,
    updateText,
    splitBlock,
    addPause,
    removeBlock,
    removeBlocks,
    clear,
    canUndo: editHistory.past.length > 0,
    canRedo: editHistory.future.length > 0,
    undoLabel: editHistory.past[editHistory.past.length - 1]?.label ?? null,
    redoLabel: editHistory.future[0]?.label ?? null,
    undoEdit,
    redoEdit,
    resetEditHistory,
  }
}
