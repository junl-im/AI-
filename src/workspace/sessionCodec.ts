import type { VoiceEmotion } from '../ai/contracts'
import type { AppPage } from '../store/useAppStore'
import type { TimelineBlockStatus } from './workspaceTypes'
import {
  ACTIVE_WORKSPACE_SESSION_ID,
  WORKSPACE_SESSION_SCHEMA_VERSION,
  type PersistedTimelineBlock,
  type WorkspaceSession,
  type WorkspaceSessionDraft,
} from './sessionTypes'

const MAX_MESSAGES = 100
const MAX_BLOCKS = 240
const MAX_MESSAGE_LENGTH = 4_000
const MAX_COMPOSER_LENGTH = 20_000
const MAX_BLOCK_TEXT_LENGTH = 2_000
const MAX_SESSION_AGE_MS = 1000 * 60 * 60 * 24 * 45
const pages: AppPage[] = ['home', 'clone', 'quality', 'projects', 'settings']
const statuses: TimelineBlockStatus[] = ['queued', 'generating', 'ready', 'failed']
const directiveIds = ['commercial', 'slow', 'numbers', 'bright'] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function safeText(value: unknown, limit: number): string {
  return typeof value === 'string' ? value.slice(0, limit) : ''
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
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
    engineId: typeof value.engineId === 'string' ? value.engineId.slice(0, 120) : undefined,
    normalizeText: value.normalizeText !== false,
    jobId: typeof value.jobId === 'string' ? value.jobId.slice(0, 160) : null,
    status,
    progress: Math.min(100, Math.max(0, finiteNumber(value.progress, 0))),
    durationSeconds: Math.max(0.1, finiteNumber(value.durationSeconds, 1.2)),
    error: typeof value.error === 'string' ? value.error.slice(0, 500) : null,
    revision: Math.max(1, Math.floor(finiteNumber(value.revision, 1))),
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
      engineId: block.engineId,
      normalizeText: block.normalizeText,
      jobId: block.jobId,
      status: block.status,
      progress: block.progress,
      durationSeconds: block.durationSeconds,
      error: block.error?.slice(0, 500) ?? null,
      revision: block.revision,
    }
  })

  return {
    id: ACTIVE_WORKSPACE_SESSION_ID,
    schemaVersion: WORKSPACE_SESSION_SCHEMA_VERSION,
    revision,
    savedAt: new Date().toISOString(),
    workspaceEntered: draft.workspaceEntered,
    page: draft.page,
    voiceId: draft.voiceId.slice(0, 120),
    composerDraft: draft.composerDraft.slice(0, MAX_COMPOSER_LENGTH),
    directiveIds: draft.directiveIds.filter((id) => directiveIds.includes(id)),
    messages: draft.messages.slice(-MAX_MESSAGES).map((message) => ({
      id: message.id.slice(0, 160),
      role: message.role,
      text: message.text.slice(0, MAX_MESSAGE_LENGTH),
      badge: message.badge?.slice(0, 160),
    })),
    blocks,
  }
}

export function normalizeWorkspaceSession(value: unknown): WorkspaceSession | null {
  if (!isRecord(value)) return null
  if (value.id !== ACTIVE_WORKSPACE_SESSION_ID) return null
  if (value.schemaVersion !== WORKSPACE_SESSION_SCHEMA_VERSION) return null
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
    voiceId: safeText(value.voiceId, 120),
    composerDraft: safeText(value.composerDraft, MAX_COMPOSER_LENGTH),
    directiveIds: Array.isArray(value.directiveIds)
      ? value.directiveIds.filter((id): id is typeof directiveIds[number] => (
          directiveIds.includes(id as typeof directiveIds[number])
        ))
      : ['numbers'],
    messages,
    blocks,
  }
}

export function hasMeaningfulWorkspaceSession(session: WorkspaceSession): boolean {
  return session.workspaceEntered
    || session.blocks.length > 0
    || session.messages.length > 1
    || session.composerDraft.trim().length > 0
    || session.directiveIds.length !== 1
    || session.directiveIds[0] !== 'numbers'
}
