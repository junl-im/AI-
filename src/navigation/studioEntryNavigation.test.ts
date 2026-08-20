import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  alignStudioEntryToTop,
  calculateStudioEntryScrollTop,
  STUDIO_ENTRY_ANCHOR_ID,
} from './studioEntryNavigation'

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('studioEntryNavigation', () => {
  it('sticky header 아래에 텍스트 음성 섹션이 오도록 목표 위치를 계산한다', () => {
    expect(calculateStudioEntryScrollTop(420, 180, 50)).toBe(542)
    expect(calculateStudioEntryScrollTop(20, 0, 50)).toBe(0)
  })

  it('첫 스튜디오 진입 시 텍스트를 음성으로 섹션을 화면 최상단 기준으로 맞춘다', () => {
    const header = document.createElement('header')
    header.className = 'soa-compact-header'
    vi.spyOn(header, 'getBoundingClientRect').mockReturnValue({ height: 50 } as DOMRect)
    const anchor = document.createElement('section')
    anchor.id = STUDIO_ENTRY_ANCHOR_ID
    vi.spyOn(anchor, 'getBoundingClientRect').mockReturnValue({ top: 360 } as DOMRect)
    document.body.append(header, anchor)
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 120 })
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)

    expect(alignStudioEntryToTop()).toBe(true)
    expect(scrollTo).toHaveBeenCalledWith({ top: 422, behavior: 'auto' })
  })
})
