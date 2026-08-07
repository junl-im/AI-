import { describe, expect, it } from 'vitest'
import {
  calculateDesktopStudioViewport,
  normalizeDesktopStudioLayout,
} from './useDesktopStudioLayout'

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

  it.each([
    [1024, 502],
    [1280, 758],
    [1440, 918],
  ])('keeps a usable three-pane center at %ipx', (viewportWidth, centerWidth) => {
    expect(calculateDesktopStudioViewport(viewportWidth)).toMatchObject({
      viewportWidth,
      threePane: true,
      leftWidth: 224,
      centerWidth,
      rightWidth: 286,
    })
  })

  it('uses the full width below the desktop breakpoint', () => {
    expect(calculateDesktopStudioViewport(960)).toEqual({
      viewportWidth: 960,
      threePane: false,
      leftWidth: 0,
      centerWidth: 960,
      rightWidth: 0,
    })
  })
})
