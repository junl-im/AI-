import { create } from 'zustand'

export type AppPage = 'home' | 'clone' | 'quality' | 'projects' | 'settings'
export type BackendStatus = 'unknown' | 'checking' | 'online' | 'degraded' | 'offline'

interface AppState {
  page: AppPage
  workspaceEntered: boolean
  connectionSheetOpen: boolean
  backendStatus: BackendStatus
  backendMessage: string
  notice: string | null
  setPage: (page: AppPage) => void
  enterWorkspace: (page?: AppPage) => void
  exitWorkspace: () => void
  openConnectionSheet: () => void
  closeConnectionSheet: () => void
  setBackendStatus: (status: BackendStatus, message?: string) => void
  showNotice: (message: string) => void
  clearNotice: () => void
}

export const useAppStore = create<AppState>((set) => ({
  page: 'home',
  workspaceEntered: false,
  connectionSheetOpen: false,
  backendStatus: 'unknown',
  backendMessage: 'Voice API 상태를 확인하지 않았습니다.',
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
  showNotice: (notice) => set({ notice }),
  clearNotice: () => set({ notice: null }),
}))
