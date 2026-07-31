import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'

export function NoticeToast() {
  const notice = useAppStore((state) => state.notice)
  const clearNotice = useAppStore((state) => state.clearNotice)

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
          className="fixed bottom-24 left-1/2 z-50 w-[calc(100%-2rem)] max-w-[470px] -translate-x-1/2 rounded-2xl bg-soa-ink px-4 py-3 text-sm font-semibold text-white shadow-soa"
        >
          {notice}
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
