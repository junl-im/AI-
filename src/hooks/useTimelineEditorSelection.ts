import { useCallback, useEffect, useMemo, useState } from 'react'
import type { TimelineBlock, TimelineVoiceBlock } from '../workspace/workspaceTypes'

export type TimelineSelectionMode = 'single' | 'toggle' | 'range'

interface UseTimelineEditorSelectionOptions {
  blocks: TimelineBlock[]
  onSelectionChange?: (ids: string[]) => void
}

export function useTimelineEditorSelection({
  blocks,
  onSelectionChange,
}: UseTimelineEditorSelectionOptions) {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(blocks[0]?.id ?? null)
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(
    () => new Set(blocks[0] ? [blocks[0].id] : []),
  )
  const [selectionAnchorId, setSelectionAnchorId] = useState<string | null>(blocks[0]?.id ?? null)

  const selectedBlocks = useMemo(
    () => blocks.filter((block) => selectedBlockIds.has(block.id)),
    [blocks, selectedBlockIds],
  )
  const selectedBlock = selectedBlocks.length === 1
    ? selectedBlocks[0]
    : blocks.find((block) => block.id === selectedBlockId) ?? null
  const selectedVoiceBlock = selectedBlocks.length === 1 && selectedBlock?.kind === 'voice'
    ? selectedBlock
    : null
  const selectedIds = useMemo(() => selectedBlocks.map((block) => block.id), [selectedBlocks])
  const selectedVoiceBlocks = useMemo(
    () => selectedBlocks.filter((block): block is TimelineVoiceBlock => block.kind === 'voice'),
    [selectedBlocks],
  )
  const selectedVoiceIds = useMemo(
    () => selectedVoiceBlocks.map((block) => block.id),
    [selectedVoiceBlocks],
  )
  const selectedDuration = useMemo(
    () => selectedBlocks.reduce((total, block) => total + Math.max(0, block.durationSeconds), 0),
    [selectedBlocks],
  )
  const selectedIdKey = selectedIds.join('|')
  const selectedVoiceIdKey = selectedVoiceIds.join('|')
  const multiSelectionActive = selectedBlockIds.size > 1

  const replaceSelection = useCallback((ids: string[], primaryId = ids[0] ?? null) => {
    const validIds = ids.filter((id) => blocks.some((block) => block.id === id))
    const nextPrimary = primaryId && validIds.includes(primaryId) ? primaryId : validIds[0] ?? null
    setSelectedBlockIds(new Set(validIds))
    setSelectedBlockId(nextPrimary)
    setSelectionAnchorId(nextPrimary)
  }, [blocks])

  const selectVoiceBlocks = useCallback((ids: string[]) => {
    const voiceIds = ids.filter((id) => blocks.some((block) => block.id === id && block.kind === 'voice'))
    if (!voiceIds.length) return
    replaceSelection(voiceIds)
  }, [blocks, replaceSelection])

  const clearSelection = useCallback(() => {
    setSelectedBlockIds(new Set())
    setSelectedBlockId(null)
    setSelectionAnchorId(null)
  }, [])

  const selectBlock = useCallback((id: string, mode: TimelineSelectionMode = 'single') => {
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
      setSelectedBlockId(next.has(id) ? id : [...next][0] ?? null)
      setSelectionAnchorId(id)
      return
    }

    setSelectedBlockIds(new Set([id]))
    setSelectionAnchorId(id)
    setSelectedBlockId(id)
  }, [blocks, selectedBlockIds, selectionAnchorId])

  useEffect(() => {
    onSelectionChange?.(selectedIdKey ? selectedIdKey.split('|') : [])
  }, [onSelectionChange, selectedIdKey])

  useEffect(() => {
    const validIds = new Set(blocks.map((block) => block.id))
    const nextIds = [...selectedBlockIds].filter((id) => validIds.has(id))
    if (nextIds.length !== selectedBlockIds.size) setSelectedBlockIds(new Set(nextIds))
    if (selectedBlockId && validIds.has(selectedBlockId)) return
    const fallback = nextIds[0] ?? blocks[0]?.id ?? null
    setSelectedBlockId(fallback)
    setSelectionAnchorId(fallback)
    if (!nextIds.length && fallback) setSelectedBlockIds(new Set([fallback]))
  }, [blocks, selectedBlockId, selectedBlockIds])

  return {
    selectedBlockId,
    selectedBlockIds,
    selectedBlocks,
    selectedBlock,
    selectedVoiceBlock,
    selectedIds,
    selectedVoiceBlocks,
    selectedVoiceIds,
    selectedDuration,
    selectedIdKey,
    selectedVoiceIdKey,
    multiSelectionActive,
    replaceSelection,
    selectVoiceBlocks,
    selectBlock,
    clearSelection,
  }
}
