import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useLayoutEffect, useState } from 'react'
import { useAppStore } from '../../store/useAppStore'

export function NoticeToast() {
  const notice = useAppStore((state) => state.notice)
  const clearNotice = useAppStore((state) => state.clearNotice)
  const [dockClearance, setDockClearance] = useState(96)

  useLayoutEffect(() => {
    if (!notice) return
    const dock = document.querySelector<HTMLElement>('.soa-dubbing-player-dock, .soa-dock')
    const measure = () => {
      if (!dock) {
        setDockClearance(96)
        return
      }
      const bounds = dock.getBoundingClientRect()
      if (bounds.height === 0) {
        setDockClearance(24)
        return
      }
      const viewportBottom = window.visualViewport
        ? window.visualViewport.offsetTop + window.visualViewport.height
        : window.innerHeight
      setDockClearance(Math.max(24, Math.ceil(viewportBottom - bounds.top + 12)))
    }
    measure()
    const observer = dock && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    if (dock && observer) observer.observe(dock)
    window.addEventListener('resize', measure)
    window.visualViewport?.addEventListener('resize', measure)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', measure)
      window.visualViewport?.removeEventListener('resize', measure)
    }
  }, [notice])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(clearNotice, 3200)
    return () => window.clearTimeout(timer)
  }, [clearNotice, notice])

  return (
    <AnimatePresence>
      {notice ? (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12 }}
          style={{ bottom: dockClearance, maxHeight: `calc(100dvh - ${dockClearance + 12}px)` }}
          className="fixed left-1/2 z-[70] w-[calc(100%-2rem)] max-w-[470px] -translate-x-1/2 overflow-y-auto rounded-2xl bg-soa-ink px-4 py-3 text-sm font-semibold text-white shadow-soa"
        >
          {notice}
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
