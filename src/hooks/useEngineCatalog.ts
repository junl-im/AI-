import { useCallback, useEffect, useMemo, useState } from 'react'
import type { EngineInfo } from '../ai/contracts'
import { ApiError, getApiConnectionContext } from '../api/httpClient'
import { useAppStore } from '../store/useAppStore'
import { getBrowserSpeechEngine } from '../tts/browserSpeech'
import { listEngines } from '../tts/voiceApi'

function readyEngineMessage(engines: EngineInfo[]): {
  status: 'online' | 'degraded' | 'offline'
  message: string
} {
  const real = engines.find((engine) => engine.ready && !['mock', 'browser'].includes(engine.mode))
  if (real) {
    return {
      status: 'online',
      message: `${real.name} 엔진을 사용할 수 있습니다.`,
    }
  }
  const browser = engines.find((engine) => engine.ready && engine.mode === 'browser')
  if (browser) {
    return {
      status: 'degraded',
      message: '브라우저 한국어 음성을 사용할 수 있습니다. AI 서버는 백그라운드에서 다시 연결합니다.',
    }
  }
  const demo = engines.find((engine) => engine.ready && engine.mode === 'mock')
  if (demo) {
    return {
      status: 'degraded',
      message: '실제 TTS 엔진이 없어 Demo 음성만 사용할 수 있습니다.',
    }
  }
  return {
    status: 'offline',
    message: '실행 가능한 음성 엔진이 없습니다.',
  }
}

export function useEngineCatalog() {
  const setBackendStatus = useAppStore((state) => state.setBackendStatus)
  const [engines, setEngines] = useState<EngineInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [configured, setConfigured] = useState(getApiConnectionContext().configured)

  const refresh = useCallback(async () => {
    const context = getApiConnectionContext()
    setConfigured(context.configured)
    setLoading(true)
    setError(null)
    if (!context.configured) {
      const browserEngine = getBrowserSpeechEngine()
      setEngines(browserEngine ? [browserEngine] : [])
      setBackendStatus(
        browserEngine ? 'degraded' : 'checking',
        browserEngine
          ? '브라우저 한국어 음성 준비 · AI 서버 자동 연결 대기'
          : '음성 시스템을 자동으로 찾고 있습니다.',
      )
      setLoading(false)
      return
    }
    try {
      const apiEngines = await listEngines()
      const browserEngine = getBrowserSpeechEngine()
      const nextEngines = browserEngine
        ? [...apiEngines.filter((engine) => engine.id !== browserEngine.id), browserEngine]
        : apiEngines
      const readiness = readyEngineMessage(nextEngines)
      setEngines(nextEngines)
      setBackendStatus(readiness.status, readiness.message)
      if (readiness.status === 'offline') setError(readiness.message)
    } catch (caught) {
      const browserEngine = getBrowserSpeechEngine()
      setEngines(browserEngine ? [browserEngine] : [])
      setBackendStatus(
        browserEngine ? 'degraded' : 'offline',
        browserEngine
          ? '브라우저 한국어 음성 준비 · AI 서버 재연결 중'
          : '음성 엔진 목록을 가져오지 못했습니다.',
      )
      setError(browserEngine ? null : (
        caught instanceof ApiError
          ? `${caught.code} · ${caught.message}`
          : '음성 엔진 목록을 가져오지 못했습니다.'
      ))
    } finally {
      setLoading(false)
    }
  }, [setBackendStatus])

  useEffect(() => {
    void refresh()
    const handleRefresh = () => void refresh()
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    window.addEventListener('sorion-api-change', handleRefresh)
    window.addEventListener('sorion-engine-refresh', handleRefresh)
    window.addEventListener('online', handleRefresh)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.removeEventListener('sorion-api-change', handleRefresh)
      window.removeEventListener('sorion-engine-refresh', handleRefresh)
      window.removeEventListener('online', handleRefresh)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [refresh])

  const selected = useMemo(
    () => engines.find((engine) => engine.ready && engine.recommended)
      ?? engines.find((engine) => engine.ready && !['mock', 'browser'].includes(engine.mode))
      ?? engines.find((engine) => engine.ready && engine.mode === 'browser')
      ?? engines.find((engine) => engine.ready)
      ?? null,
    [engines],
  )

  return { engines, selected, loading, error, configured, refresh }
}
