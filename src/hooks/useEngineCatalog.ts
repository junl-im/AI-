import { useCallback, useEffect, useMemo, useState } from 'react'
import type { EngineInfo } from '../ai/contracts'
import { ApiError, getApiConnectionContext } from '../api/httpClient'
import { useAppStore } from '../store/useAppStore'
import { getBrowserSpeechEngine } from '../tts/browserSpeech'
import { invalidateEngineCatalogCache, listEngines } from '../tts/voiceApi'

function readyEngineMessage(engines: EngineInfo[]): {
  status: 'online' | 'degraded' | 'offline'
  message: string
} {
  const real = engines.find((engine) => (
    engine.ready
    && engine.health !== 'cooldown'
    && engine.health !== 'probing'
    && engine.autoEligible !== false
    && !['mock', 'browser'].includes(engine.mode)
  ))
  if (real) {
    return {
      status: 'online',
      message: '음성 제작 준비됨',
    }
  }
  const browser = engines.find((engine) => engine.ready && engine.mode === 'browser')
  if (browser) {
    return {
      status: 'degraded',
      message: '음성 제작 준비됨',
    }
  }
  const demo = engines.find((engine) => engine.ready && engine.mode === 'mock')
  if (demo) {
    return {
      status: 'degraded',
      message: '미리 듣기 준비됨',
    }
  }
  return {
    status: 'offline',
    message: '음성 기능을 자동으로 복구하고 있습니다.',
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
          ? '음성 제작 준비됨'
          : '음성 기능을 자동으로 준비하고 있습니다.',
      )
      setLoading(false)
      return
    }
    const browserEngine = getBrowserSpeechEngine()
    if (browserEngine) {
      setEngines((current) => current.some((engine) => (
        engine.ready
        && engine.health !== 'cooldown'
        && engine.health !== 'probing'
        && !['mock', 'browser'].includes(engine.mode)
      )) ? current : [browserEngine])
      setBackendStatus('degraded', '음성 제작 준비됨')
    }
    try {
      const apiEngines = await listEngines()
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
          ? '음성 제작 준비됨'
          : '음성 기능을 자동으로 복구하고 있습니다.',
      )
      setError(browserEngine ? null : (
        caught instanceof ApiError
          ? `${caught.code} · ${caught.message}`
          : '음성 기능을 자동으로 복구하고 있습니다.'
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
    const speechSynthesis = typeof window.speechSynthesis === 'undefined' ? null : window.speechSynthesis
    const handleVoicesChanged = () => {
      invalidateEngineCatalogCache()
      void refresh()
    }
    window.addEventListener('sorion-api-change', handleRefresh)
    window.addEventListener('sorion-engine-refresh', handleRefresh)
    window.addEventListener('online', handleRefresh)
    speechSynthesis?.addEventListener('voiceschanged', handleVoicesChanged)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.removeEventListener('sorion-api-change', handleRefresh)
      window.removeEventListener('sorion-engine-refresh', handleRefresh)
      window.removeEventListener('online', handleRefresh)
      speechSynthesis?.removeEventListener('voiceschanged', handleVoicesChanged)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [refresh])

  useEffect(() => {
    const cooldowns = engines
      .filter((engine) => engine.health === 'cooldown' && (engine.cooldownRemainingSeconds ?? 0) > 0)
      .map((engine) => engine.cooldownRemainingSeconds ?? 0)
    const probing = engines.some((engine) => engine.health === 'probing')
    if (!cooldowns.length && !probing) return undefined
    const delayMs = probing
      ? 900
      : Math.max(350, Math.min(...cooldowns) * 1000 + 200)
    const timer = window.setTimeout(() => {
      invalidateEngineCatalogCache()
      void refresh()
    }, delayMs)
    return () => window.clearTimeout(timer)
  }, [engines, refresh])

  const selected = useMemo(
    () => engines.find((engine) => (
      engine.ready
      && engine.recommended
      && engine.health !== 'cooldown'
      && engine.health !== 'probing'
    ))
      ?? engines.find((engine) => (
        engine.ready
        && engine.health !== 'cooldown'
        && engine.health !== 'probing'
        && engine.autoEligible !== false
        && !['mock', 'browser'].includes(engine.mode)
      ))
      ?? engines.find((engine) => engine.ready && engine.mode === 'browser')
      ?? engines.find((engine) => (
        engine.ready
        && engine.health !== 'cooldown'
        && engine.health !== 'probing'
      ))
      ?? null,
    [engines],
  )

  return { engines, selected, loading, error, configured, refresh }
}
