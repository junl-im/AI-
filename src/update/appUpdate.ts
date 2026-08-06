import { create } from 'zustand'
import {
  currentBuildInfo,
  isDifferentBuild,
  parseAppBuildInfo,
  type AppBuildInfo,
} from './buildInfo'

export type AppUpdateStatus = 'idle' | 'checking' | 'current' | 'available' | 'error' | 'applying'

interface AppUpdateState {
  status: AppUpdateStatus
  remote: AppBuildInfo | null
  checkedAt: string | null
  message: string | null
  dismissedBuildId: string | null
  setState: (state: Partial<Omit<AppUpdateState, 'setState'>>) => void
}

export const useAppUpdateStore = create<AppUpdateState>((set) => ({
  status: 'idle',
  remote: null,
  checkedAt: null,
  message: null,
  dismissedBuildId: null,
  setState: (state) => set(state),
}))

const CHECK_COOLDOWN_MS = 60_000
const REQUEST_TIMEOUT_MS = 6_000
let inFlight: Promise<boolean> | null = null
let lastCheckStartedAt = 0

function buildManifestUrl(now = Date.now()): string {
  const base = typeof document === 'undefined' ? 'http://localhost/' : document.baseURI
  const url = new URL('version.json', base)
  url.searchParams.set('check', String(now))
  return url.toString()
}

export async function fetchRemoteBuildInfo(
  fetcher: typeof fetch,
  url: string,
  signal?: AbortSignal,
): Promise<AppBuildInfo> {
  const response = await fetcher(url, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
    signal,
  })
  if (!response.ok) {
    throw new Error(`업데이트 정보를 확인하지 못했습니다. HTTP ${response.status}`)
  }
  const parsed = parseAppBuildInfo(await response.json())
  if (!parsed) throw new Error('업데이트 정보 형식이 올바르지 않습니다.')
  return parsed
}

export async function checkForAppUpdate(options: {
  force?: boolean
  fetcher?: typeof fetch
  now?: () => number
  allowDevelopment?: boolean
} = {}): Promise<boolean> {
  if (import.meta.env.DEV && !options.allowDevelopment) {
    useAppUpdateStore.getState().setState({
      status: 'current',
      checkedAt: new Date().toISOString(),
      message: '개발 모드에서는 배포 업데이트 확인을 건너뜁니다.',
    })
    return false
  }

  const now = options.now ?? Date.now
  const startedAt = now()
  if (!options.force && startedAt - lastCheckStartedAt < CHECK_COOLDOWN_MS) {
    return useAppUpdateStore.getState().status === 'available'
  }
  if (inFlight) return inFlight

  lastCheckStartedAt = startedAt
  useAppUpdateStore.getState().setState({ status: 'checking', message: null })
  const fetcher = options.fetcher ?? fetch
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  inFlight = (async () => {
    try {
      const remote = await fetchRemoteBuildInfo(
        fetcher,
        buildManifestUrl(startedAt),
        controller.signal,
      )
      const available = isDifferentBuild(currentBuildInfo, remote)
      useAppUpdateStore.getState().setState({
        status: available ? 'available' : 'current',
        remote,
        checkedAt: new Date().toISOString(),
        message: available ? '새 배포본을 확인했습니다.' : '현재 최신 배포본을 사용 중입니다.',
        dismissedBuildId: available
          ? useAppUpdateStore.getState().dismissedBuildId
          : null,
      })
      return available
    } catch (error) {
      const message = error instanceof Error && error.name === 'AbortError'
        ? '업데이트 확인 시간이 초과되었습니다.'
        : error instanceof Error
          ? error.message
          : '업데이트 확인에 실패했습니다.'
      useAppUpdateStore.getState().setState({
        status: 'error',
        checkedAt: new Date().toISOString(),
        message,
      })
      return false
    } finally {
      clearTimeout(timer)
      inFlight = null
    }
  })()

  return inFlight
}

export function dismissAppUpdate(): void {
  const remoteBuildId = useAppUpdateStore.getState().remote?.buildId ?? null
  useAppUpdateStore.getState().setState({ dismissedBuildId: remoteBuildId })
}

export async function applyAppUpdate(): Promise<void> {
  useAppUpdateStore.getState().setState({ status: 'applying', message: '새 버전을 적용하고 있습니다.' })
  const remoteBuildId = useAppUpdateStore.getState().remote?.buildId ?? String(Date.now())
  try {
    if ('serviceWorker' in navigator) {
      const controllerChanged = new Promise<void>((resolve) => {
        navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true })
      })
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.allSettled(registrations.map(async (registration) => {
        await registration.update()
        registration.waiting?.postMessage({ type: 'SKIP_WAITING' })
      }))
      await Promise.race([
        controllerChanged,
        new Promise<void>((resolve) => window.setTimeout(resolve, 4_000)),
      ])
    }
  } finally {
    const nextUrl = new URL(window.location.href)
    nextUrl.searchParams.set('sorion-build', remoteBuildId)
    window.location.replace(nextUrl.toString())
  }
}
