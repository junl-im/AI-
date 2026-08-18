import { useCallback, useEffect, useRef, useState } from 'react'

const BASE_STATE_KEY = '__sorionExitBase'
const GUARD_STATE_KEY = '__sorionExitGuard'

interface ExitConfirmationController {
  open: boolean
  stay: () => void
  exit: () => void
}

function pushExitGuard() {
  const state = window.history.state as Record<string, unknown> | null
  if (state?.[GUARD_STATE_KEY]) return
  window.history.pushState(
    { ...(state ?? {}), [GUARD_STATE_KEY]: true },
    document.title,
  )
}

export function useExitConfirmation(): ExitConfirmationController {
  const [open, setOpen] = useState(false)
  const openRef = useRef(false)
  const bypassRef = useRef(false)

  const stay = useCallback(() => {
    openRef.current = false
    setOpen(false)
    // Rearm only after the user explicitly stays. This avoids pushState races in mobile WebViews.
    pushExitGuard()
  }, [])

  const exit = useCallback(() => {
    bypassRef.current = true
    openRef.current = false
    setOpen(false)
    // The first Back already moved from the guard entry to the base entry.
    // One more Back is enough to leave the page and is more reliable in in-app browsers than go(-2).
    window.history.back()
  }, [])

  useEffect(() => {
    const state = window.history.state as Record<string, unknown> | null
    if (!state?.[GUARD_STATE_KEY]) {
      window.history.replaceState(
        { ...(state ?? {}), [BASE_STATE_KEY]: true },
        document.title,
      )
      pushExitGuard()
    }

    const handlePopState = () => {
      if (bypassRef.current) return
      if (openRef.current) {
        // A second hardware Back while the dialog is open is the user's explicit exit gesture.
        bypassRef.current = true
        return
      }
      openRef.current = true
      setOpen(true)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  return { open, stay, exit }
}
