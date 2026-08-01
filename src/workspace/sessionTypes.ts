import type { VoiceEmotion } from '../ai/contracts'
import type { AppPage } from '../store/useAppStore'
import type {
  ComposerDirective,
  TimelineBlock,
  TimelineBlockStatus,
  WorkspaceMessage,
} from './workspaceTypes'

export const ACTIVE_WORKSPACE_SESSION_ID = 'active-workspace'
export const WORKSPACE_SESSION_SCHEMA_VERSION = 2

export type WorkspaceStorageMode = 'indexeddb' | 'localstorage' | 'memory'

export interface PersistedTimelineVoiceBlock {
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
  jobId: string | null
  status: TimelineBlockStatus
  progress: number
  durationSeconds: number
  error: string | null
  revision: number
}

export interface PersistedTimelinePauseBlock {
  id: string
  kind: 'pause'
  durationSeconds: number
}

export type PersistedTimelineBlock =
  | PersistedTimelineVoiceBlock
  | PersistedTimelinePauseBlock

export interface WorkspaceSession {
  id: typeof ACTIVE_WORKSPACE_SESSION_ID
  schemaVersion: typeof WORKSPACE_SESSION_SCHEMA_VERSION
  revision: number
  savedAt: string
  workspaceEntered: boolean
  page: AppPage
  projectTitle: string
  voiceId: string
  speechSpeed: number
  speechPitch: number
  speechEmotion: VoiceEmotion
  composerDraft: string
  directiveIds: ComposerDirective['id'][]
  messages: WorkspaceMessage[]
  blocks: PersistedTimelineBlock[]
}

export interface WorkspaceSessionDraft {
  workspaceEntered: boolean
  page: AppPage
  projectTitle: string
  voiceId: string
  speechSpeed: number
  speechPitch: number
  speechEmotion: VoiceEmotion
  composerDraft: string
  directiveIds: ComposerDirective['id'][]
  messages: WorkspaceMessage[]
  blocks: TimelineBlock[]
}

export interface WorkspaceSessionLoadResult {
  session: WorkspaceSession | null
  mode: WorkspaceStorageMode
}

export interface WorkspaceSessionSaveResult {
  mode: WorkspaceStorageMode
  persisted: boolean
}
