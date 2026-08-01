import { useCallback, useEffect, useRef, useState } from 'react'

const BASE_STATE_KEY = '__sorionExitBase'
const GUARD_STATE_KEY = '__sorionExitGuard'

interface ExitConfirmationController {
  open: boolean
  stay: () => void
  exit: () => void
}

export function useExitConfirmation(): ExitConfirmationController {
  const [open, setOpen] = useState(false)
  const openRef = useRef(false)
  const bypassRef = useRef(false)

  const stay = useCallback(() => {
    openRef.current = false
    setOpen(false)
  }, [])

  const exit = useCallback(() => {
    bypassRef.current = true
    openRef.current = false
    setOpen(false)
    window.history.go(-2)
  }, [])

  useEffect(() => {
    const state = window.history.state as Record<string, unknown> | null
    if (!state?.[GUARD_STATE_KEY]) {
      window.history.replaceState(
        { ...(state ?? {}), [BASE_STATE_KEY]: true },
        document.title,
      )
      window.history.pushState(
        { ...(state ?? {}), [GUARD_STATE_KEY]: true },
        document.title,
      )
    }

    const handlePopState = () => {
      if (bypassRef.current) return
      if (openRef.current) {
        bypassRef.current = true
        window.history.back()
        return
      }
      openRef.current = true
      setOpen(true)
      window.history.pushState(
        { ...(window.history.state ?? {}), [GUARD_STATE_KEY]: true },
        document.title,
      )
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  return { open, stay, exit }
}
