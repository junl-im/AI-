import type { VoiceEmotion } from '../ai/contracts'
import type { TimelineBlock, TimelineVoiceBlock } from '../workspace/workspaceTypes'

export const TIMELINE_EDIT_HISTORY_LIMIT = 20

export interface TimelineEditSnapshotVoice {
  id: string
  kind: 'voice'
  text: string
  voiceId: string
  voiceName: string
  emotion: VoiceEmotion
  speed: number
  pitch: number
  engineId?: string
  normalizeText: boolean
  durationSeconds: number
  revision: number
}

export interface TimelineEditSnapshotPause {
  id: string
  kind: 'pause'
  durationSeconds: number
}

export type TimelineEditSnapshotBlock = TimelineEditSnapshotVoice | TimelineEditSnapshotPause
export type TimelineEditSnapshot = TimelineEditSnapshotBlock[]

export interface TimelineEditHistoryEntry {
  id: number
  label: string
  before: TimelineEditSnapshot
  after: TimelineEditSnapshot
}

export interface TimelineEditHistoryState {
  past: TimelineEditHistoryEntry[]
  future: TimelineEditHistoryEntry[]
}

export const EMPTY_TIMELINE_EDIT_HISTORY: TimelineEditHistoryState = {
  past: [],
  future: [],
}

function cloneVoice(block: TimelineVoiceBlock): TimelineEditSnapshotVoice {
  return {
    id: block.id,
    kind: 'voice',
    text: block.text,
    voiceId: block.voiceId,
    voiceName: block.voiceName,
    emotion: block.emotion,
    speed: block.speed,
    pitch: block.pitch,
    engineId: block.engineId,
    normalizeText: block.normalizeText,
    durationSeconds: block.durationSeconds,
    revision: block.revision,
  }
}

export function captureTimelineEditSnapshot(blocks: TimelineBlock[]): TimelineEditSnapshot {
  return blocks.map((block) => block.kind === 'voice'
    ? cloneVoice(block)
    : { id: block.id, kind: 'pause', durationSeconds: block.durationSeconds })
}

export function timelineEditSnapshotsEqual(
  left: TimelineEditSnapshot,
  right: TimelineEditSnapshot,
): boolean {
  if (left.length !== right.length) return false
  return left.every((block, index) => {
    const other = right[index]
    if (!other || block.id !== other.id || block.kind !== other.kind) return false
    if (block.kind === 'pause' || other.kind === 'pause') {
      return block.kind === 'pause'
        && other.kind === 'pause'
        && block.durationSeconds === other.durationSeconds
    }
    return block.text === other.text
      && block.voiceId === other.voiceId
      && block.voiceName === other.voiceName
      && block.emotion === other.emotion
      && block.speed === other.speed
      && block.pitch === other.pitch
      && block.engineId === other.engineId
      && block.normalizeText === other.normalizeText
      && block.durationSeconds === other.durationSeconds
  })
}

export function timelineBlockMatchesSnapshot(
  block: TimelineBlock | undefined,
  snapshot: TimelineEditSnapshotBlock,
): boolean {
  if (!block || block.id !== snapshot.id || block.kind !== snapshot.kind) return false
  if (block.kind === 'pause' || snapshot.kind === 'pause') {
    return block.kind === 'pause'
      && snapshot.kind === 'pause'
      && block.durationSeconds === snapshot.durationSeconds
  }
  return block.text === snapshot.text
    && block.voiceId === snapshot.voiceId
    && block.voiceName === snapshot.voiceName
    && block.emotion === snapshot.emotion
    && block.speed === snapshot.speed
    && block.pitch === snapshot.pitch
    && block.engineId === snapshot.engineId
    && block.normalizeText === snapshot.normalizeText
    && block.durationSeconds === snapshot.durationSeconds
}

export function snapshotVoiceToQueuedBlock(
  snapshot: TimelineEditSnapshotVoice,
  currentRevision = 0,
): TimelineVoiceBlock {
  return {
    ...snapshot,
    revision: Math.max(snapshot.revision, currentRevision) + 1,
    jobId: null,
    status: 'queued',
    progress: 0,
    audio: null,
    trackId: null,
    error: null,
    sttVerification: undefined,
  }
}

export function pushTimelineEditHistory(
  history: TimelineEditHistoryState,
  entry: TimelineEditHistoryEntry,
): TimelineEditHistoryState {
  return {
    past: [...history.past, entry].slice(-TIMELINE_EDIT_HISTORY_LIMIT),
    future: [],
  }
}
