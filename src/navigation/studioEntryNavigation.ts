export const STUDIO_ENTRY_ANCHOR_ID = 'text-to-speech-studio'
const STUDIO_ENTRY_GAP = 8

function frame(callback: FrameRequestCallback): number {
  if (typeof window.requestAnimationFrame === 'function') {
    return window.requestAnimationFrame(callback)
  }
  return window.setTimeout(() => callback(performance.now()), 0)
}

export function calculateStudioEntryScrollTop(
  anchorTop: number,
  currentScrollY: number,
  headerHeight: number,
): number {
  return Math.max(0, Math.round(currentScrollY + anchorTop - headerHeight - STUDIO_ENTRY_GAP))
}

export function alignStudioEntryToTop(): boolean {
  const anchor = document.getElementById(STUDIO_ENTRY_ANCHOR_ID)
  if (!(anchor instanceof HTMLElement)) return false
  const header = document.querySelector('.soa-compact-header')
  const headerHeight = header instanceof HTMLElement
    ? header.getBoundingClientRect().height
    : 50
  const targetTop = calculateStudioEntryScrollTop(
    anchor.getBoundingClientRect().top,
    window.scrollY,
    headerHeight,
  )
  window.scrollTo({ top: targetTop, behavior: 'auto' })
  return true
}

export function scheduleStudioEntryAlignment(maxFrames = 8): void {
  let attempts = 0
  const tryAlign = () => {
    attempts += 1
    if (alignStudioEntryToTop() || attempts >= maxFrames) return
    frame(tryAlign)
  }
  frame(tryAlign)
}
