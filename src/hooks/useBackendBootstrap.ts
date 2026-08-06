import { useEffect, useRef } from 'react'
import {
  discoverApiBaseUrl,
  getApiConnectionContext,
  probeApiBaseUrl,
  saveApiBaseUrl,
} from '../api/httpClient'
import { getNetworkInformation, getMobileNetworkSnapshot } from '../network/mobileNetwork'
import { runApiConnectivityAudit } from '../settings/connectivityApi'
import { useAppStore } from '../store/useAppStore'
import { isBrowserSpeechSupported } from '../tts/browserSpeech'
import { primeEngineCatalog } from '../tts/voiceApi'

const RETRY_DELAYS_MS = [1_000, 2_500, 5_000, 10_000, 30_000]
const HEALTHY_HEARTBEAT_MS = 20_000
const HIDDEN_HEARTBEAT_MS = 90_000
const FULL_AUDIT_INTERVAL_MS = 120_000

export function useBackendBootstrap(): void {
  const setBackendStatus = useAppStore((state) => state.setBackendStatus)
  const setEngineHealth = useAppStore((state) => state.setEngineHealth)
  const runningRef = useRef(false)
  const queuedFullRef = useRef(false)
  const retryIndexRef = useRef(0)
  const timerRef = useRef<number | null>(null)
  const aliveRef = useRef(true)
  const lastFullAuditAtRef = useRef(0)

  useEffect(() => {
    aliveRef.current = true

    const clearTimer = () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
      timerRef.current = null
    }

    const schedule = (inspect: (forceFull?: boolean) => Promise<void>, delayMs: number, forceFull = false) => {
      clearTimer()
      timerRef.current = window.setTimeout(() => void inspect(forceFull), delayMs)
    }

    const scheduleHeartbeat = (inspect: (forceFull?: boolean) => Promise<void>) => {
      const network = getMobileNetworkSnapshot()
      if (!network.online) return
      schedule(
        inspect,
        document.visibilityState === 'visible' ? HEALTHY_HEARTBEAT_MS : HIDDEN_HEARTBEAT_MS,
      )
    }

    const scheduleRetry = (inspect: (forceFull?: boolean) => Promise<void>) => {
      clearTimer()
      const network = getMobileNetworkSnapshot()
      if (!network.online) return
      const index = Math.min(retryIndexRef.current, RETRY_DELAYS_MS.length - 1)
      schedule(inspect, RETRY_DELAYS_MS[index], true)
      retryIndexRef.current += 1
    }

    const applySeamlessFallback = () => {
      const browserReady = isBrowserSpeechSupported()
      const context = getApiConnectionContext()
      setEngineHealth({
        api: 'offline',
        tts: browserReady ? 'ready' : 'checking',
        worker: 'unknown',
        gpu: 'unknown',
        baseUrl: context.baseUrl,
        latencyMs: null,
        lastCheckedAt: new Date().toISOString(),
        requestId: null,
      })
      setBackendStatus(
        browserReady ? 'degraded' : 'checking',
        browserReady ? '음성 제작 준비됨' : '음성 기능을 자동으로 준비하고 있습니다.',
      )
      return browserReady
    }

    const discoverAndPromote = async (currentBaseUrl = ''): Promise<boolean> => {
      try {
        const discovered = await discoverApiBaseUrl(currentBaseUrl)
        saveApiBaseUrl(discovered.baseUrl, false)
        retryIndexRef.current = 0
        setBackendStatus('checking', '음성 기능을 자동으로 준비하고 있습니다.')
        return true
      } catch {
        return false
      }
    }

    async function inspect(forceFull = false): Promise<void> {
      if (!aliveRef.current) return
      if (runningRef.current) {
        queuedFullRef.current ||= forceFull
        return
      }
      runningRef.current = true
      clearTimer()

      try {
        let context = getApiConnectionContext()
        if (!context.configured) {
          applySeamlessFallback()
          if (!await discoverAndPromote()) {
            scheduleRetry(inspect)
            return
          }
          context = getApiConnectionContext()
        }

        const fullAuditDue = forceFull
          || Date.now() - lastFullAuditAtRef.current >= FULL_AUDIT_INTERVAL_MS

        if (!fullAuditDue) {
          try {
            const heartbeat = await probeApiBaseUrl(context.baseUrl, 2_500)
            if (!aliveRef.current) return
            retryIndexRef.current = 0
            setEngineHealth({
              api: 'ready',
              baseUrl: heartbeat.baseUrl,
              latencyMs: heartbeat.latencyMs,
              lastCheckedAt: new Date().toISOString(),
            })
            scheduleHeartbeat(inspect)
            return
          } catch {
            forceFull = true
          }
        }

        setBackendStatus('checking', '음성 기능을 자동으로 준비하고 있습니다.')
        setEngineHealth({
          api: 'checking',
          tts: 'checking',
          worker: 'checking',
          gpu: 'checking',
          baseUrl: context.baseUrl,
        })

        const report = await runApiConnectivityAudit(context.baseUrl, { mode: 'quick' })
        if (!aliveRef.current) return
        lastFullAuditAtRef.current = Date.now()
        primeEngineCatalog(report.ttsEngines, report.baseUrl)
        setEngineHealth({
          api: report.layers.api.state,
          tts: report.ttsReady
            ? report.layers.tts.state
            : isBrowserSpeechSupported()
              ? 'ready'
              : report.layers.tts.state,
          worker: report.layers.worker.state,
          gpu: report.layers.gpu.state,
          baseUrl: report.baseUrl,
          latencyMs: report.latencyMs,
          lastCheckedAt: report.lastCheckedAt,
          requestId: report.requestId,
        })

        if (report.apiReady) {
          window.dispatchEvent(new CustomEvent('sorion-engine-refresh', {
            detail: { baseUrl: report.baseUrl },
          }))
        }
        if (report.apiReady && report.ttsReady) {
          retryIndexRef.current = 0
          setBackendStatus('online', '음성 제작 준비됨')
          scheduleHeartbeat(inspect)
          return
        }
        if (!report.apiReady && await discoverAndPromote(context.baseUrl)) {
          queuedFullRef.current = true
          return
        }
        applySeamlessFallback()
        scheduleRetry(inspect)
      } catch {
        const context = getApiConnectionContext()
        if (await discoverAndPromote(context.baseUrl)) {
          queuedFullRef.current = true
        } else {
          applySeamlessFallback()
          scheduleRetry(inspect)
        }
      } finally {
        runningRef.current = false
        if (queuedFullRef.current && aliveRef.current) {
          queuedFullRef.current = false
          window.setTimeout(() => void inspect(true), 0)
        }
      }
    }

    const requestFullInspect = () => void inspect(true)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') requestFullInspect()
      else scheduleHeartbeat(inspect)
    }
    const handleOffline = () => {
      clearTimer()
      applySeamlessFallback()
    }
    const networkInformation = getNetworkInformation()

    applySeamlessFallback()
    void inspect(true)
    window.addEventListener('sorion-api-change', requestFullInspect)
    window.addEventListener('sorion-api-reconnect', requestFullInspect)
    window.addEventListener('online', requestFullInspect)
    window.addEventListener('offline', handleOffline)
    document.addEventListener('visibilitychange', handleVisibility)
    networkInformation?.addEventListener('change', requestFullInspect)
    return () => {
      aliveRef.current = false
      clearTimer()
      window.removeEventListener('sorion-api-change', requestFullInspect)
      window.removeEventListener('sorion-api-reconnect', requestFullInspect)
      window.removeEventListener('online', requestFullInspect)
      window.removeEventListener('offline', handleOffline)
      document.removeEventListener('visibilitychange', handleVisibility)
      networkInformation?.removeEventListener('change', requestFullInspect)
    }
  }, [setBackendStatus, setEngineHealth])
}
