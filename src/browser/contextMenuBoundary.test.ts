import { describe, expect, it } from 'vitest'
import { installContextMenuBoundary } from './contextMenuBoundary'

describe('context menu boundary', () => {
  it('native right-click is prevented without blocking editor handlers', () => {
    const element = document.createElement('div')
    document.body.append(element)
    let editorCalled = false
    element.addEventListener('contextmenu', () => { editorCalled = true })
    const dispose = installContextMenuBoundary()
    try {
      const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
      element.dispatchEvent(event)
      expect(event.defaultPrevented).toBe(true)
      expect(editorCalled).toBe(true)
    } finally {
      dispose()
      element.remove()
    }
    const normalEvent = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
    document.body.dispatchEvent(normalEvent)
    expect(normalEvent.defaultPrevented).toBe(false)
  })
})
