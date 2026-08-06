import { useEffect } from 'react'
import { checkForAppUpdate } from './appUpdate'

const PERIODIC_CHECK_MS = 30 * 60 * 1000
const INITIAL_CHECK_DELAY_MS = 1_500

export function useAppUpdateMonitor(): void {
  useEffect(() => {
    if (import.meta.env.DEV) return

    const check = () => {
      void checkForAppUpdate()
    }
    const initialTimer = window.setTimeout(check, INITIAL_CHECK_DELAY_MS)
    const interval = window.setInterval(check, PERIODIC_CHECK_MS)
    const handleOnline = () => check()
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') check()
    }

    window.addEventListener('online', handleOnline)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.clearTimeout(initialTimer)
      window.clearInterval(interval)
      window.removeEventListener('online', handleOnline)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])
}
