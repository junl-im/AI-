import { useEffect } from 'react'
import { getApiConnectionContext } from '../api/httpClient'
import { runApiConnectivityAudit } from '../settings/connectivityApi'
import { useAppStore } from '../store/useAppStore'

export function useBackendBootstrap(): void {
  const setBackendStatus = useAppStore((state) => state.setBackendStatus)

  useEffect(() => {
    let active = true

    async function inspect() {
      const context = getApiConnectionContext()
      if (!context.configured) {
        if (active) {
          setBackendStatus(
            'offline',
            'Voice API가 설정되지 않았습니다. 채팅의 연결 메시지를 눌러 주세요.',
          )
        }
        return
      }

      setBackendStatus('checking', 'API·TTS·Worker 준비 상태를 확인하고 있습니다.')
      try {
        const report = await runApiConnectivityAudit(context.baseUrl)
        if (!active) return
        if (report.apiReady && report.ttsReady) {
          setBackendStatus(
            'online',
            `Voice API v${report.version ?? 'unknown'} · 실제 TTS 준비됨`,
          )
          return
        }
        if (report.apiReady) {
          const demoReady = report.ttsEngines.some((engine) => (
            engine.ready && engine.mode === 'mock'
          ))
          setBackendStatus(
            demoReady ? 'degraded' : 'offline',
            demoReady
              ? 'API는 연결됐지만 실제 TTS가 없어 Demo 엔진만 사용할 수 있습니다.'
              : 'API는 연결됐지만 실행 가능한 한국어 TTS 엔진이 없습니다.',
          )
          return
        }
        setBackendStatus('offline', '입력한 주소에서 SoriON Voice API를 찾지 못했습니다.')
      } catch (error) {
        if (active) {
          setBackendStatus(
            'offline',
            error instanceof Error
              ? error.message
              : 'Voice API에 연결할 수 없습니다.',
          )
        }
      }
    }

    const handleApiChange = () => void inspect()
    const handleOnline = () => void inspect()
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void inspect()
    }

    void inspect()
    window.addEventListener('sorion-api-change', handleApiChange)
    window.addEventListener('online', handleOnline)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      active = false
      window.removeEventListener('sorion-api-change', handleApiChange)
      window.removeEventListener('online', handleOnline)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [setBackendStatus])
}
