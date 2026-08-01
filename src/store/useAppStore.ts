import { create } from 'zustand'
import type { ConnectionLayerState } from '../settings/connectivityTypes'

export type AppPage = 'home' | 'clone' | 'quality' | 'projects' | 'settings'
export type BackendStatus = 'unknown' | 'checking' | 'online' | 'degraded' | 'offline'

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
  connectionSheetOpen: boolean
  backendStatus: BackendStatus
  backendMessage: string
  engineHealth: EngineHealthSnapshot
  notice: string | null
  setPage: (page: AppPage) => void
  enterWorkspace: (page?: AppPage) => void
  exitWorkspace: () => void
  openConnectionSheet: () => void
  closeConnectionSheet: () => void
  setBackendStatus: (status: BackendStatus, message?: string) => void
  setEngineHealth: (health: Partial<EngineHealthSnapshot>) => void
  resetEngineHealth: () => void
  showNotice: (message: string) => void
  clearNotice: () => void
}

export const useAppStore = create<AppState>((set) => ({
  page: 'home',
  workspaceEntered: false,
  connectionSheetOpen: false,
  backendStatus: 'unknown',
  backendMessage: 'Voice API 상태를 확인하지 않았습니다.',
  engineHealth: initialEngineHealth,
  notice: null,
  setPage: (page) => set({ page }),
  enterWorkspace: (page = 'home') => set({ page, workspaceEntered: true }),
  exitWorkspace: () => set({ page: 'home', workspaceEntered: false }),
  openConnectionSheet: () => set({ connectionSheetOpen: true }),
  closeConnectionSheet: () => set({ connectionSheetOpen: false }),
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
}))
