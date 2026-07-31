import { useEffect, useMemo, useState } from 'react'
import type { EngineInfo } from '../ai/contracts'
import { listEngines } from '../tts/voiceApi'

export function useEngineCatalog() {
  const [engines, setEngines] = useState<EngineInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    void listEngines()
      .then((items) => {
        if (active) setEngines(items)
      })
      .catch(() => {
        if (active) setEngines([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const selected = useMemo(
    () => engines.find((engine) => engine.ready && engine.mode !== 'mock')
      ?? engines.find((engine) => engine.ready)
      ?? null,
    [engines],
  )

  return { engines, selected, loading }
}
