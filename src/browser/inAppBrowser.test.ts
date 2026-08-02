import { describe, expect, it } from 'vitest'
import {
  buildExternalBrowserUrl,
  detectInAppBrowser,
  isKakaoInAppBrowser,
} from './inAppBrowser'

describe('inAppBrowser', () => {
  it('카카오톡 Android와 iOS WebView를 식별한다', () => {
    const android = 'Mozilla/5.0 (Linux; Android 14; wv) KAKAOTALK/11.1.2 (INAPP)'
    const ios = 'Mozilla/5.0 (iPhone) Mobile/15E148 KAKAOTALK/11.1.2 (INAPP)'

    expect(detectInAppBrowser(android)).toMatchObject({ provider: 'kakao', mobile: true })
    expect(isKakaoInAppBrowser(ios)).toBe(true)
    expect(detectInAppBrowser('Mozilla/5.0 Chrome/126')).toBeNull()
  })

  it('사용자 동작으로 외부 브라우저를 여는 주소를 만든다', () => {
    const page = 'https://example.com/app?from=kakao#editor'
    expect(buildExternalBrowserUrl(page, 'Android KAKAOTALK')).toContain('intent://example.com/app')
    expect(buildExternalBrowserUrl(page, 'iPhone KAKAOTALK')).toContain('kakaotalk://web/openExternal')
  })
})
