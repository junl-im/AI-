import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

let openDialogCount = 0
let bodyOverflowBeforeDialogs = ''

function focusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    .filter((element) => element.getAttribute('aria-hidden') !== 'true')
}

export function useModalDialog<T extends HTMLElement>(
  open: boolean,
  onClose: () => void,
  returnFocusRef?: RefObject<HTMLElement | null>,
): RefObject<T | null> {
  const dialogRef = useRef<T | null>(null)
  const onCloseRef = useRef(onClose)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return undefined

    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null

    if (openDialogCount === 0) {
      bodyOverflowBeforeDialogs = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    }
    openDialogCount += 1

    const dialog = dialogRef.current
    const firstFocusable = dialog?.querySelector<HTMLElement>('[data-dialog-autofocus]')
      ?? (dialog ? focusableElements(dialog)[0] : null)
    firstFocusable?.focus({ preventScroll: true })

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return

      const items = focusableElements(dialogRef.current)
      if (items.length === 0) {
        event.preventDefault()
        dialogRef.current.focus({ preventScroll: true })
        return
      }

      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement

      if (event.shiftKey && (active === first || !dialogRef.current.contains(active))) {
        event.preventDefault()
        last.focus({ preventScroll: true })
      } else if (!event.shiftKey && (active === last || !dialogRef.current.contains(active))) {
        event.preventDefault()
        first.focus({ preventScroll: true })
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      openDialogCount = Math.max(0, openDialogCount - 1)
      if (openDialogCount === 0) {
        document.body.style.overflow = bodyOverflowBeforeDialogs
      }
      const previousFocus = previousFocusRef.current
      const returnTarget = previousFocus?.isConnected ? previousFocus : returnFocusRef?.current
      returnTarget?.focus({ preventScroll: true })
    }
  }, [open, returnFocusRef])

  return dialogRef
}
