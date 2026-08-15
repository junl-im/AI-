import type { TimelineBlock, TimelineVoiceBlock } from '../workspace/workspaceTypes'

export function findAdjacentVoiceBlockId(
  blocks: TimelineBlock[],
  currentId: string,
  direction: -1 | 1,
): string | null {
  const startIndex = blocks.findIndex((block) => block.id === currentId)
  if (startIndex < 0) return null
  for (let index = startIndex + direction; index >= 0 && index < blocks.length; index += direction) {
    if (blocks[index]?.kind === 'voice') return blocks[index].id
  }
  return null
}

export interface TimelineVoiceSelectionSummary {
  voiceCount: number
  voiceIds: string[]
  mixed: boolean
  labels: Array<{ voiceId: string; voiceName: string; count: number }>
}

export function summarizeTimelineVoiceSelection(
  blocks: TimelineVoiceBlock[],
): TimelineVoiceSelectionSummary {
  const counts = new Map<string, { voiceName: string; count: number }>()
  for (const block of blocks) {
    const current = counts.get(block.voiceId)
    if (current) current.count += 1
    else counts.set(block.voiceId, { voiceName: block.voiceName, count: 1 })
  }
  const labels = [...counts.entries()].map(([voiceId, item]) => ({
    voiceId,
    voiceName: item.voiceName,
    count: item.count,
  }))
  return {
    voiceCount: labels.length,
    voiceIds: labels.map((item) => item.voiceId),
    mixed: labels.length > 1,
    labels,
  }
}
