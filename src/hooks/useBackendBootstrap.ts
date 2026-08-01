import { useEffect, useRef } from 'react'
import { getApiConnectionContext } from '../api/httpClient'
import { getNetworkInformation, getMobileNetworkSnapshot } from '../network/mobileNetwork'
import { runApiConnectivityAudit } from '../settings/connectivityApi'
import { useAppStore } from '../store/useAppStore'

const RETRY_DELAYS_MS = [5_000, 12_000, 30_000, 60_000]

export function useBackendBootstrap(): void {
  const setBackendStatus = useAppStore((state) => state.setBackendStatus)
  const setEngineHealth = useAppStore((state) => state.setEngineHealth)
  const resetEngineHealth = useAppStore((state) => state.resetEngineHealth)
  const runningRef = useRef(false)
  const queuedRef = useRef(false)
  const retryIndexRef = useRef(0)
  const retryTimerRef = useRef<number | null>(null)
  const aliveRef = useRef(true)

  useEffect(() => {
    aliveRef.current = true

    const clearRetry = () => {
      if (retryTimerRef.current !== null) window.clearTimeout(retryTimerRef.current)
      retryTimerRef.current = null
    }

    const scheduleRetry = (inspect: () => Promise<void>) => {
      clearRetry()
      const network = getMobileNetworkSnapshot()
      if (!network.online || !network.visible) return
      const index = Math.min(retryIndexRef.current, RETRY_DELAYS_MS.length - 1)
      retryTimerRef.current = window.setTimeout(() => void inspect(), RETRY_DELAYS_MS[index])
      retryIndexRef.current += 1
    }

    async function inspect() {
      if (!aliveRef.current) return
      if (runningRef.current) {
        queuedRef.current = true
        return
      }
      runningRef.current = true
      clearRetry()
      const context = getApiConnectionContext()
      if (!context.configured) {
        resetEngineHealth()
        setBackendStatus('offline', 'Voice API가 설정되지 않았습니다. 채팅의 연결 메시지를 눌러 주세요.')
        runningRef.current = false
        return
      }

      setBackendStatus('checking', '모바일 네트워크에서 API·TTS·Worker·GPU를 확인하고 있습니다.')
      setEngineHealth({
        api: 'checking',
        tts: 'checking',
        worker: 'checking',
        gpu: 'checking',
        baseUrl: context.baseUrl,
      })
      try {
        const report = await runApiConnectivityAudit(context.baseUrl, { mode: 'quick' })
        if (!aliveRef.current) return
        setEngineHealth({
          api: report.layers.api.state,
          tts: report.layers.tts.state,
          worker: report.layers.worker.state,
          gpu: report.layers.gpu.state,
          baseUrl: report.baseUrl,
          latencyMs: report.latencyMs,
          lastCheckedAt: report.lastCheckedAt,
          requestId: report.requestId,
        })
        if (report.apiReady) window.dispatchEvent(new Event('sorion-engine-refresh'))
        if (report.apiReady && report.ttsReady) {
          retryIndexRef.current = 0
          setBackendStatus('online', `실제 TTS 준비 · ${report.latencyMs}ms`)
        } else if (report.apiReady) {
          setBackendStatus('degraded', report.layers.tts.detail)
          scheduleRetry(inspect)
        } else {
          setBackendStatus('offline', report.layers.api.detail)
          scheduleRetry(inspect)
        }
      } catch (error) {
        if (!aliveRef.current) return
        setEngineHealth({ api: 'offline', tts: 'unknown', worker: 'unknown', gpu: 'unknown' })
        setBackendStatus('offline', error instanceof Error ? error.message : 'Voice API에 연결할 수 없습니다.')
        scheduleRetry(inspect)
      } finally {
        runningRef.current = false
        if (queuedRef.current && aliveRef.current) {
          queuedRef.current = false
          window.setTimeout(() => void inspect(), 0)
        }
      }
    }

    const requestInspect = () => void inspect()
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') requestInspect()
    }
    const networkInformation = getNetworkInformation()

    void inspect()
    window.addEventListener('sorion-api-change', requestInspect)
    window.addEventListener('online', requestInspect)
    window.addEventListener('offline', requestInspect)
    document.addEventListener('visibilitychange', handleVisibility)
    networkInformation?.addEventListener('change', requestInspect)
    return () => {
      aliveRef.current = false
      clearRetry()
      window.removeEventListener('sorion-api-change', requestInspect)
      window.removeEventListener('online', requestInspect)
      window.removeEventListener('offline', requestInspect)
      document.removeEventListener('visibilitychange', handleVisibility)
      networkInformation?.removeEventListener('change', requestInspect)
    }
  }, [resetEngineHealth, setBackendStatus, setEngineHealth])
}
