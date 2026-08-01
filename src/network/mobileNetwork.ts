interface NetworkInformationLike extends EventTarget {
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g'
  downlink?: number
  rtt?: number
  saveData?: boolean
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformationLike
  mozConnection?: NetworkInformationLike
  webkitConnection?: NetworkInformationLike
}

export interface MobileNetworkSnapshot {
  online: boolean
  effectiveType: string
  downlinkMbps: number | null
  rttMs: number | null
  saveData: boolean
  visible: boolean
  standalone: boolean
}

export function getNetworkInformation(): NetworkInformationLike | null {
  if (typeof navigator === 'undefined') return null
  const candidate = navigator as NavigatorWithConnection
  return candidate.connection ?? candidate.mozConnection ?? candidate.webkitConnection ?? null
}

export function getMobileNetworkSnapshot(): MobileNetworkSnapshot {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      online: true,
      effectiveType: 'unknown',
      downlinkMbps: null,
      rttMs: null,
      saveData: false,
      visible: true,
      standalone: false,
    }
  }
  const connection = getNetworkInformation()
  const navigatorStandalone = 'standalone' in navigator
    && Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  return {
    online: navigator.onLine,
    effectiveType: connection?.effectiveType ?? 'unknown',
    downlinkMbps: connection?.downlink ?? null,
    rttMs: connection?.rtt ?? null,
    saveData: connection?.saveData ?? false,
    visible: document.visibilityState === 'visible',
    standalone: window.matchMedia?.('(display-mode: standalone)').matches || navigatorStandalone,
  }
}

export function adaptiveTimeoutMs(baseMs: number): number {
  const network = getMobileNetworkSnapshot()
  if (!network.online) return Math.min(baseMs, 2_000)
  if (network.effectiveType === 'slow-2g' || network.effectiveType === '2g') {
    return Math.round(baseMs * 2.2)
  }
  if (network.effectiveType === '3g' || network.saveData) {
    return Math.round(baseMs * 1.5)
  }
  return baseMs
}

export function mobileNetworkLabel(snapshot = getMobileNetworkSnapshot()): string {
  if (!snapshot.online) return '오프라인'
  if (snapshot.effectiveType === 'unknown') return '네트워크 연결됨'
  const dataSaver = snapshot.saveData ? ' · 데이터 절약' : ''
  return `${snapshot.effectiveType.toUpperCase()}${dataSaver}`
}
