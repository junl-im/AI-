import { describe, expect, it } from 'vitest'
import { normalizeDesktopStudioLayout } from './useDesktopStudioLayout'

describe('desktop studio layout', () => {
  it('clamps persisted panel widths to safe desktop bounds', () => {
    expect(normalizeDesktopStudioLayout({ leftWidth: 10, rightWidth: 900 })).toMatchObject({
      leftWidth: 200,
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
