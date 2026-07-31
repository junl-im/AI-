import { useCallback, useEffect, useMemo, useState } from 'react'
import type { EngineInfo } from '../ai/contracts'
import { listEngines } from '../tts/voiceApi'

export function useEngineCatalog() {
  const [engines, setEngines] = useState<EngineInfo[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setEngines(await listEngines())
    } catch {
      setEngines([])
    } finally {
      setLoading(false)
    }
  }, [])

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

  return { engines, selected, loading, refresh }
}
