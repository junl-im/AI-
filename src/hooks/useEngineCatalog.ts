import { useCallback, useEffect, useMemo, useState } from 'react'
import type { EngineInfo } from '../ai/contracts'
import { ApiError, getApiConnectionContext } from '../api/httpClient'
import { useAppStore } from '../store/useAppStore'
import { listEngines } from '../tts/voiceApi'

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
      setBackendStatus('offline')
      setError('Voice API 주소가 설정되지 않았습니다.')
      setLoading(false)
      return
    }
    try {
      setEngines(await listEngines())
      setBackendStatus('online')
    } catch (caught) {
      setEngines([])
      setBackendStatus('offline')
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
