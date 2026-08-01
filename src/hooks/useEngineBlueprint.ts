import { useCallback, useEffect, useState } from 'react'
import { getApiConnectionContext } from '../api/httpClient'
import { getEngineBlueprint } from '../engines/catalogApi'
import type { EngineBlueprint } from '../engines/catalogTypes'

export function useEngineBlueprint() {
  const [blueprint, setBlueprint] = useState<EngineBlueprint | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!getApiConnectionContext().configured) {
      setBlueprint(null)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      setBlueprint(await getEngineBlueprint())
    } catch (caught) {
      setBlueprint(null)
      setError(caught instanceof Error ? caught.message : '엔진 설계를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    const handleRefresh = () => void refresh()
    window.addEventListener('sorion-api-change', handleRefresh)
    return () => window.removeEventListener('sorion-api-change', handleRefresh)
  }, [refresh])

  return { blueprint, loading, error, refresh }
}
