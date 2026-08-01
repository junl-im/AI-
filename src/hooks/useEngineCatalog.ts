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
      setBackendStatus('offline', 'Voice API 주소가 설정되지 않았습니다.')
      setError('Voice API 주소가 설정되지 않았습니다.')
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
    const handleApiChange = () => void refresh()
    window.addEventListener('sorion-api-change', handleApiChange)
    return () => window.removeEventListener('sorion-api-change', handleApiChange)
  }, [refresh])

  const selected = useMemo(
    () => engines.find((engine) => engine.ready && engine.mode !== 'mock')
      ?? engines.find((engine) => engine.ready)
      ?? null,
    [engines],
  )

  return { engines, selected, loading, error, configured, refresh }
}
