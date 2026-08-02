import type { SttSegmentVerificationResult } from '../stt/verificationApi'
import type { GeneratedAudio } from '../tts/generationTypes'
import type { TimelineBlock, TimelineVoiceBlock } from './workspaceTypes'

export function applySttResultsToBlocks(
  blocks: TimelineBlock[],
  results: SttSegmentVerificationResult[],
): TimelineBlock[] {
  const byId = new Map(results.map((result) => [result.segmentId, result]))
  return blocks.map((block) => {
    if (block.kind !== 'voice') return block
    const result = byId.get(block.id)
    if (!result) return block
    return {
      ...block,
      sttVerification: {
        status: result.needsRegeneration
          ? result.regenerationAllowed ? 'failed' : 'blocked'
          : 'passed',
        transcriptText: result.transcriptText,
        characterErrorRate: result.characterErrorRate,
        wordErrorRate: result.wordErrorRate,
        reasons: result.reasons,
        regenerationAttempts: block.sttVerification?.regenerationAttempts ?? 0,
      },
    }
  })
}

export function prepareBlockForSttRegeneration(
  block: TimelineVoiceBlock,
): TimelineVoiceBlock {
  const previous = block.sttVerification
  return {
    ...block,
    status: 'queued',
    progress: 0,
    audio: null,
    trackId: null,
    jobId: null,
    error: null,
    revision: block.revision + 1,
    sttVerification: {
      status: 'unchecked',
      transcriptText: previous?.transcriptText ?? '',
      characterErrorRate: previous?.characterErrorRate ?? 0,
      wordErrorRate: previous?.wordErrorRate ?? 0,
      reasons: previous?.reasons ?? [],
      regenerationAttempts: (previous?.regenerationAttempts ?? 0) + 1,
    },
  }
}

interface RegenerateSttDependencies {
  cancel: (id: string) => void
  update: (updater: (blocks: TimelineBlock[]) => TimelineBlock[]) => void
  removeTrack: (trackId: string) => void
  generate: (id: string) => Promise<GeneratedAudio | null>
}

export async function regenerateSttBlocks(
  ids: string[],
  dependencies: RegenerateSttDependencies,
) {
  const results: Array<{
    blockId: string
    audio: GeneratedAudio
  }> = []
  for (const id of ids) {
    dependencies.cancel(id)
    let prepared = false
    dependencies.update((blocks) => blocks.map((block) => {
      if (block.id !== id || block.kind !== 'voice') return block
      prepared = true
      if (block.trackId) dependencies.removeTrack(block.trackId)
      return prepareBlockForSttRegeneration(block)
    }))
    if (!prepared) continue
    const audio = await dependencies.generate(id)
    if (audio) results.push({ blockId: id, audio })
  }
  return results
}
