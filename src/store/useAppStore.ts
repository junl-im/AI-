import { create } from 'zustand'

export type AppPage = 'home' | 'quality' | 'projects' | 'settings'
export type BackendStatus = 'unknown' | 'checking' | 'online' | 'offline'

interface AppState {
  page: AppPage
  backendStatus: BackendStatus
  notice: string | null
  setPage: (page: AppPage) => void
  setBackendStatus: (status: BackendStatus) => void
  showNotice: (message: string) => void
  clearNotice: () => void
}

export const useAppStore = create<AppState>((set) => ({
  page: 'home',
  backendStatus: 'unknown',
  notice: null,
  setPage: (page) => set({ page }),
  setBackendStatus: (backendStatus) => set({ backendStatus }),
  showNotice: (notice) => set({ notice }),
  clearNotice: () => set({ notice: null }),
}))
