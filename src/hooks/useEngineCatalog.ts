import { useCallback, useEffect, useMemo, useState } from 'react'
import type { EngineInfo } from '../ai/contracts'
import { ApiError, getApiConnectionContext } from '../api/httpClient'
import { useAppStore } from '../store/useAppStore'
import { listEngines } from '../tts/voiceApi'

function readyEngineMessage(engines: EngineInfo[]): {
  status: 'online' | 'degraded' | 'offline'
  message: string
} {
  const real = engines.find((engine) => engine.ready && engine.mode !== 'mock')
  if (real) {
    return {
      status: 'online',
      message: `${real.name} 엔진을 사용할 수 있습니다.`,
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
      setEngines([])
      setBackendStatus('checking', '음성 시스템을 자동으로 찾고 있습니다.')
      setLoading(false)
      return
    }
    try {
      const nextEngines = await listEngines()
      const readiness = readyEngineMessage(nextEngines)
      setEngines(nextEngines)
      setBackendStatus(readiness.status, readiness.message)
      if (readiness.status === 'offline') setError(readiness.message)
    } catch (caught) {
      setEngines([])
      setBackendStatus('offline', '음성 엔진 목록을 가져오지 못했습니다.')
      setError(
        caught instanceof ApiError
          ? `${caught.code} · ${caught.message}`
          : '음성 엔진 목록을 가져오지 못했습니다.',
      )
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
    () => engines.find((engine) => engine.ready && engine.mode !== 'mock')
      ?? engines.find((engine) => engine.ready)
      ?? null,
    [engines],
  )

  return { engines, selected, loading, error, configured, refresh }
}
