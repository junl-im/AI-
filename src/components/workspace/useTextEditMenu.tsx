import { useCallback, useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent, type RefObject } from 'react'
import { createPortal } from 'react-dom'

interface MenuState { x: number; y: number; start: number; end: number }

export function useTextEditMenu(value: string, onChange: (value: string) => void, maxLength: number, suppliedRef?: RefObject<HTMLTextAreaElement | null>) {
  const ownRef = useRef<HTMLTextAreaElement>(null)
  const editorRef = suppliedRef ?? ownRef
  const menuRef = useRef<HTMLDivElement>(null)
  const history = useRef<string[]>([])
  const future = useRef<string[]>([])
  const lastEmitted = useRef<string | null>(null)
  const [menu, setMenu] = useState<MenuState | null>(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (lastEmitted.current !== null && lastEmitted.current !== value) {
      history.current = []
      future.current = []
    }
    lastEmitted.current = value
  }, [value])

  useEffect(() => {
    if (!menu) return
    menuRef.current?.querySelector<HTMLElement>('button:not(:disabled)')?.focus({ preventScroll: true })
    const close = (event: PointerEvent) => {
      if (!(event.target as HTMLElement).closest('.soa-text-edit-menu')) setMenu(null)
    }
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenu(null) }
    window.addEventListener('pointerdown', close)
    window.addEventListener('keydown', escape)
    return () => { window.removeEventListener('pointerdown', close); window.removeEventListener('keydown', escape) }
  }, [menu])

  const change = useCallback((next: string) => {
    if (next === value) return
    history.current.push(value)
    if (history.current.length > 100) history.current.shift()
    future.current = []
    lastEmitted.current = next
    onChange(next)
  }, [onChange, value])

  const focusSelection = useCallback((start: number, end: number) => {
    const editor = editorRef.current
    editor?.focus({ preventScroll: true })
    editor?.setSelectionRange(start, end)
  }, [editorRef])

  const replaceSelection = useCallback((replacement: string) => {
    if (!menu) return
    const next = value.slice(0, menu.start) + replacement + value.slice(menu.end)
    if (next.length > maxLength) { setNotice(`최대 ${maxLength.toLocaleString()}자까지 입력할 수 있습니다.`); return }
    change(next)
    setMenu(null)
    requestAnimationFrame(() => focusSelection(menu.start + replacement.length, menu.start + replacement.length))
  }, [change, focusSelection, maxLength, menu, value])

  const undo = () => {
    const previous = history.current.pop()
    if (previous === undefined) return
    future.current.push(value)
    lastEmitted.current = previous
    onChange(previous)
    setMenu(null)
  }
  const redo = () => {
    const next = future.current.pop()
    if (next === undefined) return
    history.current.push(value)
    lastEmitted.current = next
    onChange(next)
    setMenu(null)
  }

  const editMenu = menu ? createPortal(
    <div ref={menuRef} className="soa-text-edit-menu" role="menu" aria-label="대사 편집 메뉴"
      style={{ left: Math.max(8, Math.min(menu.x, window.innerWidth - 200)), top: Math.max(8, Math.min(menu.y, window.innerHeight - 290)) }}>
      <button type="button" role="menuitem" disabled={!history.current.length} onClick={undo}>되돌리기 <kbd>Ctrl+Z</kbd></button>
      <button type="button" role="menuitem" disabled={!future.current.length} onClick={redo}>다시 실행 <kbd>Ctrl+Y</kbd></button>
      <hr />
      <button type="button" role="menuitem" disabled={menu.start === menu.end} onClick={async () => {
        try { await navigator.clipboard.writeText(value.slice(menu.start, menu.end)); setNotice('선택한 대사를 복사했습니다.') }
        catch { setNotice('복사 권한이 없습니다. Ctrl+C를 사용해 주세요.') }
        setMenu(null); focusSelection(menu.start, menu.end)
      }}>복사 <kbd>Ctrl+C</kbd></button>
      <button type="button" role="menuitem" onClick={async () => {
        try { replaceSelection(await navigator.clipboard.readText()); setNotice('붙여넣었습니다.') }
        catch { setNotice('붙여넣기 권한이 없습니다. Ctrl+V를 사용해 주세요.'); setMenu(null); focusSelection(menu.start, menu.end) }
      }}>붙여넣기 <kbd>Ctrl+V</kbd></button>
      <button type="button" role="menuitem" disabled={menu.start === menu.end} onClick={() => replaceSelection('')}>선택 내용 삭제 <kbd>Del</kbd></button>
      <button type="button" role="menuitem" onClick={() => { setMenu(null); focusSelection(0, value.length) }}>모두 선택 <kbd>Ctrl+A</kbd></button>
    </div>, document.body,
  ) : null

  return {
    editorRef,
    editMenu,
    notice,
    changeText: change,
    onTextChange: (event: ChangeEvent<HTMLTextAreaElement>) => change(event.target.value),
    onTextKeyDown: (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
        event.preventDefault()
        const rect = event.currentTarget.getBoundingClientRect()
        setNotice('')
        setMenu({ x: rect.left + 12, y: rect.top + 24, start: event.currentTarget.selectionStart, end: event.currentTarget.selectionEnd })
        return true
      }
      if (!(event.ctrlKey || event.metaKey)) return false
      const key = event.key.toLowerCase()
      if (key === 'z' && !event.shiftKey) { event.preventDefault(); undo(); return true }
      if (key === 'y' || (key === 'z' && event.shiftKey)) { event.preventDefault(); redo(); return true }
      return false
    },
    onTextContextMenu: (event: MouseEvent<HTMLTextAreaElement>) => {
      event.preventDefault()
      setNotice('')
      setMenu({ x: event.clientX, y: event.clientY, start: event.currentTarget.selectionStart, end: event.currentTarget.selectionEnd })
    },
  }
}
