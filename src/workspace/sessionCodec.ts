import type { VoiceEmotion } from '../ai/contracts'
import type { AppPage } from '../store/useAppStore'
import type { TimelineBlockStatus, TimelineSttVerification } from './workspaceTypes'
import {
  ACTIVE_WORKSPACE_SESSION_ID,
  WORKSPACE_SESSION_SCHEMA_VERSION,
  type PersistedTimelineBlock,
  type WorkspaceBatchHistoryEntry,
  type WorkspaceBatchRetrySnapshot,
  type WorkspaceSession,
  type WorkspaceSessionDraft,
} from './sessionTypes'

const MAX_MESSAGES = 100
const MAX_BLOCKS = 240
const MAX_MESSAGE_LENGTH = 4_000
const MAX_COMPOSER_LENGTH = 20_000
const MAX_PROJECT_TITLE_LENGTH = 80
const MAX_BLOCK_TEXT_LENGTH = 2_000
const MAX_SESSION_AGE_MS = 1000 * 60 * 60 * 24 * 45
const MAX_BATCH_HISTORY = 6
const MAX_BATCH_RETRY_COUNT = 3
const pages: AppPage[] = ['home', 'clone', 'quality', 'projects', 'settings']
const statuses: TimelineBlockStatus[] = ['queued', 'generating', 'ready', 'failed']
const directiveIds = ['commercial', 'slow', 'numbers', 'bright'] as const
const batchFailureKinds = ['engine', 'preset', 'network', 'cancelled', 'unknown'] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function safeText(value: unknown, limit: number): string {
  return typeof value === 'string' ? value.slice(0, limit) : ''
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function normalizeSttVerification(value: unknown): TimelineSttVerification | undefined {
  if (!isRecord(value)) return undefined
  const status = ['passed', 'failed', 'blocked', 'unchecked'].includes(String(value.status))
    ? value.status as TimelineSttVerification['status']
    : 'unchecked'
  return {
    status,
    transcriptText: safeText(value.transcriptText, MAX_BLOCK_TEXT_LENGTH),
    characterErrorRate: Math.min(1, Math.max(0, finiteNumber(value.characterErrorRate, 0))),
    wordErrorRate: Math.min(1, Math.max(0, finiteNumber(value.wordErrorRate, 0))),
    reasons: Array.isArray(value.reasons)
      ? value.reasons.filter((item): item is string => typeof item === 'string').slice(0, 20)
      : [],
    regenerationAttempts: Math.min(
      10,
      Math.max(0, Math.floor(finiteNumber(value.regenerationAttempts, 0))),
    ),
  }
}

function normalizeBatchRetrySnapshot(value: unknown): WorkspaceBatchRetrySnapshot {
  if (!isRecord(value)) return { retryCount: 0, history: [] }
  const rawHistory = Array.isArray(value.history) ? value.history : []
  const history = rawHistory.slice(0, MAX_BATCH_HISTORY).flatMap<WorkspaceBatchHistoryEntry>((entry) => {
    if (!isRecord(entry) || typeof entry.completedAt !== 'string') return []
    const completedAt = Date.parse(entry.completedAt)
    if (!Number.isFinite(completedAt)) return []
    const failureKinds = Array.isArray(entry.failureKinds)
      ? entry.failureKinds.filter((kind): kind is typeof batchFailureKinds[number] => (
          batchFailureKinds.includes(kind as typeof batchFailureKinds[number])
        ))
      : []
    return [{
      completedAt: new Date(completedAt).toISOString(),
      retry: entry.retry === true,
      requested: Math.min(500, Math.max(0, Math.floor(finiteNumber(entry.requested, 0)))),
      succeeded: Math.min(500, Math.max(0, Math.floor(finiteNumber(entry.succeeded, 0)))),
      failed: Math.min(500, Math.max(0, Math.floor(finiteNumber(entry.failed, 0)))),
      skipped: Math.min(500, Math.max(0, Math.floor(finiteNumber(entry.skipped, 0)))),
      failureKinds,
    }]
  })
  return {
    retryCount: Math.min(
      MAX_BATCH_RETRY_COUNT,
      Math.max(0, Math.floor(finiteNumber(value.retryCount, 0))),
    ),
    history,
  }
}

function normalizeBlock(value: unknown): PersistedTimelineBlock | null {
  if (!isRecord(value) || typeof value.id !== 'string') return null
  if (value.kind === 'pause') {
    return {
      id: value.id,
      kind: 'pause',
      durationSeconds: Math.max(0.1, finiteNumber(value.durationSeconds, 0.5)),
    }
  }
  if (value.kind !== 'voice') return null
  const status = statuses.includes(value.status as TimelineBlockStatus)
    ? value.status as TimelineBlockStatus
    : 'queued'
  const emotion = ['neutral', 'happy', 'calm', 'sad', 'angry', 'commercial']
    .includes(String(value.emotion))
    ? value.emotion as VoiceEmotion
    : 'neutral'
  return {
    id: value.id,
    kind: 'voice',
    text: safeText(value.text, MAX_BLOCK_TEXT_LENGTH),
    voiceId: safeText(value.voiceId, 120),
    voiceName: safeText(value.voiceName, 120),
    emotion,
    speed: Math.min(2, Math.max(0.5, finiteNumber(value.speed, 1))),
    pitch: Math.min(12, Math.max(-12, Math.round(finiteNumber(value.pitch, 0)))),
    engineId: typeof value.engineId === 'string' ? value.engineId.slice(0, 120) : undefined,
    normalizeText: value.normalizeText !== false,
    jobId: typeof value.jobId === 'string' ? value.jobId.slice(0, 160) : null,
    status,
    progress: Math.min(100, Math.max(0, finiteNumber(value.progress, 0))),
    durationSeconds: Math.max(0.1, finiteNumber(value.durationSeconds, 1.2)),
    error: typeof value.error === 'string' ? value.error.slice(0, 500) : null,
    revision: Math.max(1, Math.floor(finiteNumber(value.revision, 1))),
    sttVerification: normalizeSttVerification(value.sttVerification),
  }
}

export function createWorkspaceSession(
  draft: WorkspaceSessionDraft,
  revision: number,
): WorkspaceSession {
  const blocks: PersistedTimelineBlock[] = draft.blocks.slice(-MAX_BLOCKS).map((block) => {
    if (block.kind === 'pause') {
      return {
        id: block.id,
        kind: 'pause',
        durationSeconds: block.durationSeconds,
      }
    }
    return {
      id: block.id,
      kind: 'voice',
      text: block.text.slice(0, MAX_BLOCK_TEXT_LENGTH),
      voiceId: block.voiceId,
      voiceName: block.voiceName,
      emotion: block.emotion,
      speed: block.speed,
      pitch: block.pitch,
      engineId: block.engineId,
      normalizeText: block.normalizeText,
      jobId: block.jobId,
      status: block.status,
      progress: block.progress,
      durationSeconds: block.durationSeconds,
      error: block.error?.slice(0, 500) ?? null,
      revision: block.revision,
      sttVerification: block.sttVerification,
    }
  })

  const batchRetrySnapshot = normalizeBatchRetrySnapshot(draft.batchRetrySnapshot)

  return {
    id: ACTIVE_WORKSPACE_SESSION_ID,
    schemaVersion: WORKSPACE_SESSION_SCHEMA_VERSION,
    revision,
    savedAt: new Date().toISOString(),
    workspaceEntered: draft.workspaceEntered,
    page: draft.page,
    projectTitle: draft.projectTitle.slice(0, MAX_PROJECT_TITLE_LENGTH),
    voiceId: draft.voiceId.slice(0, 120),
    speechSpeed: Math.min(2, Math.max(0.5, draft.speechSpeed)),
    speechPitch: Math.min(12, Math.max(-12, Math.round(draft.speechPitch))),
    speechEmotion: draft.speechEmotion,
    composerDraft: draft.composerDraft.slice(0, MAX_COMPOSER_LENGTH),
    directiveIds: draft.directiveIds.filter((id) => directiveIds.includes(id)),
    messages: draft.messages.slice(-MAX_MESSAGES).map((message) => ({
      id: message.id.slice(0, 160),
      role: message.role,
      text: message.text.slice(0, MAX_MESSAGE_LENGTH),
      badge: message.badge?.slice(0, 160),
    })),
    blocks,
    batchRetrySnapshot,
  }
}

export function normalizeWorkspaceSession(value: unknown): WorkspaceSession | null {
  if (!isRecord(value)) return null
  if (value.id !== ACTIVE_WORKSPACE_SESSION_ID) return null
  if (![1, 2, WORKSPACE_SESSION_SCHEMA_VERSION].includes(Number(value.schemaVersion))) return null
  if (typeof value.savedAt !== 'string') return null
  const savedAt = Date.parse(value.savedAt)
  if (!Number.isFinite(savedAt) || Date.now() - savedAt > MAX_SESSION_AGE_MS) return null
  const page = pages.includes(value.page as AppPage) ? value.page as AppPage : 'home'
  const rawMessages = Array.isArray(value.messages) ? value.messages : []
  const messages = rawMessages.slice(-MAX_MESSAGES).flatMap((message) => {
    if (!isRecord(message) || typeof message.id !== 'string') return []
    if (!['assistant', 'user', 'system'].includes(String(message.role))) return []
    return [{
      id: message.id.slice(0, 160),
      role: message.role as 'assistant' | 'user' | 'system',
      text: safeText(message.text, MAX_MESSAGE_LENGTH),
      badge: typeof message.badge === 'string' ? message.badge.slice(0, 160) : undefined,
    }]
  })
  const rawBlocks = Array.isArray(value.blocks) ? value.blocks : []
  const blocks = rawBlocks.slice(-MAX_BLOCKS).flatMap((block) => {
    const normalized = normalizeBlock(block)
    return normalized ? [normalized] : []
  })

  return {
    id: ACTIVE_WORKSPACE_SESSION_ID,
    schemaVersion: WORKSPACE_SESSION_SCHEMA_VERSION,
    revision: Math.max(0, Math.floor(finiteNumber(value.revision, 0))),
    savedAt: new Date(savedAt).toISOString(),
    workspaceEntered: value.workspaceEntered === true,
    page,
    projectTitle: safeText(value.projectTitle, MAX_PROJECT_TITLE_LENGTH) || '새 프로젝트',
    voiceId: safeText(value.voiceId, 120),
    speechSpeed: Math.min(2, Math.max(0.5, finiteNumber(value.speechSpeed, 1))),
    speechPitch: Math.min(12, Math.max(-12, Math.round(finiteNumber(value.speechPitch, 0)))),
    speechEmotion: ['neutral', 'happy', 'calm', 'sad', 'angry', 'commercial']
      .includes(String(value.speechEmotion))
      ? value.speechEmotion as VoiceEmotion
      : 'neutral',
    composerDraft: safeText(value.composerDraft, MAX_COMPOSER_LENGTH),
    directiveIds: Array.isArray(value.directiveIds)
      ? value.directiveIds.filter((id): id is typeof directiveIds[number] => (
          directiveIds.includes(id as typeof directiveIds[number])
        ))
      : ['numbers'],
    messages,
    blocks,
    batchRetrySnapshot: normalizeBatchRetrySnapshot(value.batchRetrySnapshot),
  }
}

export function hasMeaningfulWorkspaceSession(session: WorkspaceSession): boolean {
  return session.workspaceEntered
    || session.projectTitle !== '새 프로젝트'
    || session.speechSpeed !== 1
    || session.speechPitch !== 0
    || session.speechEmotion !== 'neutral'
    || session.blocks.length > 0
    || session.messages.length > 1
    || session.composerDraft.trim().length > 0
    || session.directiveIds.length !== 1
    || session.directiveIds[0] !== 'numbers'
    || session.batchRetrySnapshot.history.length > 0
}
