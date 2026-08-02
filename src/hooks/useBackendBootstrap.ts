import { useEffect, useRef } from 'react'
import {
  discoverApiBaseUrl,
  getApiConnectionContext,
  saveApiBaseUrl,
} from '../api/httpClient'
import { isKakaoInAppBrowser } from '../browser/inAppBrowser'
import { getNetworkInformation, getMobileNetworkSnapshot } from '../network/mobileNetwork'
import { runApiConnectivityAudit } from '../settings/connectivityApi'
import { useAppStore } from '../store/useAppStore'
import { isBrowserSpeechSupported } from '../tts/browserSpeech'

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

    const failOverApi = async (currentBaseUrl: string): Promise<boolean> => {
      try {
        const discovered = await discoverApiBaseUrl(currentBaseUrl)
        saveApiBaseUrl(discovered.baseUrl)
        retryIndexRef.current = 0
        setBackendStatus('checking', '다음 음성 서버로 자동 전환하고 있습니다.')
        return true
      } catch {
        return false
      }
    }

    const applyBrowserFallback = (detail: string) => {
      const browserReady = isBrowserSpeechSupported()
      setEngineHealth({
        api: 'offline',
        tts: browserReady ? 'ready' : 'offline',
        worker: 'unknown',
        gpu: 'unknown',
        baseUrl: getApiConnectionContext().baseUrl,
        latencyMs: null,
        lastCheckedAt: new Date().toISOString(),
        requestId: null,
      })
      setBackendStatus(
        browserReady ? 'degraded' : 'offline',
        browserReady
          ? isKakaoInAppBrowser()
            ? '카카오톡 브라우저 음성 준비 · 로컬 PC 엔진은 외부 브라우저에서 연결'
            : '브라우저 한국어 음성 준비 · AI 서버 자동 재연결 중'
          : detail,
      )
      return browserReady
    }

    async function inspect() {
      if (!aliveRef.current) return
      if (runningRef.current) {
        queuedRef.current = true
        return
      }
      runningRef.current = true
      clearRetry()
      let context = getApiConnectionContext()
      if (!context.configured) {
        if (isBrowserSpeechSupported()) {
          applyBrowserFallback('음성 시스템을 자동으로 찾고 있습니다.')
        } else {
          resetEngineHealth()
          setBackendStatus('checking', '음성 시스템을 자동으로 찾고 있습니다.')
        }
        try {
          const discovered = await discoverApiBaseUrl()
          saveApiBaseUrl(discovered.baseUrl)
          context = getApiConnectionContext()
        } catch (error) {
          applyBrowserFallback(
            error instanceof Error
              ? error.message
              : '음성 시스템을 자동으로 연결하지 못했습니다.',
          )
          runningRef.current = false
          scheduleRetry(inspect)
          return
        }
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
        const browserReady = isBrowserSpeechSupported()
        setEngineHealth({
          api: report.layers.api.state,
          tts: report.ttsReady ? report.layers.tts.state : browserReady ? 'ready' : report.layers.tts.state,
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
        } else if (!report.apiReady && await failOverApi(context.baseUrl)) {
          queuedRef.current = true
        } else if (browserReady) {
          setBackendStatus('degraded', '브라우저 한국어 음성 준비 · AI 서버 자동 재연결 중')
          scheduleRetry(inspect)
        } else if (report.apiReady) {
          setBackendStatus('degraded', report.layers.tts.detail)
          scheduleRetry(inspect)
        } else {
          setBackendStatus('offline', report.layers.api.detail)
          scheduleRetry(inspect)
        }
      } catch (error) {
        if (!aliveRef.current) return
        if (await failOverApi(context.baseUrl)) {
          queuedRef.current = true
        } else {
          applyBrowserFallback(
            error instanceof Error ? error.message : 'Voice API에 연결할 수 없습니다.',
          )
          scheduleRetry(inspect)
        }
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
    window.addEventListener('sorion-api-reconnect', requestInspect)
    window.addEventListener('online', requestInspect)
    window.addEventListener('offline', requestInspect)
    document.addEventListener('visibilitychange', handleVisibility)
    networkInformation?.addEventListener('change', requestInspect)
    return () => {
      aliveRef.current = false
      clearRetry()
      window.removeEventListener('sorion-api-change', requestInspect)
      window.removeEventListener('sorion-api-reconnect', requestInspect)
      window.removeEventListener('online', requestInspect)
      window.removeEventListener('offline', requestInspect)
      document.removeEventListener('visibilitychange', handleVisibility)
      networkInformation?.removeEventListener('change', requestInspect)
    }
  }, [resetEngineHealth, setBackendStatus, setEngineHealth])
}
