import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CSSProperties, KeyboardEvent, PointerEvent as ReactPointerEvent } from 'react'

const STORAGE_KEY = 'sorion.desktop-studio-layout.v2'
const LEFT_MIN = 188
const LEFT_MAX = 360
const RIGHT_MIN = 248
const RIGHT_MAX = 420

export interface DesktopStudioLayoutState {
  leftWidth: number
  rightWidth: number
  leftCollapsed: boolean
  rightCollapsed: boolean
}

type StudioSide = 'left' | 'right'

const DEFAULT_LAYOUT: DesktopStudioLayoutState = {
  leftWidth: 224,
  rightWidth: 286,
  leftCollapsed: false,
  rightCollapsed: false,
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)))
}

export function normalizeDesktopStudioLayout(value: Partial<DesktopStudioLayoutState>): DesktopStudioLayoutState {
  return {
    leftWidth: clamp(value.leftWidth ?? DEFAULT_LAYOUT.leftWidth, LEFT_MIN, LEFT_MAX),
    rightWidth: clamp(value.rightWidth ?? DEFAULT_LAYOUT.rightWidth, RIGHT_MIN, RIGHT_MAX),
    leftCollapsed: value.leftCollapsed === true,
    rightCollapsed: value.rightCollapsed === true,
  }
}

function loadLayout(): DesktopStudioLayoutState {
  if (typeof window === 'undefined') return DEFAULT_LAYOUT
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return DEFAULT_LAYOUT
    return normalizeDesktopStudioLayout(JSON.parse(stored) as Partial<DesktopStudioLayoutState>)
  } catch {
    return DEFAULT_LAYOUT
  }
}

export function useDesktopStudioLayout() {
  const [layout, setLayout] = useState<DesktopStudioLayoutState>(loadLayout)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layout))
    } catch {
      // Private browsing and storage policies must not block editing.
    }
  }, [layout])

  const toggle = useCallback((side: StudioSide) => {
    setLayout((current) => side === 'left'
      ? { ...current, leftCollapsed: !current.leftCollapsed }
      : { ...current, rightCollapsed: !current.rightCollapsed })
  }, [])

  const resizeBy = useCallback((side: StudioSide, delta: number) => {
    setLayout((current) => side === 'left'
      ? {
          ...current,
          leftCollapsed: false,
          leftWidth: clamp(current.leftWidth + delta, LEFT_MIN, LEFT_MAX),
        }
      : {
          ...current,
          rightCollapsed: false,
          rightWidth: clamp(current.rightWidth + delta, RIGHT_MIN, RIGHT_MAX),
        })
  }, [])

  const startResize = useCallback((side: StudioSide) => (
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    if (window.innerWidth < 1024) return
    event.preventDefault()
    const startX = event.clientX
    const initial = side === 'left' ? layout.leftWidth : layout.rightWidth
    const onMove = (moveEvent: PointerEvent) => {
      const delta = side === 'left'
        ? moveEvent.clientX - startX
        : startX - moveEvent.clientX
      setLayout((current) => side === 'left'
        ? { ...current, leftCollapsed: false, leftWidth: clamp(initial + delta, LEFT_MIN, LEFT_MAX) }
        : { ...current, rightCollapsed: false, rightWidth: clamp(initial + delta, RIGHT_MIN, RIGHT_MAX) })
    }
    const finish = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', finish)
      window.removeEventListener('pointercancel', finish)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', finish, { once: true })
    window.addEventListener('pointercancel', finish, { once: true })
  }, [layout.leftWidth, layout.rightWidth])

  const onSeparatorKeyDown = useCallback((side: StudioSide) => (
    event: KeyboardEvent<HTMLButtonElement>,
  ) => {
    const inward = side === 'left' ? event.key === 'ArrowRight' : event.key === 'ArrowLeft'
    const outward = side === 'left' ? event.key === 'ArrowLeft' : event.key === 'ArrowRight'
    if (!inward && !outward) return
    event.preventDefault()
    resizeBy(side, inward ? 12 : -12)
  }, [resizeBy])

  const style = useMemo(() => ({
    '--soa-project-rail-width': `${layout.leftCollapsed ? 56 : layout.leftWidth}px`,
    '--soa-voice-drawer-width': `${layout.rightCollapsed ? 56 : layout.rightWidth}px`,
  }) as CSSProperties, [layout])

  return {
    ...layout,
    style,
    toggleLeft: () => toggle('left'),
    toggleRight: () => toggle('right'),
    startLeftResize: startResize('left'),
    startRightResize: startResize('right'),
    onLeftSeparatorKeyDown: onSeparatorKeyDown('left'),
    onRightSeparatorKeyDown: onSeparatorKeyDown('right'),
  }
}
