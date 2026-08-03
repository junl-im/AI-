export type BrowserDeviceProfile = 'android-chrome' | 'ios-safari' | 'pwa' | 'desktop-browser'
export type PlaybackProbeResult = 'not-tested' | 'passed' | 'blocked' | 'failed'
export type BackgroundRestoreResult = 'not-tested' | 'observed'

export interface BrowserSoakObservation {
  startedAt: string
  updatedAt: string
  networkTransitions: number
  visibilityTransitions: number
  backgroundReturnCount: number
  totalHiddenMs: number
  longestHiddenMs: number
  pageShowRestoreCount: number
}

export interface BrowserPlaybackEvidence {
  schemaVersion: 2
  recordedAt: string
  deviceProfile: BrowserDeviceProfile
  browserName: string
  standalone: boolean
  secureContext: boolean
  online: boolean
  eventSourceSupported: boolean
  serviceWorkerSupported: boolean
  mediaSessionSupported: boolean
  visibilityState: DocumentVisibilityState
  gesturePlayback: PlaybackProbeResult
  backgroundRestore: BackgroundRestoreResult
  soak: BrowserSoakObservation
}

const STORAGE_KEY = 'sorion.browser-playback-evidence.v2'
const LEGACY_STORAGE_KEY = 'sorion.browser-playback-evidence.v1'
const SILENT_WAV_DATA_URI = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='

function detectBrowserName(userAgent: string): string {
  const value = userAgent.toLowerCase()
  if (value.includes('crios')) return 'Chrome iOS'
  if (value.includes('fxios')) return 'Firefox iOS'
  if (value.includes('edgios')) return 'Edge iOS'
  if (value.includes('edg/')) return 'Edge'
  if (value.includes('chrome/') || value.includes('chromium/')) return 'Chrome'
  if (value.includes('firefox/')) return 'Firefox'
  if (value.includes('safari/')) return 'Safari'
  return 'Unknown browser'
}

function detectProfile(userAgent: string, standalone: boolean): BrowserDeviceProfile {
  if (standalone) return 'pwa'
  const value = userAgent.toLowerCase()
  if (value.includes('android')) return 'android-chrome'
  if (/iphone|ipad|ipod/.test(value)) return 'ios-safari'
  return 'desktop-browser'
}

function createSoakObservation(now = new Date().toISOString()): BrowserSoakObservation {
  return {
    startedAt: now,
    updatedAt: now,
    networkTransitions: 0,
    visibilityTransitions: 0,
    backgroundReturnCount: 0,
    totalHiddenMs: 0,
    longestHiddenMs: 0,
    pageShowRestoreCount: 0,
  }
}

function normalizeSoak(value: unknown, fallbackAt: string): BrowserSoakObservation {
  if (!value || typeof value !== 'object') return createSoakObservation(fallbackAt)
  const soak = value as Partial<BrowserSoakObservation>
  return {
    startedAt: typeof soak.startedAt === 'string' ? soak.startedAt : fallbackAt,
    updatedAt: typeof soak.updatedAt === 'string' ? soak.updatedAt : fallbackAt,
    networkTransitions: Math.max(0, Number(soak.networkTransitions) || 0),
    visibilityTransitions: Math.max(0, Number(soak.visibilityTransitions) || 0),
    backgroundReturnCount: Math.max(0, Number(soak.backgroundReturnCount) || 0),
    totalHiddenMs: Math.max(0, Number(soak.totalHiddenMs) || 0),
    longestHiddenMs: Math.max(0, Number(soak.longestHiddenMs) || 0),
    pageShowRestoreCount: Math.max(0, Number(soak.pageShowRestoreCount) || 0),
  }
}

export function collectBrowserPlaybackEvidence(
  gesturePlayback: PlaybackProbeResult = 'not-tested',
  backgroundRestore: BackgroundRestoreResult = 'not-tested',
  soak?: BrowserSoakObservation,
): BrowserPlaybackEvidence {
  const standalone = window.matchMedia?.('(display-mode: standalone)').matches
    || Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  const recordedAt = new Date().toISOString()
  return {
    schemaVersion: 2,
    recordedAt,
    deviceProfile: detectProfile(navigator.userAgent, standalone),
    browserName: detectBrowserName(navigator.userAgent),
    standalone,
    secureContext: Boolean(window.isSecureContext),
    online: Boolean(navigator.onLine),
    eventSourceSupported: 'EventSource' in window,
    serviceWorkerSupported: 'serviceWorker' in navigator,
    mediaSessionSupported: 'mediaSession' in navigator,
    visibilityState: document.visibilityState,
    gesturePlayback,
    backgroundRestore,
    soak: soak ? { ...soak, updatedAt: recordedAt } : createSoakObservation(recordedAt),
  }
}

export async function runGesturePlaybackProbe(): Promise<PlaybackProbeResult> {
  const audio = new Audio(SILENT_WAV_DATA_URI)
  audio.muted = true
  audio.preload = 'auto'
  try {
    await audio.play()
    audio.pause()
    audio.removeAttribute('src')
    audio.load()
    return 'passed'
  } catch (error) {
    return error instanceof DOMException && error.name === 'NotAllowedError'
      ? 'blocked'
      : 'failed'
  }
}

function parseEvidence(raw: string): BrowserPlaybackEvidence | null {
  try {
    const value = JSON.parse(raw) as Partial<Omit<BrowserPlaybackEvidence, 'backgroundRestore'>> & {
      backgroundRestore?: BackgroundRestoreResult | PlaybackProbeResult
    }
    if (typeof value.recordedAt !== 'string') return null
    const backgroundRestore = value.backgroundRestore === 'observed' || value.backgroundRestore === 'passed'
      ? 'observed'
      : 'not-tested'
    return {
      ...collectBrowserPlaybackEvidence(
        value.gesturePlayback ?? 'not-tested',
        backgroundRestore,
        normalizeSoak(value.soak, value.recordedAt),
      ),
      recordedAt: value.recordedAt,
      deviceProfile: value.deviceProfile ?? 'desktop-browser',
      browserName: typeof value.browserName === 'string' ? value.browserName : 'Unknown browser',
      standalone: Boolean(value.standalone),
      secureContext: Boolean(value.secureContext),
      online: Boolean(value.online),
      eventSourceSupported: Boolean(value.eventSourceSupported),
      serviceWorkerSupported: Boolean(value.serviceWorkerSupported),
      mediaSessionSupported: Boolean(value.mediaSessionSupported),
      visibilityState: value.visibilityState ?? 'visible',
      gesturePlayback: value.gesturePlayback ?? 'not-tested',
      backgroundRestore,
    }
  } catch {
    return null
  }
}

export function loadBrowserPlaybackEvidence(): BrowserPlaybackEvidence | null {
  try {
    const current = window.localStorage.getItem(STORAGE_KEY)
    if (current) return parseEvidence(current)
    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY)
    const migrated = legacy ? parseEvidence(legacy) : null
    if (migrated) saveBrowserPlaybackEvidence(migrated)
    return migrated
  } catch {
    return null
  }
}

export function saveBrowserPlaybackEvidence(evidence: BrowserPlaybackEvidence) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(evidence))
    window.localStorage.removeItem(LEGACY_STORAGE_KEY)
  } catch {
    // Private browsing and storage quotas must not block playback diagnostics.
  }
}

export function resetBrowserSoakEvidence(
  evidence: BrowserPlaybackEvidence | null,
): BrowserPlaybackEvidence {
  return collectBrowserPlaybackEvidence(
    evidence?.gesturePlayback ?? 'not-tested',
    'not-tested',
    createSoakObservation(),
  )
}

export function startBrowserPlaybackEvidenceMonitor(
  onUpdate: (evidence: BrowserPlaybackEvidence) => void,
  nowMs: () => number = Date.now,
): () => void {
  let evidence = loadBrowserPlaybackEvidence() ?? collectBrowserPlaybackEvidence()
  let hiddenAt = document.visibilityState === 'hidden' ? nowMs() : null

  const readCurrent = () => loadBrowserPlaybackEvidence() ?? evidence
  const commit = (
    base: BrowserPlaybackEvidence,
    nextSoak: BrowserSoakObservation,
    backgroundRestore = base.backgroundRestore,
  ) => {
    evidence = collectBrowserPlaybackEvidence(base.gesturePlayback, backgroundRestore, nextSoak)
    saveBrowserPlaybackEvidence(evidence)
    onUpdate(evidence)
  }

  const handleNetwork = () => {
    const base = readCurrent()
    commit(base, {
      ...base.soak,
      networkTransitions: base.soak.networkTransitions + 1,
    })
  }
  const handleVisibility = () => {
    const base = readCurrent()
    const now = nowMs()
    const next = {
      ...base.soak,
      visibilityTransitions: base.soak.visibilityTransitions + 1,
    }
    if (document.visibilityState === 'hidden') {
      hiddenAt = now
      commit(base, next)
      return
    }
    if (hiddenAt !== null) {
      const hiddenDuration = Math.max(0, now - hiddenAt)
      hiddenAt = null
      commit(base, {
        ...next,
        backgroundReturnCount: next.backgroundReturnCount + 1,
        totalHiddenMs: next.totalHiddenMs + hiddenDuration,
        longestHiddenMs: Math.max(next.longestHiddenMs, hiddenDuration),
      }, 'observed')
      return
    }
    commit(base, next)
  }
  const handlePageShow = (event: PageTransitionEvent) => {
    if (!event.persisted) return
    const base = readCurrent()
    commit(base, {
      ...base.soak,
      pageShowRestoreCount: base.soak.pageShowRestoreCount + 1,
    }, 'observed')
  }

  window.addEventListener('online', handleNetwork)
  window.addEventListener('offline', handleNetwork)
  document.addEventListener('visibilitychange', handleVisibility)
  window.addEventListener('pageshow', handlePageShow)
  saveBrowserPlaybackEvidence(evidence)
  onUpdate(evidence)

  return () => {
    window.removeEventListener('online', handleNetwork)
    window.removeEventListener('offline', handleNetwork)
    document.removeEventListener('visibilitychange', handleVisibility)
    window.removeEventListener('pageshow', handlePageShow)
  }
}

export function downloadBrowserPlaybackEvidence(evidence: BrowserPlaybackEvidence) {
  const blob = new Blob([JSON.stringify(evidence, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `sorion-browser-playback-${evidence.deviceProfile}-${evidence.recordedAt.slice(0, 10)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}
