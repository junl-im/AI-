import { describe, expect, it } from 'vitest'
import { normalizeDesktopStudioLayout } from './useDesktopStudioLayout'

describe('desktop studio layout', () => {
  it('starts PC workspaces with all three panes expanded', () => {
    expect(normalizeDesktopStudioLayout({})).toMatchObject({
      leftWidth: 224,
      rightWidth: 286,
      leftCollapsed: false,
      rightCollapsed: false,
    })
  })

  it('clamps persisted panel widths to safe desktop bounds', () => {
    expect(normalizeDesktopStudioLayout({ leftWidth: 10, rightWidth: 900 })).toMatchObject({
      leftWidth: 188,
      rightWidth: 420,
    })
  })

  it('preserves collapsed panel choices', () => {
    expect(normalizeDesktopStudioLayout({ leftCollapsed: true, rightCollapsed: true })).toMatchObject({
      leftCollapsed: true,
      rightCollapsed: true,
    })
  })
})
