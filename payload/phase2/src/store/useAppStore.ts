import { create } from 'zustand'
import type { VoiceProject } from '../projects/projectTypes'
import type { ConnectionLayerState } from '../settings/connectivityTypes'

export type AppPage = 'home' | 'clone' | 'quality' | 'projects' | 'settings'
export type BackendStatus = 'unknown' | 'checking' | 'online' | 'degraded' | 'offline'

export type LiveVoiceKind = 'preset' | 'my-voice'
export type LiveVoiceReadiness = 'checking' | 'ready' | 'limited' | 'offline' | 'generating'

export interface LiveVoiceSnapshot {
  voiceId: string
  voiceName: string
  voiceKind: LiveVoiceKind
  engineId: string | null
  engineName: string
  readiness: LiveVoiceReadiness
  detail: string
}

const initialLiveVoice: LiveVoiceSnapshot = {
  voiceId: 'sori-warm',
  voiceName: '혜린',
  voiceKind: 'preset',
  engineId: null,
  engineName: '자동 엔진',
  readiness: 'checking',
  detail: '음성 엔진을 확인하고 있습니다.',
}

export interface EngineHealthSnapshot {
  api: ConnectionLayerState
  tts: ConnectionLayerState
  worker: ConnectionLayerState
  gpu: ConnectionLayerState
  baseUrl: string
  latencyMs: number | null
  lastCheckedAt: string | null
  requestId: string | null
}

const initialEngineHealth: EngineHealthSnapshot = {
  api: 'unknown',
  tts: 'unknown',
  worker: 'unknown',
  gpu: 'unknown',
  baseUrl: '',
  latencyMs: null,
  lastCheckedAt: null,
  requestId: null,
}

interface AppState {
  page: AppPage
  workspaceEntered: boolean
  activeProject: VoiceProject | null
  workspaceResetToken: number
  backendStatus: BackendStatus
  backendMessage: string
  engineHealth: EngineHealthSnapshot
  notice: string | null
  liveVoice: LiveVoiceSnapshot
  setPage: (page: AppPage) => void
  enterWorkspace: (page?: AppPage) => void
  openProject: (project: VoiceProject) => void
  startNewWorkspace: () => void
  clearActiveProject: () => void
  exitWorkspace: () => void
  setBackendStatus: (status: BackendStatus, message?: string) => void
  setEngineHealth: (health: Partial<EngineHealthSnapshot>) => void
  resetEngineHealth: () => void
  showNotice: (message: string) => void
  clearNotice: () => void
  setLiveVoice: (snapshot: LiveVoiceSnapshot) => void
}

export const useAppStore = create<AppState>((set) => ({
  page: 'home',
  workspaceEntered: false,
  activeProject: null,
  workspaceResetToken: 0,
  backendStatus: 'unknown',
  backendMessage: '음성 시스템을 자동으로 확인하고 있습니다.',
  engineHealth: initialEngineHealth,
  notice: null,
  liveVoice: initialLiveVoice,
  setPage: (page) => set({ page }),
  enterWorkspace: (page = 'home') => set({ page, workspaceEntered: true }),
  openProject: (activeProject) => set({
    activeProject,
    page: 'home',
    workspaceEntered: true,
  }),
  startNewWorkspace: () => set((state) => ({
    activeProject: null,
    page: 'home',
    workspaceEntered: true,
    workspaceResetToken: state.workspaceResetToken + 1,
  })),
  clearActiveProject: () => set({ activeProject: null }),
  exitWorkspace: () => set({ page: 'home', workspaceEntered: false }),
  setBackendStatus: (backendStatus, backendMessage) => set((state) => ({
    backendStatus,
    backendMessage: backendMessage ?? state.backendMessage,
  })),
  setEngineHealth: (health) => set((state) => ({
    engineHealth: { ...state.engineHealth, ...health },
  })),
  resetEngineHealth: () => set({ engineHealth: initialEngineHealth }),
  showNotice: (notice) => set({ notice }),
  clearNotice: () => set({ notice: null }),
  setLiveVoice: (liveVoice) => set({ liveVoice }),
}))
